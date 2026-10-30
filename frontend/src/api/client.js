const API_BASE = '/api';

let currentToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

export function setAuthToken(token) {
  currentToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }
}

export function getAuthToken() {
  if (currentToken) return currentToken;
  if (typeof window !== 'undefined') {
    currentToken = localStorage.getItem('token');
    return currentToken;
  }
  return null;
}

export async function apiRequest(endpoint, { method = 'GET', data, headers = {} } = {}) {
  const token = getAuthToken();

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (data !== undefined && method !== 'GET') {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  // Handle 401 Unauthorized only if we actually provided an Authorization token
  // that was rejected, preventing false positives from killing a valid session.
  if (
    response.status === 401 &&
    Boolean(config.headers.Authorization) &&
    !endpoint.includes('/auth/login')
  ) {
    setAuthToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:expired'));
    }
  }

  let result = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    result = await response.json();
  }

  if (!response.ok) {
    const errorMessage =
      (result && (result.error || (result.errors && result.errors.map(e => e.msg).join(', ')))) ||
      `Request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = result;
    throw error;
  }

  return result;
}
