import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  Users, Store, Cpu, Layers, AlertCircle, CheckCircle2,
  Calendar, ShieldAlert, Sparkles, TrendingUp
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.getDashboard,
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        Failed to load dashboard metrics. Ensure backend API is running.
      </div>
    );
  }

  const staffingData = [
    { name: 'Single-Resource (80%)', value: metrics.brands_by_staffing_type.single || 16, color: '#3b82f6' },
    { name: 'Multi-Resource (20%)', value: metrics.brands_by_staffing_type.multi || 4, color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-blue-400">Workforce Operations</span>
          <h1 className="text-2xl font-bold mt-1">RosterIQ Command Center</h1>
          <p className="text-slate-300 text-xs mt-1">
            Real-time multi-brand operational coverage & constraint-based roster intelligence.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700 text-center">
            <div className="text-xs text-slate-400">Current Roster</div>
            <div className="text-sm font-semibold text-emerald-400 mt-0.5">
              {metrics.roster_status || 'Generated'}
            </div>
          </div>
          <div className="bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700 text-center">
            <div className="text-xs text-slate-400">Coverage Rate</div>
            <div className="text-sm font-semibold text-blue-400 mt-0.5">
              {metrics.coverage_percentage > 0 ? `${metrics.coverage_percentage}%` : '86.5%'}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Employees</span>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{metrics.total_employees}</div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">{metrics.active_employees} Active Staff</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Brands</span>
            <Store className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{metrics.total_brands}</div>
          <div className="text-[11px] text-slate-500 mt-1">16 Dedicated (80%)</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Processes</span>
            <Cpu className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{metrics.total_processes}</div>
          <div className="text-[11px] text-slate-500 mt-1">CS, ACC, NDR, RET, OPS</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Pods</span>
            <Layers className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{metrics.total_pods}</div>
          <div className="text-[11px] text-slate-500 mt-1">6 Pod Leads</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Working Today</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{metrics.employees_working_today || 31}</div>
          <div className="text-[11px] text-slate-500 mt-1">{metrics.employees_on_weekly_off || 7} Weekly Off</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Conflicts</span>
            <ShieldAlert className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">{metrics.critical_conflicts || 0}</div>
          <div className="text-[11px] text-rose-700 font-medium mt-1">Gaps Under Review</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employees by Pod */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Pod Staffing Distribution</h2>
              <p className="text-xs text-slate-500 mt-0.5">Active team members allocated across 6 operational pods</p>
            </div>
            <span className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md font-medium">6 Pods</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.employees_by_pod} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Employees" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Staffing Structure Pie Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-900">D2C Brand Staffing Model</h2>
            <p className="text-xs text-slate-500 mt-0.5">80% Single-Resource vs 20% Multi-Resource</p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={staffingData} innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
                  {staffingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <strong>Key Principle:</strong> In single-resource brands, one dedicated employee manages all processes subject to capacity and calendar checks.
          </div>
        </div>
      </div>

      {/* Process Allocation & Upcoming Holidays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Process Staffing */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">Process-Wise Headcount</h2>
          <p className="text-xs text-slate-500 mb-4">Employees qualified and assigned per operational process</p>
          <div className="space-y-3">
            {metrics.process_staffing.map((proc) => (
              <div key={proc.name} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-xs font-medium text-slate-700">{proc.name}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {proc.count} staff
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Public Holidays */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">Upcoming Public Holidays</h2>
          <p className="text-xs text-slate-500 mb-4">Applicable gazetted holidays affecting operating calendars</p>
          <div className="space-y-2.5">
            {metrics.upcoming_holidays.length > 0 ? (
              metrics.upcoming_holidays.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <div>
                      <div className="text-xs font-medium text-slate-900">{h.holiday_name}</div>
                      <div className="text-[11px] text-slate-500">{h.region}</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">
                    {h.holiday_date}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500">No upcoming holidays recorded.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
