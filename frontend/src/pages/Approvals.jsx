import React, { useState, useEffect } from 'react';
import { getBookings, approveBooking, rejectBooking } from '../api/bookings';
import { BookingStatusBadge, PriorityBadge } from '../components/StatusBadge';
import {
  ShieldCheck,
  Check,
  X,
  Clock,
  Calendar,
  Users,
  Building2,
  User,
  AlertCircle,
  CheckCircle,
  MessageSquare,
} from 'lucide-react';

export default function Approvals() {
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'all'
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState(null); // { booking, type: 'approve' | 'reject' }
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const filters = activeTab === 'pending' ? { status: 'pending' } : {};
      const data = await getBookings(filters);
      setBookings(data);
    } catch (err) {
      console.error('Failed to load approvals queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [activeTab]);

  const openDecisionModal = (booking, type) => {
    setActionModal({ booking, type });
    setComments('');
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!actionModal) return;

    setSubmitting(true);
    const { booking, type } = actionModal;

    try {
      if (type === 'approve') {
        await approveBooking(booking.booking_id, comments);
        setToast({ type: 'success', message: `Booking #${booking.booking_id} approved successfully.` });
      } else {
        await rejectBooking(booking.booking_id, comments);
        setToast({ type: 'success', message: `Booking #${booking.booking_id} rejected.` });
      }
      setActionModal(null);
      fetchQueue();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Action failed.' });
    } finally {
      setSubmitting(false);
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
            <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Approvals Queue</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Review, approve, or reject classroom and laboratory reservation requests
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'pending'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Pending Requests ({bookings.filter((b) => b.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Bookings History
          </button>
        </div>
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

      {/* Bookings Queue */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-xs text-slate-400 border border-slate-200">
            Loading queue...
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-xs text-slate-400 border border-slate-200 flex flex-col items-center gap-2">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
            <span className="font-semibold text-slate-700">No pending requests!</span>
            <span>All reservations have been processed.</span>
          </div>
        ) : (
          bookings.map((b) => (
            <div
              key={b.booking_id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5"
            >
              <div className="space-y-2.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-slate-400">
                    #{b.booking_id}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">{b.title}</h3>
                  <BookingStatusBadge status={b.status} />
                  <PriorityBadge priority={b.priority} />
                </div>

                {/* Requester info & Resource info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>
                      <strong>{b.user_name}</strong> ({b.user_role}) — {b.user_email}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>
                      <strong>{b.resource_name}</strong> ({b.location || b.building})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {formatDateTime(b.start_time)} -{' '}
                      {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Requested Attendees: {b.attendees_count}</span>
                  </div>
                </div>

                {b.description && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <strong>Purpose:</strong> {b.description}
                  </p>
                )}

                {b.approval_comments && (
                  <p className="text-xs text-slate-500">
                    <strong>Decision Comments:</strong> {b.approval_comments}
                  </p>
                )}
              </div>

              {/* Action Buttons for Pending */}
              {b.status === 'pending' && (
                <div className="flex items-center gap-2 self-end lg:self-center">
                  <button
                    onClick={() => openDecisionModal(b, 'reject')}
                    className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition border border-rose-200"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button
                    onClick={() => openDecisionModal(b, 'approve')}
                    className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Decision Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100">
            <div
              className={`px-6 py-4 border-b flex items-center justify-between ${
                actionModal.type === 'approve'
                  ? 'bg-emerald-50/70 border-emerald-100'
                  : 'bg-rose-50/70 border-rose-100'
              }`}
            >
              <h3 className="font-bold text-slate-900 text-sm capitalize">
                {actionModal.type} Booking #{actionModal.booking.booking_id}
              </h3>
              <button
                onClick={() => setActionModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDecisionSubmit} className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-600 mb-2">
                  You are about to <strong>{actionModal.type}</strong> the booking request "
                  {actionModal.booking.title}" for <strong>{actionModal.booking.user_name}</strong>.
                </p>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Optional Comments / Reason:
                </label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={
                    actionModal.type === 'approve'
                      ? 'e.g. Approved. Please collect room key from admin desk.'
                      : 'e.g. Rejected due to institutional priority event.'
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-1.5 text-xs font-bold text-white rounded-xl shadow-xs transition disabled:opacity-50 ${
                    actionModal.type === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {submitting ? 'Confirming...' : `Confirm ${actionModal.type}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

