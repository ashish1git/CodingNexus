import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import {
  MessageCircle, Plus, Clock, CheckCircle, AlertCircle,
  Send, RefreshCw, X, ArrowLeft, Loader, Trash2, User, Hash, Layers, Award
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminTicketSupport = () => {
  const { userDetails } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'medium'
  });

  const fetchTickets = useCallback(async () => {
    try {
      const res = await adminService.getAdminSupportTickets();
      if (res.success) {
        setTickets(res.tickets || []);
      }
    } catch (err) {
      console.error('Fetch admin tickets error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await adminService.createAdminSupportTicket(
      formData.subject,
      formData.description,
      formData.priority
    );
    if (res.success) {
      setShowCreateModal(false);
      setFormData({ subject: '', description: '', priority: 'medium' });
      setLoading(true);
      await fetchTickets();
    }
    setSubmitting(false);
  };

  const canDelete = userDetails?.role === 'superadmin';

  const handleDeleteTicket = async (ticketId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to permanently delete this ticket? This action cannot be undone.')) return;
    const res = await adminService.deleteAdminSupportTicket(ticketId);
    if (res.success) {
      setTickets(prev => prev.filter(t => t.id !== ticketId));
      if (selectedTicket?.id === ticketId) {
        setShowViewModal(false);
        setSelectedTicket(null);
      }
    }
    setLoading(true);
    await fetchTickets();
  };

  const canReply = userDetails?.role === 'superadmin' || userDetails?.role === 'admin';

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    setReplySubmitting(true);
    const res = await adminService.replyToAdminSupportTicket(selectedTicket.id, replyText.trim());
    if (res.success) {
      setReplyText('');
      setSelectedTicket(res.ticket || { ...selectedTicket, responses: [...(selectedTicket.responses || []), { from: 'admin', name: userDetails?.name || 'Admin', timestamp: new Date().toISOString(), message: replyText.trim() }] });
      setLoading(true);
      await fetchTickets();
    }
    setReplySubmitting(false);
  };

  const handleStatusChange = async (status) => {
    if (!selectedTicket) return;
    const res = await adminService.updateAdminSupportTicketStatus(selectedTicket.id, status);
    if (res.success) {
      setSelectedTicket({ ...selectedTicket, status });
      setLoading(true);
      await fetchTickets();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-600 text-white';
      case 'in-progress': return 'bg-yellow-600 text-white';
      case 'closed': return 'bg-green-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-600 text-white';
      case 'medium': return 'bg-orange-600 text-white';
      case 'low': return 'bg-green-600 text-white';
      case 'normal': return 'bg-gray-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'in-progress': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'closed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <MessageCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getRoleBadge = (role) => {
    const config = {
      superadmin: 'bg-purple-100 text-purple-700',
      admin: 'bg-green-100 text-green-700',
      subadmin: 'bg-blue-100 text-blue-700'
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${config[role] || 'bg-gray-100 text-gray-700'}`}>
        {role === 'superadmin' ? 'Super Admin' : role === 'subadmin' ? 'Sub Admin' : 'Admin'}
      </span>
    );
  };

  const openTicket = (ticket) => {
    setSelectedTicket(ticket);
    setShowViewModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-7 h-7 text-indigo-600" />
              <span className="text-xl font-bold text-gray-800">Subadmin Support</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Ticket</span>
              </button>
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition ml-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-blue-600">
                  {tickets.filter(t => t.status === 'open').length}
                </p>
                <p className="text-sm text-gray-500 mt-1">Open</p>
              </div>
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-yellow-600">
                  {tickets.filter(t => t.status === 'in-progress').length}
                </p>
                <p className="text-sm text-gray-500 mt-1">In Progress</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-green-600">
                  {tickets.filter(t => t.status === 'closed').length}
                </p>
                <p className="text-sm text-gray-500 mt-1">Resolved</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>

        {/* Ticket List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No support tickets</p>
            <p className="text-gray-400 text-sm mt-1">Click "New Ticket" to create one</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-indigo-300 hover:shadow cursor-pointer transition"
                onClick={() => openTicket(ticket)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-base font-semibold text-gray-800">{ticket.subject}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(ticket.status)}`}>
                        {ticket.status.toUpperCase().replace('-', ' ')}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ticket.message}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[10px] ${
                          ticket.senderRole === 'superadmin' ? 'bg-purple-600' : ticket.senderRole === 'subadmin' ? 'bg-blue-600' : 'bg-green-600'
                        }`}>
                          {ticket.senderName?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                        <span className="text-gray-500 font-medium">{ticket.senderName}</span>
                        {getRoleBadge(ticket.senderRole)}
                      </div>
                      <span>•</span>
                      <span>{new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {ticket.responses?.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5" />
                            {ticket.responses.length} replies
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {canDelete && (
                      <button
                        onClick={(e) => handleDeleteTicket(ticket.id, e)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete ticket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {getStatusIcon(ticket.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Create Subadmin Ticket</h2>
              <button
                onClick={() => { setShowCreateModal(false); setFormData({ subject: '', description: '', priority: 'medium' }); }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 text-sm"
                  placeholder="Brief description of your issue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 text-sm resize-none"
                  placeholder="Provide detailed information..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Ticket'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setFormData({ subject: '', description: '', priority: 'medium' }); }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Ticket Modal */}
      {showViewModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-2xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-800 mb-3">{selectedTicket.subject}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status.toUpperCase().replace('-', ' ')}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority.toUpperCase()}
                    </span>
                  </div>
                  {/* Student Info Section */}
                  {selectedTicket.user?.studentProfile && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="font-medium text-gray-800">{selectedTicket.user.studentProfile.name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Hash className="w-3.5 h-3.5 text-purple-500" />
                        <span>Roll: {selectedTicket.user.studentProfile.rollNo || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Award className="w-3.5 h-3.5 text-green-500" />
                        <span>Batch: {selectedTicket.user.studentProfile.batch || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Layers className="w-3.5 h-3.5 text-amber-500" />
                        <span>Div: {selectedTicket.user.studentProfile.division || 'N/A'}</span>
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={() => { setShowViewModal(false); setSelectedTicket(null); }} className="text-gray-400 hover:text-gray-600 transition">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Conversation */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Original message */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[10px] ${
                    selectedTicket.senderRole === 'superadmin' ? 'bg-purple-600' : selectedTicket.senderRole === 'subadmin' ? 'bg-blue-600' : 'bg-green-600'
                  }`}>
                    {selectedTicket.senderName?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                  <span className="font-semibold text-gray-800 text-sm">{selectedTicket.senderName}</span>
                  {getRoleBadge(selectedTicket.senderRole)}
                  <span className="text-xs text-gray-400">
                    {new Date(selectedTicket.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>

              {/* Responses */}
              {selectedTicket.responses?.map((resp, idx) => (
                <div key={idx} className={`rounded-lg p-4 border ${resp.from === 'admin' ? 'bg-indigo-50 border-indigo-200 ml-6' : 'bg-gray-50 border-gray-200 mr-6'}`}>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-semibold text-gray-800 text-sm">
                      {resp.from === 'admin' ? 'Support' : resp.name || 'User'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${resp.from === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'}`}>
                      {resp.from === 'admin' ? 'Admin' : 'Staff'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(resp.timestamp).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{resp.message}</p>
                </div>
              ))}
            </div>

            {/* Reply Section */}
            <div className="p-6 border-t border-gray-200 flex-shrink-0">
              {selectedTicket.status === 'closed' ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-green-700 font-medium flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    This ticket is resolved and closed
                  </p>
                  <button
                    onClick={() => handleStatusChange('open')}
                    className="mt-2 text-xs text-green-600 hover:text-green-700 underline"
                  >
                    Reopen ticket
                  </button>
                </div>
              ) : (
                <>
                  {canReply ? (
                    <form onSubmit={handleReply} className="space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-700">Reply</span>
                        <div className="flex items-center gap-1.5 ml-auto">
                          <button
                            type="button"
                            onClick={() => handleStatusChange('in-progress')}
                            disabled={selectedTicket.status === 'in-progress'}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                              selectedTicket.status === 'in-progress'
                                ? 'bg-yellow-100 text-yellow-700 cursor-not-allowed'
                                : 'bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-700'
                            }`}
                          >
                            Mark In Progress
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange('closed')}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700 transition"
                          >
                            Mark Resolved
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 text-sm resize-none"
                        placeholder="Type your reply..."
                        required
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={replySubmitting || !replyText.trim()}
                          className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm disabled:opacity-50"
                        >
                          {replySubmitting ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          Send Reply
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                      <p className="text-sm text-gray-500">
                        Status: <span className="font-medium text-gray-700">{selectedTicket.status.toUpperCase().replace('-', ' ')}</span>
                        <span className="ml-2 text-gray-400">• Awaiting admin response</span>
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTicketSupport;
