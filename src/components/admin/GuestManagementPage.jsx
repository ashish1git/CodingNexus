// src/components/admin/GuestManagementPage.jsx
// Standalone admin page for Guest Management (sessions + route access)

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import GuestAccessControl from './GuestAccessControl';

const GuestManagementPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Guest Management</h1>

        <GuestAccessControl />
      </div>
    </div>
  );
};

export default GuestManagementPage;
