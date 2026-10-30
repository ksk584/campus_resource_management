import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getResourceById } from '../api/resources';
import { getBookings } from '../api/bookings';
import { ResourceStatusBadge, BookingStatusBadge } from '../components/StatusBadge';
import BookingModal from '../components/BookingModal';
import WaitlistModal from '../components/WaitlistModal';
import {
  ArrowLeft,
  MapPin,
  Users,
  Building2,
  Calendar,
  Clock,
  CheckCircle,
  Sparkles,
  Info,
} from 'lucide-react';

export default function ResourceDetails() {
  const { id } = useParams();
  const [resource, setResource] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resData, bookingsData] = await Promise.all([
        getResourceById(id),
        getBookings({ resource_id: id }).catch(() => []),
      ]);
      setResource(resData);
      setSchedule(bookingsData);
    } catch (err) {
      setError(err.message || 'Failed to load resource.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-slate-400">
        Loading resource specifications...
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-rose-600 text-sm font-semibold">{error || 'Resource not found'}</p>
        <Link to="/resources" className="text-xs text-indigo-600 hover:underline">
          Return to resource list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        to="/resources"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Resources
      </Link>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-xs text-emerald-700 hover:underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Resource Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                {resource.resource_type?.replace('_', ' ')}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">
                {resource.department_name || 'Institutional Resource'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {resource.name}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <ResourceStatusBadge status={resource.status} />
            <button
              onClick={() => setIsWaitlistOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition"
            >
              Waitlist
            </button>
            <button
              onClick={() => setIsBookingOpen(true)}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
            >
              Reserve Slot
            </button>
          </div>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl">
            <MapPin className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Location</p>
              <p className="text-xs font-bold text-slate-800">
                {resource.location || resource.building || 'Campus Ground'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl">
            <Building2 className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Building / Floor</p>
              <p className="text-xs font-bold text-slate-800">
                {resource.building || 'Main Block'} (Floor {resource.floor ?? 0})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl">
            <Users className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Seating Capacity</p>
              <p className="text-xs font-bold text-slate-800">
                {resource.capacity > 0 ? `${resource.capacity} persons` : 'Equipment / Shared'}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        {resource.description && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Description
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">{resource.description}</p>
          </div>
        )}

        {/* Features & Equipment List */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Equipped Features & Amenities
          </h4>
          {resource.features?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {resource.features.map((f, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 text-xs font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{f.name}</span>
                  {f.quantity > 1 && (
                    <span className="text-[10px] font-bold bg-indigo-200/80 text-indigo-800 px-1.5 py-0.5 rounded-full">
                      x{f.quantity}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No additional features listed for this resource.</p>
          )}
        </div>
      </div>

      {/* Bookings & Schedule Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Upcoming Schedule for this Resource</h3>
          <p className="text-xs text-slate-400">
            Current bookings and reservations (conflict prevention enforced)
          </p>
        </div>

        {schedule.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 border border-slate-100 rounded-2xl">
            No active or upcoming bookings for this resource. You can reserve any available time slot!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Attendees</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {schedule.map((b) => (
                  <tr key={b.booking_id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-semibold text-slate-900">{b.title}</td>
                    <td className="py-3 px-3">
                      {new Date(b.start_time).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-3">
                      {new Date(b.start_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      -{' '}
                      {new Date(b.end_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3">{b.attendees_count}</td>
                    <td className="py-3 px-3">
                      <BookingStatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <BookingModal
        resource={resource}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSuccess={() => {
          setSuccessMsg('Booking submitted successfully! Awaiting admin approval.');
          loadData();
        }}
        onSwitchToWaitlist={() => setIsWaitlistOpen(true)}
      />

      <WaitlistModal
        resource={resource}
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
        onSuccess={() => {
          setSuccessMsg('Joined waitlist! You will be notified automatically if a slot opens up.');
        }}
      />
    </div>
  );
}

