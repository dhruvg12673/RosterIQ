# RosterIQ — Approach Note

## Problem Statement Summary
DATASTRAW manages customer experience and operational processes for multiple D2C brands. Staffing is non-uniform: ~80% of brands are managed by a single dedicated employee handling all processes, while ~20% of brands have 2–3 employees. Brands have differing operating calendars (365 days, daily except public holidays, Sundays off, or custom weekday patterns). Employees have individual weekly offs, planned leaves, and capacity restrictions.

## Core Engineering Decisions

1. **Decoupled Calendar and Workforce Models**:
   We explicitly decoupled the brand process operating calendar (`BrandProcessRule`) from individual employee schedules (`WeeklyOffRule`, `LeaveRequest`). This prevents conflating client requirements with employee availability.

2. **Deterministic Constraint-Based Engine over Opaque Optimization**:
   Rather than introducing a black-box solver that could fail silently or produce erratic schedules across deployments, we implemented a deterministic constraint evaluation engine. Every scheduling decision can be audited, explained, and traced to specific rules.

3. **Single vs Multi-Resource Brand Handling**:
   - For single-resource brands, the employee is scheduled once per day with combined process workloads checked against daily capacity.
   - When that employee is on weekly off or emergency leave, the system highlights the exact coverage gaps across all their processes and recommends qualified backup resources.
   - For multi-resource brands, process staffing is checked independently. If one employee is on leave, the system checks whether remaining staff or cross-trained peers can cover the shortage.

4. **Change Management with Targeted Re-optimization**:
   Instead of wiping and rebuilding the entire month's roster when an employee takes sudden emergency leave, the system executes targeted re-optimization on the affected dates only, preserving unaffected employee schedules.

5. **Production Readiness & Zero-Mock Architecture**:
   All metrics, charts, tables, and reports are powered by the live database via FastAPI REST endpoints. No hardcoded mock frontend data is used.
