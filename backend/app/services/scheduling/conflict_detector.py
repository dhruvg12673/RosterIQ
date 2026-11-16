"""Conflict detection for roster validation."""
from datetime import date
from typing import List, Dict, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.models import (
    ConflictRecord, RosterEntry, RosterEntryAssignment,
    Employee, Brand, Process, CoverageResult
)


CONFLICT_TYPES = [
    "NO_AVAILABLE_RESOURCE",
    "INSUFFICIENT_STAFFING",
    "APPROVED_LEAVE_CONFLICT",
    "WEEKLY_OFF_CONFLICT",
    "PUBLIC_HOLIDAY_COVERAGE_GAP",
    "EMPLOYEE_DOUBLE_BOOKING",
    "DAILY_CAPACITY_EXCEEDED",
    "INVALID_ASSIGNMENT",
    "PROCESS_COVERAGE_GAP",
    "PREFERENCE_VIOLATION"
]

SEVERITY_LEVELS = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]


def detect_conflicts(
    db: Session,
    roster_period_id: int,
    d: date,
    coverage_results: List[Dict],
    brands_map: Optional[Dict[int, str]] = None,
    processes_map: Optional[Dict[int, str]] = None,
    employees_map: Optional[Dict[int, Employee]] = None,
) -> List[Dict]:
    """Detect all conflicts for a given date in a roster period."""
    if brands_map is None:
        brands_map = {b.id: b.brand_name for b in db.query(Brand).all()}
    if processes_map is None:
        processes_map = {p.id: p.process_name for p in db.query(Process).all()}
    if employees_map is None:
        employees_map = {e.id: e for e in db.query(Employee).all()}

    conflicts = []

    # Check coverage-based conflicts
    for coverage in coverage_results:
        if coverage["coverage_status"] == "NOT_REQUIRED":
            continue

        brand_name = brands_map.get(coverage["brand_id"], "Unknown")
        process_name = processes_map.get(coverage["process_id"], "Unknown")

        if coverage["coverage_status"] == "NOT_COVERED":
            conflicts.append({
                "roster_period_id": roster_period_id,
                "roster_date": d,
                "employee_id": None,
                "brand_id": coverage["brand_id"],
                "process_id": coverage["process_id"],
                "conflict_type": "NO_AVAILABLE_RESOURCE",
                "severity": "CRITICAL",
                "explanation": f"No staff available for {brand_name}/{process_name} on {d}. Required: {coverage['required_staff']}, Available: 0",
                "suggested_resolution": f"Assign a backup employee to {brand_name}/{process_name} or adjust the schedule",
                "resolved": False
            })

        elif coverage["coverage_status"] == "PARTIALLY_COVERED":
            shortage = coverage["required_staff"] - coverage["actual_staff"]
            conflicts.append({
                "roster_period_id": roster_period_id,
                "roster_date": d,
                "employee_id": None,
                "brand_id": coverage["brand_id"],
                "process_id": coverage["process_id"],
                "conflict_type": "INSUFFICIENT_STAFFING",
                "severity": "HIGH",
                "explanation": f"Insufficient staffing for {brand_name}/{process_name} on {d}. Required: {coverage['required_staff']}, Actual: {coverage['actual_staff']}, Shortage: {shortage}",
                "suggested_resolution": f"Assign {shortage} more employee(s) to {brand_name}/{process_name}",
                "resolved": False
            })

    # Check for daily capacity
    entries = db.query(RosterEntry).options(
        joinedload(RosterEntry.assignments)
    ).filter(
        RosterEntry.roster_period_id == roster_period_id,
        RosterEntry.roster_date == d,
        RosterEntry.status == "WORKING"
    ).all()

    for entry in entries:
        employee = employees_map.get(entry.employee_id)
        if not employee:
            continue

        # Sum workload hours for this employee on this date
        total_hours = sum(a.workload_hours for a in entry.assignments)

        if total_hours > employee.daily_capacity_hours:
            conflicts.append({
                "roster_period_id": roster_period_id,
                "roster_date": d,
                "employee_id": employee.id,
                "brand_id": None,
                "process_id": None,
                "conflict_type": "DAILY_CAPACITY_EXCEEDED",
                "severity": "HIGH",
                "explanation": f"{employee.full_name} assigned {total_hours}h on {d} but capacity is {employee.daily_capacity_hours}h",
                "suggested_resolution": f"Reduce workload for {employee.full_name} or reassign some processes",
                "resolved": False
            })

    return conflicts


def save_conflicts(db: Session, conflicts: List[Dict]):
    """Save conflict records to database."""
    if not conflicts:
        return
    db.add_all([ConflictRecord(**c) for c in conflicts])
    db.flush()


def get_conflict_summary(db: Session, roster_period_id: int) -> Dict:
    """Get summary of conflicts for a roster period."""
    conflicts = db.query(ConflictRecord).filter(
        ConflictRecord.roster_period_id == roster_period_id
    ).all()

    total = len(conflicts)
    critical = sum(1 for c in conflicts if c.severity == "CRITICAL")
    high = sum(1 for c in conflicts if c.severity == "HIGH")
    medium = sum(1 for c in conflicts if c.severity == "MEDIUM")
    low = sum(1 for c in conflicts if c.severity == "LOW")
    resolved = sum(1 for c in conflicts if c.resolved)

    return {
        "total": total,
        "critical": critical,
        "high": high,
        "medium": medium,
        "low": low,
        "resolved": resolved,
        "unresolved": total - resolved
    }
