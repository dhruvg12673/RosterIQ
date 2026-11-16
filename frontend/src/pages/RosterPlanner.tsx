import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { RosterEntry, Employee, Brand, Pod } from '../types';
import {
  Sparkles, CheckCircle2, AlertTriangle, Send, ChevronLeft,
  ChevronRight, Search, Filter, RefreshCw, Info, Edit3
} from 'lucide-react';

export const RosterPlanner: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState<number>(11); // November
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [searchEmployee, setSearchEmployee] = useState<string>('');
  const [selectedPodId, setSelectedPodId] = useState<number | undefined>();
  const [selectedBrandId, setSelectedBrandId] = useState<number | undefined>();
  const [editingEntry, setEditingEntry] = useState<RosterEntry | null>(null);
  const [editStatus, setEditStatus] = useState<string>('WORKING');
  const [editReason, setEditReason] = useState<string>('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);

  // Queries
  const { data: rosterPeriods = [], isLoading: periodsLoading } = useQuery({
    queryKey: ['roster-periods'],
    queryFn: api.getRosterPeriods,
  });

  const currentPeriod = useMemo(() => {
    return rosterPeriods.find((p) => p.month === selectedMonth && p.year === selectedYear);
  }, [rosterPeriods, selectedMonth, selectedYear]);

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.getEmployees(),
  });

  const { data: pods = [] } = useQuery({
    queryKey: ['pods'],
    queryFn: api.getPods,
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => api.getBrands(),
  });

  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['roster-entries', currentPeriod?.id],
    queryFn: () => (currentPeriod ? api.getRosterEntries({ period_id: currentPeriod.id }) : Promise.resolve([])),
    enabled: !!currentPeriod,
  });

  // Calculate days in selected month
  const daysInMonth = useMemo(() => {
    const totalDays = new Date(selectedYear, selectedMonth, 0).getDate();
    return Array.from({ length: totalDays }, (_, i) => i + 1);
  }, [selectedMonth, selectedYear]);

  // Index entries by employee_id and date for O(1) grid rendering
  const entryMap = useMemo(() => {
    const map = new Map<string, RosterEntry>();
    entries.forEach((e) => {
      const day = new Date(e.roster_date).getDate();
      map.set(`${e.employee_id}-${day}`, e);
    });
    return map;
  }, [entries]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (searchEmployee) {
        const matchesName = emp.full_name.toLowerCase().includes(searchEmployee.toLowerCase());
        const matchesCode = emp.employee_code.toLowerCase().includes(searchEmployee.toLowerCase());
        if (!matchesName && !matchesCode) return false;
      }
      if (selectedPodId && emp.pod_id !== selectedPodId) return false;
      return true;
    });
  }, [employees, searchEmployee, selectedPodId]);

  // Mutations
  const generateMutation = useMutation({
    mutationFn: () => api.generateRoster(selectedMonth, selectedYear),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roster-periods'] });
      queryClient.invalidateQueries({ queryKey: ['roster-entries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setPublishMessage(data.message);
      setValidationResult(null);
    },
  });

  const validateMutation = useMutation({
    mutationFn: () => api.validateRoster(currentPeriod!.id),
    onSuccess: (data) => {
      setValidationResult(data);
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => api.publishRoster(currentPeriod!.id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roster-periods'] });
      setPublishMessage('Roster published successfully! Roster is now locked.');
    },
    onError: (err: Error) => {
      setPublishMessage(`Cannot publish: ${err.message}`);
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<RosterEntry> }) =>
      api.updateRosterEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-entries'] });
      setEditingEntry(null);
      setValidationResult(null);
    },
  });

  // Calculate quick summary stats
  const stats = useMemo(() => {
    let working = 0;
    let offs = 0;
    let leaves = 0;
    entries.forEach((e) => {
      if (e.status === 'WORKING') working++;
      else if (e.status === 'WEEKLY_OFF') offs++;
      else if (e.status === 'LEAVE' || e.status === 'COMP_OFF') leaves++;
    });
    return { working, offs, leaves };
  }, [entries]);

  const handleCellClick = (entry: RosterEntry) => {
    setEditingEntry(entry);
    setEditStatus(entry.status);
    setEditReason(entry.modification_reason || '');
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;
    updateEntryMutation.mutate({
      id: editingEntry.id,
      data: {
        status: editStatus as any,
        modification_reason: editReason || 'Manual schedule adjustment by operations manager',
      },
    });
  };

  const getCellBadge = (status: string) => {
    switch (status) {
      case 'WORKING':
        return <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">W</span>;
      case 'WEEKLY_OFF':
        return <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">OFF</span>;
      case 'LEAVE':
        return <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1 py-0.5 rounded">LV</span>;
      case 'COMP_OFF':
        return <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1 py-0.5 rounded">CO</span>;
      case 'PUBLIC_HOLIDAY':
        return <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1 py-0.5 rounded">PH</span>;
      default:
        return <span className="text-[10px] text-slate-400">-</span>;
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-5">
      {/* Top Controls & Generation Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (selectedMonth === 1) {
                setSelectedMonth(12);
                setSelectedYear(selectedYear - 1);
              } else {
                setSelectedMonth(selectedMonth - 1);
              }
            }}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="text-sm font-bold text-slate-900 w-36 text-center">
            {monthNames[selectedMonth - 1]} {selectedYear}
          </span>

          <button
            onClick={() => {
              if (selectedMonth === 12) {
                setSelectedMonth(1);
                setSelectedYear(selectedYear + 1);
              } else {
                setSelectedMonth(selectedMonth + 1);
              }
            }}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 ml-2">
            Status: {currentPeriod?.status || 'NOT GENERATED'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            <span>{generateMutation.isPending ? 'Generating Roster...' : 'Generate Roster'}</span>
          </button>

          {currentPeriod && (
            <>
              <button
                onClick={() => validateMutation.mutate()}
                disabled={validateMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300"
              >
                <CheckCircle2 className="h-4 w-4 text-slate-600" />
                <span>Validate</span>
              </button>

              <button
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending || currentPeriod.status === 'PUBLISHED'}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                <span>{currentPeriod.status === 'PUBLISHED' ? 'Published' : 'Publish'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Validation or Publish Notification Banner */}
      {publishMessage && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-xs font-medium flex items-center justify-between">
          <span>{publishMessage}</span>
          <button onClick={() => setPublishMessage(null)} className="text-blue-500 hover:text-blue-700">✕</button>
        </div>
      )}

      {validationResult && (
        <div
          className={`p-4 rounded-xl border text-xs shadow-sm ${
            validationResult.can_publish
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center justify-between font-bold text-sm">
            <span>Validation Result: {validationResult.validation_status}</span>
            <span>Coverage: {validationResult.coverage_percentage}%</span>
          </div>
          <p className="mt-1">
            Required Slots: {validationResult.total_required_slots} • Satisfied: {validationResult.satisfied_slots} •
            Unfilled: {validationResult.unfilled_slots} • Hard Violations: {validationResult.hard_constraint_violations}
          </p>
          {!validationResult.can_publish && (
            <p className="text-[11px] font-semibold text-rose-700 mt-1">
              ⚠️ Roster cannot be published until all critical coverage gaps and conflicts are resolved.
            </p>
          )}
        </div>
      )}

      {/* Summary Stats Row */}
      {currentPeriod && entries.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-center">
            <span className="text-[11px] text-slate-500">Scheduled Staff</span>
            <div className="text-lg font-bold text-slate-900">{filteredEmployees.length}</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-center">
            <span className="text-[11px] text-slate-500">Working Days</span>
            <div className="text-lg font-bold text-emerald-600">{stats.working}</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-center">
            <span className="text-[11px] text-slate-500">Weekly Offs</span>
            <div className="text-lg font-bold text-slate-600">{stats.offs}</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-center">
            <span className="text-[11px] text-slate-500">Leaves / Comp-Offs</span>
            <div className="text-lg font-bold text-rose-600">{stats.leaves}</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-center col-span-2 md:col-span-1">
            <span className="text-[11px] text-slate-500">Version</span>
            <div className="text-lg font-bold text-blue-600">v{currentPeriod.version_number}</div>
          </div>
        </div>
      )}

      {/* Grid Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="relative w-48">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee..."
              value={searchEmployee}
              onChange={(e) => setSearchEmployee(e.target.value)}
              className="pl-8 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedPodId || ''}
            onChange={(e) => setSelectedPodId(e.target.value ? Number(e.target.value) : undefined)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Pods</option>
            {pods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.pod_name}
              </option>
            ))}
          </select>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-600 font-medium">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded bg-emerald-500"></span> Work (W)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded bg-slate-300"></span> Off (OFF)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded bg-rose-500"></span> Leave (LV)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded bg-amber-500"></span> Comp-Off (CO)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded bg-purple-500"></span> Holiday (PH)
          </span>
        </div>
      </div>

      {/* Roster Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {entriesLoading || periodsLoading ? (
          <div className="text-center py-16 text-slate-500 text-xs">Loading monthly schedule grid...</div>
        ) : !currentPeriod || entries.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            <Sparkles className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-700 text-sm">No Roster Generated for this Month</p>
            <p className="mt-1">Click "Generate Roster" above to produce the constraint-evaluated monthly schedule.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 text-slate-600 sticky top-0 z-20 shadow-sm border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5 sticky left-0 bg-slate-100 z-30 min-w-[180px] font-bold text-[11px] uppercase border-r border-slate-200">
                    Employee
                  </th>
                  {daysInMonth.map((day) => {
                    const dateObj = new Date(selectedYear, selectedMonth - 1, day);
                    const isSun = dateObj.getDay() === 0;
                    return (
                      <th
                        key={day}
                        className={`px-1.5 py-2 text-center min-w-[34px] border-r border-slate-200 text-[10px] ${
                          isSun ? 'bg-amber-50 text-amber-900 font-bold' : 'font-semibold'
                        }`}
                      >
                        <div>{day}</div>
                        <div className="text-[9px] text-slate-400">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][dateObj.getDay()]}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Fixed Left Employee Column */}
                    <td className="px-3 py-2 sticky left-0 bg-white z-10 border-r border-slate-200 font-medium text-slate-900 shadow-sm">
                      <div className="font-semibold text-xs leading-tight">{emp.full_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{emp.employee_code}</div>
                    </td>

                    {/* Day Cells */}
                    {daysInMonth.map((day) => {
                      const entry = entryMap.get(`${emp.id}-${day}`);
                      const dateObj = new Date(selectedYear, selectedMonth - 1, day);
                      const isSun = dateObj.getDay() === 0;

                      return (
                        <td
                          key={day}
                          onClick={() => entry && handleCellClick(entry)}
                          className={`px-1 py-1.5 text-center border-r border-slate-100 cursor-pointer hover:ring-1 hover:ring-blue-400 transition-all ${
                            isSun ? 'bg-slate-50/60' : ''
                          }`}
                          title={entry ? `${emp.full_name} on Day ${day}: ${entry.status}` : 'Unscheduled'}
                        >
                          {entry ? getCellBadge(entry.status) : <span className="text-[10px] text-slate-300">-</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Edit Cell Modal */}
      {editingEntry && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Edit Roster Entry</h3>
            <p className="text-xs text-slate-500 mb-4">
              Date: <span className="font-semibold text-slate-700">{editingEntry.roster_date}</span>
            </p>

            <form onSubmit={handleSaveEntry} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="WORKING">WORKING</option>
                  <option value="WEEKLY_OFF">WEEKLY_OFF</option>
                  <option value="LEAVE">LEAVE</option>
                  <option value="COMP_OFF">COMP_OFF</option>
                  <option value="PUBLIC_HOLIDAY">PUBLIC_HOLIDAY</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reason for Modification</label>
                <textarea
                  rows={2}
                  placeholder="Manager notes / reason..."
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateEntryMutation.isPending}
                  className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm"
                >
                  {updateEntryMutation.isPending ? 'Saving...' : 'Apply Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
