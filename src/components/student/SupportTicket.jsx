import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, MessageCircle, Clock, CheckCircle, AlertCircle, Send, RefreshCw, X, Trash2, Bell } from 'lucide-react';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const SupportTicket = () => {
  const { currentUser, userDetails } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'medium'
  });

  useEffect(() => {
    if (currentUser) {
      fetchTickets();
    }
  }, []);

  useEffect(() => {
    if (selectedTicket && tickets.length > 0) {
      const updated = tickets.find(t => t.id === selectedTicket.id);
      if (updated) {
        setSelectedTicket(updated);
      }
    }
  }, [tickets]);

  const fetchTickets = async () => {
    if (!currentUser) return;
    try {
      const response = await studentService.getTickets();
      if (response.success) {
        const ticketsWithResponses = response.data.map(ticket => ({
          ...ticket,
          responses: ticket.responses || (ticket.response ? (() => {
            try { return JSON.parse(ticket.response); } catch (e) { return []; }
          })() : [])
        }));
        setTickets(ticketsWithResponses);
      } else {
        throw new Error(response.error || 'Failed to fetch tickets');
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      if (!loading) {
        toast.error('Failed to load tickets');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
    toast.success('Tickets refreshed');
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await studentService.createTicket({
        subject: formData.subject,
        message: formData.description,
        priority: formData.priority
      });

      if (response.success) {
        toast.success('Support ticket created successfully!');
        setShowCreateModal(false);
        setFormData({ subject: '', description: '', priority: 'medium' });
        fetchTickets();
      } else {
        throw new Error(response.error || 'Failed to create ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return;
    setDeleting(true);
    try {
      const response = await studentService.deleteTicket(ticketToDelete.id);
      if (response.success) {
        toast.success('Ticket deleted successfully');
        setTickets(prev => prev.filter(t => t.id !== ticketToDelete.id));
        setShowDeleteConfirm(false);
        setTicketToDelete(null);
        if (showViewModal && selectedTicket?.id === ticketToDelete.id) {
          setShowViewModal(false);
          setSelectedTicket(null);
        }
      } else {
        throw new Error(response.error || 'Failed to delete ticket');
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast.error('Failed to delete ticket');
    } finally {
      setDeleting(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) {
      toast.error('Please enter a message');
      return;
    }
    setSubmitting(true);
    try {
      const response = await studentService.replyToTicket(selectedTicket.id, replyText.trim());
      if (response.success) {
        toast.success('Reply sent!');
        setReplyText('');
        await fetchTickets();
      } else {
        throw new Error(response.error || 'Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error(error.message || 'Failed to send reply');
    } finally {
      setSubmitting(false);
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
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <Clock className="w-5 h-5" />;
      case 'in-progress': return <AlertCircle className="w-5 h-5" />;
      case 'closed': return <CheckCircle className="w-5 h-5" />;
      default: return <MessageCircle className="w-5 h-5" />;
    }
  };

  // Tickets where admin just enabled replies (replyEnabled but no student reply yet after last admin msg)
  const hasNewReplyEnabled = (ticket) => {
    if (!ticket.replyEnabled || ticket.status === 'closed') return false;
    const responses = ticket.responses || [];
    if (responses.length === 0) return true;
    const last = responses[responses.length - 1];
    return last.from === 'admin';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <nav className="bg-slate-800 shadow-lg border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              to="/student/dashboard"
              className="inline-flex items-center gap-2 text-slate-300 hover:text-indigo-400 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline text-sm">Back to Dashboard</span>
            </Link>
            <h1 className="text-lg sm:text-xl font-bold text-white">Support Tickets</h1>
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-2 sm:px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition disabled:opacity-50"
                title="Refresh tickets"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline text-sm">Refresh</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">New Ticket</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-4 sm:p-6 hover:border-slate-600 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-blue-400">
                  {tickets.filter(t => t.status === 'open').length}
                </p>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">Open Tickets</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-4 sm:p-6 hover:border-slate-600 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-400">
                  {tickets.filter(t => t.status === 'in-progress').length}
                </p>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">In Progress</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-4 sm:p-6 hover:border-slate-600 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-green-400">
                  {tickets.filter(t => t.status === 'closed').length}
                </p>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">Resolved</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Reply-enabled notification banners */}
        {tickets.filter(hasNewReplyEnabled).length > 0 && (
          <div className="mb-6 space-y-2">
            {tickets.filter(hasNewReplyEnabled).map(ticket => (
              <div
                key={ticket.id}
                className="flex items-center gap-3 bg-indigo-900/50 border border-indigo-600 rounded-xl px-4 py-3 cursor-pointer hover:bg-indigo-900/70 transition"
                onClick={() => { setSelectedTicket(ticket); setShowViewModal(true); }}
              >
                <Bell className="w-5 h-5 text-indigo-400 flex-shrink-0 animate-pulse" />
                <p className="text-indigo-200 text-sm">
                  <span className="font-semibold">Admin replied</span> on &quot;{ticket.subject}&quot; — you can now reply to continue the conversation.
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Tickets List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : tickets.length > 0 ? (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-4 sm:p-6 hover:border-slate-600 hover:shadow-xl transition"
              >
                <div
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer"
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setShowViewModal(true);
                  }}
                >
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <h3 className="text-base sm:text-lg font-semibold text-white break-words">{ticket.subject}</h3>
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getStatusColor(ticket.status)}`}>
                        {ticket.status.toUpperCase().replace('-', ' ')}
                      </span>
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority.toUpperCase()}
                      </span>
                      {ticket.replyEnabled && ticket.status !== 'closed' && (
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-indigo-700 text-white whitespace-nowrap">
                          REPLY OPEN
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs sm:text-sm mb-3 line-clamp-2">{ticket.message}</p>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-500">
                      <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                      {ticket.responses && ticket.responses.length > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {ticket.responses.length} replies
                          {hasNewReplyEnabled(ticket) && (
                            <span className="ml-1 w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-0 sm:ml-4 flex-shrink-0">
                    {getStatusIcon(ticket.status)}
                  </div>
                </div>

                {/* Delete button — only for open tickets */}
                {ticket.status === 'open' && (
                  <div className="mt-3 pt-3 border-t border-slate-700 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTicketToDelete(ticket);
                        setShowDeleteConfirm(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 sm:py-20">
            <MessageCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">No Support Tickets</h3>
            <p className="text-slate-400 mb-6 text-sm sm:text-base">You haven&apos;t created any support tickets yet.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
            >
              <Plus className="w-5 h-5" />
              Create Your First Ticket
            </button>
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-800 rounded-xl max-w-lg w-full p-4 sm:p-6 my-8 border border-slate-700 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Create Support Ticket</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ subject: '', description: '', priority: 'medium' });
                }}
                className="text-slate-400 hover:text-slate-200 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-600 bg-slate-700 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="Brief description of your issue"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2 border border-slate-600 bg-slate-700 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
                  placeholder="Provide detailed information about your issue..."
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-600 bg-slate-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium text-sm"
                >
                  {submitting ? 'Creating...' : 'Create Ticket'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ subject: '', description: '', priority: 'medium' });
                  }}
                  className="flex-1 bg-slate-700 text-slate-300 py-2 rounded-lg hover:bg-slate-600 transition font-medium text-sm"
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-800 rounded-xl max-w-3xl w-full my-8 border border-slate-700 shadow-xl">
            {/* Modal header */}
            <div className="p-4 sm:p-6 border-b border-slate-700">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-white mb-3 break-words">{selectedTicket.subject}</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status.toUpperCase().replace('-', ' ')}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority.toUpperCase()}
                    </span>
                    {selectedTicket.replyEnabled && selectedTicket.status !== 'closed' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-700 text-white">
                        CONVERSATION OPEN
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => { setShowViewModal(false); setReplyText(''); }}
                  className="text-slate-400 hover:text-slate-200 transition flex-shrink-0"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Conversation thread */}
            <div className="p-4 sm:p-6 max-h-[50vh] overflow-y-auto space-y-4">
              {/* Original message */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-white text-sm">You</span>
                  <span className="text-xs px-2 py-0.5 bg-indigo-800 text-indigo-200 rounded-full">Student</span>
                  <span className="text-xs text-slate-400">
                    {new Date(selectedTicket.createdAt).toLocaleString()}
                  </span>
                </div>
                <pre className="text-slate-300 text-sm whitespace-pre-wrap break-words font-sans">{selectedTicket.message}</pre>
              </div>

              {/* All responses in order */}
              {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                selectedTicket.responses.map((response, index) => (
                  <div
                    key={index}
                    className={`rounded-lg p-4 ${
                      response.from === 'student'
                        ? 'bg-indigo-900/30 border border-indigo-700/40 ml-4'
                        : 'bg-green-900/30 border border-green-700/40 mr-4'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-semibold text-white text-sm">
                        {response.from === 'student' ? 'You' : 'Admin'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        response.from === 'student' ? 'bg-indigo-800 text-indigo-200' : 'bg-green-800 text-green-200'
                      }`}>
                        {response.from === 'student' ? 'Student' : 'Support'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(response.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <pre className="text-slate-300 text-sm whitespace-pre-wrap break-words">{response.message}</pre>
                  </div>
                ))
              )}
            </div>

            {/* Reply section */}
            <div className="p-4 sm:p-6 border-t border-slate-700">
              {selectedTicket.status === 'closed' ? (
                <div className="bg-green-900/30 border-l-4 border-green-500 p-4 rounded-lg">
                  <p className="text-green-300 font-semibold text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    This ticket has been resolved and closed.
                  </p>
                </div>
              ) : selectedTicket.replyEnabled ? (
                <form onSubmit={handleReply} className="space-y-3">
                  <label className="block text-sm font-medium text-slate-300">Your Reply</label>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows="3"
                    className="w-full px-4 py-2 border border-slate-600 bg-slate-700 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
                    placeholder="Type your reply here..."
                    required
                  ></textarea>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 text-sm font-medium"
                    >
                      <Send className="w-4 h-4" />
                      {submitting ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-slate-700/40 rounded-lg p-4 text-center">
                  <p className="text-slate-400 text-sm">
                    Replies are currently disabled. The admin will enable conversation once they review your ticket.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && ticketToDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60]">
          <div className="bg-slate-800 rounded-xl max-w-sm w-full p-6 border border-slate-700 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-900/50 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Ticket?</h3>
            </div>
            <p className="text-slate-400 text-sm mb-6">
              Are you sure you want to delete &quot;<span className="text-slate-200">{ticketToDelete.subject}</span>&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteTicket}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 font-medium text-sm"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); setTicketToDelete(null); }}
                disabled={deleting}
                className="flex-1 bg-slate-700 text-slate-300 py-2 rounded-lg hover:bg-slate-600 transition font-medium text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTicket;
