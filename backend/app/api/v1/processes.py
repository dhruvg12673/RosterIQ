"""Process management API routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import Process
from app.schemas.schemas import ProcessCreate, ProcessUpdate, ProcessResponse

router = APIRouter(prefix="/processes", tags=["Processes"])


@router.get("", response_model=List[ProcessResponse])
def list_processes(db: Session = Depends(get_db)):
    return db.query(Process).order_by(Process.id).all()


@router.get("/{process_id}", response_model=ProcessResponse)
def get_process(process_id: int, db: Session = Depends(get_db)):
    process = db.query(Process).filter(Process.id == process_id).first()
    if not process:
        raise HTTPException(status_code=404, detail="Process not found")
    return process


@router.post("", response_model=ProcessResponse, status_code=201)
def create_process(data: ProcessCreate, db: Session = Depends(get_db)):
    existing = db.query(Process).filter(Process.process_code == data.process_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Process code already exists")
    process = Process(**data.model_dump())
    db.add(process)
    db.commit()
    db.refresh(process)
    return process


@router.put("/{process_id}", response_model=ProcessResponse)
def update_process(process_id: int, data: ProcessUpdate, db: Session = Depends(get_db)):
    process = db.query(Process).filter(Process.id == process_id).first()
    if not process:
        raise HTTPException(status_code=404, detail="Process not found")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(process, key, value)
    db.commit()
    db.refresh(process)
    return process
