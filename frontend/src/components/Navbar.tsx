import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, Calendar, ChevronRight } from 'lucide-react';

const routeTitles: Record<string, string> = {
  '/': 'Operations Dashboard',
  '/employees': 'Employee Management',
  '/pods': 'Pods & Operational Teams',
  '/brands': 'D2C Brand Management',
  '/processes': 'Configurable Processes',
  '/assignments': 'Resource Allocations',
  '/working-rules': 'Operating Calendars & Rules',
  '/leaves': 'Leaves & Availability',
  '/holidays': 'Public Holidays Calendar',
  '/roster-planner': 'Monthly Roster Planner',
  '/coverage-conflicts': 'Coverage Analysis & Conflicts',
  '/reports': 'Reports & Data Exports',
  '/settings': 'System Settings & Status',
};

export const Navbar: React.FC = () => {
  const location = useLocation();
  const currentTitle = routeTitles[location.pathname] || 'RosterIQ Platform';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Title & Breadcrumbs */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span>DATASTRAW Ops</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-800">{currentTitle}</span>
        </div>
        <h2 className="text-base font-semibold text-slate-900 mt-0.5">{currentTitle}</h2>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Search Input */}
        <div className="relative hidden md:block">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search brands, employees..."
            className="pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Current Month Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
          <Calendar className="h-3.5 w-3.5" />
          <span>November 2026</span>
        </div>

        {/* Notifications */}
        <button className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 relative">
          <Bell className="h-4 w-4" />
          <span className="h-2 w-2 rounded-full bg-red-500 absolute top-2 right-2"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="h-8 w-8 rounded-full bg-slate-800 text-white font-medium text-xs flex items-center justify-center">
            OM
          </div>
          <div className="hidden sm:block text-left text-xs leading-tight">
            <p className="font-semibold text-slate-800">Operations Lead</p>
            <p className="text-slate-500 text-[11px]">DATASTRAW</p>
          </div>
        </div>
      </div>
    </header>
  );
};
