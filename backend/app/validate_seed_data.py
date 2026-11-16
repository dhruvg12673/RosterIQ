"""
RosterIQ Seed Data Validator
Strictly checks all DATASTRAW assessment dataset requirements.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.core.database import SessionLocal
from app.models.models import (
    Pod, Employee, Brand, Process, BrandProcessRule,
    EmployeeAssignment, PublicHoliday, LeaveRequest, EmployeeAvailability, WeeklyOffRule
)


def validate():
    db = SessionLocal()
    errors = []
    checks_passed = 0

    try:
        print("🔍 Validating RosterIQ Seed Dataset...")

        # 1. Employees >= 36
        emp_count = db.query(Employee).count()
        print(f"• Employees count: {emp_count}")
        if emp_count < 36:
            errors.append(f"Expected at least 36 employees, found {emp_count}")
        else:
            checks_passed += 1

        # 2. Pods == 6
        pod_count = db.query(Pod).count()
        print(f"• Pods count: {pod_count}")
        if pod_count < 6:
            errors.append(f"Expected at least 6 pods, found {pod_count}")
        else:
            checks_passed += 1

        # 3. Pod Leads assigned
        leads = db.query(Pod).filter(Pod.pod_lead_employee_id != None).count()
        print(f"• Pods with assigned lead: {leads}")
        if leads < 6:
            errors.append(f"Expected 6 pod leads, found {leads}")
        else:
            checks_passed += 1

        # 4. Brands == 20
        brand_count = db.query(Brand).count()
        print(f"• Brands count: {brand_count}")
        if brand_count < 20:
            errors.append(f"Expected at least 20 brands, found {brand_count}")
        else:
            checks_passed += 1

        # 5. Processes >= 5
        proc_count = db.query(Process).count()
        print(f"• Processes count: {proc_count}")
        if proc_count < 5:
            errors.append(f"Expected at least 5 processes, found {proc_count}")
        else:
            checks_passed += 1

        # 6. Single-Resource vs Multi-Resource Brands
        single_res_brands = []
        multi_res_brands = []
        brands = db.query(Brand).all()
        for b in brands:
            primary_emps = db.query(EmployeeAssignment.employee_id).filter(
                EmployeeAssignment.brand_id == b.id,
                EmployeeAssignment.is_backup_resource == False,
                EmployeeAssignment.active == True
            ).distinct().all()
            if len(primary_emps) == 1:
                single_res_brands.append(b.brand_name)
            elif len(primary_emps) > 1:
                multi_res_brands.append(b.brand_name)

        print(f"• Single-resource brands: {len(single_res_brands)} ({len(single_res_brands)/len(brands)*100:.0f}%)")
        print(f"• Multi-resource brands: {len(multi_res_brands)} ({len(multi_res_brands)/len(brands)*100:.0f}%)")

        if len(single_res_brands) < 16:
            errors.append(f"Expected at least 16 single-resource brands, found {len(single_res_brands)}")
        else:
            checks_passed += 1

        if len(multi_res_brands) < 4:
            errors.append(f"Expected at least 4 multi-resource brands, found {len(multi_res_brands)}")
        else:
            checks_passed += 1

        # 7. Brand Process Rules (Diverse calendars)
        rules = db.query(BrandProcessRule).all()
        cal_types = set(r.operating_calendar_type for r in rules)
        print(f"• Calendar types implemented: {cal_types}")
        required_cal_types = {"ALL_DAYS", "DAILY_EXCEPT_PUBLIC_HOLIDAYS", "SUNDAYS_AND_PUBLIC_HOLIDAYS_OFF"}
        if not required_cal_types.issubset(cal_types):
            errors.append(f"Missing required calendar types: {required_cal_types - cal_types}")
        else:
            checks_passed += 1

        # 8. Weekly Off Rules
        weekly_offs = db.query(WeeklyOffRule).count()
        print(f"• Weekly off rules count: {weekly_offs}")
        if weekly_offs < emp_count:
            errors.append(f"Expected at least {emp_count} weekly off rules, found {weekly_offs}")
        else:
            checks_passed += 1

        # 9. Public Holidays
        holidays_count = db.query(PublicHoliday).count()
        print(f"• Public holidays count: {holidays_count}")
        if holidays_count < 10:
            errors.append(f"Expected at least 10 holidays, found {holidays_count}")
        else:
            checks_passed += 1

        # 10. Leaves (Approved, Pending, Comp-Off)
        leaves = db.query(LeaveRequest).all()
        leave_types = set(l.leave_type for l in leaves)
        leave_statuses = set(l.status for l in leaves)
        print(f"• Leave types: {leave_types}")
        print(f"• Leave statuses: {leave_statuses}")
        if "APPROVED" not in leave_statuses or "PENDING" not in leave_statuses:
            errors.append("Must have both APPROVED and PENDING leave requests")
        else:
            checks_passed += 1

        # 11. Backup resources
        backups = db.query(EmployeeAssignment).filter(EmployeeAssignment.is_backup_resource == True).count()
        print(f"• Backup resource assignments: {backups}")
        if backups < 5:
            errors.append(f"Expected at least 5 backup resource assignments, found {backups}")
        else:
            checks_passed += 1

        print("--------------------------------------------------")
        if errors:
            print(f"❌ Validation FAILED with {len(errors)} errors:")
            for err in errors:
                print(f"   - {err}")
            return False
        else:
            print(f"🎉 ALL {checks_passed} SEED DATA CHECKS PASSED PERFECTLY!")
            return True

    finally:
        db.close()


if __name__ == "__main__":
    success = validate()
    sys.exit(0 if success else 1)
