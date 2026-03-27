// src/components/auth/GuestLogin.jsx
// Guest entry flow — supports new session, resume active session, and previous-session recovery.
// Does NOT touch or import any existing auth/signup logic.

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ghost, CheckCircle, XCircle, ArrowLeft, Loader2, UserCheck, RotateCcw, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../services/apiClient';
import { useGuest } from '../../context/GuestContext';

const DEBOUNCE_MS = 500;

const GuestLogin = () => {
  const navigate = useNavigate();
  const { setGuestUser } = useGuest();
  const [username, setUsername] = useState('');
  // null | 'checking' | 'available' | 'taken' | 'resumable'
  const [checkStatus, setCheckStatus] = useState(null);
  const [joining, setJoining] = useState(false);
  const debounceRef = useRef(null);

  // Previous session stored in localStorage (for recovery banner)
  const [prevSession, setPrevSession] = useState(null);
  useEffect(() => {
    try {
      const stored = localStorage.getItem('guest_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.username) setPrevSession(parsed);
      }
    } catch { /* ignore */ }
  }, []);

  // ── Real-time username check ─────────────────────────────────────
  const handleUsernameChange = useCallback((e) => {
    const val = e.target.value.replace(/[^a-zA-Z0-9_\- ]/g, '');
    setUsername(val);
    setCheckStatus(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) return;

    setCheckStatus('checking');
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await apiClient.get(`/guest/check-username?username=${encodeURIComponent(val.trim())}`);
        if (res.resumable) setCheckStatus('resumable');
        else if (res.available) setCheckStatus('available');
        else setCheckStatus('taken');
      } catch {
        setCheckStatus(null);
      }
    }, DEBOUNCE_MS);
  }, []);

  // ── Core join/resume handler ─────────────────────────────────────
  const applyGuestSession = (res) => {
    const guestData = {
      id: res.guest.id,
      username: res.guest.username,
      role: 'guest',
      isGuest: true,
      name: res.guest.username
    };
    apiClient.setToken(res.token);
    localStorage.setItem('guest_user', JSON.stringify(guestData));
    setGuestUser(guestData);
    const msg = res.resumed
      ? `Welcome back, ${res.guest.username}! 👋`
      : `Welcome, ${res.guest.username}! 🎉`;
    toast.success(msg);
    navigate('/student/competitions');
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (username.trim().length < 2) {
      toast.error('Username must be at least 2 characters.');
      return;
    }
    // 'taken' means a DIFFERENT active guest owns it (not resumable)
    if (checkStatus === 'taken') {
      toast.error('That username is taken by another guest. Choose another.');
      return;
    }

    setJoining(true);
    try {
      const res = await apiClient.post('/guest/join', { username: username.trim() });
      if (res.success) {
        applyGuestSession(res);
      } else {
        toast.error(res.error || 'Could not start guest session.');
      }
    } catch {
      toast.error('Failed to join as guest. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  // Resume the previous session from localStorage directly
  const handleResumePrevious = async () => {
    if (!prevSession?.username) return;
    setJoining(true);
    try {
      const res = await apiClient.post('/guest/join', { username: prevSession.username });
      if (res.success) {
        applyGuestSession(res);
      } else {
        // Session was deleted by admin — clear stale data
        localStorage.removeItem('guest_user');
        setPrevSession(null);
        toast.error('Previous session no longer exists. Please choose a new username.');
      }
    } catch {
      toast.error('Failed to resume session. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  // ── Status icon / helper text ─────────────────────────────────────
  const StatusIcon = () => {
    if (checkStatus === 'checking') return <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />;
    if (checkStatus === 'available') return <CheckCircle className="w-5 h-5 text-emerald-400" />;
    if (checkStatus === 'resumable') return <RotateCcw className="w-5 h-5 text-amber-400" />;
    if (checkStatus === 'taken') return <XCircle className="w-5 h-5 text-red-400" />;
    return null;
  };

  const isSubmitDisabled = joining || checkStatus === 'taken' || username.trim().length < 2;
  const isResume = checkStatus === 'resumable';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex items-center justify-center p-4">
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative w-full max-w-md">
        <button
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-all mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </button>

        {/* ── Previous session recovery banner ── */}
        {prevSession?.username && (
          <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <History className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-200 truncate">
                Previous session: <strong>{prevSession.username}</strong>
              </p>
            </div>
            <button
              onClick={handleResumePrevious}
              disabled={joining}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 rounded-lg text-xs font-semibold transition disabled:opacity-50"
            >
              {joining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              Resume
            </button>
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 mb-4">
              <Ghost className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Continue as Guest</h1>
            <p className="text-slate-400 text-sm">
              Pick a username — it will appear on the leaderboard and everywhere on the platform.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label htmlFor="guest-username" className="block text-sm font-medium text-slate-300 mb-2">
                {isResume ? 'Resume your session' : 'Choose your Username'}
              </label>
              <div className="relative">
                <input
                  id="guest-username"
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="e.g. CodeNinja07"
                  maxLength={30}
                  autoComplete="off"
                  className={`w-full px-4 py-3 pr-12 bg-white/10 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    isResume ? 'border-amber-400/50 focus:ring-amber-400' : 'border-white/20 focus:ring-indigo-500'
                  }`}
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <StatusIcon />
                </div>
              </div>

              {/* Inline status messages */}
              {checkStatus === 'available' && (
                <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Username is available!
                </p>
              )}
              {checkStatus === 'resumable' && (
                <p className="mt-2 text-xs text-amber-400 flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> Your previous session found — click below to resume it.
                </p>
              )}
              {checkStatus === 'taken' && (
                <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Username is taken by another guest. Try another.
                </p>
              )}
              <p className="mt-1 text-xs text-slate-500">Letters, numbers, spaces, _ and - allowed. Max 30 chars.</p>
            </div>

            {/* Info box */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 space-y-2 text-xs text-slate-300">
              <p className="font-semibold text-indigo-300 text-sm">As a Guest you can:</p>
              <ul className="space-y-1 ml-2 list-disc list-inside">
                <li>Browse &amp; register for competitions</li>
                <li>Submit solutions &amp; see results</li>
                <li>Appear on the leaderboard by username</li>
              </ul>
              <p className="font-semibold text-red-300 text-sm mt-2">You cannot:</p>
              <ul className="space-y-1 ml-2 list-disc list-inside">
                <li>Access profile / settings pages</li>
                <li>Access the admin panel</li>
              </ul>
            </div>

            {/* Submit */}
            <button
              id="guest-join-btn"
              type="submit"
              disabled={isSubmitDisabled}
              className={`w-full py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
                isResume
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-amber-500/20'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/20'
              }`}
            >
              {joining ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> {isResume ? 'Resuming...' : 'Joining...'}</>
              ) : isResume ? (
                <><RotateCcw className="w-5 h-5" /> Resume Session</>
              ) : (
                <><UserCheck className="w-5 h-5" /> Join as Guest</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GuestLogin;
