import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, Clock, Copy, Eye, Globe, Loader2, RefreshCw, ToggleLeft, ToggleRight, UserPlus, Users, XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { recruitmentService } from '../../services/recruitmentService';

const ROLE_COLORS = {
  'DSA Trainer': 'emerald',
  'Content Team': 'pink',
  'Cinematography Team': 'violet',
  'Design Team': 'indigo',
  'Technical Team': 'cyan',
};

const COLOR_CLASSES = {
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-500' },
  pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', badge: 'bg-pink-500' },
  violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', badge: 'bg-violet-500' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-500' },
  cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', badge: 'bg-cyan-500' },
};

export default function RecruitmentConfigManager() {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState([]);
  const [stats, setStats] = useState({ openRoles: 0, totalRoles: 0, totalSubmissions: 0 });
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  const [bulkToggling, setBulkToggling] = useState(false);
  const [copied, setCopied] = useState(false);

  const formUrl = `${window.location.origin}/recruit`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [configRes, statsRes] = await Promise.all([
        recruitmentService.getAllConfigs(),
        recruitmentService.getAdminStats(),
      ]);
      if (configRes.success) setConfigs(configRes.configs || []);
      else toast.error(configRes.error || 'Failed to fetch configs');
      if (statsRes.success) setStats(statsRes.stats);
    } catch (err) {
      toast.error(err.message || 'Failed to load recruitment data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggle = async (role, currentOpen) => {
    setToggling(role);
    try {
      const res = await recruitmentService.updateConfig(role, { isOpen: !currentOpen });
      if (res.success) {
        setConfigs((prev) => prev.map((c) => (c.role === role ? { ...c, ...res.config } : c)));
        setStats((prev) => ({
          ...prev,
          openRoles: prev.openRoles + (currentOpen ? -1 : 1),
        }));
        toast.success(`${!currentOpen ? 'Opened' : 'Closed'} ${role}`);
      } else {
        toast.error(res.error || 'Failed to update');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to toggle role');
    } finally {
      setToggling(null);
    }
  };

  const handleBatchToggle = async (open) => {
    setBulkToggling(true);
    try {
      const res = await recruitmentService.batchUpdateConfigs(open);
      if (res.success) {
        setConfigs((prev) => prev.map((c) => ({ ...c, isOpen: open })));
        setStats((prev) => ({ ...prev, openRoles: open ? prev.totalRoles : 0 }));
        toast.success(open ? 'All roles opened' : 'All roles closed');
      } else {
        toast.error(res.error || 'Failed to update');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to batch update');
    } finally {
      setBulkToggling(false);
    }
  };

  const handleExpiryChange = async (role, value) => {
    try {
      // Convert local datetime string to proper UTC ISO string so the server
      // interprets it as the intended IST time instead of offsetting by +5:30.
      const expiresAt = value ? new Date(value).toISOString() : null;
      const res = await recruitmentService.updateConfig(role, { expiresAt });
      if (res.success) {
        setConfigs((prev) => prev.map((c) => (c.role === role ? { ...c, ...res.config } : c)));
        toast.success(value ? 'Expiry date set' : 'Expiry cleared');
      } else {
        toast.error(res.error || 'Failed to update expiry');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to set expiry');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(formUrl);
    setCopied(true);
    toast.success('Form link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const toDatetimeLocal = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-2">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Recruitment Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage roles, share the form, and review applications.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin/recruitment/submissions')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium text-sm"
              >
                <Eye className="w-4 h-4" /> View Submissions
              </button>
              <button
                onClick={fetchData}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* ── Stats + Share Row ── */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Stats card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Globe className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.openRoles}<span className="text-gray-400 text-lg font-normal">/{stats.totalRoles}</span></p>
                <p className="text-sm text-gray-500">Roles Open</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
                <p className="text-sm text-gray-500">Total Submissions</p>
              </div>
            </div>

            {/* Share form card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 lg:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <Copy className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-700">Share Form</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formUrl}
                  readOnly
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm bg-gray-50 text-gray-600 focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="flex-shrink-0 px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-medium transition"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Batch Actions ── */}
        {!loading && configs.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ToggleRight className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Batch Actions</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBatchToggle(true)}
                disabled={bulkToggling}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm font-medium transition disabled:opacity-50"
              >
                {bulkToggling ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Open All
              </button>
              <button
                onClick={() => handleBatchToggle(false)}
                disabled={bulkToggling}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 text-sm font-medium transition disabled:opacity-50"
              >
                {bulkToggling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Close All
              </button>
            </div>
          </div>
        )}

        {/* ── Role Cards ── */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
            <p className="text-gray-500">Loading configurations...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {configs.map((cfg) => {
              const color = ROLE_COLORS[cfg.role] || 'gray';
              const cc = COLOR_CLASSES[color] || COLOR_CLASSES.emerald;
              const now = new Date();
              const isExpired = cfg.expiresAt && new Date(cfg.expiresAt) < now;
              const statusLabel = cfg.isOpen ? (isExpired ? 'Expired' : 'Open') : 'Closed';
              const statusColor = cfg.isOpen ? (isExpired ? 'text-amber-600 bg-amber-50' : 'text-green-700 bg-green-50') : 'text-red-700 bg-red-50';

              return (
                <div key={cfg.role} className={`bg-white rounded-xl border ${cc.border} shadow-sm overflow-hidden`}>
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      {/* Left: Role info */}
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${cc.bg} flex items-center justify-center flex-shrink-0`}>
                          <UserPlus className={`w-6 h-6 ${cc.text}`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{cfg.role}</h3>
                          <span className={`inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>
                            {cfg.isOpen ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {statusLabel}
                          </span>
                        </div>
                      </div>

                      {/* Right: Controls */}
                      <div className="flex items-center gap-4 flex-wrap">
                        {/* Expiry picker */}
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <input
                            type="datetime-local"
                            value={toDatetimeLocal(cfg.expiresAt)}
                            onChange={(e) => handleExpiryChange(cfg.role, e.target.value || null)}
                            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={!cfg.isOpen}
                          />
                          {cfg.expiresAt && (
                            <button
                              onClick={() => handleExpiryChange(cfg.role, '')}
                              className="text-xs text-red-500 hover:text-red-700 font-medium"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        {/* Toggle */}
                        <button
                          onClick={() => handleToggle(cfg.role, cfg.isOpen)}
                          disabled={toggling === cfg.role}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition ${
                            cfg.isOpen
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          } disabled:opacity-50`}
                        >
                          {toggling === cfg.role ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : cfg.isOpen ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                          {cfg.isOpen ? 'Open' : 'Closed'}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 mt-3">
                      Last updated: {new Date(cfg.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
