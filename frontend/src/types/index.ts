export interface Employee {
  id: number;
  employee_code: string;
  full_name: string;
  email?: string;
  phone?: string;
  designation?: string;
  pod_id?: number;
  joining_date?: string;
  employment_status: string;
  daily_capacity_hours: number;
  weekly_off_count: number;
  preferred_weekly_off_days?: string;
  pod_name?: string;
  assignment_count?: number;
}

export interface Pod {
  id: number;
  pod_name: string;
  pod_code: string;
  pod_lead_employee_id?: number;
  description?: string;
  member_count?: number;
  lead_name?: string;
}

export interface Brand {
  id: number;
  brand_name: string;
  brand_code: string;
  description?: string;
  status: string;
  employee_count?: number;
  process_count?: number;
  resource_type?: 'single' | 'multi';
}

export interface Process {
  id: number;
  process_name: string;
  process_code: string;
  description?: string;
  status: string;
}

export interface BrandProcessRule {
  id: number;
  brand_id: number;
  process_id: number;
  operating_calendar_type: string;
  minimum_staff_required: number;
  preferred_staff_count: number;
  workload_hours_per_employee: number;
  required_start_time?: string;
  required_end_time?: string;
  operating_weekdays?: string;
  works_on_sunday: boolean;
  works_on_public_holidays: boolean;
  active: boolean;
  brand_name?: string;
  process_name?: string;
}

export interface EmployeeAssignment {
  id: number;
  employee_id: number;
  brand_id: number;
  process_id: number;
  assignment_type: string;
  allocation_percentage: number;
  priority: number;
  active_from?: string;
  active_until?: string;
  is_backup_resource: boolean;
  active: boolean;
  employee_name?: string;
  employee_code?: string;
  designation?: string;
  pod_name?: string;
  brand_name?: string;
  process_name?: string;
}

export interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
  reason?: string;
  approved_by?: number;
  created_at?: string;
  employee_name?: string;
}

export interface PublicHoliday {
  id: number;
  holiday_name: string;
  holiday_date: string;
  region: string;
  description?: string;
  applicable_to_all: boolean;
}

export interface EmployeeAvailability {
  id: number;
  employee_id: number;
  availability_date: string;
  availability_status: string;
  reason?: string;
  notes?: string;
  employee_name?: string;
}

export interface RosterPeriod {
  id: number;
  month: number;
  year: number;
  status: string;
  generated_at?: string;
  generated_by?: number;
  published_at?: string;
  version_number: number;
}

export interface RosterEntry {
  id: number;
  roster_period_id: number;
  employee_id: number;
  roster_date: string;
  status: 'WORKING' | 'WEEKLY_OFF' | 'PUBLIC_HOLIDAY' | 'LEAVE' | 'COMP_OFF' | 'UNASSIGNED';
  shift_start?: string;
  shift_end?: string;
  notes?: string;
  manually_modified: boolean;
  modification_reason?: string;
  employee_name?: string;
}

export interface CoverageResult {
  id: number;
  roster_period_id: number;
  roster_date: string;
  brand_id: number;
  process_id: number;
  required_staff: number;
  actual_staff: number;
  coverage_percentage: number;
  coverage_status: 'FULLY_COVERED' | 'PARTIALLY_COVERED' | 'NOT_COVERED' | 'NOT_REQUIRED';
  explanation?: string;
  brand_name?: string;
  process_name?: string;
}

export interface ConflictRecord {
  id: number;
  roster_period_id: number;
  roster_date: string;
  employee_id?: number;
  brand_id?: number;
  process_id?: number;
  conflict_type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  explanation?: string;
  suggested_resolution?: string;
  resolved: boolean;
  created_at?: string;
  employee_name?: string;
  employee_code?: string;
  designation?: string;
  pod_name?: string;
  brand_name?: string;
  process_name?: string;
}

export interface DashboardMetrics {
  total_employees: number;
  active_employees: number;
  total_brands: number;
  active_brands: number;
  total_processes: number;
  total_pods: number;
  roster_status?: string;
  coverage_percentage: number;
  employees_working_today: number;
  employees_on_leave: number;
  employees_on_weekly_off: number;
  critical_conflicts: number;
  upcoming_holidays: PublicHoliday[];
  employees_by_pod: { name: string; count: number }[];
  brands_by_staffing_type: { single: number; multi: number };
  process_staffing: { name: string; count: number }[];
}

export interface BackupRecommendation {
  employee_id: number;
  employee_name: string;
  brand_id: number;
  brand_name: string;
  process_id: number;
  process_name: string;
  reason: string;
  is_already_assigned: boolean;
  is_backup: boolean;
  availability_status: string;
}

export interface ChangeImpactResponse {
  affected_dates: string[];
  affected_brands: string[];
  affected_processes: string[];
  coverage_gaps: Array<{
    date: string;
    brand_id: number;
    brand_name: string;
    process_id: number;
    process_name: string;
    required_staff: number;
    impact: string;
  }>;
  backup_recommendations: BackupRecommendation[];
  unresolved_gaps: Array<{
    date: string;
    brand_id: number;
    brand_name: string;
    process_id: number;
    process_name: string;
    message: string;
  }>;
  message: string;
}
