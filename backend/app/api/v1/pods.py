"""Pod management API routes."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.database import get_db
from app.models.models import Pod, Employee
from app.schemas.schemas import PodCreate, PodUpdate, PodResponse, PodDetailResponse, EmployeeResponse

router = APIRouter(prefix="/pods", tags=["Pods"])


@router.get("", response_model=List[PodDetailResponse])
def list_pods(db: Session = Depends(get_db)):
    pods = db.query(Pod).all()
    result = []
    for pod in pods:
        member_count = db.query(Employee).filter(Employee.pod_id == pod.id).count()
        lead_name = None
        if pod.pod_lead_employee_id:
            lead = db.query(Employee).filter(Employee.id == pod.pod_lead_employee_id).first()
            lead_name = lead.full_name if lead else None
        
        pod_detail = PodDetailResponse.model_validate(pod)
        pod_detail.member_count = member_count
        pod_detail.lead_name = lead_name
        result.append(pod_detail)
    return result


@router.get("/{pod_id}", response_model=PodDetailResponse)
def get_pod(pod_id: int, db: Session = Depends(get_db)):
    pod = db.query(Pod).filter(Pod.id == pod_id).first()
    if not pod:
        raise HTTPException(status_code=404, detail="Pod not found")
    
    member_count = db.query(Employee).filter(Employee.pod_id == pod.id).count()
    lead_name = None
    if pod.pod_lead_employee_id:
        lead = db.query(Employee).filter(Employee.id == pod.pod_lead_employee_id).first()
        lead_name = lead.full_name if lead else None
    
    pod_detail = PodDetailResponse.model_validate(pod)
    pod_detail.member_count = member_count
    pod_detail.lead_name = lead_name
    return pod_detail


@router.get("/{pod_id}/members", response_model=List[EmployeeResponse])
def get_pod_members(pod_id: int, db: Session = Depends(get_db)):
    members = db.query(Employee).filter(Employee.pod_id == pod_id).all()
    return members


@router.post("", response_model=PodResponse, status_code=201)
def create_pod(data: PodCreate, db: Session = Depends(get_db)):
    existing = db.query(Pod).filter(Pod.pod_code == data.pod_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Pod code already exists")
    pod = Pod(**data.model_dump())
    db.add(pod)
    db.commit()
    db.refresh(pod)
    return pod


@router.put("/{pod_id}", response_model=PodResponse)
def update_pod(pod_id: int, data: PodUpdate, db: Session = Depends(get_db)):
    pod = db.query(Pod).filter(Pod.id == pod_id).first()
    if not pod:
        raise HTTPException(status_code=404, detail="Pod not found")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(pod, key, value)
    db.commit()
    db.refresh(pod)
    return pod


@router.delete("/{pod_id}")
def delete_pod(pod_id: int, db: Session = Depends(get_db)):
    pod = db.query(Pod).filter(Pod.id == pod_id).first()
    if not pod:
        raise HTTPException(status_code=404, detail="Pod not found")
    members = db.query(Employee).filter(Employee.pod_id == pod_id).count()
    if members > 0:
        raise HTTPException(status_code=400, detail="Cannot delete pod with members")
    db.delete(pod)
    db.commit()
    return {"message": "Pod deleted"}
