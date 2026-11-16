"""Roster management API routes."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
from app.core.database import get_db
from app.models.models import (
    RosterPeriod, RosterEntry, RosterEntryAssignment,
    Employee, Brand, Process, CoverageResult, ConflictRecord
)
from app.schemas.schemas import (
    RosterGenerateRequest, RosterGenerateResponse,
    RosterPeriodResponse, RosterEntryResponse, RosterEntryUpdate,
    RosterValidationResponse, ChangeImpactRequest, ChangeImpactResponse,
    CoverageResultResponse, ConflictRecordResponse
)

router = APIRouter(prefix="/rosters", tags=["Rosters"])


@router.get("", response_model=List[RosterPeriodResponse])
def list_roster_periods(db: Session = Depends(get_db)):
    return db.query(RosterPeriod).order_by(
        RosterPeriod.year.desc(), RosterPeriod.month.desc(), RosterPeriod.version_number.desc()
    ).all()


@router.get("/current", response_model=Optional[RosterPeriodResponse])
def get_current_roster_period(db: Session = Depends(get_db)):
    today = date.today()
    period = db.query(RosterPeriod).filter(
        RosterPeriod.month == today.month,
        RosterPeriod.year == today.year
    ).order_by(RosterPeriod.version_number.desc()).first()
    if not period:
        # Get latest generated period
        period = db.query(RosterPeriod).order_by(
            RosterPeriod.year.desc(), RosterPeriod.month.desc(), RosterPeriod.version_number.desc()
        ).first()
    return period


@router.get("/{period_id}", response_model=RosterPeriodResponse)
def get_roster_period(period_id: int, db: Session = Depends(get_db)):
    period = db.query(RosterPeriod).filter(RosterPeriod.id == period_id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Roster period not found")
    return period


@router.post("/generate", response_model=RosterGenerateResponse)
def generate_roster(data: RosterGenerateRequest, db: Session = Depends(get_db)):
    from app.services.scheduling.scheduler import generate_monthly_roster
    try:
        result = generate_monthly_roster(db, data.month, data.year)
        return RosterGenerateResponse(**result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Roster generation failed: {str(e)}")


@router.post("/{period_id}/validate", response_model=RosterValidationResponse)
def validate_roster(period_id: int, db: Session = Depends(get_db)):
    from app.services.scheduling.validator import validate_roster as do_validate
    result = do_validate(db, period_id)
    return RosterValidationResponse(**result)


@router.post("/{period_id}/publish")
def publish_roster(
    period_id: int,
    force: bool = Query(False, description="Force publish even if conflicts exist"),
    db: Session = Depends(get_db)
):
    from app.services.scheduling.validator import validate_roster as do_validate
    validation = do_validate(db, period_id)
    
    if not validation["can_publish"] and not force:
        raise HTTPException(
            status_code=400,
            detail=f"Validation notice: {validation['critical_conflicts']} critical conflicts and {validation['unfilled_slots']} unfilled coverage slots remain. Use Force Publish to proceed."
        )
    
    period = db.query(RosterPeriod).filter(RosterPeriod.id == period_id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Roster period not found")
    
    from datetime import datetime
    period.status = "PUBLISHED"
    period.published_at = datetime.now()
    db.commit()
    return {
        "message": "Roster published and locked successfully!" + (" (Published with Operations Lead Override)" if not validation["can_publish"] else ""),
        "status": "PUBLISHED",
        "can_publish": validation["can_publish"]
    }


@router.get("/entries/list", response_model=List[RosterEntryResponse])
def list_roster_entries(
    period_id: Optional[int] = None,
    employee_id: Optional[int] = None,
    roster_date: Optional[date] = None,
    brand_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(RosterEntry)
    if period_id:
        query = query.filter(RosterEntry.roster_period_id == period_id)
    if employee_id:
        query = query.filter(RosterEntry.employee_id == employee_id)
    if roster_date:
        query = query.filter(RosterEntry.roster_date == roster_date)
    if status:
        query = query.filter(RosterEntry.status == status)
    
    if brand_id:
        entry_ids = db.query(RosterEntryAssignment.roster_entry_id).filter(
            RosterEntryAssignment.brand_id == brand_id
        ).distinct()
        query = query.filter(RosterEntry.id.in_(entry_ids))
    
    entries = query.order_by(RosterEntry.roster_date, RosterEntry.employee_id).all()
    emp_map = {e.id: e.full_name for e in db.query(Employee).all()}
    result = []
    for entry in entries:
        r = RosterEntryResponse.model_validate(entry)
        r.employee_name = emp_map.get(entry.employee_id)
        result.append(r)
    return result


@router.put("/entries/{entry_id}", response_model=RosterEntryResponse)
def update_roster_entry(entry_id: int, data: RosterEntryUpdate, db: Session = Depends(get_db)):
    entry = db.query(RosterEntry).filter(RosterEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Roster entry not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(entry, key, value)
    entry.manually_modified = True
    
    db.commit()
    db.refresh(entry)
    emp = db.query(Employee).filter(Employee.id == entry.employee_id).first()
    r = RosterEntryResponse.model_validate(entry)
    r.employee_name = emp.full_name if emp else None
    return r


@router.post("/change-impact", response_model=ChangeImpactResponse)
def analyze_change_impact(data: ChangeImpactRequest, db: Session = Depends(get_db)):
    from app.services.scheduling.change_impact import analyze_change_impact as analyze
    result = analyze(
        db,
        employee_id=data.employee_id,
        change_type=data.change_type,
        start_date=data.start_date,
        end_date=data.end_date,
        reason=data.reason,
        roster_period_id=data.roster_period_id
    )
    return ChangeImpactResponse(**result)


@router.post("/apply-replacement")
def apply_replacement(
    roster_period_id: int = Query(...),
    original_employee_id: int = Query(...),
    replacement_employee_id: int = Query(...),
    date_str: str = Query(...),
    brand_id: int = Query(...),
    process_id: int = Query(...),
    db: Session = Depends(get_db)
):
    from app.services.scheduling.change_impact import apply_replacement as do_apply
    from datetime import date as date_type
    d = date_type.fromisoformat(date_str)
    result = do_apply(
        db, roster_period_id, original_employee_id,
        replacement_employee_id, d, brand_id, process_id
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@router.get("/coverage/list", response_model=List[CoverageResultResponse])
def list_coverage(
    period_id: int,
    brand_id: Optional[int] = None,
    process_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(CoverageResult).filter(
        CoverageResult.roster_period_id == period_id
    )
    if brand_id:
        query = query.filter(CoverageResult.brand_id == brand_id)
    if process_id:
        query = query.filter(CoverageResult.process_id == process_id)
    if status:
        query = query.filter(CoverageResult.coverage_status == status)
    
    results = query.order_by(CoverageResult.roster_date).all()
    brands_map = {b.id: b.brand_name for b in db.query(Brand).all()}
    processes_map = {p.id: p.process_name for p in db.query(Process).all()}
    output = []
    for r in results:
        resp = CoverageResultResponse.model_validate(r)
        resp.brand_name = brands_map.get(r.brand_id)
        resp.process_name = processes_map.get(r.process_id)
        output.append(resp)
    return output


@router.get("/conflicts/list", response_model=List[ConflictRecordResponse])
def list_conflicts(
    period_id: int,
    severity: Optional[str] = None,
    resolved: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ConflictRecord).filter(
        ConflictRecord.roster_period_id == period_id
    )
    if severity:
        query = query.filter(ConflictRecord.severity == severity)
    if resolved is not None:
        query = query.filter(ConflictRecord.resolved == resolved)
    
    conflicts = query.order_by(ConflictRecord.roster_date).all()
    emp_map = {e.id: e.full_name for e in db.query(Employee).all()}
    brands_map = {b.id: b.brand_name for b in db.query(Brand).all()}
    processes_map = {p.id: p.process_name for p in db.query(Process).all()}
    output = []
    for c in conflicts:
        resp = ConflictRecordResponse.model_validate(c)
        resp.employee_name = emp_map.get(c.employee_id) if c.employee_id else None
        resp.brand_name = brands_map.get(c.brand_id) if c.brand_id else None
        resp.process_name = processes_map.get(c.process_id) if c.process_id else None
        output.append(resp)
    return output
