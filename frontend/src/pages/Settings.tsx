import React from 'react';
import { Database, Shield, Server, CheckCircle, Code2, Sparkles, Layers } from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Title */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">System Architecture & Configuration</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          RosterIQ — Built for the DATASTRAW Tech Internship Assessment.
        </p>
      </div>

      {/* Tech Stack Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs mb-2">
            <Server className="h-4 w-4" />
            <span>FastAPI Monolith</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Python 3.12, FastAPI, Pydantic v2 schemas, deterministic scheduling engine, OR-Tools integration.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs mb-2">
            <Database className="h-4 w-4" />
            <span>Neon PostgreSQL</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            SQLAlchemy 2.0 ORM, Alembic migrations, connection pooling, SSL encryption.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-purple-600 font-semibold text-xs mb-2">
            <Code2 className="h-4 w-4" />
            <span>Modern React SPA</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, React Hook Form, Recharts.
          </p>
        </div>
      </div>

      {/* Assessment Question Answers Summary Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Assessment Core Logic Summary</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="font-bold text-slate-900 mb-1">Q1. Entity Modeling</div>
            <p className="text-slate-600 leading-relaxed">
              Normalized schema separating Brand Operating Calendars from Employee Availability. Employees map to Pods (with Pod Leads) and Brands/Processes via EmployeeAssignments with priority and backup flags.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="font-bold text-slate-900 mb-1">Q2. Constraint Scheduling Engine</div>
            <p className="text-slate-600 leading-relaxed">
              Deterministic constraint validation: Hard constraints (approved leave, explicit unavailability, weekly off, operating calendars, daily capacity hours) are strictly respected. Soft preferences optimize assignments.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="font-bold text-slate-900 mb-1">Q3. 80/20 Staffing Structure</div>
            <p className="text-slate-600 leading-relaxed">
              16 single-resource brands have 1 dedicated employee handling all processes (scheduled once daily, workload checked). 4 multi-resource brands have 2-3 staff with segregated and shared cross-covering roles.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="font-bold text-slate-900 mb-1">Q4. Emergency Leave Workflow</div>
            <p className="text-slate-600 leading-relaxed">
              When an employee managing all processes becomes unavailable, the system flags the exact affected processes, calculates gaps, recommends qualified backups, and allows one-click replacement with instant revalidation.
            </p>
          </div>
        </div>
      </div>

      {/* Deployment & Environment Info */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Deployment Configuration</h3>
        <div className="space-y-2 text-xs text-slate-600">
          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="font-medium text-slate-700">Backend Runtime:</span>
            <span className="font-mono text-slate-500">Python 3.12 / Uvicorn / Render Web Service</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="font-medium text-slate-700">Frontend Runtime:</span>
            <span className="font-mono text-slate-500">Vite Build / Render Static Site</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="font-medium text-slate-700">Database Engine:</span>
            <span className="font-mono text-slate-500">Neon Serverless PostgreSQL (with SQLite local fallback)</span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="font-medium text-slate-700">Health Check:</span>
            <span className="font-mono text-emerald-600 font-semibold">GET /api/v1/health (200 OK)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
