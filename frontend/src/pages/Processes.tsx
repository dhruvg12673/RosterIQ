import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Cpu, Plus, CheckCircle2, MessageSquare, ShoppingCart, RefreshCw, Truck, Sliders } from 'lucide-react';

export const Processes: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    process_name: '',
    process_code: '',
    description: '',
  });

  const { data: processes = [], isLoading } = useQuery({
    queryKey: ['processes'],
    queryFn: api.getProcesses,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Configurable Operational Processes</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage operational workflows. Operations managers can define new processes without changing code.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
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
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                    {getProcessIcon(proc.process_code)}
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {proc.process_code}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-3">{proc.process_name}</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {proc.description || 'Configured operational workflow.'}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  Active
                </span>
                <span className="text-[11px] text-slate-400">ID #{proc.id}</span>
              </div>
            </div>
          ))
        )}
      </div>

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
