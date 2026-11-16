import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Process, EmployeeAssignment } from '../types';
import {
  Plus,
  MessageSquare,
  ShoppingCart,
  RefreshCw,
  Truck,
  Sliders,
  Users,
  Building2,
  Search,
  X,
  ChevronRight,
  Shield,
  Layers
} from 'lucide-react';

export const Processes: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [modalSearch, setModalSearch] = useState('');
  const [formData, setFormData] = useState({
    process_name: '',
    process_code: '',
    description: '',
  });

  const { data: processes = [], isLoading } = useQuery({
    queryKey: ['processes'],
    queryFn: api.getProcesses,
  });

  // Query assignments for the selected process
  const { data: processAssignments = [], isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['assignments', { process_id: selectedProcess?.id }],
    queryFn: () => (selectedProcess ? api.getAssignments({ process_id: selectedProcess.id }) : Promise.resolve([])),
    enabled: !!selectedProcess,
  });

  const createMutation = useMutation({
    mutationFn: api.createProcess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      setIsModalOpen(false);
      setFormData({ process_name: '', process_code: '', description: '' });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const getProcessIcon = (code: string) => {
    switch (code) {
      case 'CS':
        return <MessageSquare className="h-5 w-5 text-blue-600" />;
      case 'ACC':
        return <ShoppingCart className="h-5 w-5 text-emerald-600" />;
      case 'RET':
        return <RefreshCw className="h-5 w-5 text-purple-600" />;
      case 'NDR':
        return <Truck className="h-5 w-5 text-amber-600" />;
      default:
        return <Sliders className="h-5 w-5 text-indigo-600" />;
    }
  };

  // Filter assignments within the modal
  const filteredAssignments = processAssignments.filter((a) => {
    if (!modalSearch) return true;
    const term = modalSearch.toLowerCase();
    return (
      a.employee_name?.toLowerCase().includes(term) ||
      a.employee_code?.toLowerCase().includes(term) ||
      a.brand_name?.toLowerCase().includes(term) ||
      a.designation?.toLowerCase().includes(term) ||
      a.pod_name?.toLowerCase().includes(term)
    );
  });

  const uniqueEmployeesCount = new Set(processAssignments.map((a) => a.employee_id)).size;
  const uniqueBrandsCount = new Set(processAssignments.map((a) => a.brand_id)).size;
  const primaryCount = processAssignments.filter((a) => a.assignment_type === 'PRIMARY').length;
  const backupCount = processAssignments.filter((a) => a.is_backup_resource || a.assignment_type === 'BACKUP').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Configurable Operational Processes</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage operational workflows. Click any process card to view designated employees and active brand allocations.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Process</span>
        </button>
      </div>

      {/* Process Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-3 text-center py-12 text-slate-500 text-xs">Loading processes...</div>
        ) : (
          processes.map((proc) => (
            <div
              key={proc.id}
              onClick={() => {
                setSelectedProcess(proc);
                setModalSearch('');
              }}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-blue-400 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    {getProcessIcon(proc.process_code)}
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {proc.process_code}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-3 group-hover:text-blue-600 transition-colors flex items-center justify-between">
                  <span>{proc.process_name}</span>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 group-hover:text-blue-600 transition-all" />
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                  {proc.description || 'Configured operational workflow.'}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  Active
                </span>
                <span className="text-[11px] text-blue-600 font-medium group-hover:underline">
                  View Team & Brands &rarr;
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Process Team & Brand Allocations Modal */}
      {selectedProcess && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                  {getProcessIcon(selectedProcess.process_code)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{selectedProcess.process_name}</h3>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                      {selectedProcess.process_code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedProcess.description || 'Staff designated and active brand allocations.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProcess(null)}
                className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-4 gap-3 px-6 py-3 bg-white border-b border-slate-100 text-xs">
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-bold text-slate-900">{uniqueEmployeesCount} Staff</div>
                  <div className="text-[10px] text-slate-400">Designated Employees</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                <Building2 className="h-4 w-4 text-purple-600" />
                <div>
                  <div className="font-bold text-slate-900">{uniqueBrandsCount} Brands</div>
                  <div className="text-[10px] text-slate-400">Supported Brands</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                <Shield className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="font-bold text-slate-900">{primaryCount} Primary</div>
                  <div className="text-[10px] text-slate-400">Dedicated Positions</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                <Layers className="h-4 w-4 text-amber-600" />
                <div>
                  <div className="font-bold text-slate-900">{backupCount} Backup</div>
                  <div className="text-[10px] text-slate-400">Standby Coverage</div>
                </div>
              </div>
            </div>

            {/* Search filter inside modal */}
            <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
              <div className="relative w-72">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by employee, pod, or brand..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <span className="text-[11px] text-slate-500">
                Showing {filteredAssignments.length} of {processAssignments.length} allocations
              </span>
            </div>

            {/* Table of Allocations */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingAssignments ? (
                <div className="text-center py-12 text-slate-500 text-xs">Loading employee allocations...</div>
              ) : filteredAssignments.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No employees assigned to this process yet.</p>
                  <p className="text-slate-400 text-[11px] mt-1">
                    Assign employees via the Resource Assignments page.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider text-[10px] sticky top-0">
                    <tr>
                      <th className="px-3 py-2.5">Employee</th>
                      <th className="px-3 py-2.5">Designation</th>
                      <th className="px-3 py-2.5">Pod</th>
                      <th className="px-3 py-2.5">Brand</th>
                      <th className="px-3 py-2.5">Assignment Role</th>
                      <th className="px-3 py-2.5 text-right">Allocation %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAssignments.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-3 py-2.5 font-medium text-slate-900">
                          <div>{a.employee_name || `Employee #${a.employee_id}`}</div>
                          <span className="font-mono text-[10px] text-blue-600 font-semibold">
                            {a.employee_code || `EMP${String(a.employee_id).padStart(3, '0')}`}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">
                          {a.designation || 'Brand Specialist'}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                            {a.pod_name || 'General Operations'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            <span>{a.brand_name || `Brand #${a.brand_id}`}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              a.assignment_type === 'PRIMARY'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : a.assignment_type === 'SECONDARY'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {a.assignment_type}
                            {a.is_backup_resource && ' (Backup)'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-slate-700">
                          {a.allocation_percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                onClick={() => setSelectedProcess(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Process Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add Operational Process</h3>
            <p className="text-xs text-slate-500 mb-4">Create a new business process category.</p>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Process Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Concierge Support"
                  value={formData.process_name}
                  onChange={(e) => setFormData({ ...formData, process_name: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Process Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP"
                  value={formData.process_code}
                  onChange={(e) => setFormData({ ...formData, process_code: e.target.value.toUpperCase() })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Workflow scope, SLAs, channel coverage..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  {createMutation.isPending ? 'Saving...' : 'Save Process'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
