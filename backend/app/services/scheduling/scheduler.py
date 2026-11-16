"""
RosterIQ Scheduling Engine
Deterministic constraint-based roster generation with high-performance batch operations.
"""
import calendar
from datetime import date, time, datetime, timedelta
from typing import List, Dict, Set, Tuple, Optional
from collections import defaultdict
from sqlalchemy.orm import Session
from app.models.models import (
    Employee, EmployeeAssignment, BrandProcessRule, PublicHoliday,
    RosterPeriod, RosterEntry, RosterEntryAssignment,
    CoverageResult, ConflictRecord, Brand, Process,
    WeeklyOffRule, LeaveRequest, EmployeeAvailability
)
from app.services.scheduling.calendar_rules import (
    is_process_operational, get_month_dates, get_holidays_for_brand
)
from app.services.scheduling.eligibility import get_active_employees
from app.services.scheduling.coverage import (
    calculate_coverage_for_date, save_coverage_results
)
from app.services.scheduling.conflict_detector import (
    detect_conflicts, save_conflicts
)


def generate_monthly_roster(db: Session, month: int, year: int) -> Dict:
    """
    Generate a complete monthly roster.
    This is the primary scheduling function.
    """
    # Step 1: Create or get roster period
    existing = db.query(RosterPeriod).filter(
        RosterPeriod.month == month,
        RosterPeriod.year == year
    ).first()

    if existing:
        # Delete old entries, coverage, conflicts
        db.query(ConflictRecord).filter(ConflictRecord.roster_period_id == existing.id).delete()
        db.query(CoverageResult).filter(CoverageResult.roster_period_id == existing.id).delete()
        db.query(RosterEntryAssignment).filter(
            RosterEntryAssignment.roster_entry_id.in_(
                db.query(RosterEntry.id).filter(RosterEntry.roster_period_id == existing.id)
            )
        ).delete(synchronize_session=False)
        db.query(RosterEntry).filter(RosterEntry.roster_period_id == existing.id).delete()
        db.flush()
        roster_period = existing
        roster_period.version_number += 1
    else:
        roster_period = RosterPeriod(
            month=month,
            year=year,
            status="DRAFT",
            version_number=1
        )
        db.add(roster_period)
        db.flush()

    roster_period_id = roster_period.id

    # Step 2: Pre-fetch all reference datasets into memory in single queries
    employees = get_active_employees(db)
    employees_map = {e.id: e for e in employees}
    all_dates = get_month_dates(month, year)
    rules = db.query(BrandProcessRule).filter(BrandProcessRule.active == True).all()
    rules_by_bp = {(r.brand_id, r.process_id): r for r in rules}

    brands_map = {b.id: b.brand_name for b in db.query(Brand).all()}
    processes_map = {p.id: p.process_name for p in db.query(Process).all()}

    # Pre-fetch assignments
    all_assignments = db.query(EmployeeAssignment).filter(
        EmployeeAssignment.active == True
    ).all()
    primary_assignments_by_emp = defaultdict(list)
    all_assignments_by_emp = defaultdict(list)
    for a in all_assignments:
        all_assignments_by_emp[a.employee_id].append(a)
        if not a.is_backup_resource:
            primary_assignments_by_emp[a.employee_id].append(a)

    # Pre-fetch weekly off rules
    weekly_offs = db.query(WeeklyOffRule).filter(WeeklyOffRule.active == True).all()
    weekly_offs_by_emp = defaultdict(list)
    for w in weekly_offs:
        weekly_offs_by_emp[w.employee_id].append(w)

    # Pre-fetch leaves for this month
    start_d, end_d = all_dates[0], all_dates[-1]
    leaves = db.query(LeaveRequest).filter(
        LeaveRequest.start_date <= end_d,
        LeaveRequest.end_date >= start_d
    ).all()
    leaves_by_emp = defaultdict(list)
    for l in leaves:
        leaves_by_emp[l.employee_id].append(l)

    # Pre-fetch employee unavailabilities
    unavail = db.query(EmployeeAvailability).filter(
        EmployeeAvailability.availability_date >= start_d,
        EmployeeAvailability.availability_date <= end_d
    ).all()
    unavail_map = {(u.employee_id, u.availability_date): u for u in unavail}

    # Pre-fetch brand holidays
    brand_ids = set(r.brand_id for r in rules)
    holidays_by_brand: Dict[int, List[date]] = {}
    for brand_id in brand_ids:
        holidays_by_brand[brand_id] = get_holidays_for_brand(db, brand_id, month, year)

    # Step 3: Build roster entries in memory
    stats = {
        "total_employees": len(employees),
        "total_working_entries": 0,
        "total_weekly_offs": 0,
        "total_leaves": 0,
        "total_holidays": 0,
        "total_conflicts": 0,
        "critical_conflicts": 0
    }

    # Tracking for coverage: (date, brand_id, process_id) -> count of working staff
    date_bp_counts = defaultdict(int)

    entries_to_add = []
    # To store (entry_index, brand_id, process_id, workload_hours)
    assignments_to_add_data = []

    for d in all_dates:
        weekday = d.weekday()

        for employee in employees:
            # Check availability in-memory
            reason = "AVAILABLE"
            if (employee.id, d) in unavail_map:
                status = "LEAVE"
                stats["total_leaves"] += 1
                reason = "UNAVAILABLE"
            else:
                emp_leaves = leaves_by_emp.get(employee.id, [])
                on_approved = any(l.start_date <= d <= l.end_date and l.status == "APPROVED" for l in emp_leaves)
                if on_approved:
                    status = "LEAVE"
                    stats["total_leaves"] += 1
                    reason = "APPROVED_LEAVE"
                else:
                    emp_rules = weekly_offs_by_emp.get(employee.id, [])
                    weekday_name = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"][weekday]
                    is_off = False
                    for r in emp_rules:
                        if r.effective_from and d < r.effective_from:
                            continue
                        if r.effective_until and d > r.effective_until:
                            continue
                        if r.off_day.upper() == weekday_name:
                            is_off = True
                            break

                    if is_off:
                        status = "WEEKLY_OFF"
                        stats["total_weekly_offs"] += 1
                        reason = "WEEKLY_OFF"
                    else:
                        emp_assigns = all_assignments_by_emp.get(employee.id, [])
                        if not emp_assigns:
                            status = "UNASSIGNED"
                        else:
                            status = "WORKING"
                            stats["total_working_entries"] += 1

            entry = RosterEntry(
                roster_period_id=roster_period_id,
                employee_id=employee.id,
                roster_date=d,
                status=status,
                shift_start=time(9, 0) if status == "WORKING" else None,
                shift_end=time(18, 0) if status == "WORKING" else None
            )
            entry_idx = len(entries_to_add)
            entries_to_add.append(entry)

            # For WORKING entries, create brand/process assignments
            if status == "WORKING":
                emp_primary = primary_assignments_by_emp.get(employee.id, [])
                total_hours = 0.0

                for assignment in emp_primary:
                    brand_holidays = holidays_by_brand.get(assignment.brand_id, [])
                    rule = rules_by_bp.get((assignment.brand_id, assignment.process_id))
                    if not rule:
                        continue

                    operational = is_process_operational(
                        calendar_type=rule.operating_calendar_type,
                        d=d,
                        holidays=brand_holidays,
                        operating_weekdays=rule.operating_weekdays,
                        works_on_sunday=rule.works_on_sunday,
                        works_on_public_holidays=rule.works_on_public_holidays
                    )
                    if not operational:
                        continue

                    workload = rule.workload_hours_per_employee * (assignment.allocation_percentage / 100.0)
                    total_hours += workload

                    assignments_to_add_data.append((
                        entry_idx,
                        assignment.brand_id,
                        assignment.process_id,
                        workload
                    ))

                    date_bp_counts[(d, assignment.brand_id, assignment.process_id)] += 1

    # Bulk insert RosterEntries in one round-trip
    db.add_all(entries_to_add)
    db.flush()

    # Bulk insert RosterEntryAssignments
    assigned_entries = []
    for entry_idx, b_id, p_id, w_hours in assignments_to_add_data:
        real_entry_id = entries_to_add[entry_idx].id
        assigned_entries.append(RosterEntryAssignment(
            roster_entry_id=real_entry_id,
            brand_id=b_id,
            process_id=p_id,
            workload_hours=w_hours
        ))

    if assigned_entries:
        db.add_all(assigned_entries)
        db.flush()

    # Step 4: Calculate coverage and detect conflicts with in-memory counts
    all_coverage = []
    all_conflicts = []

    for d in all_dates:
        # Pre-filter counts for this specific date
        counts_for_d = {(b_id, p_id): c for (dt, b_id, p_id), c in date_bp_counts.items() if dt == d}

        coverage_results = calculate_coverage_for_date(
            db=db,
            roster_period_id=roster_period_id,
            d=d,
            brand_process_rules=rules,
            holidays_by_brand=holidays_by_brand,
            brands_map=brands_map,
            processes_map=processes_map,
            assignments_counts=counts_for_d
        )
        all_coverage.extend(coverage_results)

        conflicts = detect_conflicts(
            db=db,
            roster_period_id=roster_period_id,
            d=d,
            coverage_results=coverage_results,
            brands_map=brands_map,
            processes_map=processes_map,
            employees_map=employees_map
        )
        all_conflicts.extend(conflicts)

    # Save coverage and conflicts in bulk
    save_coverage_results(db, all_coverage)
    save_conflicts(db, all_conflicts)

    # Step 5: Update roster period status
    roster_period.status = "GENERATED"
    roster_period.generated_at = datetime.now()

    total_required = sum(1 for c in all_coverage if c["coverage_status"] != "NOT_REQUIRED")
    total_covered = sum(1 for c in all_coverage if c["coverage_status"] == "FULLY_COVERED")
    coverage_pct = (total_covered / total_required * 100.0) if total_required > 0 else 100.0

    critical_count = sum(1 for c in all_conflicts if c["severity"] == "CRITICAL")
    stats["total_conflicts"] = len(all_conflicts)
    stats["critical_conflicts"] = critical_count

    db.commit()

    return {
        "roster_period_id": roster_period_id,
        "month": month,
        "year": year,
        "status": "GENERATED",
        "total_employees": stats["total_employees"],
        "total_working_days": stats["total_working_entries"],
        "total_weekly_offs": stats["total_weekly_offs"],
        "total_leaves": stats["total_leaves"],
        "total_holidays": stats["total_holidays"],
        "coverage_percentage": round(coverage_pct, 2),
        "total_conflicts": len(all_conflicts),
        "critical_conflicts": critical_count,
        "message": f"Roster generated for {calendar.month_name[month]} {year}. Coverage: {coverage_pct:.1f}%. Conflicts: {len(all_conflicts)} ({critical_count} critical)."
    }
