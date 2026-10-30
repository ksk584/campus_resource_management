import React, { useState, useEffect } from 'react';
import { getMyBookings, cancelBooking } from '../api/bookings';
import { BookingStatusBadge, PriorityBadge } from '../components/StatusBadge';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  XCircle,
  Search,
  MessageSquare,
  Building2,
} from 'lucide-react';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await getMyBookings();
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This will open the time slot for waitlisted users.')) {
      return;
    }

    setCancellingId(bookingId);
    try {
      const res = await cancelBooking(bookingId);
      setToast({ type: 'success', message: res.message || 'Booking cancelled successfully.' });
      fetchBookings();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to cancel booking.' });
    } finally {
      setCancellingId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.resource_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Booking History</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track current reservations, pending requests, and cancellations
          </p>
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
          <button
            onClick={() => setToast(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {['all', 'pending', 'approved', 'completed', 'cancelled', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                filterStatus === s
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or room..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-xs text-slate-400 border border-slate-200">
            Loading your bookings...
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-xs text-slate-400 border border-slate-200 flex flex-col items-center gap-2">
            <Calendar className="w-8 h-8 text-slate-300" />
            <span className="font-semibold text-slate-600">No bookings match this filter.</span>
            <span>You have not made any bookings in this category yet.</span>
          </div>
        ) : (
          filteredBookings.map((b) => (
            <div
              key={b.booking_id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 max-w-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">{b.title}</h3>
                  <BookingStatusBadge status={b.status} />
                  <PriorityBadge priority={b.priority} />
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{b.resource_name}</span>
                    <span className="text-[10px] text-slate-400">({b.resource_type})</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{b.location || b.building || 'Campus'}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {formatDateTime(b.start_time)} -{' '}
                      {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {b.description && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {b.description}
                  </p>
                )}

                {b.approval_comments && (
                  <div className="p-2.5 rounded-xl bg-slate-50 text-[11px] text-slate-600 flex items-start gap-1.5 border border-slate-100">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                    <span>
                      <strong>Admin note:</strong> {b.approval_comments}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end md:self-center">
                {['pending', 'approved'].includes(b.status) && (
                  <button
                    type="button"
                    disabled={cancellingId === b.booking_id}
                    onClick={() => handleCancel(b.booking_id)}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition border border-rose-200 disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    {cancellingId === b.booking_id ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

