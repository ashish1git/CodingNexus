// src/components/layout/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false, requiredPermission = null }) => {
  const { currentUser, userDetails, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
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
