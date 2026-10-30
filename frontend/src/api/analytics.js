import { apiRequest } from './client';

export const getUtilizationReport = (startDate, endDate) => {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);

  const qs = query.toString();
  return apiRequest(`/analytics/utilization${qs ? `?${qs}` : ''}`);
};

export const getUserSummary = () => apiRequest('/analytics/users');

export const getTodaySchedule = () => apiRequest('/analytics/today');

