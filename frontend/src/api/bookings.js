import { apiRequest } from './client';

export const getBookings = (filters = {}) => {
  const query = new URLSearchParams();
  if (filters.resource_id) query.append('resource_id', filters.resource_id);
  if (filters.status) query.append('status', filters.status);
  if (filters.start_date) query.append('start_date', filters.start_date);
  if (filters.end_date) query.append('end_date', filters.end_date);
  if (filters.user_id) query.append('user_id', filters.user_id);

  const qs = query.toString();
  return apiRequest(`/bookings${qs ? `?${qs}` : ''}`);
};

export const getMyBookings = () => apiRequest('/bookings/my/history');

export const getBookingById = (id) => apiRequest(`/bookings/${id}`);

export const createBooking = (bookingData) =>
  apiRequest('/bookings', {
    method: 'POST',
    data: bookingData,
  });

export const cancelBooking = (id) =>
  apiRequest(`/bookings/${id}/cancel`, {
    method: 'PUT',
  });

export const approveBooking = (id, comments = '') =>
  apiRequest(`/bookings/${id}/approve`, {
    method: 'PUT',
    data: { comments },
  });

export const rejectBooking = (id, comments = '') =>
  apiRequest(`/bookings/${id}/reject`, {
    method: 'PUT',
    data: { comments },
  });

