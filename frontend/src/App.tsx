import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './layouts/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { Pods } from './pages/Pods';
import { Brands } from './pages/Brands';
import { Processes } from './pages/Processes';
import { Assignments } from './pages/Assignments';
import { WorkingRules } from './pages/WorkingRules';
import { Leaves } from './pages/Leaves';
import { Holidays } from './pages/Holidays';
import { RosterPlanner } from './pages/RosterPlanner';
import { CoverageConflicts } from './pages/CoverageConflicts';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/pods" element={<Pods />} />
            <Route path="/brands" element={<Brands />} />
            <Route path="/processes" element={<Processes />} />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/working-rules" element={<WorkingRules />} />
            <Route path="/leaves" element={<Leaves />} />
            <Route path="/holidays" element={<Holidays />} />
            <Route path="/roster-planner" element={<RosterPlanner />} />
            <Route path="/coverage-conflicts" element={<CoverageConflicts />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
