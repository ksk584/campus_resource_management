import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyWaitlist, getWaitlist, leaveWaitlist } from '../api/waitlist';
import {
  Clock,
  Calendar,
  Building2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Info,
  ShieldAlert,
} from 'lucide-react';

export default function Waitlist() {
  const { isAdmin } = useAuth();
  const [entries, setEntries] = useState([]);
  const [adminViewAll, setAdminViewAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const data = adminViewAll ? await getWaitlist() : await getMyWaitlist();
      setEntries(data);
    } catch (err) {
      console.error('Failed to load waitlist entries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [adminViewAll]);

  const handleLeave = async (waitlistId) => {
    if (!window.confirm('Are you sure you want to remove this waitlist entry?')) return;

    try {
      await leaveWaitlist(waitlistId);
      setToast({ type: 'success', message: 'Removed from waitlist.' });
      fetchEntries();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to remove.' });
    }
  };

  const formatDateTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
              <Clock className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Waitlist Reservations</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Queued requests for fully booked resources, powered by automated cancellation triggers
          </p>
        </div>

        {isAdmin && (
          <div className="inline-flex p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setAdminViewAll(false)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                !adminViewAll
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              My Waitlists
            </button>
            <button
              onClick={() => setAdminViewAll(true)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                adminViewAll
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Campus-wide Waitlist
            </button>
          </div>
        )}
      </div>

      {toast && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between border ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span className="font-semibold">{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Mechanism explanation banner */}
      <div className="p-4 bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">How the Automated Waitlist Trigger Operates:</p>
          <p className="leading-relaxed text-amber-800">
            Whenever any user cancels an approved or pending booking, the PostgreSQL trigger{' '}
            <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-semibold">
              trg_notify_waitlist_on_cancel
            </code>{' '}
            automatically checks the waitlist for matching time slots and notifies the top priority users
            so they can immediately book the released slot.
          </p>
        </div>
      </div>

      {/* Waitlist List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-xs text-slate-400 border border-slate-200">
            Loading waitlist entries...
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-xs text-slate-400 border border-slate-200 flex flex-col items-center gap-2">
            <Clock className="w-8 h-8 text-slate-300" />
            <span className="font-semibold text-slate-600">No active waitlist entries.</span>
            <span>When a room is booked during your desired slot, join the waitlist from Search.</span>
          </div>
        ) : (
          entries.map((w) => (
            <div
              key={w.waitlist_id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">{w.resource_name}</h3>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                      w.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {w.is_active ? 'Active on Waitlist' : 'Inactive'}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                    Priority: {w.priority}
                  </span>
                  {adminViewAll && w.user_name && (
                    <span className="text-xs text-slate-400 font-medium">
                      Requested by {w.user_name} ({w.user_email})
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{w.location || w.building || 'Campus'}</span>
                    <span className="text-slate-400">({w.resource_type})</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {formatDateTime(w.desired_start)} -{' '}
                      {new Date(w.desired_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              {w.is_active && (
                <button
                  type="button"
                  onClick={() => handleLeave(w.waitlist_id)}
                  className="self-end md:self-center inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-xl transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Leave Waitlist
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

