// src/components/layout/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false, requiredPermission = null }) => {
  const { currentUser, userDetails, loading } = useAuth();

  // Show loading spinner while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
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
