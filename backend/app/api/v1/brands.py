"""Brand management API routes."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.database import get_db
from app.models.models import Brand, BrandProcessRule, EmployeeAssignment
from app.schemas.schemas import BrandCreate, BrandUpdate, BrandResponse, BrandDetailResponse

router = APIRouter(prefix="/brands", tags=["Brands"])


@router.get("", response_model=List[BrandDetailResponse])
def list_brands(
    search: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Brand)
    if search:
        query = query.filter(Brand.brand_name.ilike(f"%{search}%"))
    if status:
        query = query.filter(Brand.status == status)
    
    brands = query.order_by(Brand.brand_name).all()
    result = []
    for brand in brands:
        process_count = db.query(BrandProcessRule).filter(
            BrandProcessRule.brand_id == brand.id,
            BrandProcessRule.active == True
        ).count()
        
        employee_ids = db.query(EmployeeAssignment.employee_id).filter(
            EmployeeAssignment.brand_id == brand.id,
            EmployeeAssignment.active == True,
            EmployeeAssignment.is_backup_resource == False
        ).distinct().all()
        employee_count = len(employee_ids)
        
        resource_type = "single" if employee_count <= 1 else "multi"
        
        detail = BrandDetailResponse.model_validate(brand)
        detail.employee_count = employee_count
        detail.process_count = process_count
        detail.resource_type = resource_type
        result.append(detail)
    
    return result


@router.get("/{brand_id}", response_model=BrandDetailResponse)
def get_brand(brand_id: int, db: Session = Depends(get_db)):
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    process_count = db.query(BrandProcessRule).filter(
        BrandProcessRule.brand_id == brand.id, BrandProcessRule.active == True
    ).count()
    employee_ids = db.query(EmployeeAssignment.employee_id).filter(
        EmployeeAssignment.brand_id == brand.id,
        EmployeeAssignment.active == True,
        EmployeeAssignment.is_backup_resource == False
    ).distinct().all()
    employee_count = len(employee_ids)
    resource_type = "single" if employee_count <= 1 else "multi"
    
    detail = BrandDetailResponse.model_validate(brand)
    detail.employee_count = employee_count
    detail.process_count = process_count
    detail.resource_type = resource_type
    return detail


@router.post("", response_model=BrandResponse, status_code=201)
def create_brand(data: BrandCreate, db: Session = Depends(get_db)):
    existing = db.query(Brand).filter(Brand.brand_code == data.brand_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Brand code already exists")
    brand = Brand(**data.model_dump())
    db.add(brand)
    db.commit()
    db.refresh(brand)
    return brand


@router.put("/{brand_id}", response_model=BrandResponse)
def update_brand(brand_id: int, data: BrandUpdate, db: Session = Depends(get_db)):
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    if data.brand_code and data.brand_code != brand.brand_code:
        conflict = db.query(Brand).filter(Brand.brand_code == data.brand_code).first()
        if conflict:
            raise HTTPException(status_code=400, detail="Brand code already exists")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(brand, key, value)
    db.commit()
    db.refresh(brand)
    return brand


@router.delete("/{brand_id}")
def delete_brand(brand_id: int, db: Session = Depends(get_db)):
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    from app.models.models import (
        BrandProcessRule, EmployeeAssignment, CoverageResult,
        ConflictRecord, RosterEntryAssignment, PublicHolidayBrandException
    )
    db.query(PublicHolidayBrandException).filter(PublicHolidayBrandException.brand_id == brand_id).delete()
    db.query(RosterEntryAssignment).filter(RosterEntryAssignment.brand_id == brand_id).delete()
    db.query(CoverageResult).filter(CoverageResult.brand_id == brand_id).delete()
    db.query(ConflictRecord).filter(ConflictRecord.brand_id == brand_id).delete()
    db.query(EmployeeAssignment).filter(EmployeeAssignment.brand_id == brand_id).delete()
    db.query(BrandProcessRule).filter(BrandProcessRule.brand_id == brand_id).delete()
    
    brand_name = brand.brand_name
    db.delete(brand)
    db.commit()
    return {"message": f"Brand {brand_name} deleted successfully"}
