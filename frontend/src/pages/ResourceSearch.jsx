import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getResources, searchResources } from '../api/resources';
import { getResourceTypes, getDepartments, getFeatures } from '../api/departments';
import { ResourceStatusBadge } from '../components/StatusBadge';
import BookingModal from '../components/BookingModal';
import WaitlistModal from '../components/WaitlistModal';
import {
  Search,
  Filter,
  Users,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  Plus,
  Sparkles,
  Info,
  RotateCcw,
} from 'lucide-react';

export default function ResourceSearch() {
  const [resources, setResources] = useState([]);
  const [types, setTypes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [featuresList, setFeaturesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [typeId, setTypeId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [minCapacity, setMinCapacity] = useState('');
  const [locationText, setLocationText] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState([]);

  // Modals state
  const [selectedResource, setSelectedResource] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [waitlistPrefill, setWaitlistPrefill] = useState({ date: '', start: '', end: '' });

  // Success alert
  const [successMsg, setSuccessMsg] = useState(null);

  // Load initial master data
  useEffect(() => {
    async function initData() {
      try {
        const [typesData, deptsData, featsData] = await Promise.all([
          getResourceTypes(),
          getDepartments(),
          getFeatures(),
        ]);
        setTypes(typesData);
        setDepartments(deptsData);
        setFeaturesList(featsData);
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    }
    initData();
  }, []);

  // Fetch resources based on search params
  const fetchResources = async () => {
    setLoading(true);
    try {
      if (date && startTime && endTime) {
        // Run stored procedure sp_search_available_resources
        const startISO = `${date}T${startTime}:00`;
        const endISO = `${date}T${endTime}:00`;
        const results = await searchResources({
          type_id: typeId || undefined,
          min_capacity: minCapacity || undefined,
          location: locationText || undefined,
          start_time: startISO,
          end_time: endISO,
          feature_ids: selectedFeatures.length > 0 ? selectedFeatures : undefined,
        });
        setResources(results);
      } else {
        // General overview
        const results = await getResources({
          type_id: typeId || undefined,
          department_id: departmentId || undefined,
        });

        // Client-side text and feature filter if date/time not specified
        let filtered = results;
        if (locationText) {
          const q = locationText.toLowerCase();
          filtered = filtered.filter(
            (r) =>
              r.resource_name?.toLowerCase().includes(q) ||
              r.location?.toLowerCase().includes(q) ||
              r.building?.toLowerCase().includes(q)
          );
        }
        if (minCapacity) {
          filtered = filtered.filter((r) => (r.capacity || 0) >= parseInt(minCapacity, 10));
        }
        if (selectedFeatures.length > 0) {
          const selectedFeatureNames = featuresList
            .filter((f) => selectedFeatures.includes(f.feature_id))
            .map((f) => f.name);
          filtered = filtered.filter((r) =>
            selectedFeatureNames.every((sf) => r.features && r.features.includes(sf))
          );
        }

        setResources(filtered);
      }
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [typeId, departmentId, selectedFeatures]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchResources();
  };

  const handleReset = () => {
    setTypeId('');
    setDepartmentId('');
    setMinCapacity('');
    setLocationText('');
    setDate('');
    setStartTime('');
    setEndTime('');
    setSelectedFeatures([]);
  };

  const toggleFeature = (fid) => {
    setSelectedFeatures((prev) =>
      prev.includes(fid) ? prev.filter((id) => id !== fid) : [...prev, fid]
    );
  };

  const openBooking = (res) => {
    setSelectedResource(res);
    setIsBookingOpen(true);
  };

  const openWaitlist = (res, wDate, wStart, wEnd) => {
    setSelectedResource(res);
    setWaitlistPrefill({
      date: wDate || date || new Date().toISOString().slice(0, 10),
      start: wStart || startTime || '09:00',
      end: wEnd || endTime || '10:00',
    });
    setIsWaitlistOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Browse & Book Resources</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Classrooms, Labs, Seminar Halls & Portable Equipment
          </p>
        </div>
      </div>

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

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search query */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Search Keywords</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder="Room, building, or name..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Resource Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Resource Type</label>
              <select
                value={typeId}
                onChange={(e) => setTypeId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">All Types</option>
                {types.map((t) => (
                  <option key={t.type_id} value={t.type_id}>
                    {t.name.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.department_id} value={d.department_id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Capacity */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-400" /> Min Capacity
              </label>
              <input
                type="number"
                min="0"
                value={minCapacity}
                onChange={(e) => setMinCapacity(e.target.value)}
                placeholder="e.g. 40"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Time Slot Availability Filter (Triggers sp_search_available_resources) */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Check Conflict-Free Time Slot Availability
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Features Checklist */}
          {featuresList.length > 0 && (
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Features & Amenities:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {featuresList.map((f) => {
                  const selected = selectedFeatures.includes(f.feature_id);
                  return (
                    <button
                      type="button"
                      key={f.feature_id}
                      onClick={() => toggleFeature(f.feature_id)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                        selected
                          ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {f.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
            >
              <Search className="w-3.5 h-3.5" />
              Search Resources
            </button>
          </div>
        </form>
      </div>

      {/* Results Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>Found {resources.length} resource(s)</span>
          {date && startTime && endTime && (
            <span className="text-indigo-600 font-semibold">
              Filtered for {date} ({startTime} - {endTime})
            </span>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-xs text-slate-400 border border-slate-200">
            Searching available resources...
          </div>
        ) : resources.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-xs text-slate-400 border border-slate-200 flex flex-col items-center gap-2">
            <Info className="w-8 h-8 text-slate-300" />
            <span className="font-semibold text-slate-600">No resources matched your criteria.</span>
            <span>Try adjusting your filters, time slot, or capacity requirement.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {resources.map((r) => {
              const resId = r.resource_id;
              const resName = r.resource_name || r.name;
              const resType = r.resource_type;
              const capacity = r.capacity;
              const location = r.location;
              const building = r.building;
              const floor = r.floor;
              const status = r.status || 'available';
              const features = r.features || [];

              return (
                <div
                  key={resId}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                          {resType?.replace('_', ' ')}
                        </span>
                        <h3 className="font-bold text-slate-900 text-base leading-snug mt-0.5">
                          {resName}
                        </h3>
                      </div>
                      <ResourceStatusBadge status={status} />
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {location || building || 'Main Campus'} {floor !== null ? `(Floor ${floor})` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Capacity: {capacity > 0 ? `${capacity} persons` : 'Portable / Equipment'}</span>
                      </div>
                    </div>

                    {features.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {features.map((feat, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium"
                          >
                            {feat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      to={`/resources/${resId}`}
                      className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
                    >
                      View Details
                    </Link>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openWaitlist(r)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
                      >
                        Waitlist
                      </button>

                      <button
                        type="button"
                        onClick={() => openBooking(r)}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <BookingModal
        resource={selectedResource}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSuccess={() => {
          setSuccessMsg('Booking submitted successfully! It is now pending approval.');
          fetchResources();
        }}
        onSwitchToWaitlist={(res, bDate, bStart, bEnd) => openWaitlist(res, bDate, bStart, bEnd)}
      />

      {/* Waitlist Modal */}
      <WaitlistModal
        resource={selectedResource}
        initialDate={waitlistPrefill.date}
        initialStart={waitlistPrefill.start}
        initialEnd={waitlistPrefill.end}
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
        onSuccess={() => {
          setSuccessMsg('Joined waitlist! You will be notified automatically if a slot opens up.');
        }}
      />
    </div>
  );
}

