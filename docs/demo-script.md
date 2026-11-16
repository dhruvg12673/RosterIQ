# RosterIQ — 3–5 Minute Video Walkthrough Script

## Scene 1: Introduction & Operations Dashboard (0:00 - 0:45)
- **Visual**: RosterIQ Dashboard (`/`).
- **Narration**:
  "Welcome to RosterIQ, the smart workforce and roster management platform designed for DATASTRAW's multi-brand operations. Here on the Command Center, we see live data from our PostgreSQL database: 38 active employees across 6 operational pods, managing 20 D2C brands and 5 business processes. Notice our staffing distribution chart: 80% of our brands follow single-resource dedicated staffing, while 20% follow multi-resource staffing."

## Scene 2: Pods, Brands & Configurable Operating Calendars (0:45 - 1:30)
- **Visual**: Navigate to **Pods & Teams** (`/pods`), then **Brands** (`/brands`), then **Working Rules** (`/working-rules`).
- **Narration**:
  "Under Pods & Teams, we have 6 operational pods, each led by an assigned pod lead. Under Brands, our 20 D2C client accounts are tracked. Notice that operating rules are configured at the brand and process level: for example, GlowAura Skincare has Customer Support operating 365 days a year, while Abandoned Cart Conversion operates Monday to Saturday except public holidays. A brand's operating calendar and an employee's availability are treated as two independent concepts."

## Scene 3: Generating the Monthly Roster & Planner Grid (1:30 - 2:30)
- **Visual**: Navigate to **Roster Planner** (`/roster-planner`). Click "Generate Roster" for November 2026.
- **Narration**:
  "Let's move to the Roster Planner. We select November 2026 and click 'Generate Roster'. The constraint engine evaluates all 38 employees across 30 days. In seconds, our monthly grid renders: rows represent employees, and columns represent calendar dates. Each cell displays color-coded badges: Green for Work, Gray for Weekly Off, Red for Leave, Purple for Public Holidays, and Amber for Comp-Off. Notice that employees with approved leaves or designated weekly offs are never scheduled to work. Clicking any cell allows operations managers to manually adjust shifts with full audit notes."

## Scene 4: Coverage Analysis & Critical Conflicts (2:30 - 3:15)
- **Visual**: Navigate to **Coverage & Conflicts** (`/coverage-conflicts`). Show the Conflicts tab and Coverage tab.
- **Narration**:
  "Under Coverage & Conflicts, we inspect real-time coverage. Notice that on days where dedicated employees for 365-day brands have their weekly off or planned leave, the system immediately flags a Critical conflict: 'NO_AVAILABLE_RESOURCE'. RosterIQ prevents publishing an invalid roster when critical coverage gaps remain."

## Scene 5: Emergency Leave Workflow & One-Click Backup Replacement (3:15 - 4:15)
- **Visual**: Click "Emergency Leave Simulator" tab in `/coverage-conflicts`.
- **Narration**:
  "Now let's demonstrate dynamic change management. Suppose Aditya Joshi—who is the dedicated employee handling Customer Support, ACC, and Retention for single-resource brand GlowAura—suddenly takes emergency leave on November 16th.
  We select Aditya Joshi, date November 16th, and click 'Analyze Impact'.
  Instantly, the engine identifies all 3 affected processes for GlowAura Skincare and calculates the resulting coverage gaps. Furthermore, it queries our resource allocation graph and recommends qualified backup staff with clear explanations: for instance, recommending designated backup floaters who are available.
  We click 'Assign' on our recommended backup. The replacement is applied, the roster is re-evaluated, and GlowAura's coverage gap is resolved!"

## Scene 6: Reports & CSV Export (4:15 - 4:45)
- **Visual**: Navigate to **Reports & Exports** (`/reports`). Click to download Employee Roster CSV and Coverage CSV.
- **Narration**:
  "Finally, operations managers can export official schedules: Employee-wise rosters, Brand-wise allocations, Pod rosters, and Coverage reports. Each report streams directly from our backend database. RosterIQ guarantees operational reliability while respecting employee availability."
