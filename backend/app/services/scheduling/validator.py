"""Roster validation engine."""
from typing import Dict, List
from sqlalchemy.orm import Session
from app.models.models import (
    RosterPeriod, RosterEntry, CoverageResult, ConflictRecord
)
from app.services.scheduling.coverage import get_coverage_summary
from app.services.scheduling.conflict_detector import get_conflict_summary


def validate_roster(db: Session, roster_period_id: int) -> Dict:
    """
    Validate a complete roster period.
    Returns validation summary with pass/fail status.
    """
    period = db.query(RosterPeriod).filter(RosterPeriod.id == roster_period_id).first()
    if not period:
        return {"validation_status": "ERROR", "message": "Roster period not found"}

    coverage_summary = get_coverage_summary(db, roster_period_id)
    conflict_summary = get_conflict_summary(db, roster_period_id)

    # Count hard constraint violations (critical and high conflicts)
    hard_violations = conflict_summary["critical"] + conflict_summary["high"]
    soft_warnings = conflict_summary["medium"] + conflict_summary["low"]

    # Determine validation status
    if hard_violations == 0 and coverage_summary["not_covered"] == 0:
        validation_status = "VALID"
        can_publish = True
    elif conflict_summary["critical"] == 0 and coverage_summary["not_covered"] == 0:
        validation_status = "VALID_WITH_WARNINGS"
        can_publish = True
    else:
        validation_status = "INVALID"
        can_publish = False

    # Get details of issues
    details = []
    if coverage_summary["not_covered"] > 0:
        # Get specific uncovered slots
        uncovered = db.query(CoverageResult).filter(
            CoverageResult.roster_period_id == roster_period_id,
            CoverageResult.coverage_status == "NOT_COVERED"
        ).all()
        for uc in uncovered[:20]:  # Limit details
            details.append({
                "type": "COVERAGE_GAP",
                "date": str(uc.roster_date),
                "brand_id": uc.brand_id,
                "process_id": uc.process_id,
                "message": uc.explanation or "Coverage gap"
            })

    critical_conflicts = db.query(ConflictRecord).filter(
        ConflictRecord.roster_period_id == roster_period_id,
        ConflictRecord.severity == "CRITICAL",
        ConflictRecord.resolved == False
    ).all()
    for cc in critical_conflicts[:20]:
        details.append({
            "type": "CRITICAL_CONFLICT",
            "date": str(cc.roster_date),
            "conflict_type": cc.conflict_type,
            "message": cc.explanation or "Critical conflict"
        })

    return {
        "roster_period_id": roster_period_id,
        "total_required_slots": coverage_summary["required_slots"],
        "satisfied_slots": coverage_summary["fully_covered"],
        "unfilled_slots": coverage_summary["not_covered"] + coverage_summary["partially_covered"],
        "coverage_percentage": coverage_summary["coverage_percentage"],
        "hard_constraint_violations": hard_violations,
        "soft_constraint_warnings": soft_warnings,
        "critical_conflicts": conflict_summary["critical"],
        "validation_status": validation_status,
        "details": details,
        "can_publish": can_publish
    }
