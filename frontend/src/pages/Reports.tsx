import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { FileSpreadsheet, Download, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';

export const Reports: React.FC = () => {
  const { data: rosterPeriods = [] } = useQuery({
    queryKey: ['roster-periods'],
    queryFn: api.getRosterPeriods,
  });

  const [selectedPeriodId, setSelectedPeriodId] = useState<number | undefined>();

  const currentPeriod = selectedPeriodId
    ? rosterPeriods.find((p) => p.id === selectedPeriodId)
    : rosterPeriods[0];

  const periodId = currentPeriod?.id || 1;

  const reportsList = [
    {
      title: 'Monthly Roster (Employee View)',
      desc: 'Complete employee-wise schedule showing shift dates, status, assigned brands and processes.',
      url: api.getRosterCsvUrl(periodId, 'employee'),
      filename: `roster_employee_view.csv`,
      icon: FileSpreadsheet,
      badge: 'Core Schedule',
    },
    {
      title: 'Monthly Roster (Brand View)',
      desc: 'Brand-centric view showing staffing allocations per date and allocated workload hours.',
      url: api.getRosterCsvUrl(periodId, 'brand'),
      filename: `roster_brand_view.csv`,
      icon: FileSpreadsheet,
      badge: 'Brand Allocation',
    },
    {
      title: 'Monthly Roster (Pod View)',
      desc: 'Operational team roster grouped by pod leads and member schedules.',
      url: api.getRosterCsvUrl(periodId, 'pod'),
      filename: `roster_pod_view.csv`,
      icon: FileSpreadsheet,
      badge: 'Pod Operations',
    },
    {
      title: 'Operational Coverage Report',
      desc: 'Daily required vs actual staffing counts, coverage percentages, and shortage logs.',
      url: api.getCoverageCsvUrl(periodId),
      filename: `coverage_report.csv`,
      icon: CheckCircle2,
      badge: 'Coverage Analysis',
    },
    {
      title: 'Conflict & Compliance Audit Report',
      desc: 'Full log of detected scheduling conflicts, severity breakdown, and suggested resolutions.',
      url: api.getConflictCsvUrl(periodId),
      filename: `conflict_report.csv`,
      icon: ShieldAlert,
      badge: 'Audit & Compliance',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header and Period Picker */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Reports & Data Exports</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Export official monthly rosters, operational coverage matrices, and compliance audit logs in CSV format.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600 font-medium">Roster Period:</label>
          <select
            value={periodId}
            onChange={(e) => setSelectedPeriodId(Number(e.target.value))}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
          >
            {rosterPeriods.map((p) => (
              <option key={p.id} value={p.id}>
                Month {p.month}/{p.year} (v{p.version_number}) - {p.status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reportsList.map((rep, idx) => {
          const Icon = rep.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {rep.badge}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-3">{rep.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{rep.desc}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">{rep.filename}</span>
                <a
                  href={rep.url}
                  download={rep.filename}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download CSV</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
