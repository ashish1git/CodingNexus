import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, MessageCircle, Clock, CheckCircle, AlertCircle, Send, RefreshCw, X } from 'lucide-react';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const SupportTicket = () => {
  const { currentUser, userDetails } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'medium'
  });

  useEffect(() => {
    if (currentUser) {
      fetchTickets();
      const interval = setInterval(() => {
        fetchTickets();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const fetchTickets = async () => {
    if (!currentUser) return;
    try {
      const response = await studentService.getTickets();
      if (response.success) {
        setTickets(response.data);
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
        description: formData.description,
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

  const handleAddReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const response = await studentService.addTicketReply(selectedTicket.id, replyText);
      
      if (response.success) {
        toast.success('Reply added successfully!');
        setReplyText('');
        fetchTickets();
        
        // Update selected ticket locally
        const updatedTicket = tickets.find(t => t.id === selectedTicket.id);
        if (updatedTicket) {
          setSelectedTicket({
            ...updatedTicket,
            responses: [
              ...(updatedTicket.responses || []),
              {
                from: 'student',
                name: userDetails.name,
                message: replyText,
                timestamp: new Date()
              }
            ]
          });
        }
      } else {
        throw new Error(response.error || 'Failed to add reply');
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Failed to add reply');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': 
        return 'bg-blue-600 text-white';
      case 'in-progress':
        return 'bg-yellow-600 text-white';
      case 'closed':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-600 text-white';
      case 'medium': 
        return 'bg-orange-600 text-white';
      case 'low':
        return 'bg-green-600 text-white';
      default: 
        return 'bg-gray-600 text-white';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <Clock className="w-5 h-5" />;
      case 'in-progress': 
        return <AlertCircle className="w-5 h-5" />;
      case 'closed':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <MessageCircle className="w-5 h-5" />;
    }
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
                onClick={() => {
                  setSelectedTicket(ticket);
                  setShowViewModal(true);
                }}
                className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-4 sm:p-6 hover:border-slate-600 hover:shadow-xl transition cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <h3 className="text-base sm:text-lg font-semibold text-white break-words">{ticket.subject}</h3>
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getStatusColor(ticket.status)}`}>
                        {ticket.status.toUpperCase().replace('-', ' ')}
                      </span>
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs sm:text-sm mb-3 line-clamp-2">{ticket.description}</p>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-500">
                      <span>Created: {ticket.createdAt?.toLocaleDateString()}</span>
                      {ticket.responses && ticket.responses.length > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {ticket.responses.length} replies
                          {ticket.responses[ticket.responses.length - 1]?.from === 'admin' && (
                            <span className="ml-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-0 sm:ml-4 flex-shrink-0">
                    {getStatusIcon(ticket.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 sm:py-20">
            <MessageCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">No Support Tickets</h3>
            <p className="text-slate-400 mb-6 text-sm sm:text-base">You haven't created any support tickets yet.</p>
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
                  className="w-full px-4 py-2 border border-slate-600 bg-slate-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
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
                  className="w-full px-4 py-2 border border-slate-600 bg-slate-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
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
                  </div>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-slate-400 hover:text-slate-200 transition flex-shrink-0"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 max-h-96 overflow-y-auto">
              {/* Original Message */}
              <div className="mb-6">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-white">You</span>
                    <span className="text-xs text-slate-400">
                      {selectedTicket.createdAt?.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm">{selectedTicket.description}</p>
                </div>
              </div>

              {/* Responses */}
              {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                <div className="space-y-4 mb-6">
                  {selectedTicket.responses.map((response, index) => (
                    <div
                      key={index}
                      className={`rounded-lg p-4 ${
                        response.from === 'student'
                          ? 'bg-indigo-900/30 border border-indigo-700/30'
                          : 'bg-green-900/30 border border-green-700/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-semibold text-white text-sm">
                          {response.from === 'student' ? response.name : 'Admin'}
                        </span>
                        <span className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded-full">
                          {response.from === 'student' ? 'You' : 'Admin'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {response.timestamp?.toDate?.()?.toLocaleString() || 'Just now'}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm">{response.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Form */}
              {selectedTicket.status !== 'closed' && (
                <form onSubmit={handleAddReply} className="mt-6 pt-6 border-t border-slate-700">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Add Reply</label>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows="3"
                    className="w-full px-4 py-2 border border-slate-600 bg-slate-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
                    placeholder="Type your message..."
                    required
                  ></textarea>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-3 flex items-center gap-2 px-4 sm:px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 text-sm font-medium"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Sending...' : 'Send Reply'}
                  </button>
                </form>
              )}

              {selectedTicket.status === 'closed' && (
                <div className="mt-6 bg-green-900/30 border-l-4 border-green-500 p-4 rounded-lg">
                  <p className="text-green-300 font-semibold text-sm">This ticket has been resolved and closed.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTicket;