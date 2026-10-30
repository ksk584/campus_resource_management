import { apiRequest } from './client';

export const getDepartments = () => apiRequest('/departments');

export const getResourceTypes = () => apiRequest('/resource-types');

export const getFeatures = () => apiRequest('/features');

