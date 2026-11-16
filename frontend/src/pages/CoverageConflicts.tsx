import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { CoverageResult, ConflictRecord, BackupRecommendation } from '../types';
import {
  AlertTriangle, ShieldAlert, CheckCircle, Clock, Zap,
  UserCheck, ArrowRight, RefreshCw, Filter, Sparkles
} from 'lucide-react';

export const CoverageConflicts: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'conflicts' | 'coverage' | 'simulator'>('conflicts');
  const [severityFilter, setSeverityFilter] = useState<string>('');

  // Change Impact Simulator State
  const [simEmployeeId, setSimEmployeeId] = useState<number>(7); // Default to Aditya Joshi (EMP007)
  const [simDate, setSimDate] = useState<string>('2026-11-16');
  const [simReason, setSimReason] = useState<string>('Sudden personal emergency');
  const [impactData, setImpactData] = useState<any>(null);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);

  // Queries
  const { data: rosterPeriods = [] } = useQuery({
    queryKey: ['roster-periods'],
    queryFn: api.getRosterPeriods,
  });

  const currentPeriod = rosterPeriods[0]; // latest

  const { data: conflicts = [], isLoading: conflictsLoading } = useQuery({
    queryKey: ['conflicts', currentPeriod?.id, severityFilter],
    queryFn: () => (currentPeriod ? api.getConflicts(currentPeriod.id, severityFilter || undefined) : Promise.resolve([])),
    enabled: !!currentPeriod,
  });

  const { data: coverage = [], isLoading: coverageLoading } = useQuery({
    queryKey: ['coverage', currentPeriod?.id],
    queryFn: () => (currentPeriod ? api.getCoverage(currentPeriod.id) : Promise.resolve([])),
    enabled: !!currentPeriod,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.getEmployees(),
  });

  // Change Impact Mutation
  const analyzeMutation = useMutation({
    mutationFn: () =>
      api.analyzeChangeImpact({
        employee_id: simEmployeeId,
        change_type: 'EMERGENCY_LEAVE',
        start_date: simDate,
        end_date: simDate,
        reason: simReason,
        roster_period_id: currentPeriod?.id,
      }),
    onSuccess: (data) => {
      setImpactData(data);
      setApplyMessage(null);
    },
  });

  // Apply Replacement Mutation
  const applyReplacementMutation = useMutation({
    mutationFn: (rec: BackupRecommendation) =>
      api.applyReplacement({
        roster_period_id: currentPeriod!.id,
        original_employee_id: simEmployeeId,
        replacement_employee_id: rec.employee_id,
        date_str: simDate,
        brand_id: rec.brand_id,
        process_id: rec.process_id,
      }),
    onSuccess: (res) => {
      setApplyMessage('Backup replacement applied successfully! Roster re-evaluated.');
      queryClient.invalidateQueries({ queryKey: ['conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['coverage'] });
      queryClient.invalidateQueries({ queryKey: ['roster-entries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      // Re-run analysis
      analyzeMutation.mutate();
    },
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-300">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            LOW
          </span>
        );
    }
  };

  const getCoverageBadge = (status: string) => {
    switch (status) {
      case 'FULLY_COVERED':
        return <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Fully Covered</span>;
      case 'PARTIALLY_COVERED':
        return <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Partially Covered</span>;
      case 'NOT_COVERED':
        return <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">Not Covered</span>;
      default:
        return <span className="text-[11px] text-slate-400">Not Required</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-medium">
          <button
            onClick={() => setActiveTab('conflicts')}
            className={`px-3.5 py-1.5 rounded-md transition-colors ${
              activeTab === 'conflicts' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Scheduling Conflicts ({conflicts.length})
          </button>
          <button
            onClick={() => setActiveTab('coverage')}
            className={`px-3.5 py-1.5 rounded-md transition-colors ${
              activeTab === 'coverage' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Operational Coverage
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3.5 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'simulator' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-600 hover:text-blue-800'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Emergency Leave Simulator</span>
          </button>
        </div>

        {activeTab === 'conflicts' && (
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MEDIUM">Medium Only</option>
          </select>
        )}
      </div>

      {/* Tab 1: Conflicts List */}
      {activeTab === 'conflicts' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Conflict Type</th>
                  <th className="px-4 py-3">Brand & Process</th>
                  <th className="px-4 py-3">Explanation</th>
                  <th className="px-4 py-3">Suggested Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {conflictsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Loading conflicts...
                    </td>
                  </tr>
                ) : conflicts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-emerald-600 font-medium">
                      ✓ No unresolved conflicts detected for this roster!
                    </td>
                  </tr>
                ) : (
                  conflicts.slice(0, 50).map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800 whitespace-nowrap">
                        {c.roster_date}
                      </td>
                      <td className="px-4 py-3">{getSeverityBadge(c.severity)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {c.conflict_type.replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{c.brand_name || 'All Brands'}</div>
                        <div className="text-[11px] text-slate-400">{c.process_name || 'General'}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-sm">{c.explanation}</td>
                      <td className="px-4 py-3 text-blue-700 font-medium max-w-xs">{c.suggested_resolution}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Coverage Breakdown */}
      {activeTab === 'coverage' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Brand</th>
                  <th className="px-4 py-3">Process</th>
                  <th className="px-4 py-3">Required</th>
                  <th className="px-4 py-3">Actual</th>
                  <th className="px-4 py-3">Coverage %</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coverageLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Loading coverage results...
                    </td>
                  </tr>
                ) : (
                  coverage.slice(0, 60).map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-slate-700">{r.roster_date}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{r.brand_name}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{r.process_name}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{r.required_staff}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{r.actual_staff}</td>
                      <td className="px-4 py-3 font-mono font-bold text-blue-600">{r.coverage_percentage}%</td>
                      <td className="px-4 py-3">{getCoverageBadge(r.coverage_status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Emergency Leave Simulator & Backup Recommender */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          {/* Simulator Form Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900">Emergency Leave & Backup Resolution Workflow</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Demonstrate dynamic handling when an employee managing a single-resource brand suddenly takes emergency leave.
              The engine automatically calculates affected processes, detects coverage gaps, recommends eligible backups, and allows one-click replacement.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Select Scheduled Employee</label>
                <select
                  value={simEmployeeId}
                  onChange={(e) => setSimEmployeeId(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.full_name} ({e.employee_code}) - {e.designation}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Effective Date</label>
                <input
                  type="date"
                  value={simDate}
                  onChange={(e) => setSimDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reason</label>
                <input
                  type="text"
                  value={simReason}
                  onChange={(e) => setSimReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Recommended test: Aditya Joshi (EMP007 - dedicated to single-resource brand GlowAura).
              </span>
              <button
                onClick={() => analyzeMutation.mutate()}
                disabled={analyzeMutation.isPending}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <Sparkles className="h-4 w-4" />
                <span>{analyzeMutation.isPending ? 'Analyzing Impact...' : 'Analyze Impact & Find Backups'}</span>
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {applyMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{applyMessage}</span>
            </div>
          )}

          {/* Simulation Results */}
          {impactData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coverage Gaps Identified */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Identified Coverage Gaps</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Processes left unstaffed by this employee's unavailability
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200">
                    {impactData.coverage_gaps.length} Gaps
                  </span>
                </div>

                <div className="space-y-2.5">
                  {impactData.coverage_gaps.map((gap: any, idx: number) => (
                    <div key={idx} className="p-3 bg-rose-50/50 border border-rose-100 rounded-lg">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">{gap.brand_name}</span>
                        <span className="font-mono text-rose-700 font-semibold">{gap.process_name}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-1">{gap.impact}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Backups */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Recommended Backup Resources</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ranked by qualification, designated backup status & availability
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {impactData.backup_recommendations.length} Available
                  </span>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {impactData.backup_recommendations.length === 0 ? (
                    <div className="p-4 bg-amber-50 rounded-lg text-amber-800 text-xs">
                      No eligible backup staff currently available for this slot.
                    </div>
                  ) : (
                    impactData.backup_recommendations.slice(0, 6).map((rec: BackupRecommendation, idx: number) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{rec.employee_name}</span>
                            {rec.is_backup && (
                              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                                Designated Backup
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-600 mt-1 leading-relaxed">{rec.reason}</div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Target: {rec.brand_name} • {rec.process_name}
                          </div>
                        </div>

                        <button
                          onClick={() => applyReplacementMutation.mutate(rec)}
                          disabled={applyReplacementMutation.isPending}
                          className="shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded shadow-sm flex items-center gap-1"
                        >
                          <UserCheck className="h-3 w-3" />
                          <span>Assign</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
