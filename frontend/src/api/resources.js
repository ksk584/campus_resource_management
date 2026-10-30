import { apiRequest } from './client';

export const getResources = (filters = {}) => {
  const query = new URLSearchParams();
  if (filters.type_id) query.append('type_id', filters.type_id);
  if (filters.status) query.append('status', filters.status);
  if (filters.department_id) query.append('department_id', filters.department_id);

  const qs = query.toString();
  return apiRequest(`/resources${qs ? `?${qs}` : ''}`);
};

export const searchResources = (searchParams = {}) => {
  const query = new URLSearchParams();
  if (searchParams.type_id) query.append('type_id', searchParams.type_id);
  if (searchParams.min_capacity) query.append('min_capacity', searchParams.min_capacity);
  if (searchParams.location) query.append('location', searchParams.location);
  if (searchParams.start_time) query.append('start_time', searchParams.start_time);
  if (searchParams.end_time) query.append('end_time', searchParams.end_time);
  if (searchParams.feature_ids && searchParams.feature_ids.length > 0) {
    query.append('feature_ids', searchParams.feature_ids.join(','));
  }

  const qs = query.toString();
  return apiRequest(`/resources/search${qs ? `?${qs}` : ''}`);
};

export const getResourceById = (id) => apiRequest(`/resources/${id}`);

export const createResource = (resourceData) =>
  apiRequest('/resources', {
    method: 'POST',
    data: resourceData,
  });

export const updateResource = (id, resourceData) =>
  apiRequest(`/resources/${id}`, {
    method: 'PUT',
    data: resourceData,
  });

export const deleteResource = (id) =>
  apiRequest(`/resources/${id}`, {
    method: 'DELETE',
  });

