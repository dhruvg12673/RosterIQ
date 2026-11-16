"""
API Direct Functional Tests
Tests all API router functions with real database sessions.
"""
import pytest
from app.core.database import SessionLocal
from app.api.v1.employees import list_employees, count_employees, get_employee
from app.api.v1.pods import list_pods, get_pod
from app.api.v1.brands import list_brands, get_brand
from app.api.v1.processes import list_processes
from app.api.v1.working_rules import list_rules
from app.api.v1.assignments import list_assignments
from app.api.v1.leaves import list_leaves, list_availability
from app.api.v1.holidays import list_holidays
from app.api.v1.dashboard import get_dashboard
from app.api.v1.rosters import list_roster_periods, list_coverage, list_conflicts, get_current_roster_period
from app.models.models import RosterPeriod


@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    yield db
    db.close()


def test_employees_api(db_session):
    emps = list_employees(skip=0, limit=100, db=db_session)
    assert len(emps) >= 36
    counts = count_employees(db=db_session)
    assert counts["total"] >= 36
    assert counts["active"] >= 36

    # Get specific employee
    emp_detail = get_employee(emps[0].id, db=db_session)
    assert emp_detail.id == emps[0].id
    assert emp_detail.full_name is not None


def test_pods_api(db_session):
    pods = list_pods(db=db_session)
    assert len(pods) == 6
    assert all(p.member_count > 0 for p in pods)
    assert all(p.lead_name is not None for p in pods)


def test_brands_api(db_session):
    brands = list_brands(db=db_session)
    assert len(brands) == 20
    single = [b for b in brands if b.resource_type == "single"]
    assert len(single) >= 16


def test_processes_api(db_session):
    procs = list_processes(db=db_session)
    assert len(procs) >= 5
    codes = [p.process_code for p in procs]
    assert "CS" in codes
    assert "ACC" in codes
    assert "NDR" in codes


def test_working_rules_api(db_session):
    rules = list_rules(db=db_session)
    assert len(rules) > 0
    assert any(r.operating_calendar_type == "ALL_DAYS" for r in rules)


def test_assignments_api(db_session):
    assignments = list_assignments(db=db_session)
    assert len(assignments) >= 50
    backups = [a for a in assignments if a.is_backup_resource]
    assert len(backups) >= 5


def test_leaves_api(db_session):
    leaves = list_leaves(db=db_session)
    assert len(leaves) >= 3
    # Check approved vs pending
    statuses = set(l.status for l in leaves)
    assert "APPROVED" in statuses
    assert "PENDING" in statuses


def test_holidays_api(db_session):
    holidays = list_holidays(db=db_session)
    assert len(holidays) >= 10


def test_dashboard_api(db_session):
    dash = get_dashboard(db=db_session)
    assert dash.total_employees >= 36
    assert dash.total_brands == 20
    assert dash.total_pods == 6
    assert dash.total_processes >= 5
    assert len(dash.employees_by_pod) == 6
    assert dash.brands_by_staffing_type["single"] >= 16


def test_roster_periods_api(db_session):
    periods = list_roster_periods(db=db_session)
    assert len(periods) >= 1
    period_id = periods[0].id

    coverage = list_coverage(period_id=period_id, db=db_session)
    assert len(coverage) > 0

    conflicts = list_conflicts(period_id=period_id, db=db_session)
    assert len(conflicts) > 0
