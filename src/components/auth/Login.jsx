// src/components/auth/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showActivation, setShowActivation] = useState(false);
  const [activationEmail, setActivationEmail] = useState('');
  const [formData, setFormData] = useState({
    moodleId: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.moodleId || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      // Pass the moodleId directly - authService will handle email conversion
      const result = await login(formData.moodleId, formData.password);
      
      // Check if login was successful
      if (result.success) {
        // Success toast is already shown in authService.loginStudent
        navigate('/student/dashboard');
      } else if (result.needsActivation) {
        // Show activation prompt
        setActivationEmail(result.email);
        setShowActivation(true);
      }
      // Error toast is already shown in authService.loginStudent
      
    } catch (error) {
      console.error('Unexpected login error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivation = () => {
    // Redirect to signup page with pre-filled email
    navigate('/signup', { state: { email: activationEmail, moodleId: formData.moodleId } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full mb-4">
            <Code className="w-8 h-8 text-white" />
          </div>
          <Link to="/" className="block">
  <h1 className="text-3xl font-bold text-gray-800 mb-2 hover:text-indigo-600 transition-colors cursor-pointer">
    Coding Nexus
  </h1>
</Link>
          <p className="text-gray-600">Welcome back! Please login to continue</p>
        </div>

        {/* Activation Notice */}
        {showActivation && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                  Account Activation Required
                </h3>
                <p className="text-sm text-yellow-700 mb-3">
                  Your account has been created by an admin but needs to be activated. Please set your password to continue.
                </p>
                <button
                  onClick={handleActivation}
                  className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                >
                  Activate Account →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Moodle ID Input */}
          <div>
            <label htmlFor="moodleId" className="block text-sm font-medium text-gray-700 mb-2">
              Moodle ID
            </label>
            <input
              type="text"
              id="moodleId"
              name="moodleId"
              value={formData.moodleId}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="Enter your Moodle ID"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition pr-12"
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
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Login
              </>
            )}
          </button>
        </form>

        {/* Links */}
        <div className="mt-6 space-y-3">
          <div className="text-center">
            <span className="text-gray-600 text-sm">Don't have an account? </span>
            <Link
              to="/signup"
              className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
            >
              Sign up here
            </Link>
          </div>
          <div className="text-center">
            <Link
              to="/admin-login"
              className="text-purple-600 hover:text-purple-700 font-medium text-sm"
            >
              Admin Login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;