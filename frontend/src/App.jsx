import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ResourceSearch from './pages/ResourceSearch';
import ResourceDetails from './pages/ResourceDetails';
import MyBookings from './pages/MyBookings';
import Approvals from './pages/Approvals';
import Maintenance from './pages/Maintenance';
import Analytics from './pages/Analytics';
import Waitlist from './pages/Waitlist';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Application Routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/resources" element={<ResourceSearch />} />
            <Route path="/resources/:id" element={<ResourceDetails />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/waitlist" element={<Waitlist />} />

            {/* Admin-only Approvals */}
            <Route
              path="/approvals"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Approvals />
                </ProtectedRoute>
              }
            />

            {/* Admin & Faculty Maintenance */}
            <Route
              path="/maintenance"
              element={
                <ProtectedRoute allowedRoles={['admin', 'faculty']}>
                  <Maintenance />
                </ProtectedRoute>
              }
            />

            {/* Admin & Faculty Analytics */}
            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin', 'faculty']}>
                  <Analytics />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

