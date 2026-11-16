"""Leave requests and availability API routes."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
from app.core.database import get_db
from app.models.models import LeaveRequest, EmployeeAvailability, Employee
from app.schemas.schemas import (
    LeaveRequestCreate, LeaveRequestUpdate, LeaveRequestResponse,
    EmployeeAvailabilityCreate, EmployeeAvailabilityResponse
)

router = APIRouter(prefix="/leaves", tags=["Leaves & Availability"])


@router.get("", response_model=List[LeaveRequestResponse])
def list_leaves(
    employee_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(LeaveRequest)
    if employee_id:
        query = query.filter(LeaveRequest.employee_id == employee_id)
    if status:
        query = query.filter(LeaveRequest.status == status)
    
    leaves = query.order_by(LeaveRequest.created_at.desc()).all()
    result = []
    for leave in leaves:
        emp = db.query(Employee).filter(Employee.id == leave.employee_id).first()
        r = LeaveRequestResponse.model_validate(leave)
        r.employee_name = emp.full_name if emp else None
        result.append(r)
    return result


@router.post("", response_model=LeaveRequestResponse, status_code=201)
def create_leave(data: LeaveRequestCreate, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    leave = LeaveRequest(**data.model_dump())
    db.add(leave)
    db.commit()
    db.refresh(leave)
    r = LeaveRequestResponse.model_validate(leave)
    r.employee_name = emp.full_name
    return r


@router.put("/{leave_id}", response_model=LeaveRequestResponse)
def update_leave(leave_id: int, data: LeaveRequestUpdate, db: Session = Depends(get_db)):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(leave, key, value)
    db.commit()
    db.refresh(leave)
    emp = db.query(Employee).filter(Employee.id == leave.employee_id).first()
    r = LeaveRequestResponse.model_validate(leave)
    r.employee_name = emp.full_name if emp else None
    return r


@router.post("/{leave_id}/approve")
def approve_leave(leave_id: int, approved_by: Optional[int] = Query(None), db: Session = Depends(get_db)):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    leave.status = "APPROVED"
    leave.approved_by = approved_by
    db.commit()
    return {"message": "Leave approved"}


@router.post("/{leave_id}/reject")
def reject_leave(leave_id: int, db: Session = Depends(get_db)):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    leave.status = "REJECTED"
    db.commit()
    return {"message": "Leave rejected"}


# Availability routes
@router.get("/availability", response_model=List[EmployeeAvailabilityResponse])
def list_availability(
    employee_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    query = db.query(EmployeeAvailability)
    if employee_id:
        query = query.filter(EmployeeAvailability.employee_id == employee_id)
    if start_date:
        query = query.filter(EmployeeAvailability.availability_date >= start_date)
    if end_date:
        query = query.filter(EmployeeAvailability.availability_date <= end_date)
    
    records = query.all()
    result = []
    for rec in records:
        emp = db.query(Employee).filter(Employee.id == rec.employee_id).first()
        r = EmployeeAvailabilityResponse.model_validate(rec)
        r.employee_name = emp.full_name if emp else None
        result.append(r)
    return result


@router.post("/availability", response_model=EmployeeAvailabilityResponse, status_code=201)
def set_availability(data: EmployeeAvailabilityCreate, db: Session = Depends(get_db)):
    existing = db.query(EmployeeAvailability).filter(
        EmployeeAvailability.employee_id == data.employee_id,
        EmployeeAvailability.availability_date == data.availability_date
    ).first()
    
    if existing:
        existing.availability_status = data.availability_status
        existing.reason = data.reason
        existing.notes = data.notes
        db.commit()
        db.refresh(existing)
        emp = db.query(Employee).filter(Employee.id == existing.employee_id).first()
        r = EmployeeAvailabilityResponse.model_validate(existing)
        r.employee_name = emp.full_name if emp else None
        return r
    
    avail = EmployeeAvailability(**data.model_dump())
    db.add(avail)
    db.commit()
    db.refresh(avail)
    emp = db.query(Employee).filter(Employee.id == avail.employee_id).first()
    r = EmployeeAvailabilityResponse.model_validate(avail)
    r.employee_name = emp.full_name if emp else None
    return r
