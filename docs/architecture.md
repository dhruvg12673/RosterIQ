# RosterIQ — System Architecture Document

## 1. Architectural Overview

RosterIQ is structured as a **modular monolithic enterprise workforce planning platform**. The application purposefully avoids premature microservice overhead while enforcing strict separation of concerns across presentation, domain logic, persistence, and external APIs.

```
+-------------------------------------------------------------------------+
|                              FRONTEND                                   |
|   React 19 + TypeScript + Vite + Tailwind CSS + TanStack Query + Recharts |
|   - Real-time Roster Planner Grid (30/31 Day Matrix)                     |
|   - Dynamic Emergency Leave & Backup Resolution Tool                   |
|   - Multi-Level Schedule & Coverage Analytics                           |
+------------------------------------+------------------------------------+
                                     |
                          REST API / JSON (HTTP)
                                     |
+------------------------------------v------------------------------------+
|                              BACKEND API                                |
|   FastAPI + Pydantic v2 + Dependency Injection                          |
|   - /employees, /pods, /brands, /processes                              |
|   - /working-rules, /assignments, /leaves, /holidays                    |
|   - /rosters (generate, validate, publish, entries, change-impact)      |
|   - /reports (CSV streaming for employee, brand, pod, coverage logs)    |
+------------------------------------+------------------------------------+
                                     |
+------------------------------------v------------------------------------+
|                         SCHEDULING DOMAIN SERVICE                       |
|   Deterministic Constraint Evaluation Engine                            |
|   - calendar_rules.py    (Process-level operating calendars)           |
|   - eligibility.py       (Status, leaves, weekly offs, capacity)        |
|   - scheduler.py         (Monthly roster construction)                  |
|   - coverage.py          (Required vs actual slot calculation)          |
|   - conflict_detector.py (Severity classification & explanations)       |
|   - backup_recommender.py(Designated, brand & process matching)         |
|   - change_impact.py     (Targeted post-generation re-optimization)     |
|   - validator.py         (Publish-gate validation)                      |
+------------------------------------+------------------------------------+
                                     |
+------------------------------------v------------------------------------+
|                           PERSISTENCE LAYER                             |
|   SQLAlchemy 2.0 ORM + Alembic Migrations                               |
|   - Primary: Neon Serverless PostgreSQL (SSL mode required)             |
|   - Fallback / CI: SQLite for zero-dependency local verification        |
+-------------------------------------------------------------------------+
```

## 2. Core Domain Entities & Relationships

1. **Pods (`pods`)**: Operational clusters overseen by an assigned Pod Lead (`pod_lead_employee_id`).
2. **Employees (`employees`)**: Team members with daily capacity (default 8.0h), weekly off rules, and preferred off days.
3. **Brands (`brands`)**: Client accounts categorised by staffing type (80% single-resource, 20% multi-resource).
4. **Processes (`processes`)**: Dynamic business operations (CS, ACC, Retention, NDR, Ops) configurable without code changes.
5. **BrandProcessRules (`brand_process_rules`)**: Independent operating calendars per brand/process pair (`ALL_DAYS`, `DAILY_EXCEPT_PUBLIC_HOLIDAYS`, `SUNDAYS_AND_PUBLIC_HOLIDAYS_OFF`, `CUSTOM_WEEKDAY_PATTERN`).
6. **EmployeeAssignments (`employee_assignments`)**: Many-to-many allocations with allocation percentage, priority, and backup flag.
7. **RosterPeriods & RosterEntries (`roster_periods`, `roster_entries`, `roster_entry_assignments`)**: Monthly versioned schedules linking employees to actual brand/process workload per date.
8. **CoverageResults & ConflictRecords (`coverage_results`, `conflict_records`)**: Auditable logs of required vs actual staffing, shortage reasons, and suggested resolutions.
