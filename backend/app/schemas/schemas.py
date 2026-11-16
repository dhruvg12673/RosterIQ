from pydantic import BaseModel, ConfigDict, Field
from datetime import date, time, datetime
from typing import Optional, List


# ---- Employee ----
class EmployeeCreate(BaseModel):
    employee_code: str = Field(..., max_length=20)
    full_name: str = Field(..., max_length=100)
    email: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    pod_id: Optional[int] = None
    joining_date: Optional[date] = None
    employment_status: str = "ACTIVE"
    daily_capacity_hours: float = 8.0
    weekly_off_count: int = 1
    preferred_weekly_off_days: Optional[str] = None


class EmployeeUpdate(BaseModel):
    employee_code: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    pod_id: Optional[int] = None
    employment_status: Optional[str] = None
    daily_capacity_hours: Optional[float] = None
    weekly_off_count: Optional[int] = None
    preferred_weekly_off_days: Optional[str] = None


class EmployeeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    employee_code: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    pod_id: Optional[int] = None
    joining_date: Optional[date] = None
    employment_status: str
    daily_capacity_hours: float
    weekly_off_count: int
    preferred_weekly_off_days: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class EmployeeDetailResponse(EmployeeResponse):
    pod_name: Optional[str] = None
    assignment_count: int = 0


# ---- Pod ----
class PodCreate(BaseModel):
    pod_name: str = Field(..., max_length=100)
    pod_code: str = Field(..., max_length=20)
    pod_lead_employee_id: Optional[int] = None
    description: Optional[str] = None


class PodUpdate(BaseModel):
    pod_name: Optional[str] = None
    pod_lead_employee_id: Optional[int] = None
    description: Optional[str] = None


class PodResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    pod_name: str
    pod_code: str
    pod_lead_employee_id: Optional[int] = None
    description: Optional[str] = None
    created_at: Optional[datetime] = None


class PodDetailResponse(PodResponse):
    member_count: int = 0
    lead_name: Optional[str] = None


# ---- Brand ----
class BrandCreate(BaseModel):
    brand_name: str = Field(..., max_length=100)
    brand_code: str = Field(..., max_length=20)
    description: Optional[str] = None
    status: str = "ACTIVE"


class BrandUpdate(BaseModel):
    brand_name: Optional[str] = None
    brand_code: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class BrandResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    brand_name: str
    brand_code: str
    description: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None


class BrandDetailResponse(BrandResponse):
    employee_count: int = 0
    process_count: int = 0
    resource_type: str = "single"  # single or multi


# ---- Process ----
class ProcessCreate(BaseModel):
    process_name: str = Field(..., max_length=100)
    process_code: str = Field(..., max_length=20)
    description: Optional[str] = None
    status: str = "ACTIVE"


class ProcessUpdate(BaseModel):
    process_name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class ProcessResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    process_name: str
    process_code: str
    description: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None


# ---- BrandProcessRule ----
class BrandProcessRuleCreate(BaseModel):
    brand_id: int
    process_id: int
    operating_calendar_type: str = "DAILY_EXCEPT_PUBLIC_HOLIDAYS"
    minimum_staff_required: int = 1
    preferred_staff_count: int = 1
    workload_hours_per_employee: float = 8.0
    required_start_time: Optional[time] = None
    required_end_time: Optional[time] = None
    operating_weekdays: Optional[str] = None
    works_on_sunday: bool = False
    works_on_public_holidays: bool = False
    active: bool = True


class BrandProcessRuleUpdate(BaseModel):
    operating_calendar_type: Optional[str] = None
    minimum_staff_required: Optional[int] = None
    preferred_staff_count: Optional[int] = None
    workload_hours_per_employee: Optional[float] = None
    required_start_time: Optional[time] = None
    required_end_time: Optional[time] = None
    operating_weekdays: Optional[str] = None
    works_on_sunday: Optional[bool] = None
    works_on_public_holidays: Optional[bool] = None
    active: Optional[bool] = None


class BrandProcessRuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    brand_id: int
    process_id: int
    operating_calendar_type: str
    minimum_staff_required: int
    preferred_staff_count: int
    workload_hours_per_employee: float
    required_start_time: Optional[time] = None
    required_end_time: Optional[time] = None
    operating_weekdays: Optional[str] = None
    works_on_sunday: bool
    works_on_public_holidays: bool
    active: bool
    brand_name: Optional[str] = None
    process_name: Optional[str] = None


# ---- EmployeeAssignment ----
class EmployeeAssignmentCreate(BaseModel):
    employee_id: int
    brand_id: int
    process_id: int
    assignment_type: str = "PRIMARY"
    allocation_percentage: float = 100.0
    priority: int = 1
    active_from: Optional[date] = None
    active_until: Optional[date] = None
    is_backup_resource: bool = False
    active: bool = True


class EmployeeAssignmentUpdate(BaseModel):
    assignment_type: Optional[str] = None
    allocation_percentage: Optional[float] = None
    priority: Optional[int] = None
    active_until: Optional[date] = None
    is_backup_resource: Optional[bool] = None
    active: Optional[bool] = None


class EmployeeAssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    employee_id: int
    brand_id: int
    process_id: int
    assignment_type: str
    allocation_percentage: float
    priority: int
    active_from: Optional[date] = None
    active_until: Optional[date] = None
    is_backup_resource: bool
    active: bool
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    designation: Optional[str] = None
    pod_name: Optional[str] = None
    brand_name: Optional[str] = None
    process_name: Optional[str] = None


# ---- PublicHoliday ----
class PublicHolidayCreate(BaseModel):
    holiday_name: str = Field(..., max_length=100)
    holiday_date: date
    region: str = "ALL"
    description: Optional[str] = None
    applicable_to_all: bool = True


class PublicHolidayResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    holiday_name: str
    holiday_date: date
    region: str
    description: Optional[str] = None
    applicable_to_all: bool


# ---- EmployeeAvailability ----
class EmployeeAvailabilityCreate(BaseModel):
    employee_id: int
    availability_date: date
    availability_status: str
    reason: Optional[str] = None
    notes: Optional[str] = None


class EmployeeAvailabilityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    employee_id: int
    availability_date: date
    availability_status: str
    reason: Optional[str] = None
    notes: Optional[str] = None
    employee_name: Optional[str] = None


# ---- LeaveRequest ----
class LeaveRequestCreate(BaseModel):
    employee_id: int
    leave_type: str
    start_date: date
    end_date: date
    reason: Optional[str] = None


class LeaveRequestUpdate(BaseModel):
    status: Optional[str] = None
    approved_by: Optional[int] = None


class LeaveRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    employee_id: int
    leave_type: str
    start_date: date
    end_date: date
    status: str
    reason: Optional[str] = None
    approved_by: Optional[int] = None
    created_at: Optional[datetime] = None
    employee_name: Optional[str] = None


# ---- WeeklyOffRule ----
class WeeklyOffRuleCreate(BaseModel):
    employee_id: int
    off_day: str
    rule_type: str = "FIXED"
    effective_from: Optional[date] = None
    effective_until: Optional[date] = None
    active: bool = True


class WeeklyOffRuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    employee_id: int
    off_day: str
    rule_type: str
    effective_from: Optional[date] = None
    effective_until: Optional[date] = None
    active: bool


# ---- RosterPeriod ----
class RosterPeriodResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    month: int
    year: int
    status: str
    generated_at: Optional[datetime] = None
    generated_by: Optional[int] = None
    published_at: Optional[datetime] = None
    version_number: int


# ---- RosterEntry ----
class RosterEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    roster_period_id: int
    employee_id: int
    roster_date: date
    status: str
    shift_start: Optional[time] = None
    shift_end: Optional[time] = None
    notes: Optional[str] = None
    manually_modified: bool
    modification_reason: Optional[str] = None
    employee_name: Optional[str] = None


class RosterEntryUpdate(BaseModel):
    status: Optional[str] = None
    shift_start: Optional[time] = None
    shift_end: Optional[time] = None
    notes: Optional[str] = None
    modification_reason: Optional[str] = None


class RosterEntryAssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    roster_entry_id: int
    brand_id: int
    process_id: int
    workload_hours: float
    brand_name: Optional[str] = None
    process_name: Optional[str] = None


# ---- CoverageResult ----
class CoverageResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    roster_period_id: int
    roster_date: date
    brand_id: int
    process_id: int
    required_staff: int
    actual_staff: int
    coverage_percentage: float
    coverage_status: str
    explanation: Optional[str] = None
    brand_name: Optional[str] = None
    process_name: Optional[str] = None


# ---- ConflictRecord ----
class ConflictRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    roster_period_id: int
    roster_date: date
    employee_id: Optional[int] = None
    brand_id: Optional[int] = None
    process_id: Optional[int] = None
    conflict_type: str
    severity: str
    explanation: Optional[str] = None
    suggested_resolution: Optional[str] = None
    resolved: bool
    created_at: Optional[datetime] = None
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    designation: Optional[str] = None
    pod_name: Optional[str] = None
    brand_name: Optional[str] = None
    process_name: Optional[str] = None


# ---- AuditRecord ----
class AuditRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    entity_type: str
    entity_id: int
    action: str
    details: Optional[str] = None
    performed_by: Optional[int] = None
    created_at: Optional[datetime] = None


# ---- Dashboard ----
class DashboardMetrics(BaseModel):
    total_employees: int = 0
    active_employees: int = 0
    total_brands: int = 0
    active_brands: int = 0
    total_processes: int = 0
    total_pods: int = 0
    roster_status: Optional[str] = None
    coverage_percentage: float = 0.0
    employees_working_today: int = 0
    employees_on_leave: int = 0
    employees_on_weekly_off: int = 0
    critical_conflicts: int = 0
    upcoming_holidays: List[PublicHolidayResponse] = []
    employees_by_pod: List[dict] = []
    brands_by_staffing_type: dict = {}
    process_staffing: List[dict] = []


# ---- Roster Generation ----
class RosterGenerateRequest(BaseModel):
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2020, le=2030)


class RosterGenerateResponse(BaseModel):
    roster_period_id: int
    month: int
    year: int
    status: str
    total_employees: int = 0
    total_working_days: int = 0
    total_weekly_offs: int = 0
    total_leaves: int = 0
    total_holidays: int = 0
    coverage_percentage: float = 0.0
    total_conflicts: int = 0
    critical_conflicts: int = 0
    message: str = ""


# ---- Change Impact ----
class ChangeImpactRequest(BaseModel):
    employee_id: int
    change_type: str  # "EMERGENCY_LEAVE", "UNAVAILABLE", "AVAILABILITY_CHANGE"
    start_date: date
    end_date: Optional[date] = None
    reason: Optional[str] = None
    roster_period_id: Optional[int] = None


class BackupRecommendation(BaseModel):
    employee_id: int
    employee_name: str
    brand_id: int
    brand_name: str
    process_id: int
    process_name: str
    reason: str
    is_already_assigned: bool = False
    is_backup: bool = False
    availability_status: str = "AVAILABLE"


class ChangeImpactResponse(BaseModel):
    affected_dates: List[date] = []
    affected_brands: List[str] = []
    affected_processes: List[str] = []
    coverage_gaps: List[dict] = []
    backup_recommendations: List[BackupRecommendation] = []
    unresolved_gaps: List[dict] = []
    message: str = ""


# ---- Validation ----
class RosterValidationResponse(BaseModel):
    roster_period_id: int
    total_required_slots: int = 0
    satisfied_slots: int = 0
    unfilled_slots: int = 0
    coverage_percentage: float = 0.0
    hard_constraint_violations: int = 0
    soft_constraint_warnings: int = 0
    critical_conflicts: int = 0
    validation_status: str = "UNKNOWN"
    details: List[dict] = []
    can_publish: bool = False


# ---- Pagination ----
class PaginatedResponse(BaseModel):
    items: List = []
    total: int = 0
    page: int = 1
    page_size: int = 50
    total_pages: int = 0
