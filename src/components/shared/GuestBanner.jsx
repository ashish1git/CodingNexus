// src/components/shared/GuestBanner.jsx
// NEW: A sticky top banner shown to guest users platform-wide.
// Tells them who they are and offers quick sign-up.

import React from 'react';
import { Ghost, X, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGuest } from '../../context/GuestContext';

const GuestBanner = () => {
  const { guestUser, isGuest, logoutGuest } = useGuest();

  if (!isGuest || !guestUser) return null;

  return (
    <div className="w-full bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 text-white px-4 py-2 flex items-center justify-between gap-3 flex-wrap shadow-md">
      <div className="flex items-center gap-2 text-sm">
        <Ghost className="w-4 h-4 flex-shrink-0" />
        <span>
          You are browsing as{' '}
          <strong className="font-bold">{guestUser.username}</strong>
          {' '}(Guest)
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/student/competitions"
          className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition"
        >
          🏆 Competitions
        </Link>
        <Link
          to="/signup"
          className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Create Full Account
        </Link>
        <button
          onClick={logoutGuest}
          className="flex items-center gap-1 px-2 py-1 hover:bg-white/20 rounded-lg text-xs transition"
          title="End guest session"
        >
          <X className="w-3.5 h-3.5" />
          Exit
        </button>
      </div>
    </div>
  );
};

export default GuestBanner;
