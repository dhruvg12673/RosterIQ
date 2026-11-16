import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { LeaveRequest, EmployeeAvailability } from '../types';
import { CalendarOff, Plus, Check, X, Clock, AlertCircle, Calendar } from 'lucide-react';

export const Leaves: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'leaves' | 'availability'>('leaves');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: 7,
    leave_type: 'PLANNED_LEAVE',
    start_date: '2026-11-20',
    end_date: '2026-11-21',
    reason: '',
  });

  const { data: leaves = [], isLoading: leavesLoading } = useQuery({
    queryKey: ['leaves'],
    queryFn: () => api.getLeaves(),
  });

  const { data: availability = [], isLoading: availLoading } = useQuery({
    queryKey: ['availability'],
    queryFn: () => api.getAvailability(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.getEmployees(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => api.approveLeave(id, 1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => api.rejectLeave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: api.createLeave,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      setIsModalOpen(false);
      setFormData({
        employee_id: 7,
        leave_type: 'PLANNED_LEAVE',
        start_date: '2026-11-20',
        end_date: '2026-11-21',
        reason: '',
      });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Check className="h-3 w-3" /> Approved (Blocks Roster)
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" /> Pending Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <X className="h-3 w-3" /> Rejected
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-medium">
          <button
            onClick={() => setActiveTab('leaves')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'leaves' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Leave Requests ({leaves.length})
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'availability' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Availability Overrides ({availability.length})
          </button>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Leave Request</span>
        </button>
      </div>

      {activeTab === 'leaves' ? (
        /* Leave Requests Table */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Leave Type</th>
                  <th className="px-4 py-3">Date Range</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Reason / Justification</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leavesLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Loading leave records...
                    </td>
                  </tr>
                ) : leaves.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No leave requests found.
                    </td>
                  </tr>
                ) : (
                  leaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {leave.employee_name || `Employee #${leave.employee_id}`}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {leave.leave_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">
                        {leave.start_date === leave.end_date
                          ? leave.start_date
                          : `${leave.start_date} to ${leave.end_date}`}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(leave.status)}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                        {leave.reason || 'No reason specified'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {leave.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => approveMutation.mutate(leave.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-sm flex items-center gap-1"
                            >
                              <Check className="h-3 w-3" /> Approve
                            </button>
                            <button
                              onClick={() => rejectMutation.mutate(leave.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded shadow-sm flex items-center gap-1"
                            >
                              <X className="h-3 w-3" /> Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Availability Overrides Table */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Availability Status</th>
                  <th className="px-4 py-3">Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {availLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      Loading availability records...
                    </td>
                  </tr>
                ) : availability.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      No explicit availability records recorded.
                    </td>
                  </tr>
                ) : (
                  availability.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {rec.employee_name || `Employee #${rec.employee_id}`}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700">{rec.availability_date}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            rec.availability_status === 'AVAILABLE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {rec.availability_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{rec.reason || rec.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Leave Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Submit Leave Request</h3>
            <p className="text-xs text-slate-500 mb-4">Request planned leave, comp-off, or emergency leave.</p>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Employee</label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: Number(e.target.value) })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.full_name} ({e.employee_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Leave Type</label>
                <select
                  value={formData.leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="PLANNED_LEAVE">Planned Leave</option>
                  <option value="SICK_LEAVE">Sick Leave</option>
                  <option value="EMERGENCY_LEAVE">Emergency Leave</option>
                  <option value="COMP_OFF">Comp-Off</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reason</label>
                <textarea
                  rows={3}
                  placeholder="Reason for leave request..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                ></textarea>
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
                  {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
