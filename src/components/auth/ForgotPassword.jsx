import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader, CheckCircle, KeyRound } from 'lucide-react';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

const OTP_LENGTH = 6;
const OTP_EXPIRY = 600; // 10 min

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [moodleId, setMoodleId] = useState('');
  const [verificationData, setVerificationData] = useState(null);
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [otpId, setOtpId] = useState(null);
  const [otpError, setOtpError] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const inputRef = useRef(null);
  const otpRefs = useRef([]);

  // Focus first input on step change
  useEffect(() => { setTimeout(() => (inputRef.current?.focus()), 100); }, [step]);

  // OTP countdown
  useEffect(() => {
    if (otpTimer <= 0) return;
    const t = setInterval(() => setOtpTimer(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [otpTimer]);

  // --- Step 1: Send OTP ---
  const handleSendOtp = useCallback(async (e) => {
    e.preventDefault();
    if (!moodleId.trim()) return toast.error('Enter your Moodle ID');
    setLoading(true);
    try {
      const r = await authService.requestPasswordReset(moodleId.trim());
      if (r.success) {
        setVerificationData(r.data);
        setStep(2);
        setOtpTimer(OTP_EXPIRY);
        setOtp(Array(OTP_LENGTH).fill(''));
        setOtpError('');
        toast.success('OTP sent to your email!');
      }
    } finally { setLoading(false); }
  }, [moodleId]);

  // --- Step 2: OTP input ---
  const handleOtpChange = (idx, val) => {
    if (val && !/^\d$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    setOtpError('');
    if (val && idx < OTP_LENGTH - 1) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKey = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (e.key === 'Enter' && otp.every(Boolean)) handleVerifyOtp();
  };

  const handleOtpPaste = (e) => {
    const d = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (d.length !== OTP_LENGTH) return;
    e.preventDefault();
    setOtp(d.split(''));
    otpRefs.current[OTP_LENGTH - 1]?.focus();
  };

  const handleVerifyOtp = useCallback(async () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) return setOtpError('Enter complete 6-digit OTP');
    setLoading(true);
    try {
      const r = await authService.verifyOtp(moodleId.trim(), code);
      if (r.success) {
        setOtpId(r.data.otpId);
        setStep(3);
        toast.success('OTP verified! Set your new password.');
      } else {
        setOtpError(r.error || 'Invalid OTP');
      }
    } finally { setLoading(false); }
  }, [otp, moodleId]);

  const handleResend = useCallback(async () => {
    if (otpTimer > 0) return;
    setLoading(true);
    try {
      const r = await authService.requestPasswordReset(moodleId.trim());
      if (r.success) {
        setOtpTimer(OTP_EXPIRY);
        setOtp(Array(OTP_LENGTH).fill(''));
        setOtpError('');
        otpRefs.current[0]?.focus();
        toast.success('New OTP sent!');
      }
    } finally { setLoading(false); }
  }, [moodleId, otpTimer]);

  // --- Step 3: Set new password ---
  const handleReset = useCallback(async (e) => {
    e.preventDefault();
    const errs = {};
    if (newPassword.length < 6) errs.newPassword = 'Minimum 6 characters';
    if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) return setErrors(errs);
    setLoading(true);
    try {
      const r = await authService.verifyResetOtp(moodleId.trim(), otp.join(''), newPassword);
      if (r.success) {
        toast.success('Password reset! Login with your new password.');
        navigate('/login');
      }
    } finally { setLoading(false); }
  }, [newPassword, confirmPassword, moodleId, otp, navigate]);

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="min-h-dvh bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <button onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 text-white/90 hover:text-white text-sm mb-5 transition-all hover:-translate-x-0.5">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <img src="/favicon.svg" alt="" className="w-16 h-16 mx-auto mb-3 rounded-2xl shadow-md" />
            <h1 className="text-xl font-bold text-gray-800">Reset Password</h1>
            <p className="text-sm text-gray-500 mt-1">
              {step === 1 ? 'Enter your Moodle ID' : step === 2 ? 'Enter the OTP sent to your email' : 'Choose a new password'}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-1.5 mb-6">
            {[1, 2, 3].map(s => (
              <div key={s} className={`flex items-center gap-1.5 ${s > 1 ? 'ml-1.5' : ''}`}>
                {s > 1 && <div className="w-4 h-px bg-gray-300" />}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step >= s ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'
                }`}>{step > s ? '✓' : s}</div>
              </div>
            ))}
          </div>

          {/* Step 1 — Moodle ID */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Moodle ID</label>
                <input ref={inputRef} type="text" value={moodleId} onChange={e => setMoodleId(e.target.value)} placeholder="e.g. 23106031" required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 text-base" />
                <p className="mt-1.5 text-xs text-gray-400">OTP sent to <span className="font-medium text-indigo-500">yourMoodleId@apsit.edu.in</span></p>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition">
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : <><Mail className="w-4 h-4" /> Send OTP</>}
              </button>
            </form>
          )}

          {/* Step 2 — OTP */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 rounded-xl text-center">
                <p className="text-sm font-medium text-indigo-800">{verificationData?.maskedName}</p>
                <p className="text-xs text-indigo-500 mt-0.5">OTP sent to {verificationData?.maskedEmail}</p>
              </div>

              <div className="text-center">
                <label className="text-sm font-medium text-gray-700 mb-3 block">6-digit OTP</label>
                <div className="flex gap-1.5 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((d, i) => (
                    <input key={i} ref={el => otpRefs.current[i] = el}
                      type="text" inputMode="numeric" maxLength={1} value={d}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKey(i, e)}
                      className={`w-10 h-11 sm:w-11 sm:h-12 text-center text-lg font-bold border-2 rounded-xl transition text-gray-900 focus:ring-2 focus:ring-indigo-500 ${
                        otpError ? 'border-red-400' : d ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300'
                      }`} />
                  ))}
                </div>
                {otpError && <p className="text-sm text-red-600 mt-1.5">{otpError}</p>}

                {otpTimer > 0 ? (
                  <p className="text-xs text-gray-400 mt-3">Expires in <span className="font-semibold text-indigo-600">{fmt(otpTimer)}</span></p>
                ) : (
                  <button type="button" onClick={handleResend} disabled={loading}
                    className="text-sm text-indigo-600 font-medium mt-3 disabled:opacity-50">Resend OTP</button>
                )}
              </div>

              <button onClick={handleVerifyOtp} disabled={loading || !otp.every(Boolean)}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition">
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : <><KeyRound className="w-4 h-4" /> Verify OTP</>}
              </button>

              <button type="button" onClick={() => { setStep(1); setOtp(Array(OTP_LENGTH).fill('')); setOtpError(''); }}
                className="w-full text-sm text-gray-500 py-2 hover:text-gray-700 transition">← Back</button>
            </div>
          )}

          {/* Step 3 — New Password */}
          {step === 3 && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <p className="text-sm text-emerald-800">OTP verified! Set your new password.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                <div className="relative">
                  <input ref={inputRef} type={showPassword ? 'text' : 'password'} value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setErrors({}); }}
                    className={`w-full px-4 py-3 border rounded-xl pr-11 text-gray-900 text-base focus:ring-2 focus:ring-indigo-500 ${errors.newPassword ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="New password" />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && <p className="text-sm text-red-600 mt-1">{errors.newPassword}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setErrors({}); }}
                    className={`w-full px-4 py-3 border rounded-xl pr-11 text-gray-900 text-base focus:ring-2 focus:ring-indigo-500 ${errors.confirmPassword ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="Confirm password" />
                  <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>}
              </div>

              <button type="submit" disabled={loading || !newPassword || !confirmPassword}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition">
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : <><Lock className="w-4 h-4" /> Reset Password</>}
              </button>
            </form>
          )}

          <div className="mt-5 text-center">
            <Link to="/login" className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
