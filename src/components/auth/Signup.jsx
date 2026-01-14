// src/components/auth/Signup.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Signup = () => {
  const navigate = useNavigate();
  const { signup, currentUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
    moodleId: '',
    mobile: '',
    batch: 'Basic',
    password: '',
    confirmPassword: ''
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (currentUser) {
      navigate('/student/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.name || !formData.rollNo || !formData.moodleId || !formData.mobile) {
      toast.error('Please fill in all fields');
      return false;
    }

    if (formData.mobile.length !== 10) {
      toast.error('Mobile number must be 10 digits');
      return false;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Convert Moodle ID to email format
      const email = `${formData.moodleId}@codingnexus.com`;

      const userData = {
        name: formData.name,
        rollNo: formData.rollNo,
        moodleId: formData.moodleId,
        mobile: formData.mobile,
        batch: formData.batch
      };

      await signup(email, formData.password, userData);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    }catch (error) {
  console.error('Signup error:', error);

  if (error.message === 'MOODLE_ID_EXISTS') {
    toast.error('This Moodle ID is already registered');
  } else if (error.code === 'auth/email-already-in-use') {
    toast.error('Account already exists. Please login.');
  } else {
    toast.error('Registration failed. Please try again.');
  }
}
 finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 my-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full mb-4">
            <Code className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Join Coding Nexus Club</h1>
          <p className="text-gray-600">Create your account and start learning</p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="Ashish"
                required
              />
            </div>

            {/* Roll Number */}
            <div>
              <label htmlFor="rollNo" className="block text-sm font-medium text-gray-700 mb-2">
                Roll Number
              </label>
              <input
                type="text"
                id="rollNo"
                name="rollNo"
                value={formData.rollNo}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="125"
                required
              />
            </div>

            {/* Moodle ID */}
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
                placeholder="23106031"
                required
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number
              </label>
              <input
                type="tel"
                id="mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="8104287477"
                maxLength="10"
                required
              />
            </div>
          </div>

          {/* Batch Selection */}
          <div>
            <label htmlFor="batch" className="block text-sm font-medium text-gray-700 mb-2">
              Select Batch
            </label>
            <select
              id="batch"
              name="batch"
              value={formData.batch}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            >
              <option value="Basic">Basic Batch</option>
              <option value="Advanced">Advanced Batch</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Password */}
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
                  placeholder="••••••"
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition pr-12"
                  placeholder="••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
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
                <UserPlus className="w-5 h-5" />
                Create Account
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <span className="text-gray-600 text-sm">Already have an account? </span>
          <Link
            to="/login"
            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
          >
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;