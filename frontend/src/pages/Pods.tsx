import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Layers, ShieldCheck, Users, ChevronRight } from 'lucide-react';

export const Pods: React.FC = () => {
  const { data: pods = [], isLoading } = useQuery({
    queryKey: ['pods'],
    queryFn: api.getPods,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.getEmployees(),
  });

  const [selectedPodId, setSelectedPodId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Operational Pods & Leads</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Employees are structured into functional pods overseeing dedicated brand clusters.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
          6 Active Pods
        </span>
      </div>

      {/* Pods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {pods.map((pod) => {
          const members = employees.filter((e) => e.pod_id === pod.id);
          const isExpanded = selectedPodId === pod.id;

          return (
            <div
              key={pod.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {pod.pod_code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-2">{pod.pod_name}</h3>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Layers className="h-4 w-4" />
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  {pod.description || 'Specialized operational cluster.'}
                </p>

                {/* Pod Lead Indicator */}
                <div className="mt-4 p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div className="text-xs">
                    <span className="text-slate-400 block text-[10px]">Pod Lead</span>
                    <span className="font-semibold text-slate-800">{pod.lead_name || 'Assigned Lead'}</span>
                  </div>
                </div>
              </div>

              {/* Members Count & Drawer Toggle */}
              <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span>{members.length} Members</span>
                  </div>
                  <button
                    onClick={() => setSelectedPodId(isExpanded ? null : pod.id)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <span>{isExpanded ? 'Hide Members' : 'View Members'}</span>
                    <ChevronRight className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-200/60 space-y-2 max-h-48 overflow-y-auto">
                    {members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between text-xs py-1">
                        <span className="font-medium text-slate-800">{m.full_name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{m.employee_code}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
