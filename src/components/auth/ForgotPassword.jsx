import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code, ArrowLeft, Mail, Lock, Eye, EyeOff, Check, Loader, AlertCircle } from 'lucide-react';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = enter moodleId, 2 = verify & reset
  const [loading, setLoading] = useState(false);
  const [moodleId, setMoodleId] = useState('');
  const [verificationData, setVerificationData] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  const handleMoodleIdSubmit = async (e) => {
    e.preventDefault();
    
    if (!moodleId.trim()) {
      toast.error('Please enter your Moodle ID');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.requestPasswordReset(moodleId.trim());
      
      if (result.success) {
        setVerificationData(result.data);
        setStep(2);
        toast.success('Account found! Please verify your identity.');
      }
    } catch (error) {
      console.error('Request reset error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};

    // Validate phone (last 4 digits)
    if (!formData.phone.trim()) {
      newErrors.phone = 'Please enter the last 4 digits of your phone number';
    } else if (formData.phone.length !== 4 || !/^\d{4}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter exactly 4 digits';
    }

    // Validate new password
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    // Validate confirm password
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const result = await authService.resetPassword(
        moodleId.trim(),
        formData.phone,
        formData.newPassword
      );

      if (result.success) {
        toast.success('Password reset successfully! Please login with your new password.');
        navigate('/login');
      }
    } catch (error) {
      console.error('Reset password error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-white hover:text-indigo-200 transition-all hover:translate-x-1 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>
        <div className="bg-white rounded-2xl shadow-2xl w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/favicon.svg" alt="Coding Nexus Logo" className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-lg" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Reset Password</h1>
          <p className="text-gray-600">
            {step === 1 
              ? 'Enter your Moodle ID to reset your password' 
              : 'Verify your identity and set a new password'}
          </p>
        </div>

        {step === 1 ? (
          // Step 1: Enter Moodle ID
          <form onSubmit={handleMoodleIdSubmit} className="space-y-5">
            <div>
              <label htmlFor="moodleId" className="block text-sm font-medium text-gray-700 mb-2">
                Moodle ID
              </label>
              <input
                type="text"
                id="moodleId"
                value={moodleId}
                onChange={(e) => setMoodleId(e.target.value)}
                style={{ color: '#111827' }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-gray-900"
                placeholder="e.g., 23106031"
                required
              />
              <p className="mt-1 text-xs text-gray-500">Enter only your Moodle ID number</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Find My Account
                </>
              )}
            </button>
          </form>
        ) : (
          // Step 2: Verify & Reset Password
          <form onSubmit={handleResetSubmit} className="space-y-5">
            {/* Account Info Display */}
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
              <p className="text-sm text-indigo-800">
                <strong>Account Found:</strong> {verificationData?.maskedName || 'Student'}
              </p>
              <p className="text-xs text-indigo-600 mt-1">
                Phone hint: ******{verificationData?.phoneHint || '****'}
              </p>
            </div>

            {/* Phone Verification */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last 4 digits of your phone number
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                maxLength={4}
                style={{ color: '#111827' }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-gray-900 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 1234"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  style={{ color: '#111827' }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition pr-12 text-gray-900 ${
                    errors.newPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  style={{ color: '#111827' }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition pr-12 text-gray-900 ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Security Note */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-800">
                For security, we verify your identity using the phone number registered in your profile.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setFormData({ phone: '', newPassword: '', confirmPassword: '' });
                  setErrors({});
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Reset Password
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
