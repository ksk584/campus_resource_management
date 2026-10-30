import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTodaySchedule } from '../api/analytics';
import { getMyBookings, getBookings } from '../api/bookings';
import { getResources } from '../api/resources';
import { BookingStatusBadge } from '../components/StatusBadge';
import {
  Calendar,
  Clock,
  Layers,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Search,
  Users,
  MapPin,
  Sparkles,
} from 'lucide-react';

export default function Dashboard() {
  const { user, isAdmin, isFaculty } = useAuth();
  const [stats, setStats] = useState({
    totalBookings: 0,
    availableResources: 0,
    pendingApprovals: 0,
    todayBookingsCount: 0,
  });
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const [resourcesRes, myBookingsRes] = await Promise.all([
          getResources().catch(() => []),
          getMyBookings().catch(() => []),
        ]);

        const availCount = resourcesRes.filter((r) => r.status === 'available').length;
        const myRecent = myBookingsRes.slice(0, 5);

        let pendingCount = 0;
        let todaySched = [];

        if (isAdmin) {
          const allBookings = await getBookings({ status: 'pending' }).catch(() => []);
          pendingCount = allBookings.length;
        }

        if (isAdmin || isFaculty) {
          todaySched = await getTodaySchedule().catch(() => []);
        }

        setStats({
          totalBookings: user?.total_bookings || myBookingsRes.length,
          availableResources: availCount,
          pendingApprovals: pendingCount,
          todayBookingsCount: todaySched.filter((s) => s.booking_id).length,
        });

        setRecentBookings(myRecent);
        setTodaySchedule(todaySched);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [user, isAdmin, isFaculty]);

  const formatDateTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-linear-to-r from-indigo-700 via-indigo-600 to-blue-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-600/15">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-sm mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Welcome to Smart Campus Booking
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {user?.name || 'Campus Member'}!
            </h1>
            <p className="mt-1 text-indigo-100 text-sm leading-relaxed">
              Find, reserve, and manage lecture halls, labs, seminar auditoriums, and campus equipment
              with automated conflict detection and approval workflows.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/resources"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 text-xs sm:text-sm font-bold shadow-md hover:bg-indigo-50 transition"
            >
              <Search className="w-4 h-4" />
              Browse Resources
            </Link>
            {isAdmin && (
              <Link
                to="/approvals"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500/40 text-white text-xs sm:text-sm font-bold border border-white/20 hover:bg-indigo-500/60 transition"
              >
                <ShieldCheck className="w-4 h-4" />
                Approvals Queue
              </Link>
            )}
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isAdmin ? 'Active Available' : 'My Total Bookings'}
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {isAdmin ? stats.availableResources : stats.totalBookings}
            </p>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Campus infrastructure</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Now</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.availableResources}</p>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Ready for reservations</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {isAdmin ? (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pending Approvals
              </p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pendingApprovals}</p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Requires review</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">No-Show Count</p>
              <p className={`text-2xl font-bold mt-1 ${(user?.no_show_count || 0) > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {user?.no_show_count || 0}
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {(user?.no_show_count || 0) > 2 ? 'High risk (>30%)' : 'Good standing'}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
        )}

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Schedule</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.todayBookingsCount}</p>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Active slots today</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">My Recent Bookings</h3>
              <p className="text-xs text-slate-400">Your latest reservations and requests</p>
            </div>
            <Link
              to="/my-bookings"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 divide-y divide-slate-100">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading bookings...</div>
            ) : recentBookings.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <Calendar className="w-8 h-8 text-slate-300" />
                <span>You have no recent bookings.</span>
                <Link
                  to="/resources"
                  className="mt-2 text-indigo-600 font-semibold text-xs hover:underline"
                >
                  Book a classroom or lab
                </Link>
              </div>
            ) : (
              recentBookings.map((b) => (
                <div key={b.booking_id} className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900 leading-snug">{b.title}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{b.resource_name}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatDateTime(b.start_time)}
                      </span>
                    </div>
                  </div>
                  <BookingStatusBadge status={b.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Today's Campus Schedule or Guide */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isAdmin || isFaculty ? "Today's Campus Bookings" : 'Quick Actions & Booking Guide'}
              </h3>
              <p className="text-xs text-slate-400">
                {isAdmin || isFaculty
                  ? 'Real-time daily schedule across college resources'
                  : 'Rules, conflict detection & policies'}
              </p>
            </div>
            {(isAdmin || isFaculty) && (
              <Link
                to="/analytics"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                Analytics <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {isAdmin || isFaculty ? (
            <div className="flex-1 divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {todaySchedule.filter((s) => s.booking_id).length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No bookings scheduled for today.
                </div>
              ) : (
                todaySchedule
                  .filter((s) => s.booking_id)
                  .map((s, idx) => (
                    <div key={idx} className="py-3 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{s.booking_title}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-medium text-indigo-600">{s.resource_name}</span>
                          <span>•</span>
                          <span>Booked by {s.booked_by}</span>
                        </p>
                      </div>
                      <div className="text-right text-xs text-slate-500 whitespace-nowrap">
                        <span className="font-semibold text-slate-700">
                          {new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(s.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          ) : (
            <div className="space-y-3.5 text-xs text-slate-600">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" /> Automated Conflict Detection
                </p>
                <p className="text-slate-500 leading-relaxed">
                  PostgreSQL database triggers instantly detect and reject overlapping bookings. If a room
                  is booked, you can join the waitlist and get automatically notified if it's cancelled.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600" /> Admin Approval Workflow
                </p>
                <p className="text-slate-500 leading-relaxed">
                  All reservations trigger an approval record. Campus admins review requests based on priority,
                  attendee size, and academic necessity.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" /> Attendance & No-Show Policy
                </p>
                <p className="text-slate-500 leading-relaxed">
                  Users with a no-show rate exceeding 30% are automatically downgraded in booking priority
                  by stored procedure logic.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

