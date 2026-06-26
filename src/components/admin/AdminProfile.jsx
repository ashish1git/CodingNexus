import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, User, Mail, Key, Lock, BadgeCheck, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import ChangePasswordModal from '../shared/ChangePasswordModal';

const AdminProfile = () => {
  const { userDetails } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);

  const roleConfig = {
    superadmin: { label: 'Super Admin', color: 'bg-purple-100 text-purple-700', icon: Shield },
    admin: { label: 'Admin', color: 'bg-green-100 text-green-700', icon: Shield },
    subadmin: { label: 'Sub Admin', color: 'bg-blue-100 text-blue-700', icon: Shield }
  };

  const role = userDetails?.role || 'admin';
  const config = roleConfig[role] || roleConfig.admin;
  const RoleIcon = config.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Shield className="w-8 h-8 text-indigo-600" />
                <span className="text-xl font-bold text-gray-800">Admin Portal</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-lg">
              <RoleIcon className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">{config.label}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {userDetails?.name?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
              <div className="text-white">
                <h1 className="text-2xl font-bold">{userDetails?.name || 'Admin'}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <BadgeCheck className="w-4 h-4 text-indigo-200" />
                  <span className="text-indigo-100 font-medium">{config.label}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Name</p>
                    <p className="text-sm font-semibold text-gray-800">{userDetails?.name || '—'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Mail className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Email</p>
                    <p className="text-sm font-semibold text-gray-800">{userDetails?.email || '—'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Shield className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Role</p>
                    <div className="mt-1">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 ${config.color} text-xs font-semibold rounded-full`}>
                        <RoleIcon className="w-3.5 h-3.5" />
                        {config.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200" />

            {/* Security Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Security</h2>
              <button
                onClick={() => setShowChangePassword(true)}
                className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-indigo-50 transition group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition">
                    <Key className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-800">Change Password</p>
                    <p className="text-xs text-gray-500">Update your account password</p>
                  </div>
                </div>
                <Lock className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </div>
  );
};

export default AdminProfile;
