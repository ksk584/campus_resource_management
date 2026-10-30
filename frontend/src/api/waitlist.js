import { apiRequest } from './client';

export const getWaitlist = (filters = {}) => {
  const query = new URLSearchParams();
  if (filters.resource_id) query.append('resource_id', filters.resource_id);
  if (filters.is_active !== undefined) query.append('is_active', filters.is_active);

  const qs = query.toString();
  return apiRequest(`/waitlist${qs ? `?${qs}` : ''}`);
};

export const getMyWaitlist = () => apiRequest('/waitlist/my');

export const joinWaitlist = (data) =>
  apiRequest('/waitlist', {
    method: 'POST',
    data,
  });

export const leaveWaitlist = (id) =>
  apiRequest(`/waitlist/${id}`, {
    method: 'DELETE',
  });

