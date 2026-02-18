import React, { useState, useEffect } from 'react';
import { 
  Mail, Send, Users, Filter, Eye, X, 
  CheckCircle, AlertCircle, Loader, FileText, Upload, 
  Search, Calendar, MapPin, Clock, UserCheck 
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import toast from 'react-hot-toast';

const BulkEmailManager = () => {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [filterType, setFilterType] = useState('event'); // all, batch, event - default to event
  const [filterValue, setFilterValue] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('all'); // all, quiz_taken, quiz_not_taken
  const [events, setEvents] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [filteredRecipients, setFilteredRecipients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [sendResult, setSendResult] = useState(null);
  const [eventInfo, setEventInfo] = useState(null);
  
  // Email content
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [useCustomHTML, setUseCustomHTML] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');

  // Batch options
  const batchOptions = ['Basic', 'Python', 'Web', 'Advanced', 'Full Stack', 'Data Science'];

  // Load events for filtering
  useEffect(() => {
    if (filterType === 'event') {
      fetchEvents();
    }
  }, [filterType]);

  // Filter recipients based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRecipients(recipients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = recipients.filter(r => 
        r.email.toLowerCase().includes(query) ||
        r.name.toLowerCase().includes(query) ||
        (r.phone && r.phone.toLowerCase().includes(query))
      );
      setFilteredRecipients(filtered);
    }
  }, [searchQuery, recipients]);

  // Auto-refresh when attendance status changes (if recipients already loaded)
  useEffect(() => {
    if (filterType === 'event' && filterValue && recipients.length > 0 && eventInfo?.hasQuiz) {
      fetchRecipients();
    }
  }, [attendanceStatus]);

  const fetchEvents = async () => {
    try {
      const data = await apiClient.get('/admin/email/events');
      if (data.success) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const getEventStatusBadge = (status) => {
    const badges = {
      upcoming: { color: 'bg-blue-100 text-blue-700', icon: '📅', label: 'Upcoming' },
      ongoing: { color: 'bg-green-100 text-green-700', icon: '🟢', label: 'Ongoing' },
      completed: { color: 'bg-gray-100 text-gray-700', icon: '✓', label: 'Completed' },
      scheduled: { color: 'bg-purple-100 text-purple-700', icon: '📋', label: 'Scheduled' }
    };
    const badge = badges[status] || badges.scheduled;
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${badge.color} font-medium`}>
        {badge.icon} {badge.label}
      </span>
    );
  };

  const fetchRecipients = async () => {
    setLoading(true);
    setSearchQuery(''); // Reset search when fetching new recipients
    try {
      const data = await apiClient.post('/admin/email/recipients', {
        filterType: filterType === 'all' ? undefined : filterType,
        filterValue: filterType === 'all' ? undefined : filterValue,
        attendanceStatus: filterType === 'event' ? attendanceStatus : undefined,
        searchQuery: searchQuery
      });

      if (data.success) {
        setRecipients(data.recipients);
        setFilteredRecipients(data.recipients);
        setSelectedRecipients(data.recipients.map(r => r.id));
        setEventInfo(data.eventInfo || null);
        toast.success(`Found ${data.count} recipients`);
        
        // Auto-populate subject for event-based emails
        if (data.eventInfo && !subject) {
          setSubject(`${data.eventInfo.title} - Important Update`);
        }
      }
    } catch (error) {
      console.error('Error fetching recipients:', error);
      toast.error('Failed to fetch recipients');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!subject.trim()) {
      toast.error('Please enter email subject');
      return;
    }

    if (!message.trim() && !htmlContent.trim()) {
      toast.error('Please enter email message');
      return;
    }

    if (selectedRecipients.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }

    const confirmed = window.confirm(
      `Send email to ${selectedRecipients.length} recipient(s)?\n\nSubject: "${subject}"\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setSending(true);
    setSendResult(null);

    try {
      const data = await apiClient.post('/admin/email/send-bulk', {
        subject,
        message,
        htmlContent: useCustomHTML ? htmlContent : undefined,
        recipientIds: selectedRecipients,
        filterType: filterType,
        recipientType: filterType === 'event' ? 'eventParticipant' : 'student'
      });

      if (data.success) {
        setSendResult(data.stats);
        toast.success(`Email sent successfully to ${data.stats.sent}/${data.stats.total} recipients`);
        
        // Reset form after successful send
        if (data.stats.failed === 0) {
          setSubject('');
          setMessage('');
          setHtmlContent('');
          setRecipients([]);
          setSelectedRecipients([]);
        }
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const toggleRecipient = (recipientId) => {
    setSelectedRecipients(prev => 
      prev.includes(recipientId)
        ? prev.filter(id => id !== recipientId)
        : [...prev, recipientId]
    );
  };

  const toggleAllRecipients = () => {
    if (selectedRecipients.length === recipients.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(recipients.map(r => r.id));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Bulk Email System
                </h1>
                <p className="text-gray-600 text-sm">
                  Send custom emails to event participants
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Filters & Recipients */}
          <div className="lg:col-span-1 space-y-6">
            {/* Filter Options */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-bold text-gray-800">Recipients Filter</h2>
              </div>

              <div className="space-y-4">
                {/* Filter Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter By
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => {
                      setFilterType(e.target.value);
                      setFilterValue('');
                      setAttendanceStatus('all');
                      setRecipients([]);
                      setFilteredRecipients([]);
                      setSelectedRecipients([]);
                      setEventInfo(null);
                      setSearchQuery('');
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="event">📅 By Event Registration (Recommended)</option>
                    <option value="batch">🎓 By Batch</option>
                    <option value="all">👥 All Active Students</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {filterType === 'event' && '✨ Perfect for event-related communications'}
                    {filterType === 'batch' && '📚 Target specific learning groups'}
                    {filterType === 'all' && '📢 System-wide announcements'}
                  </p>
                </div>

                {/* Batch Selection */}
                {filterType === 'batch' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Batch
                    </label>
                    <select
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">-- Select Batch --</option>
                      {batchOptions.map(batch => (
                        <option key={batch} value={batch}>{batch}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Event Selection */}
                {filterType === 'event' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Event
                    </label>
                    <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-2">
                      {events.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No events available</p>
                      ) : (
                        events.map(event => {
                          const isSelected = filterValue === event.id;
                          return (
                            <div
                              key={event.id}
                              onClick={() => setFilterValue(event.id)}
                              className={`p-3 rounded-lg cursor-pointer transition-all ${
                                isSelected 
                                  ? 'bg-purple-50 border-2 border-purple-500' 
                                  : 'bg-white border border-gray-200 hover:border-purple-300'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className={`font-medium truncate ${isSelected ? 'text-purple-900' : 'text-gray-800'}`}>
                                    {event.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                                    <Calendar className="w-3 h-3" />
                                    <span>{new Date(event.date).toLocaleDateString('en-IN')}</span>
                                    <span className="text-gray-400">|</span>
                                    <span>{event.type}</span>
                                  </div>
                                  {event.venue && (
                                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                      <MapPin className="w-3 h-3" />
                                      <span className="truncate">{event.venue}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  {getEventStatusBadge(event.status)}
                                  <span className="text-xs font-medium text-purple-600">
                                    {event.registrations} registered
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Attendance Status Filter (only for events with quiz) */}
                {filterType === 'event' && filterValue && eventInfo?.hasQuiz && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Filter by Attendance (Quiz-based)
                    </label>
                    <div className="space-y-2 bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <label className="flex items-center gap-3 cursor-pointer hover:bg-purple-100 p-2 rounded-lg transition-colors">
                        <input
                          type="radio"
                          name="attendanceStatus"
                          value="all"
                          checked={attendanceStatus === 'all'}
                          onChange={(e) => setAttendanceStatus(e.target.value)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">All Registered</p>
                          <p className="text-xs text-gray-600">Everyone who signed up ({eventInfo?.totalRegistered || 0})</p>
                        </div>
                      </label>
                      
                      <label className="flex items-center gap-3 cursor-pointer hover:bg-green-100 p-2 rounded-lg transition-colors">
                        <input
                          type="radio"
                          name="attendanceStatus"
                          value="quiz_taken"
                          checked={attendanceStatus === 'quiz_taken'}
                          onChange={(e) => setAttendanceStatus(e.target.value)}
                          className="w-4 h-4 text-green-600"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">✅ Quiz Takers Only (Attended)</p>
                          <p className="text-xs text-gray-600">Actually attended & took quiz ({eventInfo?.quizTakers || 0})</p>
                        </div>
                      </label>
                      
                      <label className="flex items-center gap-3 cursor-pointer hover:bg-red-100 p-2 rounded-lg transition-colors">
                        <input
                          type="radio"
                          name="attendanceStatus"
                          value="quiz_not_taken"
                          checked={attendanceStatus === 'quiz_not_taken'}
                          onChange={(e) => setAttendanceStatus(e.target.value)}
                          className="w-4 h-4 text-red-600"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">❌ No Quiz (No-shows)</p>
                          <p className="text-xs text-gray-600">Registered but didn't attend ({eventInfo?.noQuizTakers || 0})</p>
                        </div>
                      </label>
                      
                      <div className="mt-2 pt-2 border-t border-purple-300">
                        <p className="text-xs text-purple-700 font-medium">
                          💡 Tip: Quiz participation = Proof of attendance
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fetch Recipients Button */}
                <button
                  onClick={fetchRecipients}
                  disabled={loading || (filterType !== 'all' && !filterValue)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Users className="w-5 h-5" />
                      Load Recipients
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Recipients List */}
            {recipients.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                {/* Event Info Banner */}
                {eventInfo && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-bold text-purple-900">{eventInfo.title}</h4>
                        <div className="text-sm text-gray-600 mt-1">
                          <p>{new Date(eventInfo.eventDate).toLocaleString('en-IN')}</p>
                          <p className="text-xs mt-1">{eventInfo.eventType} • {getEventStatusBadge(eventInfo.status)}</p>
                        </div>
                        {eventInfo.hasQuiz && (
                          <div className="mt-3 pt-3 border-t border-purple-300">
                            <p className="text-xs font-semibold text-purple-800 mb-2">📊 Quiz-based Attendance Stats:</p>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="bg-blue-100 rounded px-2 py-1 text-center">
                                <p className="text-blue-600 font-medium">Total</p>
                                <p className="text-blue-800 font-bold">{eventInfo.totalRegistered}</p>
                              </div>
                              <div className="bg-green-100 rounded px-2 py-1 text-center">
                                <p className="text-green-600 font-medium">✅ Attended</p>
                                <p className="text-green-800 font-bold">{eventInfo.quizTakers}</p>
                              </div>
                              <div className="bg-red-100 rounded px-2 py-1 text-center">
                                <p className="text-red-600 font-medium">❌ No-show</p>
                                <p className="text-red-800 font-bold">{eventInfo.noQuizTakers}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, email, or phone..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {searchQuery && (
                    <p className="text-xs text-gray-500 mt-1">
                      Showing {filteredRecipients.length} of {recipients.length} recipients
                    </p>
                  )}
                </div>

                {/* Header with Select All */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b">
                  <h3 className="text-lg font-bold text-gray-800">
                    Recipients ({selectedRecipients.length}/{recipients.length})
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-purple-50 px-3 py-1 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedRecipients.length === recipients.length}
                      onChange={toggleAllRecipients}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Select All</span>
                  </label>
                </div>

                {/* Recipients List */}
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredRecipients.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No recipients found matching "{searchQuery}"</p>
                    </div>
                  ) : (
                    filteredRecipients.map((recipient) => {
                      const isSelected = selectedRecipients.includes(recipient.id);
                      return (
                        <label
                          key={recipient.id}
                          className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-purple-50 border-2 border-purple-300' 
                              : 'bg-gray-50 border border-gray-200 hover:border-purple-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRecipient(recipient.id)}
                            className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`font-medium truncate ${isSelected ? 'text-purple-900' : 'text-gray-800'}`}>
                                {recipient.name}
                              </p>
                              {isSelected && <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0" />}
                              {eventInfo?.hasQuiz && recipient.tookQuiz !== undefined && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  recipient.tookQuiz 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {recipient.tookQuiz ? '✅ Attended' : '❌ No-show'}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 truncate mt-0.5">
                              ✉️ {recipient.email}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                              {recipient.phone && recipient.phone !== 'N/A' && (
                                <span>📱 {recipient.phone}</span>
                              )}
                              {recipient.batch && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                                  {recipient.batch}
                                </span>
                              )}
                              {recipient.registeredAt && (
                                <span className="text-xs text-gray-400">
                                  Registered: {new Date(recipient.registeredAt).toLocaleDateString('en-IN')}
                                </span>
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>

                {/* Quick Stats */}
                <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
                  <div className="bg-blue-50 rounded-lg p-2">
                    <p className="text-xs text-blue-600 font-medium">Total</p>
                    <p className="text-lg font-bold text-blue-700">{recipients.length}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-2">
                    <p className="text-xs text-purple-600 font-medium">Selected</p>
                    <p className="text-lg font-bold text-purple-700">{selectedRecipients.length}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2">
                    <p className="text-xs text-green-600 font-medium">Will Send</p>
                    <p className="text-lg font-bold text-green-700">{selectedRecipients.length}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Email Composer */}
          <div className="lg:col-span-2 space-y-6">
            {/* Email Composer */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-bold text-gray-800">Compose Email</h2>
              </div>

              <div className="space-y-4">
                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* HTML Toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useCustomHTML"
                    checked={useCustomHTML}
                    onChange={(e) => setUseCustomHTML(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="useCustomHTML" className="text-sm text-gray-700 cursor-pointer">
                    Use Custom HTML
                  </label>
                </div>

                {/* Message / HTML Content */}
                {useCustomHTML ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      HTML Content <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={htmlContent}
                      onChange={(e) => setHtmlContent(e.target.value)}
                      placeholder="Enter HTML content for email body"
                      rows="12"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Enter your message here. It will be automatically formatted with a professional template."
                      rows="10"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      ℹ️ Your message will be wrapped in a professional email template automatically.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleSendEmail}
                    disabled={sending || !subject.trim() || (!message.trim() && !htmlContent.trim()) || selectedRecipients.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {sending ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Email ({selectedRecipients.length})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Send Result */}
            {sendResult && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-bold text-gray-800">Send Results</h3>
                </div>

                <div className="grid sm:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-blue-600 font-medium">Total</p>
                    <p className="text-2xl font-bold text-blue-700">{sendResult.total}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-green-600 font-medium">Sent</p>
                    <p className="text-2xl font-bold text-green-700">{sendResult.sent}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-red-600 font-medium">Failed</p>
                    <p className="text-2xl font-bold text-red-700">{sendResult.failed}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-purple-600 font-medium">Success Rate</p>
                    <p className="text-2xl font-bold text-purple-700">{sendResult.successRate}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkEmailManager;
