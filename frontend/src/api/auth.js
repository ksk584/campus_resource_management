import { apiRequest } from './client';

export const loginUser = (email, password) =>
  apiRequest('/auth/login', {
    method: 'POST',
    data: { email, password },
  });

export const registerUser = (userData) =>
  apiRequest('/auth/register', {
    method: 'POST',
    data: userData,
  });

export const getMe = () => apiRequest('/auth/me');

