import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Layers,
  Store,
  Cpu,
  UserCheck,
  CalendarDays,
  CalendarCheck2,
  CalendarOff,
  Sparkles,
  AlertTriangle,
  FileSpreadsheet,
  Settings as SettingsIcon,
  ChevronRight
} from 'lucide-react';

interface NavItem {
  name: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: 'Overview', to: '/', icon: LayoutDashboard },
  { name: 'Employees', to: '/employees', icon: Users },
  { name: 'Pods & Teams', to: '/pods', icon: Layers },
  { name: 'Brands', to: '/brands', icon: Store },
  { name: 'Processes', to: '/processes', icon: Cpu },
  { name: 'Resource Assignments', to: '/assignments', icon: UserCheck },
  { name: 'Working Rules', to: '/working-rules', icon: CalendarDays },
  { name: 'Leaves & Availability', to: '/leaves', icon: CalendarOff },
  { name: 'Public Holidays', to: '/holidays', icon: CalendarCheck2 },
  { name: 'Roster Planner', to: '/roster-planner', icon: Sparkles, badge: 'Core' },
  { name: 'Coverage & Conflicts', to: '/coverage-conflicts', icon: AlertTriangle },
  { name: 'Reports & Exports', to: '/reports', icon: FileSpreadsheet },
  { name: 'Settings', to: '/settings', icon: SettingsIcon },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 h-screen sticky top-0 border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            R
          </div>
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight leading-none">RosterIQ</h1>
            <p className="text-[11px] text-slate-400 mt-1">Smart Workforce Planning</p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate flex-1">{item.name}</span>
              {item.badge && (
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
        <div className="flex items-center justify-between">
          <span>DATASTRAW Tech</span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            Live
          </span>
        </div>
      </div>
    </aside>
  );
};
