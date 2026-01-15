// src/components/admin/TicketManagement.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, MessageCircle, Send, Clock, CheckCircle, AlertCircle, 
  Search, Filter, X 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import toast, { Toaster } from 'react-hot-toast';

const TicketManagement = () => {
  const { userDetails } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, statusFilter, priorityFilter]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await adminService.getAllTickets();
      if (response.success && response.tickets) {
        const ticketsList = response.tickets.map(ticket => ({
          ...ticket,
          createdAt: new Date(ticket.createdAt),
          updatedAt: ticket.updatedAt ? new Date(ticket.updatedAt) : null
        }));
        setTickets(ticketsList);
      } else {
        toast.error(response.error || 'Failed to load tickets');
        setTickets([]);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = [...tickets];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.priority === priorityFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.studentRollNo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTickets(filtered);
  };

  const showStatusToast = (newStatus) => {
    const toastConfigs = {
      'open': {
        icon: '🕐',
        title: 'Ticket Reopened',
        message: 'Ticket status changed to Open',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-500',
        textColor: 'text-blue-800'
      },
      'in-progress': {
        icon: '⚠️',
        title: 'Ticket In Progress',
        message: 'Ticket status changed to In Progress',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-500',
        textColor: 'text-yellow-800'
      },
      'closed': {
        icon: '✅',
        title: 'Ticket Resolved',
        message: 'Ticket status changed to Closed',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-500',
        textColor: 'text-green-800'
      }
    };

    const config = toastConfigs[newStatus];
    
    toast.custom((t) => (
      <div
        className={`${config.bgColor} ${config.borderColor} border-l-4 rounded-lg shadow-lg p-4 max-w-md transform transition-all duration-300 ${
          t.visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center">
          <div className="flex-shrink-0 text-xl mr-3">{config.icon}</div>
          <div className="flex-1">
            <p className={`font-semibold ${config.textColor}`}>{config.title}</p>
            <p className="text-sm text-gray-600">{config.message}</p>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    ), {
      duration: 3000,
      position: 'top-right'
    });
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      // Update local state immediately for instant feedback
      const updatedTickets = tickets.map(ticket => {
        if (ticket.id === ticketId) {
          return {
            ...ticket,
            status: newStatus,
            updatedAt: new Date()
          };
        }
        return ticket;
      });
      setTickets(updatedTickets);

      // Update selected ticket if it's the one being changed
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(prev => ({
          ...prev,
          status: newStatus,
          updatedAt: new Date()
        }));
      }

      // Show toast notification
      showStatusToast(newStatus);

      // Update via adminService
      const response = await adminService.updateTicket(ticketId, {
        status: newStatus
      });
      
      if (!response.success) {
        // Revert local state on error
        fetchTickets();
        toast.error(response.error || 'Failed to update status');
      }

    } catch (error) {
      console.error('Error updating status:', error);
      // Revert local state on error
      fetchTickets();
      toast.error('Failed to update status');
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    
    if (!replyText.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    setSubmitting(true);

    try {
      // Send to server
      const response = await adminService.updateTicket(selectedTicket.id, {
        reply: replyText,
        status: selectedTicket.status === 'open' ? 'in-progress' : selectedTicket.status
      });
      
      if (!response.success) {
        toast.error(response.error || 'Failed to send reply');
        return;
      }

      toast.success('Reply sent successfully!');

      // Clear reply text
      setReplyText('');

      // Refresh tickets to get updated data from database
      const ticketsResponse = await adminService.getAllTickets();
      if (ticketsResponse.success && ticketsResponse.tickets) {
        const ticketsList = ticketsResponse.tickets.map(ticket => ({
          ...ticket,
          createdAt: new Date(ticket.createdAt),
          updatedAt: ticket.updatedAt ? new Date(ticket.updatedAt) : null
        }));
        setTickets(ticketsList);
        
        // Update selected ticket with fresh data
        const updated = ticketsList.find(t => t.id === selectedTicket.id);
        if (updated) {
          setSelectedTicket(updated);
        }
      }

    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  const openTicketModal = (ticket) => {
    setSelectedTicket(ticket);
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'closed':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-orange-100 text-orange-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
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
    <div className="min-h-screen bg-gray-50">
      {/* Add Toaster component at the root */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            maxWidth: '500px',
          },
        }}
      />

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Support Tickets</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {tickets.filter(t => t.status === 'open').length}
                </p>
                <p className="text-sm text-gray-600">Open Tickets</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {tickets.filter(t => t.status === 'in-progress').length}
                </p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {tickets.filter(t => t.status === 'closed').length}
                </p>
                <p className="text-sm text-gray-600">Resolved</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {tickets.filter(t => t.priority === 'high' && t.status !== 'closed').length}
                </p>
                <p className="text-sm text-gray-600">High Priority</p>
              </div>
              <MessageCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by subject, student name, or roll no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredTickets.length > 0 ? (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => openTicketModal(ticket)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(ticket.status)}
                      <h3 className="text-lg font-semibold text-gray-800">{ticket.subject}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority} priority
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{ticket.message}</p>

                    <div className="flex items-center gap-6 text-xs text-gray-500">
                      <span className="font-medium">{ticket.studentName}</span>
                      <span>Roll: {ticket.studentRollNo}</span>
                      <span>Created: {ticket.createdAt?.toLocaleDateString()}</span>
                      {ticket.responses && ticket.responses.length > 0 && (
                        <span className="flex items-center gap-1 text-indigo-600">
                          <MessageCircle className="w-4 h-4" />
                          {ticket.responses.length} replies
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Tickets Found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No support tickets yet'}
            </p>
          </div>
        )}
      </div>

      {/* Ticket Detail Modal - Fixed layout */}
      {showModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header - Fixed with sticky positioning */}
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200 z-10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedTicket.subject}</h2>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority} priority
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    From: <span className="font-medium">{selectedTicket.studentName}</span> ({selectedTicket.studentRollNo})
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition ml-4 flex-shrink-0"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Status Change - Moved down and properly spaced */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Change Status:</label>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent flex-1"
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Conversation */}
            <div className="p-6">
              {/* Original Message */}
              <div className="mb-6">
                <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-800">{selectedTicket.studentName}</span>
                    <span className="text-xs text-gray-500">
                      {selectedTicket.createdAt?.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>
              </div>

              {/* Responses */}
              {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                <div className="space-y-4">
                  {selectedTicket.responses.map((response, index) => (
                    <div key={index} className={`rounded-lg p-4 border-l-4 ${
                      response.from === 'student' 
                        ? 'bg-indigo-50 border-indigo-500' 
                        : 'bg-green-50 border-green-500'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-800">{response.name}</span>
                        <span className="text-xs px-2 py-1 bg-white rounded-full font-medium">
                          {response.from === 'student' ? 'Student' : 'Admin'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(response.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{response.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reply Form */}
            {selectedTicket.status !== 'closed' && (
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <form onSubmit={handleReply}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Reply</label>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Type your response here..."
                    required
                  ></textarea>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      {submitting ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {selectedTicket.status === 'closed' && (
              <div className="p-6 border-t border-gray-200 bg-green-50">
                <p className="text-green-800 font-semibold flex items-center gap-2 justify-center">
                  <CheckCircle className="w-5 h-5" />
                  This ticket has been resolved and closed.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketManagement;