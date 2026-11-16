# RosterIQ — Scheduling Algorithm & Constraint Model

## 1. Scheduling Philosophy

Workforce scheduling in multi-brand operations is governed by one fundamental rule:

> **A brand's operating calendar and an employee's working availability are two completely different things.**

A brand process may operate 365 days a year, but an individual employee is entitled to weekly offs, public holidays, and leaves. The scheduling engine must guarantee that operating rules are strictly enforced without silently creating invalid schedules.

## 2. Constraint Hierarchy

### Hard Constraints (Never Silently Violated)
1. **Approved Leave**: Employees on approved planned leave, sick leave, or comp-off are never scheduled as `WORKING`.
2. **Explicit Unavailability**: Any date marked `UNAVAILABLE` in availability records blocks scheduling.
3. **Weekly Offs**: Employees are scheduled off on their designated weekly off days.
4. **Daily Capacity**: An employee's combined workload across all assigned brand processes on any single day cannot exceed their daily capacity hours (default 8.0h).
5. **Operating Calendar**: A process not operational on a date (e.g., non-Sunday operation) must not generate a coverage requirement or gap.
6. **No Double-Counting**: An employee cannot be counted twice toward the same staffing requirement.

### Soft Constraints (Optimized Where Feasible)
1. Preferred weekly off day alignment.
2. Fair distribution of floaters and backup resources.
3. Minimal schedule churn when handling emergency changes.

## 3. Algorithm Step-by-Step Flow

```
1. Initialize RosterPeriod for target month/year (auto-increment version).
2. Gather active workforce, brand rules, assignments, and public holidays.
3. For each date in month:
   a. For each employee:
      i.   Check active employment status.
      ii.  Evaluate hard availability:
           - On approved leave? -> Status: LEAVE
           - Weekly off date?   -> Status: WEEKLY_OFF
           - Unavailability?    -> Status: LEAVE
           - Otherwise          -> Status: WORKING
      iii. Record RosterEntry.
      iv.  If WORKING:
           - Retrieve active brand/process assignments.
           - Filter to processes operational on this date.
           - Allocate workload proportional to assignment percentage.
           - Record RosterEntryAssignment.
4. Calculate Operational Coverage per date:
   a. For each active BrandProcessRule:
      i.   Determine if process is operational.
      ii.  If NOT operational -> status: NOT_REQUIRED (no gap).
      iii. If operational -> count actual assigned working staff.
      iv.  Evaluate coverage:
           - actual >= required -> FULLY_COVERED
           - actual > 0         -> PARTIALLY_COVERED
           - actual == 0        -> NOT_COVERED
      v.   Persist CoverageResult.
5. Conflict Detection & Classification:
   a. Uncovered slots -> CRITICAL conflict (NO_AVAILABLE_RESOURCE).
   b. Understaffed slots -> HIGH conflict (INSUFFICIENT_STAFFING).
   c. Capacity breaches (> 8.0h) -> HIGH conflict (DAILY_CAPACITY_EXCEEDED).
   d. Persist ConflictRecord with explanations and suggested resolutions.
6. Validation Gate:
   - Status: VALID, VALID_WITH_WARNINGS, or INVALID.
   - Publishing blocked if critical conflicts remain.
```

## 4. Change Management & Targeted Re-optimization

When an employee suddenly takes emergency leave post-generation:
1. `analyze_change_impact()` identifies affected entries on the specific dates only.
2. Scopes impact to the specific brands and processes managed by that employee.
3. Generates prioritized backup recommendations:
   - Priority 1: Designated backup resources.
   - Priority 2: Primary staff on the same brand handling other processes.
   - Priority 3: Staff qualified on the same process for other brands.
4. `apply_replacement()` updates the affected date's roster entry without rebuilding unaffected dates.
