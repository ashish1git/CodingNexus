import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Image, Video, Download, ChevronDown, ChevronUp, ArrowLeft, Calendar, MapPin, Clock, Tag, LogOut, ExternalLink } from 'lucide-react';
import { eventService } from '../../services/eventService';
import toast from 'react-hot-toast';

// Auto-calculate status based on dates
const getAutoStatus = (event) => {
  const now = new Date();
  const startDate = new Date(event.eventDate);
  const endDate = event.eventEndDate ? new Date(event.eventEndDate) : null;
  const deadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;

  if (endDate && now > endDate) {
    return 'completed';
  }
  if (endDate && now >= startDate && now <= endDate) {
    return 'ongoing';
  }
  if (!endDate && now > startDate) {
    return 'completed';
  }
  if (deadline && now > deadline) {
    return 'completed';
  }
  return 'upcoming';
};

export default function EventDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeEvents, setActiveEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [stats, setStats] = useState({ totalEvents: 0, quizzesAttempted: 0, certificatesEarned: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedMedia, setExpandedMedia] = useState({});
  const [expandedDesc, setExpandedDesc] = useState({});
  const [mediaFiles, setMediaFiles] = useState({});

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      toast.error('Please login to continue');
      navigate('/event-login');
      return;
    }

    const parsedUser = JSON.parse(userData);

    if (parsedUser.role !== 'event_guest') {
      toast.error('This is for event participants only');
      navigate('/login');
      return;
    }

    setUser(parsedUser);
    setActiveEvents(parsedUser.activeEvents || []);
    setPastEvents(parsedUser.pastEvents || []);
    setLoading(false);

    // Fetch real stats
    try {
      const statsRes = await eventService.getStats();
      if (statsRes.success) setStats(statsRes.stats);
    } catch (e) {
      console.error('Stats fetch error:', e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/event-login');
  };

  const toggleMedia = async (eventId) => {
    if (expandedMedia[eventId]) {
      setExpandedMedia(prev => ({ ...prev, [eventId]: false }));
      return;
    }
    setExpandedMedia(prev => ({ ...prev, [eventId]: true }));
    if (!mediaFiles[eventId]) {
      try {
        const res = await eventService.getEventMedia(eventId);
        if (res.success) {
          setMediaFiles(prev => ({ ...prev, [eventId]: res.media || [] }));
        }
      } catch (err) {
        console.error('Failed to fetch media:', err);
        setMediaFiles(prev => ({ ...prev, [eventId]: [] }));
      }
    }
  };

  const getMediaIcon = (fileType) => {
    if (fileType === 'image') return Image;
    if (fileType === 'video') return Video;
    return FileText;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black event-dark-theme">
      {/* Header */}
      <div className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/events')} className="p-2 hover:bg-gray-700/50 rounded-lg transition">
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div className="text-base sm:text-lg font-bold text-white">
                <span className="text-purple-400">My</span> Dashboard
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-xs hidden sm:block">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-red-600/80 hover:text-white transition text-xs"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Welcome + Stats Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Welcome, {user?.name?.split(' ')[0]}! 👋</h1>
            <p className="text-gray-400 text-sm">Your event hub — quizzes, certificates & resources</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-gray-800/80 border border-gray-700 rounded-lg px-4 py-2.5 text-center min-w-[70px]">
              <p className="text-xl font-bold text-white">{activeEvents.length + pastEvents.length}</p>
              <p className="text-gray-500 text-[10px] uppercase tracking-wide">Events</p>
            </div>
            <div className="bg-gray-800/80 border border-gray-700 rounded-lg px-4 py-2.5 text-center min-w-[70px]">
              <p className="text-xl font-bold text-white">{stats.quizzesAttempted}</p>
              <p className="text-gray-500 text-[10px] uppercase tracking-wide">Quizzes</p>
            </div>
            <div className="bg-gray-800/80 border border-gray-700 rounded-lg px-4 py-2.5 text-center min-w-[70px]">
              <p className="text-xl font-bold text-amber-400">{stats.certificatesEarned}</p>
              <p className="text-gray-500 text-[10px] uppercase tracking-wide">Certs</p>
            </div>
          </div>
        </div>

        {/* Quick Actions - Compact */}
        <div className="flex gap-3 mb-6">
          <button onClick={() => navigate('/event-dashboard/quizzes')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white hover:bg-gray-700 hover:border-purple-500/50 transition text-sm font-medium">
            <span className="text-lg">📝</span> My Quizzes
          </button>
          <button onClick={() => navigate('/event-dashboard/certificates')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white hover:bg-gray-700 hover:border-amber-500/50 transition text-sm font-medium">
            <span className="text-lg">🎓</span> Certificates
          </button>
        </div>

        {/* Active Events */}
        <div className="mb-6">
          <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" /> Active Events
          </h2>

          {activeEvents.length === 0 ? (
            <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-gray-700">
              <div className="text-3xl mb-2">📅</div>
              <h3 className="text-sm font-semibold text-white mb-1">No Active Events</h3>
              <p className="text-gray-500 text-xs mb-3">Check back during your registered event times!</p>
              {pastEvents.length === 0 && (
                <button onClick={() => navigate('/events')} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm">
                  Browse Events
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {activeEvents.map((event) => {
                const isDescExpanded = expandedDesc[event.id];
                const hasLongDesc = event.description && event.description.length > 120;
                const autoStatus = getAutoStatus(event);
                return (
                <div key={event.id} className="bg-gray-800/70 rounded-2xl overflow-hidden border border-gray-700 hover:border-purple-500/40 transition">
                  {/* Event Card - Vertical on mobile, Horizontal on desktop */}
                  <div className="flex flex-col lg:flex-row">
                    {/* Event Poster - Full Display, Bigger */}
                    {event.posterUrl && (
                      <div className="lg:w-96 flex-shrink-0 bg-black">
                        <div className="aspect-[16/10] lg:aspect-auto lg:h-full">
                          <img
                            src={event.posterUrl}
                            alt={event.title}
                            className="w-full h-full object-contain"
                            onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Event Details */}
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="text-lg font-bold text-white">{event.title}</h3>
                        <span className={`flex-shrink-0 px-2.5 py-1 text-xs rounded-full font-semibold uppercase tracking-wide ${
                          autoStatus === 'ongoing'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse'
                            : autoStatus === 'completed'
                            ? 'bg-gray-600/20 text-gray-400 border border-gray-600/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {autoStatus === 'ongoing' && <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-ping"/>}
                          {autoStatus}
                        </span>
                      </div>

                      {event.description && (
                        <div className="mb-4">
                          <p className={`text-gray-400 text-sm leading-relaxed whitespace-pre-wrap ${isDescExpanded ? '' : 'line-clamp-2'}`}>
                            {event.description}
                          </p>
                          {hasLongDesc && (
                            <button
                              onClick={() => setExpandedDesc(prev => ({ ...prev, [event.id]: !prev[event.id] }))}
                              className="text-purple-400 hover:text-purple-300 text-xs font-medium mt-1.5 flex items-center gap-1 transition"
                            >
                              {isDescExpanded ? <>Show less <ChevronUp className="w-3 h-3" /></> : <>Read more <ChevronDown className="w-3 h-3" /></>}
                            </button>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                        <div className="bg-gray-700/30 rounded-lg p-2.5 border border-gray-600/30">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Calendar className="w-3 h-3 text-purple-400" />
                            <span className="text-gray-500 text-[10px] uppercase font-medium">Start Date</span>
                          </div>
                          <p className="text-white text-sm font-semibold">{new Date(event.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          <p className="text-purple-300 text-xs">{new Date(event.eventDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                        </div>
                        {event.eventEndDate && (
                          <div className="bg-gray-700/30 rounded-lg p-2.5 border border-gray-600/30">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span className="text-gray-500 text-[10px] uppercase font-medium">End Time</span>
                            </div>
                            <p className="text-white text-sm font-semibold">{new Date(event.eventEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                            <p className="text-amber-300 text-xs">{new Date(event.eventEndDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                          </div>
                        )}
                        {event.venue && (
                          <div className={`bg-gray-700/30 rounded-lg p-2.5 border border-gray-600/30 ${event.eventEndDate ? 'col-span-2' : ''}`}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <MapPin className="w-3 h-3 text-blue-400" />
                              <span className="text-gray-500 text-[10px] uppercase font-medium">Venue</span>
                            </div>
                            <p className="text-white text-sm font-medium truncate">{event.venue}</p>
                          </div>
                        )}
                        {event.eventType && (
                          <div className={`bg-gray-700/30 rounded-lg p-2.5 border border-gray-600/30 ${!event.eventEndDate ? '' : 'col-span-2'}`}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <Tag className="w-3 h-3 text-green-400" />
                              <span className="text-gray-500 text-[10px] uppercase font-medium">Type</span>
                            </div>
                            <p className="text-white text-sm font-medium capitalize">{event.eventType}</p>
                          </div>
                        )}
                      </div>

                      {/* Media Files Section */}
                      <div className="border-t border-gray-700/50 pt-3">
                        <button
                          onClick={() => toggleMedia(event.id)}
                          className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300 transition font-medium group"
                        >
                          <FileText className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                          <span>Event Resources</span>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                          </span>
                          {expandedMedia[event.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {expandedMedia[event.id] && (
                          <div className="mt-2">
                            {!mediaFiles[event.id] ? (
                              <div className="flex items-center gap-2 text-gray-500 text-xs py-1">
                                <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                Loading...
                              </div>
                            ) : mediaFiles[event.id].length === 0 ? (
                              <p className="text-gray-500 text-xs py-1">No resources shared yet.</p>
                            ) : (
                              <div className="grid gap-1.5 mt-2">
                                {mediaFiles[event.id].map(file => {
                                  const Icon = getMediaIcon(file.fileType);
                                  return (
                                    <a
                                      key={file.id}
                                      href={file.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 px-2.5 py-2 bg-gray-700/30 rounded-lg hover:bg-gray-700/60 transition group"
                                    >
                                      <Icon className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-white text-xs font-medium truncate">{file.title}</p>
                                        <p className="text-gray-500 text-[10px] truncate">{file.fileName} {file.fileSize ? `• ${formatFileSize(file.fileSize)}` : ''}</p>
                                      </div>
                                      <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-purple-400 transition flex-shrink-0" />
                                    </a>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>

        {/* Past Events Section */}
        {pastEvents.length > 0 && (
          <div className="mb-6">
            <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" /> Past Events
            </h2>
            <div className="space-y-5">
              {pastEvents.map((event) => {
                const isDescExpanded = expandedDesc[event.id];
                const hasLongDesc = event.description && event.description.length > 120;
                const autoStatus = getAutoStatus(event);
                return (
                <div key={event.id} className="bg-gray-800/50 rounded-2xl overflow-hidden border border-gray-700/50 hover:border-gray-600/50 transition opacity-90">
                  {/* Event Card - Vertical on mobile, Horizontal on desktop */}
                  <div className="flex flex-col lg:flex-row">
                    {/* Event Poster - Full Display, Bigger */}
                    {event.posterUrl && (
                      <div className="lg:w-96 flex-shrink-0 bg-black">
                        <div className="aspect-[16/10] lg:aspect-auto lg:h-full">
                          <img
                            src={event.posterUrl}
                            alt={event.title}
                            className="w-full h-full object-contain"
                            onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Event Details */}
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="text-lg font-bold text-white">{event.title}</h3>
                        <span className="flex-shrink-0 px-2.5 py-1 text-xs rounded-full font-semibold uppercase tracking-wide bg-gray-600/20 text-gray-400 border border-gray-600/30">
                          {autoStatus}
                        </span>
                      </div>

                      {event.description && (
                        <div className="mb-4">
                          <p className={`text-gray-400 text-sm leading-relaxed whitespace-pre-wrap ${isDescExpanded ? '' : 'line-clamp-2'}`}>
                            {event.description}
                          </p>
                          {hasLongDesc && (
                            <button
                              onClick={() => setExpandedDesc(prev => ({ ...prev, [event.id]: !prev[event.id] }))}
                              className="text-purple-400 hover:text-purple-300 text-xs font-medium mt-1.5 flex items-center gap-1 transition"
                            >
                              {isDescExpanded ? <>Show less <ChevronUp className="w-3 h-3" /></> : <>Read more <ChevronDown className="w-3 h-3" /></>}
                            </button>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                        <div className="bg-gray-700/30 rounded-lg p-2.5 border border-gray-600/30">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Calendar className="w-3 h-3 text-purple-400" />
                            <span className="text-gray-500 text-[10px] uppercase font-medium">Start Date</span>
                          </div>
                          <p className="text-white text-sm font-semibold">{new Date(event.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          <p className="text-purple-300 text-xs">{new Date(event.eventDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                        </div>
                        {event.eventEndDate && (
                          <div className="bg-gray-700/30 rounded-lg p-2.5 border border-gray-600/30">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span className="text-gray-500 text-[10px] uppercase font-medium">End Time</span>
                            </div>
                            <p className="text-white text-sm font-semibold">{new Date(event.eventEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                            <p className="text-amber-300 text-xs">{new Date(event.eventEndDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                          </div>
                        )}
                        {event.venue && (
                          <div className={`bg-gray-700/30 rounded-lg p-2.5 border border-gray-600/30 ${event.eventEndDate ? 'col-span-2' : ''}`}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <MapPin className="w-3 h-3 text-blue-400" />
                              <span className="text-gray-500 text-[10px] uppercase font-medium">Venue</span>
                            </div>
                            <p className="text-white text-sm font-medium truncate">{event.venue}</p>
                          </div>
                        )}
                        {event.eventType && (
                          <div className={`bg-gray-700/30 rounded-lg p-2.5 border border-gray-600/30 ${!event.eventEndDate ? '' : 'col-span-2'}`}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <Tag className="w-3 h-3 text-green-400" />
                              <span className="text-gray-500 text-[10px] uppercase font-medium">Type</span>
                            </div>
                            <p className="text-white text-sm font-medium capitalize">{event.eventType}</p>
                          </div>
                        )}
                      </div>

                      {/* Media Files Section */}
                      <div className="border-t border-gray-700/50 pt-3">
                        <button
                          onClick={() => toggleMedia(event.id)}
                          className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300 transition font-medium group"
                        >
                          <FileText className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                          <span>Event Resources</span>
                          {expandedMedia[event.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {expandedMedia[event.id] && (
                          <div className="mt-2">
                            {!mediaFiles[event.id] ? (
                              <div className="flex items-center gap-2 text-gray-500 text-xs py-1">
                                <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                Loading...
                              </div>
                            ) : mediaFiles[event.id].length === 0 ? (
                              <p className="text-gray-500 text-xs py-1">No resources shared yet.</p>
                            ) : (
                              <div className="grid gap-1.5 mt-2">
                                {mediaFiles[event.id].map(file => {
                                  const Icon = getMediaIcon(file.fileType);
                                  return (
                                    <a
                                      key={file.id}
                                      href={file.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 px-2.5 py-2 bg-gray-700/30 rounded-lg hover:bg-gray-700/60 transition group"
                                    >
                                      <Icon className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-white text-xs font-medium truncate">{file.title}</p>
                                        <p className="text-gray-500 text-[10px] truncate">{file.fileName} {file.fileSize ? `• ${formatFileSize(file.fileSize)}` : ''}</p>
                                      </div>
                                      <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-purple-400 transition flex-shrink-0" />
                                    </a>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        )}

        {/* Quick Tips */}
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-lg p-4 text-xs text-gray-400">
          <span className="text-purple-400 font-medium">💡 Tips:</span>
          <span className="ml-2">Certificates appear after event completion • Quizzes are time-limited • Each quiz can only be attempted once</span>
        </div>
      </div>
    </div>
  );
}
