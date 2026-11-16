"""Employee assignment API routes."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.database import get_db
from app.models.models import EmployeeAssignment, Employee, Brand, Process
from app.schemas.schemas import (
    EmployeeAssignmentCreate, EmployeeAssignmentUpdate, EmployeeAssignmentResponse
)

router = APIRouter(prefix="/assignments", tags=["Assignments"])


@router.get("", response_model=List[EmployeeAssignmentResponse])
def list_assignments(
    employee_id: Optional[int] = None,
    brand_id: Optional[int] = None,
    process_id: Optional[int] = None,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    query = db.query(EmployeeAssignment)
    if employee_id:
        query = query.filter(EmployeeAssignment.employee_id == employee_id)
    if brand_id:
        query = query.filter(EmployeeAssignment.brand_id == brand_id)
    if process_id:
        query = query.filter(EmployeeAssignment.process_id == process_id)
    if active_only:
        query = query.filter(EmployeeAssignment.active == True)
    
    assignments = query.all()
    emp_map = {e.id: e for e in db.query(Employee).all()}
    brand_map = {b.id: b.brand_name for b in db.query(Brand).all()}
    proc_map = {p.id: p.process_name for p in db.query(Process).all()}
    from app.models.models import Pod
    pod_map = {p.id: p.pod_name for p in db.query(Pod).all()}
    
    result = []
    for a in assignments:
        emp = emp_map.get(a.employee_id)
        r = EmployeeAssignmentResponse.model_validate(a)
        r.employee_name = emp.full_name if emp else None
        r.employee_code = emp.employee_code if emp else None
        r.designation = emp.designation if emp else None
        r.pod_name = pod_map.get(emp.pod_id) if (emp and emp.pod_id) else None
        r.brand_name = brand_map.get(a.brand_id)
        r.process_name = proc_map.get(a.process_id)
        result.append(r)
    return result


@router.post("", response_model=EmployeeAssignmentResponse, status_code=201)
def create_assignment(data: EmployeeAssignmentCreate, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    brand = db.query(Brand).filter(Brand.id == data.brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
        
    process = db.query(Process).filter(Process.id == data.process_id).first()
    if not process:
        raise HTTPException(status_code=404, detail="Process not found")
    
    assignment = EmployeeAssignment(**data.model_dump())
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    r = EmployeeAssignmentResponse.model_validate(assignment)
    r.employee_name = emp.full_name
    r.brand_name = brand.brand_name
    r.process_name = process.process_name
    return r


@router.put("/{assignment_id}", response_model=EmployeeAssignmentResponse)
def update_assignment(assignment_id: int, data: EmployeeAssignmentUpdate, db: Session = Depends(get_db)):
    assignment = db.query(EmployeeAssignment).filter(EmployeeAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(assignment, key, value)
    db.commit()
    db.refresh(assignment)
    emp = db.query(Employee).filter(Employee.id == assignment.employee_id).first()
    brand = db.query(Brand).filter(Brand.id == assignment.brand_id).first()
    process = db.query(Process).filter(Process.id == assignment.process_id).first()
    r = EmployeeAssignmentResponse.model_validate(assignment)
    r.employee_name = emp.full_name if emp else None
    r.brand_name = brand.brand_name if brand else None
    r.process_name = process.process_name if process else None
    return r


@router.delete("/{assignment_id}")
def deactivate_assignment(assignment_id: int, db: Session = Depends(get_db)):
    assignment = db.query(EmployeeAssignment).filter(EmployeeAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    assignment.active = False
    db.commit()
    return {"message": "Assignment deactivated"}
