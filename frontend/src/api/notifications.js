import { apiRequest } from './client';

export const getNotifications = (page = 1, limit = 20) =>
  apiRequest(`/notifications?page=${page}&limit=${limit}`);

export const getUnreadCount = () => apiRequest('/notifications/unread-count');

export const markAllAsRead = () =>
  apiRequest('/notifications/read-all', {
    method: 'PUT',
  });

export const markAsRead = (id) =>
  apiRequest(`/notifications/${id}/read`, {
    method: 'PUT',
  });

