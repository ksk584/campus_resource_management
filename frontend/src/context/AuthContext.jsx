import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getMe } from '../api/auth';
import { setAuthToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state once on application mount
  useEffect(() => {
    async function initAuth() {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        setAuthToken(savedToken);
        try {
          const freshUser = await getMe();
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        } catch (err) {
          console.warn('Initial session restore check:', err.message);
          if (err.status === 401) {
            setAuthToken(null);
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
          }
        }
      }
      setLoading(false);
    }

    initAuth();

    const handleExpired = () => {
      setAuthToken(null);
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    };

    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []); // Run ONLY once on mount

  const login = async (email, password) => {
    const res = await loginUser(email, password);
    // Write tokens synchronously before resolving
    setAuthToken(res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (userData) => {
    const res = await registerUser(userData);
    setAuthToken(res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    setAuthToken(null);
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const freshUser = await getMe();
        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
        return freshUser;
      } catch (err) {
        console.error('Failed to refresh user:', err);
      }
    }
  };

  const isAdmin = user?.role === 'admin';
  const isFaculty = user?.role === 'faculty';
  const isStudent = user?.role === 'student';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAdmin,
        isFaculty,
        isStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
