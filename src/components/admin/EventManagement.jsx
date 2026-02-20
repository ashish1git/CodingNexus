import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Plus, Search, Calendar, MapPin, Users, Edit2, Trash2, X, Check, 
  Upload, Image, FileText, Video, Download, ArrowLeft,
  Award, BarChart3, Clock, RefreshCw, CheckCircle, Eye, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../utils/permissions';

const API = import.meta.env.VITE_API_URL;
const CLOUDINARY_CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_PRESET = import.meta.env.VITE_CLOUDINARY_NOTES_PRESET || 'codingnexus_notes';

// Auto calculate event status based on dates
const getAutoStatus = (event) => {
  const now = new Date();
  const eventStart = new Date(event.eventDate);
  const eventEnd = event.eventEndDate ? new Date(event.eventEndDate) : new Date(eventStart.getTime() + 3 * 60 * 60 * 1000);
  if (event.status === 'cancelled') return 'cancelled';
  if (now < eventStart) return 'upcoming';
  if (now >= eventStart && now <= eventEnd) return 'ongoing';
  return 'completed';
};

const EVENT_TYPES = [
  { value: 'workshop', label: 'Workshop', icon: '🛠️' },
  { value: 'hackathon', label: 'Hackathon', icon: '💻' },
  { value: 'seminar', label: 'Seminar', icon: '🎓' },
  { value: 'competition', label: 'Competition', icon: '🏆' },
  { value: 'webinar', label: 'Webinar', icon: '📹' }
];

const STATUS_OPTIONS = [
  { value: 'upcoming', label: 'Upcoming', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  { value: 'ongoing', label: 'Live', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  { value: 'completed', label: 'Done', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
  { value: 'cancelled', label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' }
];

const MEDIA_TYPES = [
  { value: 'image', label: 'Image', icon: Image },
  { value: 'pdf', label: 'PDF', icon: FileText },
  { value: 'document', label: 'Document', icon: FileText },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'other', label: 'Other', icon: Download }
];

// Convert UTC to Indian datetime-local format
const toIndianDateTimeLocal = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const offset = 5.5 * 60 * 60 * 1000; // IST offset
  const ist = new Date(d.getTime() + offset);
  return ist.toISOString().slice(0, 16);
};

// Convert datetime-local input to proper ISO string
const fromIndianDateTimeLocal = (localStr) => {
  if (!localStr) return null;
  const d = new Date(localStr);
  return d.toISOString();
};

export default function EventManagement() {
  const navigate = useNavigate();
  const { userDetails } = useAuth();
  const canManageEvents = hasPermission(userDetails, 'manageEvents');
  const canCreateEvents = hasPermission(userDetails, 'createEvents');
  const canEditEvents = hasPermission(userDetails, 'editEvents');
  const canDeleteEvents = hasPermission(userDetails, 'deleteEvents');
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [viewReg, setViewReg] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [regLoading, setRegLoading] = useState(false);
  const [regSearch, setRegSearch] = useState('');
  const [viewMedia, setViewMedia] = useState(null);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [showMediaForm, setShowMediaForm] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaForm, setMediaForm] = useState({ title: '', description: '', fileType: 'document' });
  const [mediaFile, setMediaFile] = useState(null);
  const [posterUploading, setPosterUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showBulkCertModal, setShowBulkCertModal] = useState(false);
  const [bulkCertParticipants, setBulkCertParticipants] = useState([]);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/events/admin/events`, { headers });
      setEvents(res.data.events || []);
    } catch (err) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchSearch = !searchQuery || 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.venue?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || e.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [events, searchQuery, statusFilter]);

  // Form state
  const [form, setForm] = useState({
    title: '', description: '', eventType: 'workshop', eventDate: '',
    eventEndDate: '', venue: '', posterUrl: '', maxParticipants: 100,
    registrationDeadline: '', status: 'upcoming'
  });

  const resetForm = () => {
    setForm({
      title: '', description: '', eventType: 'workshop', eventDate: '',
      eventEndDate: '', venue: '', posterUrl: '', maxParticipants: 100,
      registrationDeadline: '', status: 'upcoming'
    });
    setEditingEvent(null);
  };

  const openCreate = () => {
    if (!canCreateEvents) {
      toast.error("You don't have permission to create events");
      return;
    }
    resetForm();
    setShowModal(true);
  };
  
  const openEdit = (event) => {
    if (!canEditEvents) {
      toast.error("You don't have permission to edit events");
      return;
    }
    setEditingEvent(event);
    setForm({
      title: event.title || '',
      description: event.description || '',
      eventType: event.eventType || 'workshop',
      eventDate: toIndianDateTimeLocal(event.eventDate),
      eventEndDate: toIndianDateTimeLocal(event.eventEndDate),
      venue: event.venue || '',
      posterUrl: event.posterUrl || '',
      maxParticipants: event.maxParticipants || 100,
      registrationDeadline: toIndianDateTimeLocal(event.registrationDeadline),
      status: event.status || 'upcoming'
    });
    setShowModal(true);
  };

  const handlePosterUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image'); return; }
    setPosterUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', CLOUDINARY_PRESET);
      fd.append('folder', 'events/posters');
      const res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, fd);
      setForm(prev => ({ ...prev, posterUrl: res.data.secure_url }));
      toast.success('Poster uploaded');
    } catch { toast.error('Upload failed'); }
    finally { setPosterUploading(false); }
  };

  const handleSave = async () => {
    if (editingEvent && !canEditEvents) {
      toast.error("You don't have permission to edit events");
      return;
    }
    if (!editingEvent && !canCreateEvents) {
      toast.error("You don't have permission to create events");
      return;
    }
    if (!form.title || !form.eventDate || !form.registrationDeadline) {
      toast.error('Title, event date, and deadline are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        maxParticipants: parseInt(form.maxParticipants) || 100,
        eventDate: fromIndianDateTimeLocal(form.eventDate),
        eventEndDate: form.eventEndDate ? fromIndianDateTimeLocal(form.eventEndDate) : null,
        registrationDeadline: fromIndianDateTimeLocal(form.registrationDeadline)
      };
      if (editingEvent) {
        await axios.put(`${API}/events/admin/events/${editingEvent.id}`, payload, { headers });
        toast.success('Event updated');
      } else {
        await axios.post(`${API}/events/admin/events`, payload, { headers });
        toast.success('Event created');
      }
      setShowModal(false);
      resetForm();
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!canDeleteEvents) {
      toast.error("You don't have permission to delete events");
      return;
    }
    if (!confirm('Delete this event?')) return;
    try {
      await axios.delete(`${API}/events/admin/events/${id}`, { headers });
      toast.success('Deleted');
      fetchEvents();
    } catch { toast.error('Delete failed'); }
  };

  const handleStatusChange = async (id, status) => {
    if (!canEditEvents) {
      toast.error("You don't have permission to change event status");
      return;
    }
    try {
      await axios.patch(`${API}/events/admin/events/${id}/status`, { status }, { headers });
      toast.success('Status updated');
      fetchEvents();
    } catch { toast.error('Update failed'); }
  };

  // Registrations
  const openRegistrations = async (event) => {
    setViewReg(event);
    setRegLoading(true);
    setRegSearch('');
    try {
      const res = await axios.get(`${API}/events/admin/events/${event.id}/registrations`, { headers });
      setRegistrations(res.data.registrations || []);
    } catch { toast.error('Failed to load'); }
    finally { setRegLoading(false); }
  };

  const filteredRegs = useMemo(() => {
    if (!regSearch) return registrations;
    return registrations.filter(r =>
      r.participant?.name?.toLowerCase().includes(regSearch.toLowerCase()) ||
      r.participant?.email?.toLowerCase().includes(regSearch.toLowerCase())
    );
  }, [registrations, regSearch]);

  const markAttendance = async (eventId, participantId) => {
    try {
      await axios.post(`${API}/events/admin/events/${eventId}/attendance/${participantId}`, {}, { headers });
      toast.success('Attendance marked');
      openRegistrations(viewReg);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const issueCertificate = async (eventId, participantId) => {
    try {
      await axios.post(`${API}/events/admin/events/${eventId}/certificate/${participantId}`, {}, { headers });
      toast.success('Certificate issued');
      openRegistrations(viewReg);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const bulkCertificates = async (eventId) => {
    // Get participants who attended (marked present OR took quiz) and haven't received certificates yet
    const eligibleParticipants = registrations.filter(
      r => (r.attendanceMarked || r.quizAttended) && !r.certificateGenerated
    );
    
    if (eligibleParticipants.length === 0) {
      toast.error('No eligible participants found. Either no one attended/took quiz or certificates already issued.');
      return;
    }
    
    // Show modal with participant list
    setBulkCertParticipants(eligibleParticipants);
    setShowBulkCertModal(true);
  };

  const confirmBulkCertificates = async () => {
    try {
      const res = await axios.post(`${API}/events/admin/events/${viewReg.id}/certificates/bulk`, { attendanceRequired: true }, { headers });
      toast.success(res.data.message);
      setShowBulkCertModal(false);
      setBulkCertParticipants([]);
      openRegistrations(viewReg);
    } catch (err) { 
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const previewCertificate = async (eventId) => {
    try {
      const response = await axios.post(
        `${API}/events/admin/events/${eventId}/certificate/preview`,
        { participantName: 'Sample Student', division: 'FY AIML' },
        { headers, responseType: 'blob' }
      );
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      toast.success('Preview opened in new tab');
    } catch (err) {
      console.error('Preview error:', err);
      toast.error('Failed to generate preview');
    }
  };

  const revokeCertificate = async (eventId, participantId) => {
    if (!confirm('Reset this certificate? The student will be able to re-download with a corrected name.')) return;
    try {
      await axios.delete(`${API}/events/admin/events/${eventId}/certificate/${participantId}`, { headers });
      toast.success('Certificate reset successfully. Student can now re-download.');
      openRegistrations(viewReg);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to reset certificate'); }
  };

  const editCertificateName = async (eventId, participantId, currentName) => {
    const newName = prompt('Edit certificate name:', currentName || '');
    if (!newName || newName.trim() === '') {
      toast.error('Name cannot be empty');
      return;
    }
    if (newName.trim() === currentName) {
      return; // No change
    }
    try {
      await axios.patch(
        `${API}/events/admin/events/${eventId}/certificate/${participantId}/name`,
        { newName: newName.trim() },
        { headers }
      );
      toast.success('Certificate name updated successfully');
      openRegistrations(viewReg);
    } catch (err) { 
      toast.error(err.response?.data?.error || 'Failed to update certificate name'); 
    }
  };

  // Media
  const openMedia = async (event) => {
    setViewMedia(event);
    setMediaLoading(true);
    setShowMediaForm(false);
    setMediaForm({ title: '', description: '', fileType: 'document' });
    setMediaFile(null);
    try {
      const res = await axios.get(`${API}/events/admin/events/${event.id}/media`, { headers });
      setMediaFiles(res.data.media || []);
    } catch { toast.error('Failed to load media'); }
    finally { setMediaLoading(false); }
  };

  const uploadMedia = async () => {
    if (!mediaForm.title || !mediaFile) { toast.error('Title and file required'); return; }
    setUploadingMedia(true);
    try {
      // Step 1: Upload file to Cloudinary via backend (more reliable)
      const formData = new FormData();
      formData.append('file', mediaFile);
      
      console.log('Uploading file to backend:', { 
        fileName: mediaFile.name, 
        type: mediaFile.type,
        size: mediaFile.size 
      });
      
      const uploadRes = await axios.post(
        `${API}/events/admin/events/${viewMedia.id}/upload-media`,
        formData,
        { 
          headers: { 
            ...headers,
            'Content-Type': 'multipart/form-data' 
          } 
        }
      );
      
      if (!uploadRes.data.success) {
        throw new Error(uploadRes.data.error || 'Upload failed');
      }
      
      console.log('File uploaded successfully:', uploadRes.data.fileUrl);
      
      // Step 2: Save media info to database
      const backendRes = await axios.post(
        `${API}/events/admin/events/${viewMedia.id}/media`, 
        {
          title: mediaForm.title, 
          description: mediaForm.description,
          fileUrl: uploadRes.data.fileUrl, 
          fileType: mediaForm.fileType,
          fileName: mediaFile.name, 
          fileSize: mediaFile.size
        }, 
        { headers }
      );
      
      console.log('Media info saved:', backendRes.data);
      toast.success('Media uploaded successfully');
      setShowMediaForm(false);
      setMediaForm({ title: '', description: '', fileType: 'document' });
      setMediaFile(null);
      openMedia(viewMedia);
    } catch (error) { 
      console.error('Upload error:', error.response?.data || error.message);
      const errorMsg = error.response?.data?.error || error.response?.data?.details || error.message || 'Upload failed';
      toast.error(`Upload failed: ${errorMsg}`);
    }
    finally { setUploadingMedia(false); }
  };

  const deleteMedia = async (mediaId) => {
    if (!confirm('Delete this file?')) return;
    try {
      await axios.delete(`${API}/events/admin/events/${viewMedia.id}/media/${mediaId}`, { headers });
      toast.success('Deleted');
      openMedia(viewMedia);
    } catch { toast.error('Delete failed'); }
  };

  const formatSize = (b) => {
    if (!b) return '';
    if (b < 1024) return b + 'B';
    if (b < 1048576) return (b/1024).toFixed(1) + 'KB';
    return (b/1048576).toFixed(1) + 'MB';
  };

  const formatIndianDate = (d) => new Date(d).toLocaleString('en-IN', { 
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true 
  });

  // Stats
  const stats = useMemo(() => ({
    total: events.length,
    upcoming: events.filter(e => e.status === 'upcoming').length,
    ongoing: events.filter(e => e.status === 'ongoing').length,
    completed: events.filter(e => e.status === 'completed').length,
    totalRegs: events.reduce((s, e) => s + (e._count?.registrations || 0), 0)
  }), [events]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 text-purple-600 animate-spin" />
      </div>
    );
  }

  // Access Denied Screen
  if (!canManageEvents) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to manage events. Contact your administrator to request access.
            </p>
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Event Management</h1>
            <p className="text-gray-500 text-sm">Create and manage events</p>
          </div>
        </div>
        {canCreateEvents && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-sm font-medium shadow-sm">
            <Plus className="w-4 h-4" /> Create Event
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, icon: BarChart3, color: 'text-purple-600' },
          { label: 'Upcoming', value: stats.upcoming, icon: Clock, color: 'text-blue-600' },
          { label: 'Live', value: stats.ongoing, icon: CheckCircle, color: 'text-green-600' },
          { label: 'Done', value: stats.completed, icon: Check, color: 'text-gray-500' },
          { label: 'Registrations', value: stats.totalRegs, icon: Users, color: 'text-amber-600' }
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-gray-500 text-xs">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search events..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', ...STATUS_OPTIONS.map(s => s.value)].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition border ${
                statusFilter === s ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
              }`}>
              {s === 'all' ? 'All' : STATUS_OPTIONS.find(x => x.value === s)?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No Events</h3>
          <p className="text-gray-500 text-sm">Create your first event to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredEvents.map(event => {
            const autoStatus = getAutoStatus(event);
            const statusStyle = STATUS_OPTIONS.find(s => s.value === autoStatus) || STATUS_OPTIONS[0];
            const regCount = event._count?.registrations || 0;
            const isLive = autoStatus === 'ongoing';
            return (
              <div key={event.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group">
                {/* Poster - Larger with aspect ratio */}
                <div className="relative aspect-[16/10] bg-gradient-to-br from-purple-100 to-blue-100 overflow-hidden">
                  {event.posterUrl ? (
                    <img src={event.posterUrl} alt="" className="w-full h-full object-contain bg-gray-50" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl">{EVENT_TYPES.find(t => t.value === event.eventType)?.icon || '🎯'}</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm ${
                      isLive ? 'bg-green-500 text-white animate-pulse' : `${statusStyle.bg} ${statusStyle.text}`
                    }`}>
                      {isLive && <span className="inline-block w-2 h-2 bg-white rounded-full mr-1.5 animate-ping" />}
                      {statusStyle.label}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 text-base">{event.title}</h3>
                  <p className="text-gray-500 text-sm mb-3 line-clamp-1">{event.venue || 'No venue'}</p>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>{formatIndianDate(event.eventDate)}</span>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">{regCount}/{event.maxParticipants} registered</span>
                    {canEditEvents ? (
                      <select value={autoStatus} onChange={e => handleStatusChange(event.id, e.target.value)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                        {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    ) : (
                      <span className={`px-2.5 py-1.5 rounded-lg text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                        {statusStyle.label}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button onClick={() => openRegistrations(event)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-medium">
                      <Users className="w-4 h-4" /> Registrations
                    </button>
                    <button onClick={() => openMedia(event)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition text-sm font-medium">
                      <FileText className="w-4 h-4" /> Media
                    </button>
                    <button onClick={() => navigate(`/admin/event-quizzes?eventId=${event.id}`)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition text-sm font-medium">
                      <Award className="w-4 h-4" /> Quiz
                    </button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {canEditEvents && (
                      <button onClick={() => openEdit(event)} className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition text-xs font-medium">
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                    )}
                    {canDeleteEvents && (
                      <button onClick={() => handleDelete(event.id)} className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-xs font-medium">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-xl my-8 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{editingEvent ? 'Edit Event' : 'Create Event'}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Poster */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Banner</label>
                {form.posterUrl ? (
                  <div className="relative rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                    <img src={form.posterUrl} alt="" className="w-full max-h-64 object-contain mx-auto" />
                    <button onClick={() => setForm(p => ({ ...p, posterUrl: '' }))} className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-lg text-white shadow-lg transition">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition bg-gray-50">
                    {posterUploading ? <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" /> : (
                      <><Upload className="w-8 h-8 text-gray-400 mb-2" /><span className="text-gray-500 text-sm">Click to upload banner</span><span className="text-gray-400 text-xs mt-1">Recommended: 16:9 aspect ratio</span></>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePosterUpload} disabled={posterUploading} />
                  </label>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Event title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" placeholder="Event description" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.eventType} onChange={e => setForm(p => ({ ...p, eventType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Start *</label>
                  <input type="datetime-local" value={form.eventDate} onChange={e => setForm(p => ({ ...p, eventDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event End</label>
                  <input type="datetime-local" value={form.eventEndDate} onChange={e => setForm(p => ({ ...p, eventEndDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline *</label>
                  <input type="datetime-local" value={form.registrationDeadline} onChange={e => setForm(p => ({ ...p, registrationDeadline: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
                  <input type="number" value={form.maxParticipants} onChange={e => setForm(p => ({ ...p, maxParticipants: e.target.value }))} min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                <input type="text" value={form.venue} onChange={e => setForm(p => ({ ...p, venue: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Event venue" />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium disabled:opacity-50">
                {saving ? 'Saving...' : editingEvent ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTRATIONS MODAL */}
      {viewReg && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-3xl my-8 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Registrations</h2>
                <p className="text-gray-500 text-sm">{viewReg.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => previewCertificate(viewReg.id)} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition flex items-center gap-1" title="Preview certificate with test data">
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <button onClick={() => bulkCertificates(viewReg.id)} className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200 transition flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Bulk Certs
                </button>
                <button onClick={() => setViewReg(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
            </div>
            <div className="p-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={regSearch} onChange={e => setRegSearch(e.target.value)} placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <p className="text-gray-500 text-xs mb-2">{filteredRegs.length} participant(s)</p>
              {regLoading ? (
                <div className="flex justify-center py-10"><RefreshCw className="w-5 h-5 text-purple-500 animate-spin" /></div>
              ) : filteredRegs.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">No registrations</div>
              ) : (
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr className="text-left text-gray-500 text-xs">
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3 hidden sm:table-cell">Email</th>
                        <th className="py-2 px-3 hidden md:table-cell">Branch</th>
                        <th className="py-2 px-3 text-center">Attendance</th>
                        <th className="py-2 px-3 text-center">Certificate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredRegs.map((r, i) => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="py-2 px-3 text-gray-400">{i + 1}</td>
                          <td className="py-2 px-3 font-medium text-gray-900">{r.participant?.name}</td>
                          <td className="py-2 px-3 text-gray-500 hidden sm:table-cell">{r.participant?.email}</td>
                          <td className="py-2 px-3 text-gray-500 hidden md:table-cell">{r.participant?.branch}/{r.participant?.division}</td>
                          <td className="py-2 px-3 text-center">
                            {r.attendanceMarked ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs"><CheckCircle className="w-3 h-3" /> Present</span>
                            ) : (
                              <button onClick={() => markAttendance(viewReg.id, r.participant?.id)} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition">Mark</button>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {r.certificateGenerated ? (
                              // Certificate actually downloaded and name locked
                              <div className="flex flex-col items-start gap-1">
                                <div className="flex items-center gap-1 w-full">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                                    <Award className="w-3 h-3" /> Downloaded
                                  </span>
                                  <button 
                                    onClick={() => editCertificateName(viewReg.id, r.participant?.id, r.certificateName)}
                                    className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-xs hover:bg-blue-200 transition" 
                                    title="Edit certificate name"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button 
                                    onClick={() => revokeCertificate(viewReg.id, r.participant?.id)}
                                    className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200 transition" 
                                    title="Reset certificate (allows re-download with new name)"
                                  >
                                    ✕
                                  </button>
                                </div>
                                {r.certificateName && (
                                  <div className="text-xs text-gray-500 ml-2" title="Certificate issued to this name">
                                    📄 {r.certificateName}
                                  </div>
                                )}
                              </div>
                            ) : r.certificateApprovedByAdmin ? (
                              // Approved but not yet downloaded
                              <div className="flex items-center gap-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
                                  <Award className="w-3 h-3" /> Approved
                                </span>
                                <button 
                                  onClick={() => revokeCertificate(viewReg.id, r.participant?.id)}
                                  className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200 transition" 
                                  title="Revoke approval"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              // Not approved yet - show Approve button
                              <button onClick={() => issueCertificate(viewReg.id, r.participant?.id)} disabled={!r.attendanceMarked}
                                className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs hover:bg-amber-200 transition disabled:opacity-40 disabled:cursor-not-allowed">Approve</button>
                            )}
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

      {/* BULK CERTIFICATES CONFIRMATION MODAL */}
      {showBulkCertModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Confirm Bulk Certificate Issue</h2>
                <p className="text-gray-500 text-sm">{bulkCertParticipants.length} participant(s) eligible</p>
              </div>
              <button onClick={() => { setShowBulkCertModal(false); setBulkCertParticipants([]); }} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Ready to issue:</strong> Certificates will be issued to the following participants who attended the event or took the quiz.
                </p>
              </div>

              <div className="space-y-2">
                {bulkCertParticipants.map((participant, index) => (
                  <div key={participant.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{participant.participant?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{participant.participant?.email}</p>
                    </div>
                    <div className="flex gap-1">
                      {participant.attendanceMarked && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                          <CheckCircle className="w-3 h-3" /> Present
                        </span>
                      )}
                      {participant.quizAttended && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                          <Award className="w-3 h-3" /> Quiz
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
              <button 
                onClick={() => { setShowBulkCertModal(false); setBulkCertParticipants([]); }} 
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={confirmBulkCertificates}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition text-sm font-medium flex items-center gap-2"
              >
                <Award className="w-4 h-4" />
                Issue {bulkCertParticipants.length} Certificate{bulkCertParticipants.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEDIA MODAL */}
      {viewMedia && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl my-8 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Media Files</h2>
                <p className="text-gray-500 text-sm">{viewMedia.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowMediaForm(!showMediaForm)} className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 transition flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" /> Upload
                </button>
                <button onClick={() => setViewMedia(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
            </div>
            <div className="p-4">
              {showMediaForm && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                  <div className="space-y-3">
                    <input type="text" value={mediaForm.title} onChange={e => setMediaForm(p => ({ ...p, title: e.target.value }))} placeholder="Title *"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    <input type="text" value={mediaForm.description} onChange={e => setMediaForm(p => ({ ...p, description: e.target.value }))} placeholder="Description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    <div className="flex gap-2">
                      <select value={mediaForm.fileType} onChange={e => setMediaForm(p => ({ ...p, fileType: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                        {MEDIA_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      <label className="flex-1 flex items-center justify-center px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 text-sm">
                        {mediaFile ? <span className="text-gray-700 truncate">{mediaFile.name}</span> : <span className="text-gray-500">Choose file</span>}
                        <input type="file" className="hidden" onChange={e => setMediaFile(e.target.files?.[0] || null)} />
                      </label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setShowMediaForm(false); setMediaFile(null); }} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs hover:bg-gray-300 transition">Cancel</button>
                      <button onClick={uploadMedia} disabled={uploadingMedia || !mediaForm.title || !mediaFile}
                        className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-1">
                        {uploadingMedia ? <><RefreshCw className="w-3 h-3 animate-spin" /> Uploading...</> : <>Upload</>}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {mediaLoading ? (
                <div className="flex justify-center py-10"><RefreshCw className="w-5 h-5 text-purple-500 animate-spin" /></div>
              ) : mediaFiles.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">No media files yet</div>
              ) : (
                <div className="space-y-2">
                  {mediaFiles.map(f => {
                    const Icon = MEDIA_TYPES.find(t => t.value === f.fileType)?.icon || FileText;
                    return (
                      <div key={f.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 group hover:border-purple-300 transition">
                        <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{f.title}</p>
                          <p className="text-gray-500 text-xs">{f.fileName} • {formatSize(f.fileSize)}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <a href={f.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600"><Download className="w-4 h-4" /></a>
                          <button onClick={() => deleteMedia(f.id)} className="p-1.5 hover:bg-red-100 rounded-lg text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
