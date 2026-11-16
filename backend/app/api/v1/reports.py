"""Reports and CSV export API routes."""
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
import csv
import io
from app.core.database import get_db
from app.models.models import (
    RosterEntry, RosterEntryAssignment, Employee, Brand, Process,
    RosterPeriod, CoverageResult, ConflictRecord, Pod
)

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/roster-csv")
def export_roster_csv(
    period_id: int,
    view: str = Query("employee", description="employee, brand, or pod"),
    db: Session = Depends(get_db)
):
    period = db.query(RosterPeriod).filter(RosterPeriod.id == period_id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Roster period not found")
    
    entries = db.query(RosterEntry).filter(
        RosterEntry.roster_period_id == period_id
    ).order_by(RosterEntry.employee_id, RosterEntry.roster_date).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    if view == "employee":
        writer.writerow(["Employee", "Employee Code", "Date", "Status", "Brands", "Processes", "Notes"])
        for entry in entries:
            emp = db.query(Employee).filter(Employee.id == entry.employee_id).first()
            brands = []
            processes = []
            for a in entry.assignments:
                brand = db.query(Brand).filter(Brand.id == a.brand_id).first()
                process = db.query(Process).filter(Process.id == a.process_id).first()
                if brand:
                    brands.append(brand.brand_name)
                if process:
                    processes.append(process.process_name)
            
            writer.writerow([
                emp.full_name if emp else "",
                emp.employee_code if emp else "",
                str(entry.roster_date),
                entry.status,
                "; ".join(set(brands)),
                "; ".join(set(processes)),
                entry.notes or ""
            ])
    elif view == "brand":
        writer.writerow(["Brand", "Date", "Employee", "Process", "Status", "Hours"])
        for entry in entries:
            emp = db.query(Employee).filter(Employee.id == entry.employee_id).first()
            for a in entry.assignments:
                brand = db.query(Brand).filter(Brand.id == a.brand_id).first()
                process = db.query(Process).filter(Process.id == a.process_id).first()
                writer.writerow([
                    brand.brand_name if brand else "",
                    str(entry.roster_date),
                    emp.full_name if emp else "",
                    process.process_name if process else "",
                    entry.status,
                    a.workload_hours
                ])
    elif view == "pod":
        writer.writerow(["Pod", "Employee", "Date", "Status", "Brands"])
        for entry in entries:
            emp = db.query(Employee).filter(Employee.id == entry.employee_id).first()
            pod = db.query(Pod).filter(Pod.id == emp.pod_id).first() if emp and emp.pod_id else None
            brands = [db.query(Brand).filter(Brand.id == a.brand_id).first() for a in entry.assignments]
            brand_names = [b.brand_name for b in brands if b]
            writer.writerow([
                pod.pod_name if pod else "Unassigned",
                emp.full_name if emp else "",
                str(entry.roster_date),
                entry.status,
                "; ".join(brand_names)
            ])
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=roster_{period.month}_{period.year}_{view}.csv"}
    )


@router.get("/coverage-csv")
def export_coverage_csv(period_id: int, db: Session = Depends(get_db)):
    results = db.query(CoverageResult).filter(
        CoverageResult.roster_period_id == period_id
    ).order_by(CoverageResult.roster_date).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Brand", "Process", "Required", "Actual", "Coverage %", "Status"])
    
    for r in results:
        brand = db.query(Brand).filter(Brand.id == r.brand_id).first()
        process = db.query(Process).filter(Process.id == r.process_id).first()
        writer.writerow([
            str(r.roster_date),
            brand.brand_name if brand else "",
            process.process_name if process else "",
            r.required_staff,
            r.actual_staff,
            f"{r.coverage_percentage:.1f}",
            r.coverage_status
        ])
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=coverage_report.csv"}
    )


@router.get("/conflict-csv")
def export_conflict_csv(period_id: int, db: Session = Depends(get_db)):
    conflicts = db.query(ConflictRecord).filter(
        ConflictRecord.roster_period_id == period_id
    ).order_by(ConflictRecord.roster_date).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Type", "Severity", "Brand", "Process", "Employee", "Explanation", "Resolution", "Resolved"])
    
    for c in conflicts:
        emp = db.query(Employee).filter(Employee.id == c.employee_id).first() if c.employee_id else None
        brand = db.query(Brand).filter(Brand.id == c.brand_id).first() if c.brand_id else None
        process = db.query(Process).filter(Process.id == c.process_id).first() if c.process_id else None
        writer.writerow([
            str(c.roster_date),
            c.conflict_type,
            c.severity,
            brand.brand_name if brand else "",
            process.process_name if process else "",
            emp.full_name if emp else "",
            c.explanation or "",
            c.suggested_resolution or "",
            "Yes" if c.resolved else "No"
        ])
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=conflict_report.csv"}
    )
