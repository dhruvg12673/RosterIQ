"""Working rules (BrandProcessRule) API routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.models import BrandProcessRule, Brand, Process
from app.schemas.schemas import (
    BrandProcessRuleCreate, BrandProcessRuleUpdate, BrandProcessRuleResponse
)

router = APIRouter(prefix="/working-rules", tags=["Working Rules"])


@router.get("", response_model=List[BrandProcessRuleResponse])
def list_rules(brand_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(BrandProcessRule)
    if brand_id:
        query = query.filter(BrandProcessRule.brand_id == brand_id)
    
    rules = query.all()
    result = []
    for rule in rules:
        brand = db.query(Brand).filter(Brand.id == rule.brand_id).first()
        process = db.query(Process).filter(Process.id == rule.process_id).first()
        r = BrandProcessRuleResponse.model_validate(rule)
        r.brand_name = brand.brand_name if brand else None
        r.process_name = process.process_name if process else None
        result.append(r)
    return result


@router.get("/{rule_id}", response_model=BrandProcessRuleResponse)
def get_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(BrandProcessRule).filter(BrandProcessRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    brand = db.query(Brand).filter(Brand.id == rule.brand_id).first()
    process = db.query(Process).filter(Process.id == rule.process_id).first()
    r = BrandProcessRuleResponse.model_validate(rule)
    r.brand_name = brand.brand_name if brand else None
    r.process_name = process.process_name if process else None
    return r


@router.post("", response_model=BrandProcessRuleResponse, status_code=201)
def create_rule(data: BrandProcessRuleCreate, db: Session = Depends(get_db)):
    existing = db.query(BrandProcessRule).filter(
        BrandProcessRule.brand_id == data.brand_id,
        BrandProcessRule.process_id == data.process_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Rule already exists for this brand/process")
    rule = BrandProcessRule(**data.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    brand = db.query(Brand).filter(Brand.id == rule.brand_id).first()
    process = db.query(Process).filter(Process.id == rule.process_id).first()
    r = BrandProcessRuleResponse.model_validate(rule)
    r.brand_name = brand.brand_name if brand else None
    r.process_name = process.process_name if process else None
    return r


@router.put("/{rule_id}", response_model=BrandProcessRuleResponse)
def update_rule(rule_id: int, data: BrandProcessRuleUpdate, db: Session = Depends(get_db)):
    rule = db.query(BrandProcessRule).filter(BrandProcessRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(rule, key, value)
    db.commit()
    db.refresh(rule)
    brand = db.query(Brand).filter(Brand.id == rule.brand_id).first()
    process = db.query(Process).filter(Process.id == rule.process_id).first()
    r = BrandProcessRuleResponse.model_validate(rule)
    r.brand_name = brand.brand_name if brand else None
    r.process_name = process.process_name if process else None
    return r
