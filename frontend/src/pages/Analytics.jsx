import React, { useState, useEffect } from 'react';
import { getUtilizationReport, getUserSummary } from '../api/analytics';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Users,
  CheckCircle,
  Calendar,
  Building2,
  Clock,
  Sparkles,
  Percent,
} from 'lucide-react';

export default function Analytics() {
  const [utilization, setUtilization] = useState([]);
  const [usersSummary, setUsersSummary] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [utilData, usersData] = await Promise.all([
        getUtilizationReport(startDate || undefined, endDate || undefined),
        getUserSummary(),
      ]);
      setUtilization(utilData);
      setUsersSummary(usersData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleDateFilter = (e) => {
    e.preventDefault();
    fetchAnalytics();
  };

  // High-level aggregates
  const totalBookingsCount = utilization.reduce((acc, u) => acc + parseInt(u.total_bookings || 0, 10), 0);
  const totalHoursUsed = utilization.reduce((acc, u) => acc + parseFloat(u.total_hours || 0), 0);
  const totalNoShows = utilization.reduce((acc, u) => acc + parseInt(u.no_show_bookings || 0, 10), 0);
  const highNoShowUsersCount = usersSummary.filter((u) => u.is_high_no_show).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Resource Utilization & Analytics
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Database views and stored procedure reports on campus facility usage
          </p>
        </div>

        {/* Date Filter Form */}
        <form onSubmit={handleDateFilter} className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
          />
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs"
          >
            Apply Range
          </button>
        </form>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Bookings</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalBookingsCount}</p>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Across all facilities</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hours Utilized</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{totalHoursUsed.toFixed(1)}h</p>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Total active room hours</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">No-Show Events</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{totalNoShows}</p>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Triggered penalty counters</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">High No-Show Users</p>
            <p className={`text-2xl font-bold mt-1 ${highNoShowUsersCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {highNoShowUsersCount}
            </p>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Priority downgraded (&gt;30%)</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Utilization Report Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Facility Utilization Report
            </h3>
            <p className="text-xs text-slate-400">
              Computed by stored procedure <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">sp_resource_utilization_report</code>
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Computing utilization stats...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Resource</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Total Bookings</th>
                  <th className="py-3 px-3">Completed</th>
                  <th className="py-3 px-3">No-Shows</th>
                  <th className="py-3 px-3">Total Hours</th>
                  <th className="py-3 px-3">Utilization Rate</th>
                  <th className="py-3 px-3">Attendance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {utilization.map((u) => {
                  const utilPct = parseFloat(u.utilization_pct || 0);
                  const attRate = parseFloat(u.attendance_rate || 0);

                  return (
                    <tr key={u.resource_id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-bold text-slate-900">{u.resource_name}</td>
                      <td className="py-3 px-3 capitalize">{u.resource_type?.replace('_', ' ')}</td>
                      <td className="py-3 px-3 font-semibold">{u.total_bookings}</td>
                      <td className="py-3 px-3 text-emerald-600 font-semibold">{u.completed_bookings}</td>
                      <td className="py-3 px-3 text-amber-600 font-semibold">{u.no_show_bookings}</td>
                      <td className="py-3 px-3">{parseFloat(u.total_hours || 0).toFixed(1)}h</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full"
                              style={{ width: `${Math.min(utilPct, 100)}%` }}
                            />
                          </div>
                          <span className="font-semibold text-slate-800">{utilPct}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-semibold ${
                            attRate < 70 && parseInt(u.total_bookings, 10) > 0
                              ? 'text-rose-600'
                              : 'text-emerald-700'
                          }`}
                        >
                          {attRate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Booking Summary Table (vw_user_booking_summary) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">User Booking & Attendance Reliability</h3>
          <p className="text-xs text-slate-400">
            Source view: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">vw_user_booking_summary</code> (No-show priority downgrading trigger active)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3">User Name</th>
                <th className="py-3 px-3">Email</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Total Bookings</th>
                <th className="py-3 px-3">No-Show Count</th>
                <th className="py-3 px-3">No-Show Rate</th>
                <th className="py-3 px-3">Standing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {usersSummary.map((u) => (
                <tr key={u.user_id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 font-bold text-slate-900">{u.name}</td>
                  <td className="py-3 px-3">{u.email}</td>
                  <td className="py-3 px-3 capitalize">{u.role}</td>
                  <td className="py-3 px-3">{u.department_name || 'General'}</td>
                  <td className="py-3 px-3 font-semibold">{u.total_bookings}</td>
                  <td className="py-3 px-3">{u.no_show_count}</td>
                  <td className="py-3 px-3">{u.no_show_rate}%</td>
                  <td className="py-3 px-3">
                    {u.is_high_no_show ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Priority Downgraded
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Good Standing
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

