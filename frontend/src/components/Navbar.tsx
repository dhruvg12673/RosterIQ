import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Bell,
  Search,
  Calendar,
  ChevronRight,
  ChevronDown,
  User,
  KeyRound,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  Mail,
  Phone,
  ShieldCheck
} from 'lucide-react';

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

interface UserProfile {
  fullName: string;
  email: string;
  role: string;
  phone: string;
  organization: string;
}

export const Navbar: React.FC = () => {
  const location = useLocation();
  const currentTitle = routeTitles[location.pathname] || 'RosterIQ Platform';

  // Profile State (initialized from localStorage or defaults)
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('rosteriq_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      fullName: 'Operations Lead',
      email: 'operations@datastraw.in',
      role: 'Lead Workforce Operations Manager',
      phone: '+91 98765 43210',
      organization: 'DATASTRAW Ops',
    };
  });

  // Modal & Dropdown States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  // Form states
  const [profileFormData, setProfileFormData] = useState<UserProfile>(profile);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileFormData.fullName.trim() || !profileFormData.email.trim()) {
      setProfileMessage({ type: 'error', text: 'Name and email are required.' });
      return;
    }
    setProfile(profileFormData);
    localStorage.setItem('rosteriq_user_profile', JSON.stringify(profileFormData));
    setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
    setTimeout(() => {
      setProfileMessage(null);
      setIsProfileModalOpen(false);
    }, 1500);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordFormData.currentPassword) {
      setPasswordMessage({ type: 'error', text: 'Please enter your current password.' });
      return;
    }
    if (passwordFormData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordMessage({ type: 'success', text: 'Password successfully changed!' });
    setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => {
      setPasswordMessage(null);
      setIsPasswordModalOpen(false);
    }, 1500);
  };

  const handleSignOut = () => {
    // Clear session & reload
    localStorage.removeItem('rosteriq_user_profile');
    setIsSignOutModalOpen(false);
    window.location.href = '/';
  };

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
        <button
          title="Notifications"
          className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 relative transition-colors"
        >
          <Bell className="h-4 w-4" />
          <span className="h-2 w-2 rounded-full bg-red-500 absolute top-2 right-2"></span>
        </button>

        {/* Interactive User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:bg-slate-50 p-1.5 rounded-lg transition-colors text-left"
          >
            <div className="h-8 w-8 rounded-full bg-slate-900 text-white font-medium text-xs flex items-center justify-center shadow-sm">
              {getInitials(profile.fullName)}
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="flex items-center gap-1">
                <p className="font-semibold text-xs text-slate-800">{profile.fullName}</p>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </div>
              <p className="text-slate-500 text-[11px]">{profile.organization}</p>
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              {/* Profile Card Summary */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <p className="text-xs font-bold text-slate-900">{profile.fullName}</p>
                <p className="text-[11px] text-slate-500 truncate">{profile.email}</p>
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  <ShieldCheck className="h-3 w-3" />
                  {profile.role}
                </span>
              </div>

              {/* Menu Actions */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setProfileFormData(profile);
                    setProfileMessage(null);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition-colors"
                >
                  <User className="h-4 w-4 text-slate-400" />
                  <span>Update Profile</span>
                </button>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setPasswordMessage(null);
                    setIsPasswordModalOpen(true);
                  }}
                  className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition-colors"
                >
                  <KeyRound className="h-4 w-4 text-slate-400" />
                  <span>Change Password</span>
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsSignOutModalOpen(true);
                  }}
                  className="w-full px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors font-medium"
                >
                  <LogOut className="h-4 w-4 text-red-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Update Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900">Update Profile</h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">Edit your workforce manager contact details.</p>

            {profileMessage && (
              <div
                className={`mb-4 p-3 rounded-lg text-xs flex items-center gap-2 border ${
                  profileMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                {profileMessage.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span>{profileMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={profileFormData.fullName}
                    onChange={(e) => setProfileFormData({ ...profileFormData, fullName: e.target.value })}
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={profileFormData.email}
                    onChange={(e) => setProfileFormData({ ...profileFormData, email: e.target.value })}
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Role / Designation</label>
                <input
                  type="text"
                  value={profileFormData.role}
                  onChange={(e) => setProfileFormData({ ...profileFormData, role: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                  <div className="relative">
                    <Phone className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={profileFormData.phone}
                      onChange={(e) => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                      className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Organization</label>
                  <div className="relative">
                    <Building2 className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={profileFormData.organization}
                      onChange={(e) => setProfileFormData({ ...profileFormData, organization: e.target.value })}
                      className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900">Change Password</h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">Enter your current password and choose a new secure one.</p>

            {passwordMessage && (
              <div
                className={`mb-4 p-3 rounded-lg text-xs flex items-center gap-2 border ${
                  passwordMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                {passwordMessage.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span>{passwordMessage.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={passwordFormData.currentPassword}
                    onChange={(e) => setPasswordFormData({ ...passwordFormData, currentPassword: e.target.value })}
                    className="w-full text-xs pl-3 pr-9 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    placeholder="Min. 6 characters"
                    value={passwordFormData.newPassword}
                    onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                    className="w-full text-xs pl-3 pr-9 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  value={passwordFormData.confirmPassword}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition-colors"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
      {isSignOutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600">
                <LogOut className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">Sign Out</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to end your current session in RosterIQ?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSignOutModalOpen(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Stay Logged In
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="px-4 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-sm transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
