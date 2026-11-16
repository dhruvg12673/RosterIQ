"""Change impact analysis for post-generation roster modifications."""
from datetime import date, timedelta
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.models.models import (
    RosterEntry, RosterEntryAssignment, RosterPeriod,
    EmployeeAssignment, Employee, LeaveRequest, EmployeeAvailability,
    Brand, Process, CoverageResult, ConflictRecord
)
from app.services.scheduling.eligibility import is_employee_available
from app.services.scheduling.backup_recommender import recommend_backups
from app.services.scheduling.coverage import calculate_coverage_for_date
from app.services.scheduling.conflict_detector import detect_conflicts
from app.services.scheduling.calendar_rules import get_holidays_for_brand


def analyze_change_impact(
    db: Session,
    employee_id: int,
    change_type: str,
    start_date: date,
    end_date: Optional[date] = None,
    reason: Optional[str] = None,
    roster_period_id: Optional[int] = None
) -> Dict:
    """
    Analyze the impact of an employee becoming unavailable.
    This is THE critical workflow for the assessment.
    """
    if end_date is None:
        end_date = start_date

    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        return {"message": "Employee not found", "affected_dates": []}

    # Find the roster period if not provided
    if roster_period_id is None:
        period = db.query(RosterPeriod).filter(
            RosterPeriod.month == start_date.month,
            RosterPeriod.year == start_date.year,
            RosterPeriod.status.in_(["GENERATED", "VALIDATED", "PUBLISHED"])
        ).first()
        if period:
            roster_period_id = period.id

    if roster_period_id is None:
        return {
            "message": "No active roster found for the specified dates",
            "affected_dates": [],
            "affected_brands": [],
            "affected_processes": [],
            "coverage_gaps": [],
            "backup_recommendations": [],
            "unresolved_gaps": []
        }

    # Get affected dates
    affected_dates = []
    current = start_date
    while current <= end_date:
        affected_dates.append(current)
        current += timedelta(days=1)

    # Find all affected roster entries
    affected_entries = db.query(RosterEntry).filter(
        RosterEntry.roster_period_id == roster_period_id,
        RosterEntry.employee_id == employee_id,
        RosterEntry.roster_date.in_(affected_dates),
        RosterEntry.status == "WORKING"
    ).all()

    if not affected_entries:
        return {
            "message": f"{employee.full_name} is not scheduled to work on the affected dates",
            "affected_dates": affected_dates,
            "affected_brands": [],
            "affected_processes": [],
            "coverage_gaps": [],
            "backup_recommendations": [],
            "unresolved_gaps": []
        }

    # Collect affected brands and processes
    affected_brand_ids = set()
    affected_process_ids = set()
    affected_brand_names = set()
    affected_process_names = set()

    for entry in affected_entries:
        for assignment in entry.assignments:
            affected_brand_ids.add(assignment.brand_id)
            affected_process_ids.add(assignment.process_id)
            brand = db.query(Brand).filter(Brand.id == assignment.brand_id).first()
            process = db.query(Process).filter(Process.id == assignment.process_id).first()
            if brand:
                affected_brand_names.add(brand.brand_name)
            if process:
                affected_process_names.add(process.process_name)

    # Calculate coverage gaps
    coverage_gaps = []
    all_recommendations = []
    unresolved_gaps = []

    from app.models.models import BrandProcessRule

    for d in affected_dates:
        entry = next((e for e in affected_entries if e.roster_date == d), None)
        if not entry:
            continue

        for assignment in entry.assignments:
            brand = db.query(Brand).filter(Brand.id == assignment.brand_id).first()
            process = db.query(Process).filter(Process.id == assignment.process_id).first()
            brand_name = brand.brand_name if brand else "Unknown"
            process_name = process.process_name if process else "Unknown"

            # Get rule for this brand/process
            rule = db.query(BrandProcessRule).filter(
                BrandProcessRule.brand_id == assignment.brand_id,
                BrandProcessRule.process_id == assignment.process_id,
                BrandProcessRule.active == True
            ).first()

            if not rule:
                continue

            coverage_gaps.append({
                "date": str(d),
                "brand_id": assignment.brand_id,
                "brand_name": brand_name,
                "process_id": assignment.process_id,
                "process_name": process_name,
                "required_staff": rule.minimum_staff_required,
                "impact": f"{employee.full_name} unavailable - coverage gap for {brand_name}/{process_name}"
            })

            # Get backup recommendations
            backups = recommend_backups(
                db, assignment.brand_id, assignment.process_id, d,
                exclude_employee_ids=[employee_id]
            )

            available_backups = [b for b in backups if b["availability_status"] == "AVAILABLE"]

            if available_backups:
                all_recommendations.extend(available_backups)
            else:
                unresolved_gaps.append({
                    "date": str(d),
                    "brand_id": assignment.brand_id,
                    "brand_name": brand_name,
                    "process_id": assignment.process_id,
                    "process_name": process_name,
                    "message": f"No eligible backup found for {brand_name}/{process_name} on {d}"
                })

    return {
        "affected_dates": affected_dates,
        "affected_brands": list(affected_brand_names),
        "affected_processes": list(affected_process_names),
        "coverage_gaps": coverage_gaps,
        "backup_recommendations": all_recommendations,
        "unresolved_gaps": unresolved_gaps,
        "message": f"Impact analysis complete. {len(coverage_gaps)} coverage gaps found. {len(all_recommendations)} backup recommendations available. {len(unresolved_gaps)} unresolved gaps."
    }


def apply_replacement(
    db: Session,
    roster_period_id: int,
    original_employee_id: int,
    replacement_employee_id: int,
    d: date,
    brand_id: int,
    process_id: int
) -> Dict:
    """Apply a backup replacement for a specific date/brand/process."""
    # Find the original entry
    original_entry = db.query(RosterEntry).filter(
        RosterEntry.roster_period_id == roster_period_id,
        RosterEntry.employee_id == original_employee_id,
        RosterEntry.roster_date == d
    ).first()

    if not original_entry:
        return {"success": False, "message": "Original roster entry not found"}

    # Update original entry status
    original_entry.status = "LEAVE"
    original_entry.manually_modified = True
    original_entry.modification_reason = "Employee unavailable - replacement assigned"

    # Remove the specific assignment from the original entry
    assignment_to_remove = None
    for a in original_entry.assignments:
        if a.brand_id == brand_id and a.process_id == process_id:
            assignment_to_remove = a
            break

    if assignment_to_remove:
        db.delete(assignment_to_remove)

    # Check if replacement employee already has a roster entry for this date
    replacement_entry = db.query(RosterEntry).filter(
        RosterEntry.roster_period_id == roster_period_id,
        RosterEntry.employee_id == replacement_employee_id,
        RosterEntry.roster_date == d
    ).first()

    if replacement_entry:
        # Update existing entry to WORKING
        replacement_entry.status = "WORKING"
        replacement_entry.manually_modified = True
        replacement_entry.modification_reason = f"Assigned as replacement for employee #{original_employee_id}"
    else:
        # Create new entry
        from app.models.models import RosterEntry as RE
        replacement_entry = RE(
            roster_period_id=roster_period_id,
            employee_id=replacement_employee_id,
            roster_date=d,
            status="WORKING",
            manually_modified=True,
            modification_reason=f"Assigned as replacement for employee #{original_employee_id}"
        )
        db.add(replacement_entry)
        db.flush()

    # Add the brand/process assignment to replacement
    from app.models.models import RosterEntryAssignment as REA
    new_assignment = REA(
        roster_entry_id=replacement_entry.id,
        brand_id=brand_id,
        process_id=process_id,
        workload_hours=8.0
    )
    db.add(new_assignment)

    db.commit()

    return {
        "success": True,
        "message": f"Replacement applied successfully",
        "original_employee_id": original_employee_id,
        "replacement_employee_id": replacement_employee_id,
        "date": str(d),
        "brand_id": brand_id,
        "process_id": process_id
    }
