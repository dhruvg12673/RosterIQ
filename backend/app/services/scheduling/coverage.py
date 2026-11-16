"""Coverage calculation for roster validation."""
from datetime import date
from typing import List, Dict, Tuple, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.models import (
    BrandProcessRule, CoverageResult, RosterEntry,
    RosterEntryAssignment, Brand, Process
)


def calculate_coverage_for_date(
    db: Session,
    roster_period_id: int,
    d: date,
    brand_process_rules: List[BrandProcessRule],
    holidays_by_brand: Dict[int, List[date]],
    brands_map: Optional[Dict[int, str]] = None,
    processes_map: Optional[Dict[int, str]] = None,
    assignments_counts: Optional[Dict[Tuple[int, int], int]] = None,
) -> List[Dict]:
    """Calculate coverage for all brand/process combinations on a date."""
    from app.services.scheduling.calendar_rules import is_process_operational

    if brands_map is None:
        brands_map = {b.id: b.brand_name for b in db.query(Brand).all()}
    if processes_map is None:
        processes_map = {p.id: p.process_name for p in db.query(Process).all()}

    # Group counts in a single query if not provided
    if assignments_counts is None:
        counts = db.query(
            RosterEntryAssignment.brand_id,
            RosterEntryAssignment.process_id,
            func.count(RosterEntryAssignment.id)
        ).join(RosterEntry).filter(
            RosterEntry.roster_period_id == roster_period_id,
            RosterEntry.roster_date == d,
            RosterEntry.status == "WORKING"
        ).group_by(
            RosterEntryAssignment.brand_id,
            RosterEntryAssignment.process_id
        ).all()
        assignments_counts = {(b_id, p_id): c for b_id, p_id, c in counts}

    coverage_results = []

    for rule in brand_process_rules:
        if not rule.active:
            continue

        brand_holidays = holidays_by_brand.get(rule.brand_id, [])

        # Check if process is operational on this date
        operational = is_process_operational(
            calendar_type=rule.operating_calendar_type,
            d=d,
            holidays=brand_holidays,
            operating_weekdays=rule.operating_weekdays,
            works_on_sunday=rule.works_on_sunday,
            works_on_public_holidays=rule.works_on_public_holidays
        )

        if not operational:
            coverage_results.append({
                "roster_period_id": roster_period_id,
                "roster_date": d,
                "brand_id": rule.brand_id,
                "process_id": rule.process_id,
                "required_staff": 0,
                "actual_staff": 0,
                "coverage_percentage": 100.0,
                "coverage_status": "NOT_REQUIRED",
                "explanation": f"Process not operational on {d} per calendar type {rule.operating_calendar_type}"
            })
            continue

        # Count actual staff assigned
        actual_staff = assignments_counts.get((rule.brand_id, rule.process_id), 0)

        required = rule.minimum_staff_required
        coverage_pct = (actual_staff / required * 100.0) if required > 0 else 100.0
        coverage_pct = min(coverage_pct, 100.0)

        if actual_staff >= required:
            status = "FULLY_COVERED"
        elif actual_staff > 0:
            status = "PARTIALLY_COVERED"
        else:
            status = "NOT_COVERED"

        brand_name = brands_map.get(rule.brand_id, "Unknown")
        process_name = processes_map.get(rule.process_id, "Unknown")

        explanation = f"{brand_name}/{process_name}: {actual_staff}/{required} staff"
        if status != "FULLY_COVERED":
            explanation += f" - SHORTAGE of {required - actual_staff}"

        coverage_results.append({
            "roster_period_id": roster_period_id,
            "roster_date": d,
            "brand_id": rule.brand_id,
            "process_id": rule.process_id,
            "required_staff": required,
            "actual_staff": actual_staff,
            "coverage_percentage": coverage_pct,
            "coverage_status": status,
            "explanation": explanation
        })

    return coverage_results


def save_coverage_results(db: Session, results: List[Dict]):
    """Save coverage results to database using bulk add."""
    if not results:
        return
    db.add_all([CoverageResult(**r) for r in results])
    db.flush()


def get_coverage_summary(db: Session, roster_period_id: int) -> Dict:
    """Get coverage summary metrics for a roster period."""
    results = db.query(CoverageResult).filter(
        CoverageResult.roster_period_id == roster_period_id
    ).all()

    total_slots = len(results)
    operational_slots = [r for r in results if r.coverage_status != "NOT_REQUIRED"]
    fully_covered = sum(1 for r in operational_slots if r.coverage_status == "FULLY_COVERED")
    partially_covered = sum(1 for r in operational_slots if r.coverage_status == "PARTIALLY_COVERED")
    not_covered = sum(1 for r in operational_slots if r.coverage_status == "NOT_COVERED")

    coverage_pct = (fully_covered / len(operational_slots) * 100.0) if operational_slots else 100.0

    return {
        "total_slots": total_slots,
        "operational_slots": len(operational_slots),
        "fully_covered": fully_covered,
        "partially_covered": partially_covered,
        "not_covered": not_covered,
        "coverage_percentage": round(coverage_pct, 2)
    }

