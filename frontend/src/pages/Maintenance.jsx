import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMaintenance, cancelMaintenance } from '../api/maintenance';
import { getResources } from '../api/resources';
import MaintenanceModal from '../components/MaintenanceModal';
import {
  Wrench,
  Calendar,
  Clock,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Building2,
  ShieldCheck,
} from 'lucide-react';

export default function Maintenance() {
  const { isAdmin } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [resources, setResources] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [maintData, resData] = await Promise.all([
        getMaintenance({ status: statusFilter || undefined }),
        getResources(),
      ]);
      setSchedules(maintData);
      setResources(resData);
    } catch (err) {
      console.error('Failed to load maintenance schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleCancelMaintenance = async (id) => {
    if (!window.confirm('Cancel this maintenance window?')) return;

    try {
      await cancelMaintenance(id);
      setToast({ type: 'success', message: 'Maintenance window cancelled.' });
      fetchData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to cancel.' });
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

  const statusStyles = {
    scheduled: 'bg-amber-50 text-amber-700 border-amber-200',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
              <Wrench className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Maintenance Schedules</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Resource blackout windows with automatic booking conflict prevention
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Schedule Maintenance
          </button>
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
              <XCircle className="w-4 h-4 text-rose-600" />
            )}
            <span className="font-semibold">{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Info Alert explaining DB trigger */}
      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Database Conflict Enforcement:</strong> Whenever a maintenance window is active,
          the PostgreSQL trigger <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">trg_check_maintenance_conflict</code> automatically
          rejects any student or faculty booking attempts for that resource and timeslot.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
            !statusFilter ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          All ({schedules.length})
        </button>
        {['scheduled', 'in_progress', 'completed', 'cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl capitalize transition ${
              statusFilter === st ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Maintenance List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-xs text-slate-400 border border-slate-200">
            Loading maintenance schedules...
          </div>
        ) : schedules.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-xs text-slate-400 border border-slate-200 flex flex-col items-center gap-2">
            <CheckCircle className="w-8 h-8 text-slate-300" />
            <span className="font-semibold text-slate-600">No maintenance scheduled in this filter.</span>
          </div>
        ) : (
          schedules.map((m) => (
            <div
              key={m.maintenance_id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">{m.title}</h3>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold capitalize ${
                      statusStyles[m.status] || 'bg-slate-50 text-slate-600'
                    }`}
                  >
                    {m.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Building2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>{m.resource_name}</span>
                    <span className="text-slate-400">({m.location || 'Campus'})</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {formatDateTime(m.start_time)} - {formatDateTime(m.end_time)}
                    </span>
                  </div>
                </div>

                {m.description && (
                  <p className="text-xs text-slate-600 max-w-xl leading-relaxed">{m.description}</p>
                )}
              </div>

              {isAdmin && m.status === 'scheduled' && (
                <button
                  type="button"
                  onClick={() => handleCancelMaintenance(m.maintenance_id)}
                  className="self-end md:self-center px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-xl transition"
                >
                  Cancel Maintenance
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <MaintenanceModal
        resources={resources}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setToast({ type: 'success', message: 'Maintenance window created successfully.' });
          fetchData();
        }}
      />
    </div>
  );
}

