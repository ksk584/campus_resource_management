import React from 'react';

export function BookingStatusBadge({ status }) {
  const styles = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
    completed: 'bg-blue-50 text-blue-700 border-blue-200',
    no_show: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const labels = {
    pending: 'Pending Approval',
    approved: 'Approved',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    completed: 'Completed',
    no_show: 'No Show',
  };

  const style = styles[status] || 'bg-slate-50 text-slate-700 border-slate-200';
  const label = labels[status] || status;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {label}
    </span>
  );
}

export function ResourceStatusBadge({ status }) {
  const styles = {
    available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    maintenance: 'bg-amber-50 text-amber-700 border-amber-200',
    retired: 'bg-slate-100 text-slate-500 border-slate-200',
  };

  const labels = {
    available: 'Available',
    maintenance: 'In Maintenance',
    retired: 'Retired',
  };

  const style = styles[status] || 'bg-slate-50 text-slate-700 border-slate-200';
  const label = labels[status] || status;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${style}`}>
      <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${status === 'available' ? 'bg-emerald-500' : status === 'maintenance' ? 'bg-amber-500' : 'bg-slate-400'}`}></span>
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const styles = {
    low: 'bg-slate-100 text-slate-600 border-slate-200',
    normal: 'bg-blue-50 text-blue-700 border-blue-200',
    high: 'bg-amber-50 text-amber-700 border-amber-200',
    urgent: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
  };

  const style = styles[priority] || 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs uppercase tracking-wider font-semibold border ${style}`}>
      {priority}
    </span>
  );
}

