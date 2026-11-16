import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { EmployeeAssignment } from '../types';
import { UserCheck, Plus, Trash2, Filter, ShieldCheck, Percent } from 'lucide-react';

export const Assignments: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedBrand, setSelectedBrand] = useState<number | undefined>();
  const [selectedEmployee, setSelectedEmployee] = useState<number | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: 1,
    brand_id: 1,
    process_id: 1,
    assignment_type: 'PRIMARY',
    allocation_percentage: 100.0,
    priority: 1,
    is_backup_resource: false,
  });

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['assignments', selectedBrand, selectedEmployee],
    queryFn: () => api.getAssignments({ brand_id: selectedBrand, employee_id: selectedEmployee }),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.getEmployees(),
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
    mutationFn: api.createAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setIsModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      is_backup_resource: formData.assignment_type === 'BACKUP',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedBrand || ''}
            onChange={(e) => setSelectedBrand(e.target.value ? Number(e.target.value) : undefined)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.brand_name}
              </option>
            ))}
          </select>

          <select
            value={selectedEmployee || ''}
            onChange={(e) => setSelectedEmployee(e.target.value ? Number(e.target.value) : undefined)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Employees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name} ({e.employee_code})
              </option>
            ))}
          </select>

          <span className="text-xs text-slate-500 font-medium">
            Showing {assignments.length} Assignments
          </span>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">D2C Brand</th>
                <th className="px-4 py-3">Process</th>
                <th className="px-4 py-3">Role / Type</th>
                <th className="px-4 py-3">Allocation</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Loading assignments...
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No resource assignments found.
                  </td>
                </tr>
              ) : (
                assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {a.employee_name || `Employee #${a.employee_id}`}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {a.brand_name || `Brand #${a.brand_id}`}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {a.process_name || `Process #${a.process_id}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {a.is_backup_resource ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <ShieldCheck className="h-3 w-3" />
                          Backup Resource
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          Primary
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {a.allocation_percentage}%
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono">
                      P{a.priority}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteMutation.mutate(a.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                        title="Deactivate assignment"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Assignment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Assign Resource</h3>
            <p className="text-xs text-slate-500 mb-4">Allocate an employee to a brand and process workflow.</p>

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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Assignment Type</label>
                  <select
                    value={formData.assignment_type}
                    onChange={(e) => setFormData({ ...formData, assignment_type: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="PRIMARY">Primary Staff</option>
                    <option value="SECONDARY">Secondary</option>
                    <option value="BACKUP">Backup Resource</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Allocation %</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    step="5"
                    value={formData.allocation_percentage}
                    onChange={(e) => setFormData({ ...formData, allocation_percentage: Number(e.target.value) })}
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
                  {createMutation.isPending ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
