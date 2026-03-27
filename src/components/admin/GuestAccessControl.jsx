// src/components/admin/GuestAccessControl.jsx
// Shows two sections:
//  1. Route Access Toggles  — admin can enable/disable routes for guests
//  2. Active Sessions       — with a Delete button per guest

import React, { useState, useEffect, useCallback } from 'react';
import { Ghost, Trash2, RefreshCw, ToggleLeft, ToggleRight, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../services/apiClient';

// Default routes shown even if DB is empty
const DEFAULT_ROUTES = [
  { route: '/student/competitions',             label: 'Competitions List',     isEnabled: true  },
  { route: '/student/competition/:id',           label: 'Competition Problems',  isEnabled: true  },
  { route: '/student/competition/:id/results',   label: 'Competition Results',   isEnabled: true  },
  { route: '/student/dashboard',                 label: 'Student Dashboard',     isEnabled: false },
  { route: '/student/profile',                   label: 'Student Profile',       isEnabled: false },
  { route: '/student/notes',                     label: 'Notes Viewer',          isEnabled: false },
  { route: '/student/attendance',                label: 'Attendance View',       isEnabled: false },
  { route: '/student/quiz/list',                 label: 'Quiz List',             isEnabled: false },
  { route: '/student/code-editor',               label: 'Code Editor',           isEnabled: false },
  { route: '/student/support',                   label: 'Support Tickets',       isEnabled: false },
  { route: '/student/certificates',              label: 'Certificates',          isEnabled: false },
];

const GuestAccessControl = () => {
  // ── Routes state ──
  const [routes, setRoutes]     = useState(DEFAULT_ROUTES);
  const [savingRoutes, setSavingRoutes] = useState(false);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  // ── Sessions state ──
  const [sessions, setSessions]   = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [deleting, setDeleting]   = useState(null);

  // ── Load route config ─────────────────────────────────────────────
  const loadRoutes = useCallback(async () => {
    setLoadingRoutes(true);
    try {
      const res = await apiClient.get('/guest/admin/routes');
      if (res.success && res.configs.length > 0) {
        // Merge DB values with defaults (add any missing defaults)
        const dbMap = Object.fromEntries(res.configs.map(r => [r.route, r]));
        setRoutes(DEFAULT_ROUTES.map(d => ({
          ...d,
          ...(dbMap[d.route] ? { isEnabled: dbMap[d.route].isEnabled, label: dbMap[d.route].label } : {})
        })));
      }
    } catch {
      // silently keep defaults
    } finally {
      setLoadingRoutes(false);
    }
  }, []);

  // ── Load sessions ─────────────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res = await apiClient.get('/guest/admin/sessions');
      if (res.success) setSessions(res.sessions || []);
    } catch {
      toast.error('Failed to load guest sessions.');
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    loadRoutes();
    loadSessions();
  }, [loadRoutes, loadSessions]);

  // ── Toggle a route ────────────────────────────────────────────────
  const toggleRoute = (route) => {
    setRoutes(prev => prev.map(r => r.route === route ? { ...r, isEnabled: !r.isEnabled } : r));
  };

  // ── Save route config ─────────────────────────────────────────────
  const saveRoutes = async () => {
    setSavingRoutes(true);
    try {
      const res = await apiClient.put('/guest/admin/routes', { routes });
      if (res.success) {
        toast.success('Guest access settings saved!');
        // Clear frontend cache so ProtectedRoute picks up changes immediately
        sessionStorage.removeItem('guest_allowed_routes');
      } else {
        toast.error(res.error || 'Failed to save settings.');
      }
    } catch {
      toast.error('Failed to save settings.');
    } finally {
      setSavingRoutes(false);
    }
  };

  // ── Delete session ────────────────────────────────────────────────
  const handleDelete = async (id, username) => {
    if (!window.confirm(`Permanently remove guest "${username}"?`)) return;
    setDeleting(id);
    try {
      const res = await apiClient.post('/guest/admin/delete-session', { sessionId: id });
      if (res.success) {
        toast.success(`Guest "${username}" removed.`);
        setSessions(prev => prev.filter(s => s.id !== id));
      } else {
        toast.error(res.error || 'Failed to delete.');
      }
    } catch {
      toast.error('Failed to delete session.');
    } finally {
      setDeleting(null);
    }
  };

  const enabledCount = routes.filter(r => r.isEnabled).length;

  return (
    <div className="space-y-6">

      {/* ── SECTION 1: Route Access Toggles ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <ToggleRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Guest Route Access</h2>
              <p className="text-indigo-100 text-xs">{enabledCount} of {routes.length} routes enabled for guests</p>
            </div>
          </div>
          <button
            onClick={saveRoutes}
            disabled={savingRoutes}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition disabled:opacity-60"
          >
            {savingRoutes ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>

        <div className="p-4">
          {loadingRoutes ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading…
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {routes.map(r => (
                <button
                  key={r.route}
                  onClick={() => toggleRoute(r.route)}
                  className={`flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all ${
                    r.isEnabled
                      ? 'border-indigo-300 bg-indigo-50 hover:bg-indigo-100'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold truncate ${r.isEnabled ? 'text-indigo-700' : 'text-gray-600'}`}>
                      {r.label}
                    </p>
                    <p className="text-xs text-gray-400 truncate font-mono">{r.route}</p>
                  </div>
                  {r.isEnabled
                    ? <ToggleRight className="w-7 h-7 text-indigo-500 flex-shrink-0 ml-2" />
                    : <ToggleLeft className="w-7 h-7 text-gray-400 flex-shrink-0 ml-2" />
                  }
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION 2: Active Guest Sessions ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Ghost className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Active Guest Sessions</h2>
              <p className="text-slate-300 text-xs">{sessions.length} active guest{sessions.length !== 1 ? 's' : ''} right now</p>
            </div>
          </div>
          <button
            onClick={loadSessions}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingSessions ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          {loadingSessions ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading…
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Ghost className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No active guest sessions.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <th className="px-6 py-3 text-left font-semibold">Username</th>
                  <th className="px-6 py-3 text-left font-semibold">Created</th>
                  <th className="px-6 py-3 text-left font-semibold">Expires</th>
                  <th className="px-6 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3 font-medium text-gray-800">
                      <div className="flex items-center gap-2">
                        <Ghost className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        {s.username}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs">{new Date(s.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-3 text-gray-500 text-xs">{new Date(s.expiresAt).toLocaleString()}</td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => handleDelete(s.id, s.username)}
                        disabled={deleting === s.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition disabled:opacity-40"
                      >
                        {deleting === s.id
                          ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />}
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};

export default GuestAccessControl;
