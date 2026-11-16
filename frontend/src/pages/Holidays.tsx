import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { PublicHoliday } from '../types';
import { CalendarCheck2, Plus, Trash2, Calendar, Globe } from 'lucide-react';

export const Holidays: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    holiday_name: '',
    holiday_date: '2026-08-15',
    region: 'PAN-INDIA',
    description: 'Gazetted public holiday',
    applicable_to_all: true,
  });

  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ['holidays', selectedYear],
    queryFn: () => api.getHolidays(selectedYear),
  });

  const createMutation = useMutation({
    mutationFn: api.createHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      setIsModalOpen(false);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-medium">
            <button
              onClick={() => setSelectedYear(2026)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedYear === 2026 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Year 2026
            </button>
            <button
              onClick={() => setSelectedYear(2025)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedYear === 2025 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Year 2025
            </button>
          </div>
          <span className="text-xs text-slate-500 font-medium">{holidays.length} Gazetted Holidays</span>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add Holiday</span>
        </button>
      </div>

      {/* Holidays Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 text-center py-12 text-slate-500 text-xs">Loading holidays...</div>
        ) : holidays.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-500 text-xs">No holidays recorded for this year.</div>
        ) : (
          holidays.map((h) => (
            <div
              key={h.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{h.holiday_name}</h3>
                  <div className="text-xs text-blue-600 font-mono font-semibold mt-0.5">{h.holiday_date}</div>
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500">
                    <Globe className="h-3 w-3 text-slate-400" />
                    <span>{h.region}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-emerald-700 font-medium">All Brands Applicable</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Holiday Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add Public Holiday</h3>
            <p className="text-xs text-slate-500 mb-4">Add a gazetted or regional public holiday.</p>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Holiday Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Independence Day"
                  value={formData.holiday_name}
                  onChange={(e) => setFormData({ ...formData, holiday_name: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formData.holiday_date}
                  onChange={(e) => setFormData({ ...formData, holiday_date: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Region</label>
                <input
                  type="text"
                  placeholder="PAN-INDIA or State"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
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
                  {createMutation.isPending ? 'Saving...' : 'Save Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
