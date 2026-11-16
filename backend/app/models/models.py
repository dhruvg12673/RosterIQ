from datetime import datetime, date, time
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, Date, Time, DateTime,
    ForeignKey, UniqueConstraint, CheckConstraint, Index, func
)
from sqlalchemy.orm import relationship, mapped_column, Mapped
from typing import Optional, List
from app.core.database import Base


class Pod(Base):
    __tablename__ = "pods"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    pod_name: Mapped[str] = mapped_column(String(100), nullable=False)
    pod_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    pod_lead_employee_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("employees.id", use_alter=True), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    employees: Mapped[List["Employee"]] = relationship("Employee", back_populates="pod", foreign_keys="Employee.pod_id")
    pod_lead: Mapped[Optional["Employee"]] = relationship("Employee", foreign_keys=[pod_lead_employee_id], post_update=True)


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    employee_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    designation: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    pod_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("pods.id"), nullable=True)
    joining_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    employment_status: Mapped[str] = mapped_column(String(20), default="ACTIVE", server_default="ACTIVE")
    daily_capacity_hours: Mapped[float] = mapped_column(Float, default=8.0, server_default="8.0")
    weekly_off_count: Mapped[int] = mapped_column(Integer, default=1, server_default="1")
    preferred_weekly_off_days: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, onupdate=func.now(), nullable=True)

    pod: Mapped[Optional["Pod"]] = relationship("Pod", back_populates="employees", foreign_keys=[pod_id])
    assignments: Mapped[List["EmployeeAssignment"]] = relationship("EmployeeAssignment", back_populates="employee")
    availability_records: Mapped[List["EmployeeAvailability"]] = relationship("EmployeeAvailability", back_populates="employee")
    leave_requests: Mapped[List["LeaveRequest"]] = relationship("LeaveRequest", back_populates="employee", foreign_keys="LeaveRequest.employee_id")
    roster_entries: Mapped[List["RosterEntry"]] = relationship("RosterEntry", back_populates="employee")
    weekly_off_rules: Mapped[List["WeeklyOffRule"]] = relationship("WeeklyOffRule", back_populates="employee")


class Brand(Base):
    __tablename__ = "brands"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    brand_name: Mapped[str] = mapped_column(String(100), nullable=False)
    brand_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE", server_default="ACTIVE")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    brand_process_rules: Mapped[List["BrandProcessRule"]] = relationship("BrandProcessRule", back_populates="brand")
    assignments: Mapped[List["EmployeeAssignment"]] = relationship("EmployeeAssignment", back_populates="brand")


class Process(Base):
    __tablename__ = "processes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    process_name: Mapped[str] = mapped_column(String(100), nullable=False)
    process_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE", server_default="ACTIVE")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    brand_process_rules: Mapped[List["BrandProcessRule"]] = relationship("BrandProcessRule", back_populates="process")


class BrandProcessRule(Base):
    __tablename__ = "brand_process_rules"
    __table_args__ = (
        UniqueConstraint("brand_id", "process_id", name="uq_brand_process"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    brand_id: Mapped[int] = mapped_column(Integer, ForeignKey("brands.id"), nullable=False)
    process_id: Mapped[int] = mapped_column(Integer, ForeignKey("processes.id"), nullable=False)
    operating_calendar_type: Mapped[str] = mapped_column(String(50), nullable=False, default="DAILY_EXCEPT_PUBLIC_HOLIDAYS")
    minimum_staff_required: Mapped[int] = mapped_column(Integer, default=1, server_default="1")
    preferred_staff_count: Mapped[int] = mapped_column(Integer, default=1, server_default="1")
    workload_hours_per_employee: Mapped[float] = mapped_column(Float, default=8.0, server_default="8.0")
    required_start_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    required_end_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    operating_weekdays: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    works_on_sunday: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    works_on_public_holidays: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")

    brand: Mapped["Brand"] = relationship("Brand", back_populates="brand_process_rules")
    process: Mapped["Process"] = relationship("Process", back_populates="brand_process_rules")


class EmployeeAssignment(Base):
    __tablename__ = "employee_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employees.id"), nullable=False)
    brand_id: Mapped[int] = mapped_column(Integer, ForeignKey("brands.id"), nullable=False)
    process_id: Mapped[int] = mapped_column(Integer, ForeignKey("processes.id"), nullable=False)
    assignment_type: Mapped[str] = mapped_column(String(20), default="PRIMARY", server_default="PRIMARY")
    allocation_percentage: Mapped[float] = mapped_column(Float, default=100.0, server_default="100.0")
    priority: Mapped[int] = mapped_column(Integer, default=1, server_default="1")
    active_from: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    active_until: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_backup_resource: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")

    employee: Mapped["Employee"] = relationship("Employee", back_populates="assignments")
    brand: Mapped["Brand"] = relationship("Brand", back_populates="assignments")
    process: Mapped["Process"] = relationship("Process")


class PublicHoliday(Base):
    __tablename__ = "public_holidays"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    holiday_name: Mapped[str] = mapped_column(String(100), nullable=False)
    holiday_date: Mapped[date] = mapped_column(Date, nullable=False)
    region: Mapped[str] = mapped_column(String(50), default="ALL", server_default="ALL")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    applicable_to_all: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")

    brand_exceptions: Mapped[List["PublicHolidayBrandException"]] = relationship("PublicHolidayBrandException", back_populates="holiday")


class PublicHolidayBrandException(Base):
    __tablename__ = "public_holiday_brand_exceptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    holiday_id: Mapped[int] = mapped_column(Integer, ForeignKey("public_holidays.id"), nullable=False)
    brand_id: Mapped[int] = mapped_column(Integer, ForeignKey("brands.id"), nullable=False)
    is_applicable: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")

    holiday: Mapped["PublicHoliday"] = relationship("PublicHoliday", back_populates="brand_exceptions")
    brand: Mapped["Brand"] = relationship("Brand")


class EmployeeAvailability(Base):
    __tablename__ = "employee_availability"
    __table_args__ = (
        UniqueConstraint("employee_id", "availability_date", name="uq_employee_availability_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employees.id"), nullable=False)
    availability_date: Mapped[date] = mapped_column(Date, nullable=False)
    availability_status: Mapped[str] = mapped_column(String(20), nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    employee: Mapped["Employee"] = relationship("Employee", back_populates="availability_records")


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employees.id"), nullable=False)
    leave_type: Mapped[str] = mapped_column(String(20), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="PENDING", server_default="PENDING")
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    approved_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("employees.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    employee: Mapped["Employee"] = relationship("Employee", back_populates="leave_requests", foreign_keys=[employee_id])
    approver: Mapped[Optional["Employee"]] = relationship("Employee", foreign_keys=[approved_by])


class WeeklyOffRule(Base):
    __tablename__ = "weekly_off_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employees.id"), nullable=False)
    off_day: Mapped[str] = mapped_column(String(20), nullable=False)
    rule_type: Mapped[str] = mapped_column(String(20), default="FIXED", server_default="FIXED")
    effective_from: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    effective_until: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")

    employee: Mapped["Employee"] = relationship("Employee", back_populates="weekly_off_rules")


class RosterPeriod(Base):
    __tablename__ = "roster_periods"
    __table_args__ = (
        UniqueConstraint("month", "year", "version_number", name="uq_roster_period_version"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="DRAFT", server_default="DRAFT")
    generated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    generated_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    version_number: Mapped[int] = mapped_column(Integer, default=1, server_default="1")

    entries: Mapped[List["RosterEntry"]] = relationship("RosterEntry", back_populates="roster_period", cascade="all, delete-orphan")
    coverage_results: Mapped[List["CoverageResult"]] = relationship("CoverageResult", back_populates="roster_period", cascade="all, delete-orphan")
    conflict_records: Mapped[List["ConflictRecord"]] = relationship("ConflictRecord", back_populates="roster_period", cascade="all, delete-orphan")


class RosterEntry(Base):
    __tablename__ = "roster_entries"
    __table_args__ = (
        UniqueConstraint("roster_period_id", "employee_id", "roster_date", name="uq_roster_entry"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    roster_period_id: Mapped[int] = mapped_column(Integer, ForeignKey("roster_periods.id"), nullable=False)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employees.id"), nullable=False)
    roster_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    shift_start: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    shift_end: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    manually_modified: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    modification_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    roster_period: Mapped["RosterPeriod"] = relationship("RosterPeriod", back_populates="entries")
    employee: Mapped["Employee"] = relationship("Employee", back_populates="roster_entries")
    assignments: Mapped[List["RosterEntryAssignment"]] = relationship("RosterEntryAssignment", back_populates="roster_entry", cascade="all, delete-orphan")


class RosterEntryAssignment(Base):
    __tablename__ = "roster_entry_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    roster_entry_id: Mapped[int] = mapped_column(Integer, ForeignKey("roster_entries.id"), nullable=False)
    brand_id: Mapped[int] = mapped_column(Integer, ForeignKey("brands.id"), nullable=False)
    process_id: Mapped[int] = mapped_column(Integer, ForeignKey("processes.id"), nullable=False)
    workload_hours: Mapped[float] = mapped_column(Float, default=8.0, server_default="8.0")

    roster_entry: Mapped["RosterEntry"] = relationship("RosterEntry", back_populates="assignments")
    brand: Mapped["Brand"] = relationship("Brand")
    process: Mapped["Process"] = relationship("Process")


class CoverageResult(Base):
    __tablename__ = "coverage_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    roster_period_id: Mapped[int] = mapped_column(Integer, ForeignKey("roster_periods.id"), nullable=False)
    roster_date: Mapped[date] = mapped_column(Date, nullable=False)
    brand_id: Mapped[int] = mapped_column(Integer, ForeignKey("brands.id"), nullable=False)
    process_id: Mapped[int] = mapped_column(Integer, ForeignKey("processes.id"), nullable=False)
    required_staff: Mapped[int] = mapped_column(Integer, nullable=False)
    actual_staff: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    coverage_percentage: Mapped[float] = mapped_column(Float, default=0.0, server_default="0.0")
    coverage_status: Mapped[str] = mapped_column(String(20), nullable=False)
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    roster_period: Mapped["RosterPeriod"] = relationship("RosterPeriod", back_populates="coverage_results")
    brand: Mapped["Brand"] = relationship("Brand")
    process: Mapped["Process"] = relationship("Process")


class ConflictRecord(Base):
    __tablename__ = "conflict_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    roster_period_id: Mapped[int] = mapped_column(Integer, ForeignKey("roster_periods.id"), nullable=False)
    roster_date: Mapped[date] = mapped_column(Date, nullable=False)
    employee_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("employees.id"), nullable=True)
    brand_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("brands.id"), nullable=True)
    process_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("processes.id"), nullable=True)
    conflict_type: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    suggested_resolution: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    roster_period: Mapped["RosterPeriod"] = relationship("RosterPeriod", back_populates="conflict_records")
    employee: Mapped[Optional["Employee"]] = relationship("Employee")
    brand: Mapped[Optional["Brand"]] = relationship("Brand")
    process: Mapped[Optional["Process"]] = relationship("Process")


class AuditRecord(Base):
    __tablename__ = "audit_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[int] = mapped_column(Integer, nullable=False)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    performed_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
