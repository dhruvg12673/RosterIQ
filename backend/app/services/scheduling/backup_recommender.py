"""Backup employee recommendation system."""
from datetime import date
from typing import List, Dict
from sqlalchemy.orm import Session
from app.models.models import (
    Employee, EmployeeAssignment, Brand, Process
)
from app.services.scheduling.eligibility import (
    is_employee_available, get_backup_assignments_for_brand_process,
    get_assignments_for_brand_process
)


def recommend_backups(
    db: Session,
    brand_id: int,
    process_id: int,
    d: date,
    exclude_employee_ids: List[int] = None
) -> List[Dict]:
    """
    Recommend backup employees for a brand/process on a given date.
    Returns sorted list of recommendations with reasons.
    """
    if exclude_employee_ids is None:
        exclude_employee_ids = []

    recommendations = []
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    process = db.query(Process).filter(Process.id == process_id).first()
    brand_name = brand.brand_name if brand else "Unknown"
    process_name = process.process_name if process else "Unknown"

    # 1. Check designated backup employees first
    backup_assignments = get_backup_assignments_for_brand_process(db, brand_id, process_id)
    for assignment in backup_assignments:
        if assignment.employee_id in exclude_employee_ids:
            continue
        available, reason = is_employee_available(db, assignment.employee_id, d)
        employee = db.query(Employee).filter(Employee.id == assignment.employee_id).first()
        if employee:
            recommendations.append({
                "employee_id": employee.id,
                "employee_name": employee.full_name,
                "brand_id": brand_id,
                "brand_name": brand_name,
                "process_id": process_id,
                "process_name": process_name,
                "reason": f"Designated backup for {brand_name}/{process_name}. {'Available' if available else f'Unavailable: {reason}'}",
                "is_already_assigned": True,
                "is_backup": True,
                "availability_status": "AVAILABLE" if available else reason,
                "priority": 1 if available else 100
            })

    # 2. Check primary employees from the same brand (different process)
    brand_assignments = db.query(EmployeeAssignment).filter(
        EmployeeAssignment.brand_id == brand_id,
        EmployeeAssignment.active == True,
        EmployeeAssignment.is_backup_resource == False
    ).all()

    for assignment in brand_assignments:
        if assignment.employee_id in exclude_employee_ids:
            continue
        if assignment.process_id == process_id:
            continue
        # Already in recommendations?
        if any(r["employee_id"] == assignment.employee_id for r in recommendations):
            continue

        available, reason = is_employee_available(db, assignment.employee_id, d)
        employee = db.query(Employee).filter(Employee.id == assignment.employee_id).first()
        if employee and available:
            recommendations.append({
                "employee_id": employee.id,
                "employee_name": employee.full_name,
                "brand_id": brand_id,
                "brand_name": brand_name,
                "process_id": process_id,
                "process_name": process_name,
                "reason": f"Already assigned to {brand_name} for another process. Can cross-cover {process_name}.",
                "is_already_assigned": True,
                "is_backup": False,
                "availability_status": "AVAILABLE",
                "priority": 2
            })

    # 3. Check employees assigned to the same process for other brands
    process_assignments = db.query(EmployeeAssignment).filter(
        EmployeeAssignment.process_id == process_id,
        EmployeeAssignment.active == True,
        EmployeeAssignment.is_backup_resource == False
    ).all()

    for assignment in process_assignments:
        if assignment.employee_id in exclude_employee_ids:
            continue
        if assignment.brand_id == brand_id:
            continue
        if any(r["employee_id"] == assignment.employee_id for r in recommendations):
            continue

        available, reason = is_employee_available(db, assignment.employee_id, d)
        employee = db.query(Employee).filter(Employee.id == assignment.employee_id).first()
        if employee and available:
            recommendations.append({
                "employee_id": employee.id,
                "employee_name": employee.full_name,
                "brand_id": brand_id,
                "brand_name": brand_name,
                "process_id": process_id,
                "process_name": process_name,
                "reason": f"Handles {process_name} for another brand. Has relevant experience.",
                "is_already_assigned": False,
                "is_backup": False,
                "availability_status": "AVAILABLE",
                "priority": 3
            })

    # Sort by priority (lower is better)
    recommendations.sort(key=lambda r: r["priority"])

    return recommendations
