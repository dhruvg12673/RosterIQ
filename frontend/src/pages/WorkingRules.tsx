import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { BrandProcessRule } from '../types';
import { CalendarDays, Plus, CheckCircle, XCircle, Search, Edit2 } from 'lucide-react';

export const WorkingRules: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedBrand, setSelectedBrand] = useState<number | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    brand_id: 1,
    process_id: 1,
    operating_calendar_type: 'DAILY_EXCEPT_PUBLIC_HOLIDAYS',
    minimum_staff_required: 1,
    preferred_staff_count: 1,
    workload_hours_per_employee: 8.0,
    works_on_sunday: false,
    works_on_public_holidays: false,
    operating_weekdays: 'Monday,Tuesday,Wednesday,Thursday,Friday',
  });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['working-rules', selectedBrand],
    queryFn: () => api.getWorkingRules(selectedBrand),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => api.getBrands(),
  });

  const { data: processes = [] } = useQuery({
    queryKey: ['processes'],
    queryFn: api.getProcesses,
  });

  const createMutation = useMutation({
    mutationFn: api.createWorkingRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['working-rules'] });
      setIsModalOpen(false);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const getCalendarBadge = (calType: string) => {
    switch (calType) {
      case 'ALL_DAYS':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            365 Days Operation
          </span>
        );
      case 'DAILY_EXCEPT_PUBLIC_HOLIDAYS':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Daily (Holidays Off)
          </span>
        );
      case 'SUNDAYS_AND_PUBLIC_HOLIDAYS_OFF':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Mon-Sat (Sun/Hol Off)
          </span>
        );
      case 'CUSTOM_WEEKDAY_PATTERN':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Custom Weekdays
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{calType}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Action / Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <select
            value={selectedBrand || ''}
            onChange={(e) => setSelectedBrand(e.target.value ? Number(e.target.value) : undefined)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Brands ({brands.length})</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.brand_name}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-500 font-medium">{rules.length} Operating Rules</span>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add Working Rule</span>
        </button>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3">Process</th>
                <th className="px-4 py-3">Operating Calendar</th>
                <th className="px-4 py-3">Min Staff</th>
                <th className="px-4 py-3">Workload</th>
                <th className="px-4 py-3 text-center">Sunday Coverage</th>
                <th className="px-4 py-3 text-center">Holiday Coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Loading rules...
                  </td>
                </tr>
              ) : rules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No working rules configured.
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {rule.brand_name || `Brand #${rule.brand_id}`}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-mono text-[11px]">
                        {rule.process_name || `Process #${rule.process_id}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>{getCalendarBadge(rule.operating_calendar_type)}</div>
                      {rule.operating_weekdays && (
                        <div className="text-[10px] text-slate-400 mt-0.5">{rule.operating_weekdays}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">
                      {rule.minimum_staff_required}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">
                      {rule.workload_hours_per_employee} hrs
                    </td>
                    <td className="px-4 py-3 text-center">
                      {rule.works_on_sunday ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600 inline" />
                      ) : (
                        <XCircle className="h-4 w-4 text-slate-300 inline" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {rule.works_on_public_holidays ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600 inline" />
                      ) : (
                        <XCircle className="h-4 w-4 text-slate-300 inline" />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Create Brand Working Rule</h3>
            <p className="text-xs text-slate-500 mb-4">Define operating calendar & staffing criteria.</p>

            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Brand</label>
                  <select
                    value={formData.brand_id}
                    onChange={(e) => setFormData({ ...formData, brand_id: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.brand_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Process</label>
                  <select
                    value={formData.process_id}
                    onChange={(e) => setFormData({ ...formData, process_id: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {processes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.process_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Operating Calendar Type</label>
                <select
                  value={formData.operating_calendar_type}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({
                      ...formData,
                      operating_calendar_type: val,
                      works_on_sunday: val === 'ALL_DAYS',
                      works_on_public_holidays: val === 'ALL_DAYS',
                    });
                  }}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL_DAYS">365-Day Operation (All Days, Holidays & Sundays)</option>
                  <option value="DAILY_EXCEPT_PUBLIC_HOLIDAYS">Daily Except Public Holidays</option>
                  <option value="SUNDAYS_AND_PUBLIC_HOLIDAYS_OFF">Sundays and Public Holidays Off</option>
                  <option value="CUSTOM_WEEKDAY_PATTERN">Custom Weekday Pattern</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Min Staff Required</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.minimum_staff_required}
                    onChange={(e) => setFormData({ ...formData, minimum_staff_required: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Workload Hours/Staff</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    step="0.5"
                    value={formData.workload_hours_per_employee}
                    onChange={(e) => setFormData({ ...formData, workload_hours_per_employee: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm"
                >
                  {createMutation.isPending ? 'Saving...' : 'Save Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
