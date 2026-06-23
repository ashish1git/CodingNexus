import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Calendar, ChevronDown, ChevronUp, Download, Eye, EyeOff, Filter, Loader2,
  Mail, Phone, RefreshCw, Search, Settings, Trash2, Users,
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

const BADGE_CLASSES = {
  emerald: 'bg-emerald-100 text-emerald-700',
  pink: 'bg-pink-100 text-pink-700',
  violet: 'bg-violet-100 text-violet-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  cyan: 'bg-cyan-100 text-cyan-700',
};

export default function RecruitmentSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await recruitmentService.getSubmissions(params);
      if (res.success) setSubmissions(res.submissions || []);
      else toast.error(res.error || 'Failed to fetch submissions');
    } catch (err) {
      toast.error(err.message || 'Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, startDate, endDate]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Unique roles from submissions + any filter
  const availableRoles = useMemo(() => {
    const roles = new Set(submissions.map((s) => s.role));
    return [...roles].sort();
  }, [submissions]);

  const filtered = useMemo(() => {
    if (!search.trim()) return submissions;
    const q = search.toLowerCase();
    return submissions.filter(
      (s) =>
        s.fullName?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.moodleId?.toLowerCase().includes(q) ||
        s.whatsappNo?.toLowerCase().includes(q) ||
        s.branch?.toLowerCase().includes(q)
    );
  }, [submissions, search]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await recruitmentService.exportSubmissions(roleFilter);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recruitment-submissions${roleFilter ? '-' + roleFilter.replace(/\s+/g, '-') : ''}-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Excel file downloaded');
    } catch (err) {
      toast.error(err.message || 'Failed to export');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete submission from ${name}? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await recruitmentService.deleteSubmission(id);
      if (res.success) {
        setSubmissions((prev) => prev.filter((s) => s.id !== id));
        toast.success('Submission deleted');
      } else {
        toast.error(res.error || 'Failed to delete');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const renderRoleBadge = (role) => {
    const color = ROLE_COLORS[role] || 'gray';
    const cls = BADGE_CLASSES[color] || 'bg-gray-100 text-gray-700';
    return <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{role}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-2">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Recruitment Submissions</h1>
              <p className="text-gray-600 mt-1">Review all applications received.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.href = '/admin/recruitment'}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium text-sm"
              >
                <Settings className="w-4 h-4" /> Config
              </button>
              <button
                onClick={handleExport}
                disabled={exporting || filtered.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export Excel
              </button>
              <button
                onClick={fetchSubmissions}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, Moodle ID..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Role filter */}
            <div className="relative">
              <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">All Roles</option>
                {availableRoles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Start date */}
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                title="From date"
              />
            </div>

            {/* End date */}
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                title="To date"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              Total: <span className="font-bold text-gray-900">{filtered.length}</span>
            </div>
            {roleFilter && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                Role: {renderRoleBadge(roleFilter)}
              </div>
            )}
          </div>
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
            <p className="text-gray-500">Loading submissions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No submissions found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or wait for applications to come in.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((sub) => {
              const isExpanded = expandedId === sub.id;
              const answers = sub.roleAnswers || {};

              return (
                <div key={sub.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Header */}
                  <div
                    className="p-4 sm:p-5 cursor-pointer hover:bg-gray-50 transition-colors flex items-start justify-between gap-3"
                    onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h3 className="text-base font-bold text-gray-900">{sub.fullName}</h3>
                        {renderRoleBadge(sub.role)}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {sub.email}</span>
                        <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {sub.whatsappNo}</span>
                        <span className="inline-flex items-center gap-1">Moodle: {sub.moodleId}</span>
                        <span>{sub.branch} • {sub.year}</span>
                        <span>{new Date(sub.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 p-1">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-5 bg-gray-50">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Role-Specific Answers</h4>
                      {Object.keys(answers).length > 0 ? (
                        <div className="space-y-3">
                          {Object.entries(answers).map(([qId, answer]) => {
                            const display = Array.isArray(answer) ? answer.join(', ') : String(answer ?? '—');
                            return (
                              <div key={qId} className="bg-white rounded-lg border border-gray-200 p-3">
                                <p className="text-xs text-gray-500 mb-1">{qId}</p>
                                <p className="text-sm font-medium text-gray-800">{display}</p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No role-specific answers</p>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(sub.email);
                            toast.success('Email copied');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-medium transition"
                        >
                          <Mail className="w-3.5 h-3.5" /> Copy Email
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(sub.whatsappNo);
                            toast.success('WhatsApp copied');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-medium transition"
                        >
                          <Phone className="w-3.5 h-3.5" /> Copy WhatsApp
                        </button>
                        <button
                          onClick={() => handleDelete(sub.id, sub.fullName)}
                          disabled={deletingId === sub.id}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-xs font-medium transition disabled:opacity-50"
                        >
                          {deletingId === sub.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
