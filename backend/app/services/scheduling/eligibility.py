"""Employee eligibility determination for scheduling."""
from datetime import date
from typing import List, Dict, Set, Tuple
from sqlalchemy.orm import Session
from app.models.models import (
    Employee, EmployeeAssignment, EmployeeAvailability,
    LeaveRequest, WeeklyOffRule
)


def get_active_employees(db: Session) -> List[Employee]:
    """Get all active employees."""
    return db.query(Employee).filter(
        Employee.employment_status == "ACTIVE"
    ).all()


def get_employee_assignments(db: Session, employee_id: int) -> List[EmployeeAssignment]:
    """Get active assignments for an employee."""
    return db.query(EmployeeAssignment).filter(
        EmployeeAssignment.employee_id == employee_id,
        EmployeeAssignment.active == True
    ).all()


def get_assignments_for_brand_process(
    db: Session, brand_id: int, process_id: int, include_backup: bool = False
) -> List[EmployeeAssignment]:
    """Get all employee assignments for a brand/process combination."""
    query = db.query(EmployeeAssignment).filter(
        EmployeeAssignment.brand_id == brand_id,
        EmployeeAssignment.process_id == process_id,
        EmployeeAssignment.active == True
    )
    if not include_backup:
        query = query.filter(EmployeeAssignment.is_backup_resource == False)
    return query.order_by(EmployeeAssignment.priority).all()


def get_backup_assignments_for_brand_process(
    db: Session, brand_id: int, process_id: int
) -> List[EmployeeAssignment]:
    """Get backup employee assignments for a brand/process."""
    return db.query(EmployeeAssignment).filter(
        EmployeeAssignment.brand_id == brand_id,
        EmployeeAssignment.process_id == process_id,
        EmployeeAssignment.active == True,
        EmployeeAssignment.is_backup_resource == True
    ).order_by(EmployeeAssignment.priority).all()


def is_on_approved_leave(db: Session, employee_id: int, d: date) -> bool:
    """Check if employee has approved leave on a date."""
    leave = db.query(LeaveRequest).filter(
        LeaveRequest.employee_id == employee_id,
        LeaveRequest.status == "APPROVED",
        LeaveRequest.start_date <= d,
        LeaveRequest.end_date >= d
    ).first()
    return leave is not None


def is_on_pending_leave(db: Session, employee_id: int, d: date) -> bool:
    """Check if employee has pending leave on a date (should NOT block scheduling)."""
    leave = db.query(LeaveRequest).filter(
        LeaveRequest.employee_id == employee_id,
        LeaveRequest.status == "PENDING",
        LeaveRequest.start_date <= d,
        LeaveRequest.end_date >= d
    ).first()
    return leave is not None


def is_explicitly_unavailable(db: Session, employee_id: int, d: date) -> bool:
    """Check if employee is explicitly marked unavailable."""
    avail = db.query(EmployeeAvailability).filter(
        EmployeeAvailability.employee_id == employee_id,
        EmployeeAvailability.availability_date == d,
        EmployeeAvailability.availability_status == "UNAVAILABLE"
    ).first()
    return avail is not None


def get_weekly_off_days(db: Session, employee_id: int, d: date) -> List[str]:
    """Get the weekly off days for an employee."""
    rules = db.query(WeeklyOffRule).filter(
        WeeklyOffRule.employee_id == employee_id,
        WeeklyOffRule.active == True
    ).all()

    # Filter by effective dates
    active_rules = []
    for rule in rules:
        if rule.effective_from and d < rule.effective_from:
            continue
        if rule.effective_until and d > rule.effective_until:
            continue
        active_rules.append(rule)

    return [rule.off_day for rule in active_rules]


def is_weekly_off(db: Session, employee_id: int, d: date) -> bool:
    """Check if a given date is a weekly off for an employee."""
    from app.services.scheduling.calendar_rules import get_weekday_name
    weekday = get_weekday_name(d)
    off_days = get_weekly_off_days(db, employee_id, d)
    return weekday in off_days


def is_employee_available(db: Session, employee_id: int, d: date) -> Tuple[bool, str]:
    """
    Check if an employee is available on a given date.
    Returns (is_available, reason_if_not).
    """
    # Check employment status
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee or employee.employment_status != "ACTIVE":
        return False, "INACTIVE"

    # Check approved leave (hard constraint)
    if is_on_approved_leave(db, employee_id, d):
        return False, "APPROVED_LEAVE"

    # Check explicit unavailability
    if is_explicitly_unavailable(db, employee_id, d):
        return False, "UNAVAILABLE"

    # Check weekly off
    if is_weekly_off(db, employee_id, d):
        return False, "WEEKLY_OFF"

    return True, "AVAILABLE"


def get_eligible_employees_for_slot(
    db: Session, brand_id: int, process_id: int, d: date,
    include_backup: bool = False
) -> List[Dict]:
    """
    Get eligible employees for a brand/process on a specific date.
    Returns list of dicts with employee info and availability status.
    """
    assignments = get_assignments_for_brand_process(
        db, brand_id, process_id, include_backup=include_backup
    )

    eligible = []
    for assignment in assignments:
        available, reason = is_employee_available(db, assignment.employee_id, d)
        employee = db.query(Employee).filter(Employee.id == assignment.employee_id).first()
        if employee:
            eligible.append({
                "employee_id": employee.id,
                "employee_name": employee.full_name,
                "available": available,
                "reason": reason,
                "assignment_type": assignment.assignment_type,
                "is_backup": assignment.is_backup_resource,
                "priority": assignment.priority,
                "allocation_percentage": assignment.allocation_percentage,
                "daily_capacity_hours": employee.daily_capacity_hours
            })

    return eligible
