import { apiRequest } from './client';

export const getMaintenance = (filters = {}) => {
  const query = new URLSearchParams();
  if (filters.resource_id) query.append('resource_id', filters.resource_id);
  if (filters.status) query.append('status', filters.status);

  const qs = query.toString();
  return apiRequest(`/maintenance${qs ? `?${qs}` : ''}`);
};

export const createMaintenance = (data) =>
  apiRequest('/maintenance', {
    method: 'POST',
    data,
  });

export const updateMaintenance = (id, data) =>
  apiRequest(`/maintenance/${id}`, {
    method: 'PUT',
    data,
  });

export const cancelMaintenance = (id) =>
  apiRequest(`/maintenance/${id}`, {
    method: 'DELETE',
  });

