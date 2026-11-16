# RosterIQ — Smart Workforce & Roster Management System

> **Tagline:** Smart Workforce Planning. Reliable Operational Coverage.  
> **Assignment:** DATASTRAW Tech Internship Assessment Test  
> **Status:** Production-Ready & Autonomously Built  

---

## 1. Project Overview & Problem Statement

DATASTRAW manages customer experience (CX) and operational processes for multiple D2C brands. Staffing is non-uniform:
- **~80% of brands** are managed by a single dedicated employee handling all processes assigned to that brand.
- **~20% of brands** typically have 2–3 employees.
- Different brands and processes follow different operating calendars (365 days, daily except public holidays, Sundays off, custom weekday patterns).
- Employees have individual weekly offs, planned leaves, emergency leaves, comp-offs, and daily capacity limits (8.0 hrs).

**The Core Principle:** A brand's operating calendar and an employee's working availability are two different things.

RosterIQ solves this multi-tenant workforce scheduling problem through a normalized database, a deterministic constraint-based scheduling engine, and a modern enterprise SaaS interface inspired by Linear and Notion.

---

## 2. Technology Stack

- **Backend:** Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0 ORM, Alembic migrations, Pytest, Uvicorn.
- **Database:** Neon Serverless PostgreSQL (with SSL), SQLite for zero-dependency local testing.
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, React Hook Form, Zod, Recharts, Lucide React.
- **Reporting:** Python streaming CSV exports (Employee, Brand, Pod, Coverage, Conflict reports).
- **Deployment:** Render web service (Backend) + static site (Frontend).

---

## 3. Database Architecture & Schema Summary

```
                      +-------------------+
                      |       pods        |
                      +---------+---------+
                                | 1:N
                      +---------v---------+
                      |     employees     |<----------------+
                      +---------+---------+                 |
                                | 1:N                       |
           +--------------------+--------------------+      |
           | 1:N                | 1:N                | 1:N  |
+----------v---------+ +--------v---------+ +--------v------v----+
| employee_           | | weekly_off_      | | leave_requests     |
| availability       | | rules            | +--------------------+
+--------------------+ +------------------+
           |
           | N:1
+----------v---------+             +--------------------+
| employee_          | N:1         |     processes      |
| assignments        +------------>+---------+----------+
+----------+---------+             |         | 1:N
           | N:1                   | +-------v------------+
+----------v---------+             | | brand_process_     |
|       brands       +<------------+ | rules              |
+----------+---------+ 1:N           +--------------------+
           | 1:N
+----------v---------+
| roster_entries     |
+----------+---------+
           | 1:N
+----------v---------+
| roster_entry_      |
| assignments        |
+--------------------+
```

### Entities:
1. `employees`: Staff metadata, daily capacity hours (8.0h), weekly off rules, pod association.
2. `pods`: 6 operational pods led by assigned Pod Leads (`pod_lead_employee_id`).
3. `brands`: 20 D2C client accounts (16 single-resource, 4 multi-resource).
4. `processes`: 5 configurable operational processes (CS, ACC, Retention, NDR, Ops).
5. `brand_process_rules`: Independent operating calendars per brand/process pair (`ALL_DAYS`, `DAILY_EXCEPT_PUBLIC_HOLIDAYS`, `SUNDAYS_AND_PUBLIC_HOLIDAYS_OFF`, `CUSTOM_WEEKDAY_PATTERN`).
6. `employee_assignments`: Many-to-many allocations with allocation %, priority, and backup flags.
7. `roster_periods` & `roster_entries`: Versioned monthly schedules linking employees to brand/process workloads.
8. `coverage_results` & `conflict_records`: Auditable logs of required vs actual staffing, shortage reasons, and suggested resolutions.

---

## 4. Realistic Seed Dataset Verification

The database is seeded with a realistic Indian workforce dataset exceeding all requirements:
- **38 Employees** across 6 operational pods.
- **6 Operational Pods** with assigned Pod Leads.
- **20 Fictional D2C Brands**:
  - **16 Single-Resource Brands (80%)**: Dedicated employee handles CS, ACC, NDR, Retention.
  - **4 Multi-Resource Brands (20%)**: Segregated responsibilities with cross-covering backups.
- **5 Operational Processes**: Customer Support, Abandoned Cart Conversion, Retention, Non-Delivery Report, Operations & Escalations.
- **54 Brand Process Rules** demonstrating diverse calendars.
- **73 Employee Assignments** (primary, secondary, and backup roles).
- **38 Weekly Off Rules** distributed across days of the week.
- **24 Public Holidays** spanning gazetted Indian holidays.
- **Approved Leaves, Pending Leaves, and Comp-Offs**.

Validate anytime:
```bash
python backend/app/validate_seed_data.py
```

---

## 5. Scheduling Algorithm & Constraints

### Hard Constraints (Never Silently Violated)
- **Approved Leave & Comp-Off**: Employees on approved leave are never scheduled as `WORKING`.
- **Explicit Unavailability**: Any date marked `UNAVAILABLE` blocks scheduling.
- **Weekly Offs**: Employees are scheduled off on their designated weekly off days.
- **Daily Capacity**: An employee's combined workload across all assigned brand processes on any single day cannot exceed their daily capacity (8.0h).
- **Operating Calendars**: Non-operational processes generate zero coverage requirements or false gaps.
- **No Double-Counting**: An employee cannot be counted twice toward the same staffing requirement.

### Soft Constraints (Optimized Where Feasible)
- Preferred weekly off alignment.
- Prioritized backup employee recommendations.
- Minimal schedule churn on emergency changes.

---

## 6. Answers to the 8 Assessment Questions

### Q1. How did you model employees, brands, processes, pods, and their relationships?
We established a normalized relational model separating **Client Operating Requirements** from **Employee Availability**:
- `brands` and `processes` are linked via `brand_process_rules`, enabling each process under a brand to operate under its own calendar independently.
- `employees` belong to a `pod`, which links to a pod lead.
- Employees are mapped to brands and processes via `employee_assignments` which record allocation percentage, priority, and whether the resource is primary or backup.
- Daily allocations are tracked via `roster_entries` and `roster_entry_assignments`, allowing an employee to handle multiple processes while strictly enforcing daily capacity hours.

### Q2. How does your system generate a roster and determine whether it satisfies required constraints?
The engine uses a deterministic constraint-based algorithm:
1. Gathers all active employees, brand/process rules, public holidays, weekly offs, and approved leaves.
2. For each day of the month, evaluates employee availability. Employees on approved leave or weekly off are designated `LEAVE` or `WEEKLY_OFF`.
3. For working employees, matches their assignments to processes operational on that date, checking that combined workload does not exceed 8.0 hours.
4. Evaluates coverage against `minimum_staff_required`. Any unstaffed operational slot generates a `CoverageResult` with shortage details.
5. `validate_roster()` inspects all coverage results and conflict records. If any `CRITICAL` or `HIGH` violations exist, the roster is flagged `INVALID` and publishing is strictly gated.

### Q3. How did you handle the difference between single-resource brands and brands with multiple employees?
- **Single-Resource Brands (80%)**: One dedicated employee is assigned to all processes for that brand. The scheduler generates one daily roster entry for that employee with multiple process sub-allocations, verifying that the combined daily hours do not exceed 8.0h. When that employee is off or on leave, the system immediately flags coverage gaps across all their processes and recommends qualified backup resources.
- **Multi-Resource Brands (20%)**: Multiple employees (2–3) are assigned distinct processes. The system checks staffing independently per process. If one employee is unavailable, the system evaluates whether remaining primary employees or designated cross-covering backups can maintain operational coverage.

### Q4. What happens when an employee manages all processes for a brand but is unavailable on a required working day?
The system executes a dedicated emergency change workflow (`analyze_change_impact()`):
1. Detects all processes assigned to that employee for that brand.
2. Identifies resulting coverage gaps on operational dates.
3. Queries the allocation graph and recommends eligible backup employees in order of priority:
   - *Priority 1:* Designated backup resources for that brand/process.
   - *Priority 2:* Primary staff from the same brand handling other processes (cross-coverage).
   - *Priority 3:* Staff handling the same process for other non-competing brands.
4. Allows the manager to apply the replacement with a single click (`apply_replacement()`), updating the affected date and revalidating the roster without touching unaffected days.

### Q5. How does your system handle conflicting requirements or insufficient staffing?
RosterIQ never silently produces an invalid roster or fabricates phantom coverage:
- The system saves the best valid roster possible and generates structured `ConflictRecord` rows categorized by severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
- Unfilled required slots are recorded with explicit explanations (e.g., *"No staff available for GlowAura/Customer Support on 2026-11-15. Required: 1, Available: 0"*).
- The Roster Planner and Coverage screens prominently display severity badges and suggested resolutions.
- The `publish_roster` endpoint enforces a strict guard clause returning HTTP 400 if critical conflicts remain unresolved.

### Q6. Which parts of the process did you automate, and which did you leave under human control? Why?
- **Automated**:
  - Monthly schedule generation across hundreds of employee-date combinations.
  - Complex calendar evaluation (Sunday rules, gazetted holidays, custom weekdays).
  - Daily workload calculation and capacity enforcement.
  - Coverage gap identification and backup ranking.
- **Left Under Human Control**:
  - **Leave approval/rejection**: Managers must review leave requests; pending requests do not automatically block scheduling.
  - **Publishing gate**: Final authorization to publish the roster to team members.
  - **Manual shift modifications and replacement confirmations**: Operations leads make the final call on allocating backup staff based on business priorities.
- *Reasoning:* While algorithms excel at constraint satisfaction, human operational judgment is critical for edge-case business exceptions, client escalations, and empathetic leave decisions.

### Q7. If the company doubled its team and brand count, what would you change about your solution?
1. **Database Indexing & Partitioning**: Partition `roster_entries` and `coverage_results` by `roster_period_id` and date range to maintain sub-millisecond query performance at scale.
2. **Asynchronous Generation via Background Workers**: Move roster generation to a Celery/Redis background worker with WebSocket progress updates for instant UI responsiveness.
3. **Integer Programming Solver**: Introduce OR-Tools CP-SAT for multi-objective optimization (e.g., balancing weekend off fairness across 100+ employees while minimizing overtime).
4. **Multi-Region Pod Hierarchies**: Support region-specific timezones, shift handovers, and statutory labor compliance rules per territory.

### Q8. If you had one additional week to work on this, what would you improve first?
1. **Interactive Drag-and-Drop Shift Swap**: Allow operations managers to drag employees across shift slots in the Roster Planner with live visual constraint feedback.
2. **Employee Self-Service Portal**: Mobile-responsive view for employees to view their monthly calendar, request shift swaps, and apply for comp-offs.
3. **Automated Notification Dispatch**: Slack / WhatsApp / Email webhook triggers notifying team members when their monthly roster is published or shifts change.
4. **Historical Roster Version Comparison**: A visual diff tool showing changes between roster revisions (e.g., v1 Draft vs v2 Published).

---

## 7. Local Execution & Verification

### Prerequisites
- Python 3.12+
- Node.js 20+ & pnpm

### Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python -m alembic upgrade head
python app/seed_data.py
python app/validate_seed_data.py
python -m pytest tests/test_scenarios.py tests/test_api_endpoints.py -v
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup
```bash
cd frontend
pnpm install
pnpm run build
pnpm run dev
```
Open [http://localhost:5173](http://localhost:5173).

---

## 8. Automated Test Execution Results

All 25 automated backend tests pass with 100% success rate:
```
tests/test_api.py::test_health_endpoints PASSED
tests/test_api.py::test_employees_endpoints PASSED
tests/test_api.py::test_pods_endpoints PASSED
tests/test_api.py::test_brands_endpoints PASSED
tests/test_api.py::test_processes_endpoints PASSED
tests/test_api.py::test_dashboard_endpoint PASSED
tests/test_api.py::test_roster_endpoints PASSED
tests/test_api_endpoints.py::test_employees_api PASSED
tests/test_api_endpoints.py::test_pods_api PASSED
tests/test_api_endpoints.py::test_brands_api PASSED
tests/test_api_endpoints.py::test_processes_api PASSED
tests/test_api_endpoints.py::test_working_rules_api PASSED
tests/test_api_endpoints.py::test_assignments_api PASSED
tests/test_api_endpoints.py::test_leaves_api PASSED
tests/test_api_endpoints.py::test_holidays_api PASSED
tests/test_api_endpoints.py::test_dashboard_api PASSED
tests/test_api_endpoints.py::test_roster_periods_api PASSED
tests/test_scenarios.py::test_scenario_1_single_resource_emergency_leave PASSED
tests/test_scenarios.py::test_scenario_2_three_employee_brand_one_on_leave PASSED
tests/test_scenarios.py::test_scenario_3_different_operating_calendars_same_brand PASSED
tests/test_scenarios.py::test_scenario_4_cross_brand_workload_and_double_counting PASSED
tests/test_scenarios.py::test_scenario_5_insufficient_staffing_prevents_publish PASSED
tests/test_scenarios.py::test_scenario_6_approved_leave_blocks_availability PASSED
tests/test_scenarios.py::test_scenario_7_pending_leave_does_not_block_scheduling PASSED
tests/test_scenarios.py::test_scenario_8_change_availability_post_roster_generation PASSED

============================= 25 passed in 40.86s =============================
```

---

## 9. Render Deployment Instructions

1. Push code to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete RosterIQ workforce platform"
   git push origin main
   ```
2. Log into [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** -> **Blueprint**.
4. Select the repository. Render will automatically parse `render.yaml` and create:
   - `rosteriq-api`: FastAPI backend service with health checks on `/health`.
   - `rosteriq-ui`: React frontend static site with SPA routing rewrites.
5. In Render Environment Settings for `rosteriq-api`, set `DATABASE_URL` to your Neon PostgreSQL connection string:
   ```
   postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/rosteriq?sslmode=require
   ```
6. Deploy! Render will build the frontend, run database migrations, seed the database, and launch both services.
