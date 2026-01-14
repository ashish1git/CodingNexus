// src/components/auth/AdminLogin.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login, currentUser, userDetails } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (currentUser) {
      // Redirect to appropriate dashboard based on role
      if (userDetails?.role === 'superadmin' || userDetails?.role === 'admin' || userDetails?.role === 'subadmin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        // If student is logged in, redirect to student dashboard
        navigate('/student/dashboard', { replace: true });
      }
    }
  }, [currentUser, userDetails, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      // login with isAdmin=true
      const result = await login(formData.email, formData.password, true);
      
      if (result.success) {
        toast.success('Login successful!');
        navigate('/admin/dashboard');
      } else {
        // Error toast already shown in authService, but we can add more specific handling
        console.error('Admin login failed:', result.error);
        
        // Show additional toast if needed (optional)
        if (!result.error || result.error.includes('Not authorized')) {
          toast.error('You are not authorized as an administrator');
        }
      }
    } catch (error) {
      console.error('Admin login error:', error);
      
      // Handle unexpected errors
      if (error.code === 'auth/user-not-found') {
        toast.error('Admin account not found');
      } else if (error.code === 'auth/wrong-password') {
        toast.error('Incorrect password');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many attempts. Please try again later');
      } else if (error.code === 'auth/invalid-credential') {
        toast.error('Invalid admin credentials');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-gray-700 to-indigo-700 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Portal</h1>
          <p className="text-gray-600">Secure access for administrators</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Admin Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={{ color: '#111827' }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-gray-900"
              placeholder="admin@codingnexus.com"
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                style={{ color: '#111827' }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition pr-12 text-gray-900"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-gray-700 to-indigo-700 text-white py-3 rounded-lg font-medium hover:from-gray-800 hover:to-indigo-800 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Admin Login
              </>
            )}
          </button>
        </form>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> Only authorized administrators can access this portal.
            Super Admin manages  accounts from the  Super Admin dashboard.
          </p>
        </div>

        {/* Back to Student Login */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
          >
            ← Back to Student Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;