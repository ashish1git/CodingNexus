// src/components/layout/ProtectedRoute.jsx
import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGuest } from '../../context/GuestContext';
import { apiClient } from '../../services/apiClient';

const ProtectedRoute = ({ children, adminOnly = false, requiredPermission = null }) => {
  const { currentUser, userDetails, loading } = useAuth();
  const { guestUser, isGuest } = useGuest();
  const location = useLocation();
  const [guestAllowed, setGuestAllowed] = useState(null); // null = checking

  // Fetch admin-allowed routes for guests (cached in sessionStorage for 60 s)
  useEffect(() => {
    if (!isGuest) return;
    const cacheKey = 'guest_allowed_routes';
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { routes, ts } = JSON.parse(cached);
      if (Date.now() - ts < 60_000) {
        const currentPath = location.pathname;
        const allowed = routes.some(r => currentPath === r || currentPath.startsWith(r.replace(':id', '').replace('/:id', '')));
        setGuestAllowed(allowed);
        return;
      }
    }
    apiClient.get('/guest/allowed-routes')
      .then(res => {
        const routes = res.success ? res.routes.map(r => r.route) : [];
        sessionStorage.setItem(cacheKey, JSON.stringify({ routes, ts: Date.now() }));
        const currentPath = location.pathname;
        const allowed = routes.some(r => currentPath === r || currentPath.startsWith(r.replace(':id', '').replace('/:id', '')));
        setGuestAllowed(allowed);
      })
      .catch(() => setGuestAllowed(false));
  }, [isGuest, location.pathname]);

  // Show loading spinner while auth is initializing
  // SKIP this for guests — GuestContext initializes synchronously so we can proceed immediately
  if (loading && !isGuest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // ── Guest user handling (NEW — does not affect existing flow) ──
  if (isGuest && guestUser) {
    // Admins never see guest routes
    if (adminOnly) return <Navigate to="/" />;

    // Still checking allowed routes
    if (guestAllowed === null) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-300">Verifying guest access…</p>
          </div>
        </div>
      );
    }

    if (!guestAllowed) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center max-w-md p-8 bg-gray-800 rounded-2xl shadow-xl">
            <p className="text-4xl mb-4">🚫</p>
            <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
            <p className="text-gray-400 text-sm">The administrator has not enabled guest access for this page.</p>
          </div>
        </div>
      );
    }

    // Allowed — render the page
    return children;
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to={adminOnly ? "/admin-login" : "/login"} />;
  }

  // If route requires admin access
  if (adminOnly) {
    // ✅ superadmin + admin + subadmin can ACCESS pages
    if (
      userDetails?.role !== 'superadmin' &&
      userDetails?.role !== 'admin' &&
      userDetails?.role !== 'subadmin'
    ) {
      return <Navigate to="/" />;
    }

    // ⚠️ IMPORTANT:
    // Permission logic must NEVER block page access
    // It is kept ONLY for backward compatibility
    if (requiredPermission) {
      // superadmin always allowed
      if (userDetails?.role === 'superadmin') {
        return children;
      }

      // subadmin/admin are also allowed to LOAD the page
      // permission will be checked INSIDE the component
      return children;
    }
  }

  // Prevent admins from accessing student routes
  if (
    !adminOnly &&
    (
      userDetails?.role === 'superadmin' ||
      userDetails?.role === 'admin' ||
      userDetails?.role === 'subadmin'
    )
  ) {
    return <Navigate to="/admin/dashboard" />;
  }

  return children;
};

export default ProtectedRoute;
