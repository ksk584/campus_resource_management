import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Search,
  CalendarCheck,
  Clock,
  ShieldCheck,
  Wrench,
  BarChart3,
  X,
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin, isFaculty } = useAuth();

  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/resources', label: 'Search & Book', icon: Search },
    { to: '/my-bookings', label: 'My Bookings', icon: CalendarCheck },
    { to: '/waitlist', label: 'Waitlist', icon: Clock },
    ...(isAdmin
      ? [{ to: '/approvals', label: 'Approvals Queue', icon: ShieldCheck, badge: 'Admin' }]
      : []),
    ...(isAdmin || isFaculty
      ? [
          { to: '/maintenance', label: 'Maintenance', icon: Wrench },
          { to: '/analytics', label: 'Analytics', icon: BarChart3 },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar aside */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100 md:hidden">
          <span className="font-bold text-slate-800">Menu</span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Navigation
          </p>

          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User stats snippet in sidebar footer */}
        {user && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/70">
            <div className="text-xs text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Total Bookings:</span>
                <span className="font-semibold text-slate-700">{user.total_bookings ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>No-shows:</span>
                <span
                  className={`font-semibold ${
                    (user.no_show_count ?? 0) > 0 ? 'text-amber-600' : 'text-slate-700'
                  }`}
                >
                  {user.no_show_count ?? 0}
                </span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

