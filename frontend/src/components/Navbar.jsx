import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Building2, Menu } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();

  const roleColors = {
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    faculty: 'bg-blue-100 text-blue-700 border-blue-200',
    student: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm font-bold text-base">
              CB
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                CampusBook
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-400">
                Resource Management
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <NotificationDropdown />

          <div className="h-6 w-px bg-slate-200"></div>

          {user && (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-900 leading-tight">
                  {user.name}
                </span>
                <span className="text-[11px] text-slate-500 flex items-center justify-end gap-1">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  {user.department_name || 'All Departments'}
                </span>
              </div>

              <span
                className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                  roleColors[user.role] || 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {user.role}
              </span>

              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

