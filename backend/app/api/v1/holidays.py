"""Public holidays API routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.models import PublicHoliday
from app.schemas.schemas import PublicHolidayCreate, PublicHolidayResponse

router = APIRouter(prefix="/holidays", tags=["Public Holidays"])


@router.get("", response_model=List[PublicHolidayResponse])
def list_holidays(year: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(PublicHoliday)
    if year:
        from sqlalchemy import extract
        query = query.filter(extract('year', PublicHoliday.holiday_date) == year)
    return query.order_by(PublicHoliday.holiday_date).all()


@router.post("", response_model=PublicHolidayResponse, status_code=201)
def create_holiday(data: PublicHolidayCreate, db: Session = Depends(get_db)):
    holiday = PublicHoliday(**data.model_dump())
    db.add(holiday)
    db.commit()
    db.refresh(holiday)
    return holiday


@router.delete("/{holiday_id}")
def delete_holiday(holiday_id: int, db: Session = Depends(get_db)):
    holiday = db.query(PublicHoliday).filter(PublicHoliday.id == holiday_id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")
    db.delete(holiday)
    db.commit()
    return {"message": "Holiday deleted"}
