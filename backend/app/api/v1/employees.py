"""Employee management API routes."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.database import get_db
from app.models.models import Employee, Pod, EmployeeAssignment
from app.schemas.schemas import (
    EmployeeCreate, EmployeeUpdate, EmployeeResponse,
    EmployeeDetailResponse, PaginatedResponse
)

router = APIRouter(prefix="/employees", tags=["Employees"])


@router.get("", response_model=List[EmployeeResponse])
def list_employees(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status: Optional[str] = None,
    pod_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Employee)
    if search:
        query = query.filter(
            (Employee.full_name.ilike(f"%{search}%")) |
            (Employee.employee_code.ilike(f"%{search}%")) |
            (Employee.email.ilike(f"%{search}%"))
        )
    if status:
        query = query.filter(Employee.employment_status == status)
    if pod_id:
        query = query.filter(Employee.pod_id == pod_id)
    return query.order_by(Employee.employee_code).offset(skip).limit(limit).all()


@router.get("/count")
def count_employees(db: Session = Depends(get_db)):
    total = db.query(Employee).count()
    active = db.query(Employee).filter(Employee.employment_status == "ACTIVE").count()
    return {"total": total, "active": active}


@router.get("/{employee_id}", response_model=EmployeeDetailResponse)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    pod_name = None
    if employee.pod_id:
        pod = db.query(Pod).filter(Pod.id == employee.pod_id).first()
        pod_name = pod.pod_name if pod else None
    
    assignment_count = db.query(EmployeeAssignment).filter(
        EmployeeAssignment.employee_id == employee_id,
        EmployeeAssignment.active == True
    ).count()
    
    response = EmployeeDetailResponse.model_validate(employee)
    response.pod_name = pod_name
    response.assignment_count = assignment_count
    return response


@router.post("", response_model=EmployeeResponse, status_code=201)
def create_employee(data: EmployeeCreate, db: Session = Depends(get_db)):
    existing = db.query(Employee).filter(
        Employee.employee_code == data.employee_code
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee code already exists")
    
    employee = Employee(**data.model_dump())
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(employee_id: int, data: EmployeeUpdate, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    if data.employee_code and data.employee_code != employee.employee_code:
        conflict = db.query(Employee).filter(Employee.employee_code == data.employee_code).first()
        if conflict:
            raise HTTPException(status_code=400, detail="Employee code already exists")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(employee, key, value)
    
    db.commit()
    db.refresh(employee)
    return employee


@router.delete("/{employee_id}")
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # 1. Unset pod lead if they were a pod lead
    db.query(Pod).filter(Pod.pod_lead_employee_id == employee_id).update({Pod.pod_lead_employee_id: None})
    
    # 2. Delete all related records
    from app.models.models import (
        EmployeeAssignment, LeaveRequest, WeeklyOffRule,
        EmployeeAvailability, RosterEntry, RosterEntryAssignment
    )
    entry_ids = [e[0] for e in db.query(RosterEntry.id).filter(RosterEntry.employee_id == employee_id).all()]
    if entry_ids:
        db.query(RosterEntryAssignment).filter(RosterEntryAssignment.roster_entry_id.in_(entry_ids)).delete(synchronize_session=False)
    
    db.query(RosterEntry).filter(RosterEntry.employee_id == employee_id).delete()
    db.query(EmployeeAssignment).filter(EmployeeAssignment.employee_id == employee_id).delete()
    db.query(LeaveRequest).filter(LeaveRequest.employee_id == employee_id).delete()
    db.query(WeeklyOffRule).filter(WeeklyOffRule.employee_id == employee_id).delete()
    db.query(EmployeeAvailability).filter(EmployeeAvailability.employee_id == employee_id).delete()
    
    emp_name = employee.full_name
    db.delete(employee)
    db.commit()
    return {"message": f"Employee {emp_name} deleted successfully"}
