import {
  Employee, Pod, Brand, Process, BrandProcessRule, EmployeeAssignment,
  LeaveRequest, PublicHoliday, EmployeeAvailability, RosterPeriod,
  RosterEntry, CoverageResult, ConflictRecord, DashboardMetrics,
  ChangeImpactResponse
} from '../types';

const rawBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');
const API_BASE = rawBase.endsWith('/api/v1') ? rawBase : `${rawBase}/api/v1`;

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const err = await res.json();
      errorDetail = err.detail || err.message || errorDetail;
    } catch {}
    throw new Error(errorDetail);
  }

  return res.json();
}

export const api = {
  // Dashboard
  getDashboard: () => fetchJson<DashboardMetrics>('/dashboard'),

  // Employees
  getEmployees: (params?: { search?: string; status?: string; pod_id?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.status) q.append('status', params.status);
    if (params?.pod_id) q.append('pod_id', params.pod_id.toString());
    return fetchJson<Employee[]>(`/employees?${q.toString()}`);
  },
  getEmployee: (id: number) => fetchJson<Employee>(`/employees/${id}`),
  createEmployee: (data: Partial<Employee>) => fetchJson<Employee>('/employees', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateEmployee: (id: number, data: Partial<Employee>) => fetchJson<Employee>(`/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Pods
  getPods: () => fetchJson<Pod[]>('/pods'),
  getPod: (id: number) => fetchJson<Pod>(`/pods/${id}`),
  createPod: (data: Partial<Pod>) => fetchJson<Pod>('/pods', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Brands
  getBrands: (params?: { search?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.status) q.append('status', params.status);
    return fetchJson<Brand[]>(`/brands?${q.toString()}`);
  },
  getBrand: (id: number) => fetchJson<Brand>(`/brands/${id}`),
  createBrand: (data: Partial<Brand>) => fetchJson<Brand>('/brands', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Processes
  getProcesses: () => fetchJson<Process[]>('/processes'),
  createProcess: (data: Partial<Process>) => fetchJson<Process>('/processes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Working Rules
  getWorkingRules: (brand_id?: number) => {
    const url = brand_id ? `/working-rules?brand_id=${brand_id}` : '/working-rules';
    return fetchJson<BrandProcessRule[]>(url);
  },
  createWorkingRule: (data: Partial<BrandProcessRule>) => fetchJson<BrandProcessRule>('/working-rules', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateWorkingRule: (id: number, data: Partial<BrandProcessRule>) => fetchJson<BrandProcessRule>(`/working-rules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Assignments
  getAssignments: (params?: { employee_id?: number; brand_id?: number; process_id?: number }) => {
    const q = new URLSearchParams();
    if (params?.employee_id) q.append('employee_id', params.employee_id.toString());
    if (params?.brand_id) q.append('brand_id', params.brand_id.toString());
    if (params?.process_id) q.append('process_id', params.process_id.toString());
    return fetchJson<EmployeeAssignment[]>(`/assignments?${q.toString()}`);
  },
  createAssignment: (data: Partial<EmployeeAssignment>) => fetchJson<EmployeeAssignment>('/assignments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteAssignment: (id: number) => fetchJson<{ message: string }>(`/assignments/${id}`, {
    method: 'DELETE',
  }),

  // Leaves & Availability
  getLeaves: (params?: { employee_id?: number; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.employee_id) q.append('employee_id', params.employee_id.toString());
    if (params?.status) q.append('status', params.status);
    return fetchJson<LeaveRequest[]>(`/leaves?${q.toString()}`);
  },
  createLeave: (data: Partial<LeaveRequest>) => fetchJson<LeaveRequest>('/leaves', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  approveLeave: (id: number, approved_by?: number) => {
    const q = approved_by ? `?approved_by=${approved_by}` : '';
    return fetchJson<{ message: string }>(`/leaves/${id}/approve${q}`, { method: 'POST' });
  },
  rejectLeave: (id: number) => fetchJson<{ message: string }>(`/leaves/${id}/reject`, { method: 'POST' }),
  getAvailability: (params?: { employee_id?: number }) => {
    const q = params?.employee_id ? `?employee_id=${params.employee_id}` : '';
    return fetchJson<EmployeeAvailability[]>(`/leaves/availability${q}`);
  },
  setAvailability: (data: Partial<EmployeeAvailability>) => fetchJson<EmployeeAvailability>('/leaves/availability', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Holidays
  getHolidays: (year?: number) => {
    const q = year ? `?year=${year}` : '';
    return fetchJson<PublicHoliday[]>(`/holidays${q}`);
  },
  createHoliday: (data: Partial<PublicHoliday>) => fetchJson<PublicHoliday>('/holidays', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Rosters
  getRosterPeriods: () => fetchJson<RosterPeriod[]>('/rosters'),
  getCurrentRosterPeriod: () => fetchJson<RosterPeriod | null>('/rosters/current'),
  generateRoster: (month: number, year: number) => fetchJson<any>('/rosters/generate', {
    method: 'POST',
    body: JSON.stringify({ month, year }),
  }),
  validateRoster: (period_id: number) => fetchJson<any>(`/rosters/${period_id}/validate`, {
    method: 'POST',
  }),
  publishRoster: (period_id: number) => fetchJson<any>(`/rosters/${period_id}/publish`, {
    method: 'POST',
  }),
  getRosterEntries: (params: { period_id?: number; employee_id?: number; roster_date?: string; brand_id?: number }) => {
    const q = new URLSearchParams();
    if (params.period_id) q.append('period_id', params.period_id.toString());
    if (params.employee_id) q.append('employee_id', params.employee_id.toString());
    if (params.roster_date) q.append('roster_date', params.roster_date);
    if (params.brand_id) q.append('brand_id', params.brand_id.toString());
    return fetchJson<RosterEntry[]>(`/rosters/entries/list?${q.toString()}`);
  },
  updateRosterEntry: (id: number, data: Partial<RosterEntry>) => fetchJson<RosterEntry>(`/rosters/entries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  analyzeChangeImpact: (data: { employee_id: number; change_type: string; start_date: string; end_date?: string; reason?: string; roster_period_id?: number }) =>
    fetchJson<ChangeImpactResponse>('/rosters/change-impact', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  applyReplacement: (params: { roster_period_id: number; original_employee_id: number; replacement_employee_id: number; date_str: string; brand_id: number; process_id: number }) => {
    const q = new URLSearchParams({
      roster_period_id: params.roster_period_id.toString(),
      original_employee_id: params.original_employee_id.toString(),
      replacement_employee_id: params.replacement_employee_id.toString(),
      date_str: params.date_str,
      brand_id: params.brand_id.toString(),
      process_id: params.process_id.toString(),
    });
    return fetchJson<any>(`/rosters/apply-replacement?${q.toString()}`, { method: 'POST' });
  },
  getCoverage: (period_id: number, brand_id?: number, process_id?: number) => {
    const q = new URLSearchParams({ period_id: period_id.toString() });
    if (brand_id) q.append('brand_id', brand_id.toString());
    if (process_id) q.append('process_id', process_id.toString());
    return fetchJson<CoverageResult[]>(`/rosters/coverage/list?${q.toString()}`);
  },
  getConflicts: (period_id: number, severity?: string) => {
    const q = new URLSearchParams({ period_id: period_id.toString() });
    if (severity) q.append('severity', severity);
    return fetchJson<ConflictRecord[]>(`/rosters/conflicts/list?${q.toString()}`);
  },

  // Export URLs
  getRosterCsvUrl: (period_id: number, view: string = 'employee') =>
    `${API_BASE}/reports/roster-csv?period_id=${period_id}&view=${view}`,
  getCoverageCsvUrl: (period_id: number) =>
    `${API_BASE}/reports/coverage-csv?period_id=${period_id}`,
  getConflictCsvUrl: (period_id: number) =>
    `${API_BASE}/reports/conflict-csv?period_id=${period_id}`,
};
