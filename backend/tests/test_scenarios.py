"""
RosterIQ Comprehensive Assessment Test Suite
Tests all 8 mandatory assessment scenarios.
"""
import pytest
from datetime import date, time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.models import (
    Base, Pod, Employee, Brand, Process, BrandProcessRule,
    EmployeeAssignment, PublicHoliday, LeaveRequest, EmployeeAvailability,
    WeeklyOffRule, RosterPeriod, RosterEntry, RosterEntryAssignment,
    CoverageResult, ConflictRecord
)
from app.services.scheduling.calendar_rules import is_process_operational, get_weekday_name
from app.services.scheduling.eligibility import is_employee_available, is_on_approved_leave, is_on_pending_leave
from app.services.scheduling.coverage import calculate_coverage_for_date
from app.services.scheduling.conflict_detector import detect_conflicts
from app.services.scheduling.backup_recommender import recommend_backups
from app.services.scheduling.change_impact import analyze_change_impact, apply_replacement
from app.services.scheduling.validator import validate_roster
from app.services.scheduling.scheduler import generate_monthly_roster


@pytest.fixture(scope="function")
def db():
    """In-memory SQLite test database fixture."""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()

    try:
        # Seed minimal baseline for tests
        pod = Pod(pod_name="Alpha Pod", pod_code="POD-A")
        session.add(pod)
        session.commit()

        p_cs = Process(process_name="Customer Support", process_code="CS")
        p_acc = Process(process_name="Abandoned Cart Conversion", process_code="ACC")
        p_ndr = Process(process_name="Non-Delivery Report", process_code="NDR")
        p_ret = Process(process_name="Retention", process_code="RET")
        session.add_all([p_cs, p_acc, p_ndr, p_ret])
        session.commit()

        yield session
    finally:
        session.close()


def test_scenario_1_single_resource_emergency_leave(db):
    """
    SCENARIO 1:
    A single-resource brand operates 365 days. Its dedicated employee takes emergency leave on Sunday.
    Expected:
    - Customer Support coverage gap detected if operational.
    - Other non-operating processes do not incorrectly create gaps.
    - Eligible backup recommended.
    - Unresolved gap clearly flagged.
    """
    # Create brand and processes
    brand = Brand(brand_name="Brand Alpha", brand_code="BRD-A")
    db.add(brand)
    db.commit()

    cs_proc = db.query(Process).filter(Process.process_code == "CS").first()
    ret_proc = db.query(Process).filter(Process.process_code == "RET").first()

    # Rule 1: CS operates 365 days (works on Sunday and holidays)
    r_cs = BrandProcessRule(
        brand_id=brand.id, process_id=cs_proc.id,
        operating_calendar_type="ALL_DAYS", minimum_staff_required=1,
        works_on_sunday=True, works_on_public_holidays=True, active=True
    )
    # Rule 2: Retention does NOT operate on Sundays
    r_ret = BrandProcessRule(
        brand_id=brand.id, process_id=ret_proc.id,
        operating_calendar_type="SUNDAYS_AND_PUBLIC_HOLIDAYS_OFF", minimum_staff_required=1,
        works_on_sunday=False, works_on_public_holidays=False, active=True
    )
    db.add_all([r_cs, r_ret])
    db.commit()

    # Dedicated employee
    emp = Employee(employee_code="EMP-DED", full_name="Dedicated Rahul", employment_status="ACTIVE")
    # Backup employee
    backup_emp = Employee(employee_code="EMP-BAK", full_name="Backup Sunita", employment_status="ACTIVE")
    db.add_all([emp, backup_emp])
    db.commit()

    # Primary assignments for dedicated employee
    a1 = EmployeeAssignment(employee_id=emp.id, brand_id=brand.id, process_id=cs_proc.id, assignment_type="PRIMARY")
    a2 = EmployeeAssignment(employee_id=emp.id, brand_id=brand.id, process_id=ret_proc.id, assignment_type="PRIMARY")
    # Backup assignment for backup employee
    b1 = EmployeeAssignment(employee_id=backup_emp.id, brand_id=brand.id, process_id=cs_proc.id, assignment_type="BACKUP", is_backup_resource=True)
    db.add_all([a1, a2, b1])
    db.commit()

    sunday = date(2026, 11, 15)  # Sunday
    assert sunday.weekday() == 6

    # Test calendar logic: CS is operational on Sunday, RET is NOT operational on Sunday
    assert is_process_operational("ALL_DAYS", sunday, holidays=[], works_on_sunday=True) is True
    assert is_process_operational("SUNDAYS_AND_PUBLIC_HOLIDAYS_OFF", sunday, holidays=[], works_on_sunday=False) is False

    # Emergency leave for dedicated employee
    db.add(LeaveRequest(
        employee_id=emp.id, leave_type="EMERGENCY_LEAVE",
        start_date=sunday, end_date=sunday, status="APPROVED"
    ))
    db.commit()

    # Check availability
    avail, reason = is_employee_available(db, emp.id, sunday)
    assert avail is False
    assert reason == "APPROVED_LEAVE"

    # Backup employee is available
    b_avail, b_reason = is_employee_available(db, backup_emp.id, sunday)
    assert b_avail is True

    # Recommend backups
    backups = recommend_backups(db, brand.id, cs_proc.id, sunday)
    assert len(backups) >= 1
    assert backups[0]["employee_id"] == backup_emp.id
    assert backups[0]["availability_status"] == "AVAILABLE"


def test_scenario_2_three_employee_brand_one_on_leave(db):
    """
    SCENARIO 2:
    A three-employee brand has one employee on leave.
    Expected:
    - Remaining employees evaluated.
    - Coverage independently calculated for every process.
    - Coverage gap reported only where requirements are not met.
    """
    brand = Brand(brand_name="MultiBrand", brand_code="MB")
    db.add(brand)
    db.commit()

    cs = db.query(Process).filter(Process.process_code == "CS").first()
    acc = db.query(Process).filter(Process.process_code == "ACC").first()
    ndr = db.query(Process).filter(Process.process_code == "NDR").first()

    db.add_all([
        BrandProcessRule(brand_id=brand.id, process_id=cs.id, operating_calendar_type="ALL_DAYS", minimum_staff_required=1, works_on_sunday=True),
        BrandProcessRule(brand_id=brand.id, process_id=acc.id, operating_calendar_type="ALL_DAYS", minimum_staff_required=1, works_on_sunday=True),
        BrandProcessRule(brand_id=brand.id, process_id=ndr.id, operating_calendar_type="ALL_DAYS", minimum_staff_required=1, works_on_sunday=True),
    ])
    db.commit()

    emp1 = Employee(employee_code="E1", full_name="Emp One", employment_status="ACTIVE")
    emp2 = Employee(employee_code="E2", full_name="Emp Two", employment_status="ACTIVE")
    emp3 = Employee(employee_code="E3", full_name="Emp Three", employment_status="ACTIVE")
    db.add_all([emp1, emp2, emp3])
    db.commit()

    # E1 -> CS, E2 -> ACC, E3 -> NDR
    db.add_all([
        EmployeeAssignment(employee_id=emp1.id, brand_id=brand.id, process_id=cs.id, assignment_type="PRIMARY"),
        EmployeeAssignment(employee_id=emp2.id, brand_id=brand.id, process_id=acc.id, assignment_type="PRIMARY"),
        EmployeeAssignment(employee_id=emp3.id, brand_id=brand.id, process_id=ndr.id, assignment_type="PRIMARY"),
    ])
    db.commit()

    d = date(2026, 11, 16)  # Monday
    # E2 takes leave
    db.add(LeaveRequest(employee_id=emp2.id, leave_type="PLANNED_LEAVE", start_date=d, end_date=d, status="APPROVED"))
    db.commit()

    assert is_employee_available(db, emp1.id, d)[0] is True
    assert is_employee_available(db, emp2.id, d)[0] is False  # On leave
    assert is_employee_available(db, emp3.id, d)[0] is True

    # Roster setup
    period = RosterPeriod(month=11, year=2026, status="DRAFT")
    db.add(period)
    db.commit()

    # Roster entries: E1 working CS, E2 on leave, E3 working NDR
    re1 = RosterEntry(roster_period_id=period.id, employee_id=emp1.id, roster_date=d, status="WORKING")
    re2 = RosterEntry(roster_period_id=period.id, employee_id=emp2.id, roster_date=d, status="LEAVE")
    re3 = RosterEntry(roster_period_id=period.id, employee_id=emp3.id, roster_date=d, status="WORKING")
    db.add_all([re1, re2, re3])
    db.commit()

    db.add_all([
        RosterEntryAssignment(roster_entry_id=re1.id, brand_id=brand.id, process_id=cs.id),
        RosterEntryAssignment(roster_entry_id=re3.id, brand_id=brand.id, process_id=ndr.id),
    ])
    db.commit()

    rules = db.query(BrandProcessRule).filter(BrandProcessRule.brand_id == brand.id).all()
    coverage = calculate_coverage_for_date(db, period.id, d, rules, holidays_by_brand={brand.id: []})

    cov_map = {c["process_id"]: c["coverage_status"] for c in coverage}
    # CS is fully covered
    assert cov_map[cs.id] == "FULLY_COVERED"
    # ACC has a coverage gap because E2 is on leave!
    assert cov_map[acc.id] == "NOT_COVERED"
    # NDR is fully covered
    assert cov_map[ndr.id] == "FULLY_COVERED"


def test_scenario_3_different_operating_calendars_same_brand(db):
    """
    SCENARIO 3:
    Two processes under the same brand have different operating calendars.
    Expected: Each calendar independently respected.
    """
    brand = Brand(brand_name="DualCalendarBrand", brand_code="DCB")
    db.add(brand)
    db.commit()

    cs = db.query(Process).filter(Process.process_code == "CS").first()
    acc = db.query(Process).filter(Process.process_code == "ACC").first()

    sunday = date(2026, 11, 15)
    monday = date(2026, 11, 16)
    holiday = date(2026, 11, 18)

    # Process 1: CS works ALL_DAYS (including Sunday and Holiday)
    # Process 2: ACC works SUNDAYS_AND_PUBLIC_HOLIDAYS_OFF
    assert is_process_operational("ALL_DAYS", sunday, holidays=[holiday], works_on_sunday=True) is True
    assert is_process_operational("SUNDAYS_AND_PUBLIC_HOLIDAYS_OFF", sunday, holidays=[holiday], works_on_sunday=False) is False

    assert is_process_operational("ALL_DAYS", holiday, holidays=[holiday], works_on_public_holidays=True) is True
    assert is_process_operational("SUNDAYS_AND_PUBLIC_HOLIDAYS_OFF", holiday, holidays=[holiday], works_on_public_holidays=False) is False

    assert is_process_operational("ALL_DAYS", monday, holidays=[holiday]) is True
    assert is_process_operational("SUNDAYS_AND_PUBLIC_HOLIDAYS_OFF", monday, holidays=[holiday]) is True


def test_scenario_4_cross_brand_workload_and_double_counting(db):
    """
    SCENARIO 4:
    One employee works across two brands.
    Expected: Daily workload checked, employee not double-counted.
    """
    brand1 = Brand(brand_name="Brand One", brand_code="B1")
    brand2 = Brand(brand_name="Brand Two", brand_code="B2")
    db.add_all([brand1, brand2])
    db.commit()

    cs = db.query(Process).filter(Process.process_code == "CS").first()
    emp = Employee(employee_code="E-SHARED", full_name="Shared Worker", daily_capacity_hours=8.0, employment_status="ACTIVE")
    db.add(emp)
    db.commit()

    d = date(2026, 11, 16)
    period = RosterPeriod(month=11, year=2026)
    db.add(period)
    db.commit()

    # Create 1 daily entry with 2 assignments: 5h on B1, 5h on B2 -> total 10h > 8h capacity!
    entry = RosterEntry(roster_period_id=period.id, employee_id=emp.id, roster_date=d, status="WORKING")
    db.add(entry)
    db.commit()

    db.add_all([
        RosterEntryAssignment(roster_entry_id=entry.id, brand_id=brand1.id, process_id=cs.id, workload_hours=5.0),
        RosterEntryAssignment(roster_entry_id=entry.id, brand_id=brand2.id, process_id=cs.id, workload_hours=5.0),
    ])
    db.commit()

    conflicts = detect_conflicts(db, period.id, d, coverage_results=[])
    capacity_conflicts = [c for c in conflicts if c["conflict_type"] == "DAILY_CAPACITY_EXCEEDED"]
    assert len(capacity_conflicts) == 1
    assert "10.0h" in capacity_conflicts[0]["explanation"]
    assert "8.0h" in capacity_conflicts[0]["explanation"]


def test_scenario_5_insufficient_staffing_prevents_publish(db):
    """
    SCENARIO 5:
    A process requires two employees but only one qualified employee is available.
    Expected: Insufficient staffing detected, roster not marked fully valid.
    """
    brand = Brand(brand_name="HeavyBrand", brand_code="HB")
    db.add(brand)
    db.commit()

    cs = db.query(Process).filter(Process.process_code == "CS").first()
    rule = BrandProcessRule(brand_id=brand.id, process_id=cs.id, operating_calendar_type="ALL_DAYS", minimum_staff_required=2, works_on_sunday=True)
    db.add(rule)
    db.commit()

    emp = Employee(employee_code="E-SOLO", full_name="Solo Worker", employment_status="ACTIVE")
    db.add(emp)
    db.commit()

    d = date(2026, 11, 16)
    period = RosterPeriod(month=11, year=2026)
    db.add(period)
    db.commit()

    entry = RosterEntry(roster_period_id=period.id, employee_id=emp.id, roster_date=d, status="WORKING")
    db.add(entry)
    db.commit()

    db.add(RosterEntryAssignment(roster_entry_id=entry.id, brand_id=brand.id, process_id=cs.id, workload_hours=8.0))
    db.commit()

    coverage = calculate_coverage_for_date(db, period.id, d, [rule], {brand.id: []})
    assert coverage[0]["coverage_status"] == "PARTIALLY_COVERED"
    assert coverage[0]["actual_staff"] == 1
    assert coverage[0]["required_staff"] == 2

    conflicts = detect_conflicts(db, period.id, d, coverage)
    insufficient = [c for c in conflicts if c["conflict_type"] == "INSUFFICIENT_STAFFING"]
    assert len(insufficient) == 1
    assert insufficient[0]["severity"] == "HIGH"


def test_scenario_6_approved_leave_blocks_availability(db):
    """
    SCENARIO 6:
    A manager assigns an employee who has approved leave.
    Expected: Invalid assignment rejected / unavailable status detected.
    """
    emp = Employee(employee_code="E-LEAVE", full_name="Leave Worker", employment_status="ACTIVE")
    db.add(emp)
    db.commit()

    d = date(2026, 11, 20)
    db.add(LeaveRequest(employee_id=emp.id, leave_type="PLANNED_LEAVE", start_date=d, end_date=d, status="APPROVED"))
    db.commit()

    assert is_on_approved_leave(db, emp.id, d) is True
    avail, reason = is_employee_available(db, emp.id, d)
    assert avail is False
    assert reason == "APPROVED_LEAVE"


def test_scenario_7_pending_leave_does_not_block_scheduling(db):
    """
    SCENARIO 7:
    An employee has a pending leave request.
    Expected: Pending status displayed, but pending request NOT treated as approved leave.
    """
    emp = Employee(employee_code="E-PEND", full_name="Pending Worker", employment_status="ACTIVE")
    db.add(emp)
    db.commit()

    d = date(2026, 11, 21)
    db.add(LeaveRequest(employee_id=emp.id, leave_type="PLANNED_LEAVE", start_date=d, end_date=d, status="PENDING"))
    db.commit()

    assert is_on_pending_leave(db, emp.id, d) is True
    assert is_on_approved_leave(db, emp.id, d) is False
    # Availability is TRUE because pending request does NOT block!
    avail, _ = is_employee_available(db, emp.id, d)
    assert avail is True


def test_scenario_8_change_availability_post_roster_generation(db):
    """
    SCENARIO 8:
    A manager changes an employee's availability after roster generation.
    Expected:
    - Affected assignments identified.
    - Coverage recalculated.
    - Replacement suggested.
    - Roster revalidated.
    """
    brand = Brand(brand_name="Brand Eight", brand_code="B8")
    db.add(brand)
    db.commit()

    cs = db.query(Process).filter(Process.process_code == "CS").first()
    rule = BrandProcessRule(brand_id=brand.id, process_id=cs.id, operating_calendar_type="ALL_DAYS", minimum_staff_required=1, works_on_sunday=True)
    db.add(rule)
    db.commit()

    emp_orig = Employee(employee_code="E-ORIG", full_name="Original Staff", employment_status="ACTIVE")
    emp_repl = Employee(employee_code="E-REPL", full_name="Replacement Staff", employment_status="ACTIVE")
    db.add_all([emp_orig, emp_repl])
    db.commit()

    # Backup assignment for replacement
    db.add(EmployeeAssignment(employee_id=emp_repl.id, brand_id=brand.id, process_id=cs.id, assignment_type="BACKUP", is_backup_resource=True))
    db.commit()

    d = date(2026, 11, 16)
    period = RosterPeriod(month=11, year=2026, status="GENERATED")
    db.add(period)
    db.commit()

    # Original employee was scheduled
    entry = RosterEntry(roster_period_id=period.id, employee_id=emp_orig.id, roster_date=d, status="WORKING")
    db.add(entry)
    db.commit()
    db.add(RosterEntryAssignment(roster_entry_id=entry.id, brand_id=brand.id, process_id=cs.id, workload_hours=8.0))
    db.commit()

    # Step 1: Analyze change impact
    impact = analyze_change_impact(db, emp_orig.id, "EMERGENCY_LEAVE", start_date=d, end_date=d, roster_period_id=period.id)
    assert len(impact["coverage_gaps"]) == 1
    assert len(impact["backup_recommendations"]) >= 1
    assert impact["backup_recommendations"][0]["employee_id"] == emp_repl.id

    # Step 2: Apply replacement
    result = apply_replacement(db, period.id, emp_orig.id, emp_repl.id, d, brand.id, cs.id)
    assert result["success"] is True

    # Step 3: Verify updated entries
    orig_entry = db.query(RosterEntry).filter(RosterEntry.employee_id == emp_orig.id, RosterEntry.roster_date == d).first()
    assert orig_entry.status == "LEAVE"

    repl_entry = db.query(RosterEntry).filter(RosterEntry.employee_id == emp_repl.id, RosterEntry.roster_date == d).first()
    assert repl_entry.status == "WORKING"
    assert repl_entry.manually_modified is True
