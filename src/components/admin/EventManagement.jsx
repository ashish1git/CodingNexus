import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function EventManagement() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [issuingCert, setIssuingCert] = useState(null);
  const [markingAttendance, setMarkingAttendance] = useState(null);
  const [bulkGeneratingCerts, setBulkGeneratingCerts] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'workshop',
    eventDate: '',
    eventEndDate: '',
    venue: '',
    posterUrl: '',
    maxParticipants: 100,
    registrationDeadline: '',
    batch: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/events/admin/events`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setEvents(response.data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handlePosterUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingPoster(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_NOTES_PRESET || 'codingnexus_notes');

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData
      );

      setFormData(prev => ({
        ...prev,
        posterUrl: response.data.secure_url
      }));

      toast.success('Poster uploaded successfully!');
    } catch (error) {
      console.error('Poster upload error:', error);
      toast.error('Failed to upload poster');
    } finally {
      setUploadingPoster(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      
      if (editingEvent) {
        // Update existing event
        const response = await axios.put(
          `${import.meta.env.VITE_API_URL}/events/admin/events/${editingEvent.id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        toast.success('Event updated successfully!');
      } else {
        // Create new event
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/events/admin/events`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        toast.success('Event created successfully!');
      }
      
      setShowCreateModal(false);
      setEditingEvent(null);
      fetchEvents();
      resetForm();
    } catch (error) {
      console.error('Event error:', error);
      toast.error(error.response?.data?.error || 'Failed to save event');
    }
  };

  // Helper to format ISO date to datetime-local value
  const formatDateForInput = (isoDate) => {
    if (!isoDate) return '';
    try {
      const d = new Date(isoDate);
      // Format: YYYY-MM-DDTHH:mm (datetime-local expects this)
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title || '',
      description: event.description || '',
      eventType: event.eventType || 'workshop',
      eventDate: formatDateForInput(event.eventDate),
      eventEndDate: formatDateForInput(event.eventEndDate),
      venue: event.venue || '',
      posterUrl: event.posterUrl || '',
      maxParticipants: event.maxParticipants || 100,
      registrationDeadline: formatDateForInput(event.registrationDeadline),
      batch: event.batch || ''
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/events/admin/events/${eventId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Event deleted successfully!');
      fetchEvents();
    } catch (error) {
      console.error('Delete event error:', error);
      toast.error(error.response?.data?.error || 'Failed to delete event');
    }
  };

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/events/admin/events/${eventId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success(`Event status updated to ${newStatus}`);
      fetchEvents();
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Failed to update status');
    }
  };

  const viewRegistrations = async (event) => {
    setSelectedEvent(event);
    setLoadingRegistrations(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/events/admin/events/${event.id}/registrations`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRegistrations(response.data.registrations || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Failed to load registrations');
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const handleIssueCertificate = async (participantId) => {
    setIssuingCert(participantId);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/events/admin/events/${selectedEvent.id}/certificate/${participantId}`,
        { templateType: 'participation' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Certificate issued successfully!');
      // Refresh registrations to show updated status
      viewRegistrations(selectedEvent);
    } catch (error) {
      console.error('Error issuing certificate:', error);
      toast.error(error.response?.data?.error || 'Failed to issue certificate');
    } finally {
      setIssuingCert(null);
    }
  };

  const handleMarkAttendance = async (participantId) => {
    setMarkingAttendance(participantId);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/events/admin/events/${selectedEvent.id}/attendance/${participantId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Attendance marked!');
      viewRegistrations(selectedEvent);
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    } finally {
      setMarkingAttendance(null);
    }
  };

  const handleBulkGenerateCertificates = async () => {
    if (!confirm('Generate certificates for all participants with marked attendance? This cannot be undone.')) {
      return;
    }

    setBulkGeneratingCerts(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/events/admin/events/${selectedEvent.id}/certificates/bulk`,
        { templateType: 'participation', attendanceRequired: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const { results } = response.data;
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        toast.success(`Successfully generated ${successCount} certificate(s)!`);
      }
      if (failCount > 0) {
        toast.error(`Failed to generate ${failCount} certificate(s)`);
      }

      viewRegistrations(selectedEvent);
    } catch (error) {
      console.error('Error generating bulk certificates:', error);
      toast.error(error.response?.data?.error || 'Failed to generate certificates');
    } finally {
      setBulkGeneratingCerts(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      eventType: 'workshop',
      eventDate: '',
      eventEndDate: '',
      venue: '',
      posterUrl: '',
      maxParticipants: 100,
      registrationDeadline: '',
      batch: ''
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      upcoming: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.upcoming;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Event Management</h1>
            <p className="text-gray-600 mt-1">Create and manage events for external participants</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin/event-quizzes')}
              className="px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
            >
              📝 Event Quizzes
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              Create New Event
            </button>
          </div>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Loading events...</div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Yet</h3>
            <p className="text-gray-600 mb-6">Create your first event to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Create Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Poster */}
                {event.posterUrl ? (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={event.posterUrl}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-6xl">🎯</span>
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full capitalize">
                          {event.eventType}
                        </span>
                        <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(event.status)}`}>
                          {event.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    <div>📅 {new Date(event.eventDate).toLocaleString('en-IN')}</div>
                    {event.venue && <div>📍 {event.venue}</div>}
                    <div>👥 {event.registeredCount}/{event.maxParticipants} registered</div>
                    <div>⏰ Deadline: {new Date(event.registrationDeadline).toLocaleDateString('en-IN')}</div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mb-3">
                    <select
                      value={event.status}
                      onChange={(e) => handleStatusChange(event.id, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => viewRegistrations(event)}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                    >
                      Registrations
                    </button>
                    <button
                      onClick={() => handleEdit(event)}
                      className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                    >
                      Delete
                    </button>
                  </div>

                  {event.registeredCount > 0 && event.status === 'completed' && (
                    <button
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Generate Certificates ({event.registeredCount})
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingEvent ? 'Edit Event' : 'Create New Event'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingEvent(null);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Web Development Workshop"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Describe your event..."
                />
              </div>

              {/* Event Type and Max Participants */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="workshop">Workshop</option>
                    <option value="hackathon">Hackathon</option>
                    <option value="seminar">Seminar</option>
                    <option value="competition">Competition</option>
                    <option value="webinar">Webinar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Participants <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Event Date and End Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Start Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.eventEndDate}
                    onChange={(e) => setFormData({ ...formData, eventEndDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Registration Deadline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.registrationDeadline}
                  onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Venue */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue
                </label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Main Auditorium, Room 101"
                />
              </div>

              {/* Poster Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Poster
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePosterUpload}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {uploadingPoster && (
                    <span className="text-sm text-gray-600">Uploading...</span>
                  )}
                </div>
                {formData.posterUrl && (
                  <div className="mt-3">
                    <img
                      src={formData.posterUrl}
                      alt="Preview"
                      className="h-32 w-auto rounded-lg border border-gray-300"
                    />
                  </div>
                )}
              </div>

              {/* Batch (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specific Batch (Optional)
                </label>
                <input
                  type="text"
                  value={formData.batch}
                  onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Leave empty for all batches"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingEvent(null);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingPoster}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Registrations Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Registrations: {selectedEvent.title}
                </h2>
                <button
                  onClick={() => { setSelectedEvent(null); setRegistrations([]); }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Bulk Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBulkGenerateCertificates}
                  disabled={bulkGeneratingCerts || registrations.filter(r => r.attendanceMarked && !r.certificateGenerated).length === 0}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {bulkGeneratingCerts ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    'Generate Certificates (Attended)'
                  )}
                </button>
                <span className="text-sm text-gray-500">
                  {registrations.filter(r => r.attendanceMarked && !r.certificateGenerated).length} eligible
                </span>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Total Registrations: {selectedEvent.registeredCount}
              </p>
              
              {loadingRegistrations ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading registrations...</p>
                </div>
              ) : registrations.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No registrations yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">#</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">Name</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">Email</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">Phone</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">Division</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">Branch</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">Attendance</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">Certificate</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {registrations.map((reg, idx) => (
                        <tr key={reg.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600">{idx + 1}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{reg.participant?.name || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{reg.participant?.email || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{reg.participant?.phone || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{reg.participant?.division || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{reg.participant?.branch || '-'}</td>
                          <td className="px-4 py-3">
                            {reg.attendanceMarked ? (
                              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">✓ Present</span>
                            ) : (
                              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Pending</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {reg.certificateGenerated ? (
                              <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">✓ Issued</span>
                            ) : (
                              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Not issued</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              {!reg.attendanceMarked && (
                                <button
                                  onClick={() => handleMarkAttendance(reg.participant?.id)}
                                  disabled={markingAttendance === reg.participant?.id}
                                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {markingAttendance === reg.participant?.id ? '...' : 'Mark Present'}
                                </button>
                              )}
                              {!reg.certificateGenerated && reg.attendanceMarked && (
                                <button
                                  onClick={() => handleIssueCertificate(reg.participant?.id)}
                                  disabled={issuingCert === reg.participant?.id}
                                  className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                                >
                                  {issuingCert === reg.participant?.id ? '...' : 'Issue Cert'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
