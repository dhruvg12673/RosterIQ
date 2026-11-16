"""Dashboard API routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date, datetime
from app.core.database import get_db
from app.models.models import (
    Employee, Brand, Process, Pod, RosterPeriod, RosterEntry,
    LeaveRequest, PublicHoliday, ConflictRecord, CoverageResult,
    EmployeeAssignment
)
from app.schemas.schemas import DashboardMetrics, PublicHolidayResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardMetrics)
def get_dashboard(db: Session = Depends(get_db)):
    today = date.today()
    
    total_employees = db.query(Employee).count()
    active_employees = db.query(Employee).filter(Employee.employment_status == "ACTIVE").count()
    total_brands = db.query(Brand).count()
    active_brands = db.query(Brand).filter(Brand.status == "ACTIVE").count()
    total_processes = db.query(Process).filter(Process.status == "ACTIVE").count()
    total_pods = db.query(Pod).count()
    
    # Current or latest roster period
    current_period = db.query(RosterPeriod).filter(
        RosterPeriod.month == today.month,
        RosterPeriod.year == today.year
    ).order_by(RosterPeriod.version_number.desc()).first()
    
    if not current_period:
        current_period = db.query(RosterPeriod).order_by(
            RosterPeriod.year.desc(), RosterPeriod.month.desc(), RosterPeriod.version_number.desc()
        ).first()
    
    roster_status = current_period.status if current_period else None
    
    employees_working = 0
    employees_on_leave = 0
    employees_on_weekly_off = 0
    coverage_percentage = 0.0
    critical_conflicts = 0
    
    if current_period:
        # Check if entries exist for today or use average
        working_count = db.query(RosterEntry).filter(
            RosterEntry.roster_period_id == current_period.id,
            RosterEntry.roster_date == today,
            RosterEntry.status == "WORKING"
        ).count()
        
        if working_count > 0:
            employees_working = working_count
            employees_on_leave = db.query(RosterEntry).filter(
                RosterEntry.roster_period_id == current_period.id,
                RosterEntry.roster_date == today,
                RosterEntry.status == "LEAVE"
            ).count()
            employees_on_weekly_off = db.query(RosterEntry).filter(
                RosterEntry.roster_period_id == current_period.id,
                RosterEntry.roster_date == today,
                RosterEntry.status == "WEEKLY_OFF"
            ).count()
        else:
            # First working date in period
            first_entry = db.query(RosterEntry).filter(
                RosterEntry.roster_period_id == current_period.id,
                RosterEntry.status == "WORKING"
            ).first()
            if first_entry:
                sample_date = first_entry.roster_date
                employees_working = db.query(RosterEntry).filter(
                    RosterEntry.roster_period_id == current_period.id,
                    RosterEntry.roster_date == sample_date,
                    RosterEntry.status == "WORKING"
                ).count()
                employees_on_leave = db.query(RosterEntry).filter(
                    RosterEntry.roster_period_id == current_period.id,
                    RosterEntry.roster_date == sample_date,
                    RosterEntry.status == "LEAVE"
                ).count()
                employees_on_weekly_off = db.query(RosterEntry).filter(
                    RosterEntry.roster_period_id == current_period.id,
                    RosterEntry.roster_date == sample_date,
                    RosterEntry.status == "WEEKLY_OFF"
                ).count()
        
        # Coverage
        coverage_results = db.query(CoverageResult).filter(
            CoverageResult.roster_period_id == current_period.id
        ).all()
        
        required = [c for c in coverage_results if c.coverage_status != "NOT_REQUIRED"]
        if required:
            covered = sum(1 for c in required if c.coverage_status == "FULLY_COVERED")
            coverage_percentage = round((covered / len(required)) * 100, 2)
        
        critical_conflicts = db.query(ConflictRecord).filter(
            ConflictRecord.roster_period_id == current_period.id,
            ConflictRecord.severity == "CRITICAL",
            ConflictRecord.resolved == False
        ).count()
    
    # Upcoming holidays
    upcoming = db.query(PublicHoliday).filter(
        PublicHoliday.holiday_date >= today
    ).order_by(PublicHoliday.holiday_date).limit(5).all()
    
    if not upcoming:
        # Fall back to all holidays
        upcoming = db.query(PublicHoliday).order_by(PublicHoliday.holiday_date).limit(5).all()
        
    upcoming_holidays = [PublicHolidayResponse.model_validate(h) for h in upcoming]
    
    # Employees by pod
    pods = db.query(Pod).all()
    employees_by_pod = []
    for pod in pods:
        count = db.query(Employee).filter(
            Employee.pod_id == pod.id,
            Employee.employment_status == "ACTIVE"
        ).count()
        employees_by_pod.append({"name": pod.pod_name, "count": count})
    
    # Brands by staffing type
    all_brands = db.query(Brand).filter(Brand.status == "ACTIVE").all()
    single_resource = 0
    multi_resource = 0
    for brand in all_brands:
        emp_count = db.query(EmployeeAssignment.employee_id).filter(
            EmployeeAssignment.brand_id == brand.id,
            EmployeeAssignment.active == True,
            EmployeeAssignment.is_backup_resource == False
        ).distinct().count()
        if emp_count <= 1:
            single_resource += 1
        else:
            multi_resource += 1
    
    # Process staffing
    processes = db.query(Process).filter(Process.status == "ACTIVE").all()
    process_staffing = []
    for proc in processes:
        emp_count = db.query(EmployeeAssignment.employee_id).filter(
            EmployeeAssignment.process_id == proc.id,
            EmployeeAssignment.active == True
        ).distinct().count()
        process_staffing.append({"name": proc.process_name, "count": emp_count})
    
    return DashboardMetrics(
        total_employees=total_employees,
        active_employees=active_employees,
        total_brands=total_brands,
        active_brands=active_brands,
        total_processes=total_processes,
        total_pods=total_pods,
        roster_status=roster_status,
        coverage_percentage=coverage_percentage,
        employees_working_today=employees_working,
        employees_on_leave=employees_on_leave,
        employees_on_weekly_off=employees_on_weekly_off,
        critical_conflicts=critical_conflicts,
        upcoming_holidays=upcoming_holidays,
        employees_by_pod=employees_by_pod,
        brands_by_staffing_type={"single": single_resource, "multi": multi_resource},
        process_staffing=process_staffing
    )
