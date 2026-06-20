import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader, AlertCircle, KeyRound, CheckCircle } from 'lucide-react';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = enter moodleId, 2 = enter OTP & new password
  const [loading, setLoading] = useState(false);
  const [moodleId, setMoodleId] = useState('');
  const [verificationData, setVerificationData] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  // OTP timer countdown
  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

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
        setOtpTimer(600); // 10 minutes
        toast.success('OTP sent to your registered email!');
      }
    } catch (error) {
      console.error('Request reset error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError('');

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs[index + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pastedData)) return;
    
    const digits = pastedData.split('');
    setOtp(digits);
    otpRefs[5].current.focus();
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    
    setLoading(true);
    try {
      const result = await authService.requestPasswordReset(moodleId.trim());
      if (result.success) {
        setOtpTimer(600);
        setOtp(['', '', '', '', '', '']);
        otpRefs[0].current.focus();
        toast.success('New OTP sent to your email!');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};

    // Validate OTP
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setOtpError('Please enter the complete 6-digit OTP');
      return;
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
      const result = await authService.verifyResetOtp(
        moodleId.trim(),
        otpString,
        formData.newPassword
      );

      if (result.success) {
        toast.success('Password reset successfully! Please login with your new password.');
        navigate('/login');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
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

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
              ? 'Enter your Moodle ID to receive an OTP' 
              : 'Enter the OTP sent to your email'}
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
              <p className="mt-1 text-xs text-gray-500">
                Enter your Moodle ID. OTP will be sent to <strong>yourMoodleId@apsit.edu.in</strong>
              </p>
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
                  Send OTP
                </>
              )}
            </button>
          </form>
        ) : (
          // Step 2: Enter OTP & New Password
          <form onSubmit={handleVerifySubmit} className="space-y-5">
            {/* Account Info Display */}
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
              <p className="text-sm text-indigo-800">
                <strong>Account:</strong> {verificationData?.maskedName || 'Student'}
              </p>
              {verificationData?.maskedEmail && (
                <p className="text-xs text-indigo-600 mt-1">
                  OTP sent to: {verificationData.maskedEmail}
                </p>
              )}
            </div>

            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                Enter 6-digit OTP
              </label>
              <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={otpRefs[index]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    style={{ color: '#111827' }}
                    className={`w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-gray-900 ${
                      otpError ? 'border-red-500' : 'border-gray-300'
                    } ${digit ? 'border-indigo-400 bg-indigo-50' : ''}`}
                  />
                ))}
              </div>
              {otpError && (
                <p className="mt-2 text-sm text-red-600 text-center">{otpError}</p>
              )}

              {/* Timer & Resend */}
              <div className="mt-3 text-center">
                {otpTimer > 0 ? (
                  <p className="text-xs text-gray-500">
                    OTP expires in <span className="font-semibold text-indigo-600">{formatTimer(otpTimer)}</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              {/* New Password */}
              <div className="mb-4">
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
            </div>

            {/* Security Note */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-800">
                For security, an OTP has been sent to your registered email. Never share this OTP with anyone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp(['', '', '', '', '', '']);
                  setOtpError('');
                  setFormData({ newPassword: '', confirmPassword: '' });
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
                    <KeyRound className="w-5 h-5" />
                    Verify & Reset
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
