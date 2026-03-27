// src/context/GuestContext.jsx
// NEW: Separate context for guest session state.
// Does NOT modify or import AuthContext.

import { createContext, useContext, useState } from 'react';
import { apiClient } from '../services/apiClient';

const GuestContext = createContext();

export const useGuest = () => {
  const ctx = useContext(GuestContext);
  if (!ctx) throw new Error('useGuest must be used within GuestProvider');
  return ctx;
};

// Helper: read guest user synchronously — runs once at init time
function readGuestFromStorage() {
  try {
    const stored = localStorage.getItem('guest_user');
    const token  = localStorage.getItem('token');
    if (stored && token) {
      const parsed = JSON.parse(stored);
      if (parsed?.role === 'guest') return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export const GuestProvider = ({ children }) => {
  // Lazy initializer runs synchronously on first render — no race condition
  const [guestUser, setGuestUser] = useState(() => readGuestFromStorage());

  const logoutGuest = async () => {
    try {
      await apiClient.post('/guest/logout');
    } catch {
      // best effort
    }
    apiClient.removeToken();
    localStorage.removeItem('guest_user');
    setGuestUser(null);
  };

  const value = {
    guestUser,
    setGuestUser,
    isGuest: !!guestUser,
    logoutGuest
  };

  return <GuestContext.Provider value={value}>{children}</GuestContext.Provider>;
};

export default GuestContext;
