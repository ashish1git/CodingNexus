import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, MapPin, Users, Clock, ArrowRight, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const EVENT_TYPES = [
  { key: 'all', label: 'All Events', icon: '🎯' },
  { key: 'workshop', label: 'Workshops', icon: '🛠️' },
  { key: 'hackathon', label: 'Hackathons', icon: '💻' },
  { key: 'seminar', label: 'Seminars', icon: '🎓' },
  { key: 'competition', label: 'Competitions', icon: '🏆' },
  { key: 'webinar', label: 'Webinars', icon: '📹' }
];

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'ongoing', label: 'Live Now' },
  { key: 'completed', label: 'Past' }
];

// Auto-calculate status based on dates
const getAutoStatus = (event) => {
  const now = new Date();
  const startDate = new Date(event.eventDate);
  const endDate = event.eventEndDate ? new Date(event.eventEndDate) : null;

  // If event has ended (endDate passed), it's completed
  if (endDate && now > endDate) {
    return 'completed';
  }
  
  // If event is currently running (between start and end), it's ongoing/live
  if (endDate && now >= startDate && now <= endDate) {
    return 'ongoing';
  }
  
  // If no end date and start date passed, assume 3-hour duration
  if (!endDate && now > startDate) {
    const assumedEnd = new Date(startDate.getTime() + 3 * 60 * 60 * 1000); // 3 hours
    if (now <= assumedEnd) {
      return 'ongoing';
    }
    return 'completed';
  }
  
  // Event hasn't started yet
  return 'upcoming';
};

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [expandedDesc, setExpandedDesc] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/events/public/events`);
      setEvents(response.data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    const filtered = events.filter(event => {
      const matchesSearch = !searchQuery ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (event.venue && event.venue.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = selectedType === 'all' || event.eventType === selectedType;
      const autoStatus = getAutoStatus(event);
      const matchesStatus = selectedStatus === 'all' || autoStatus === selectedStatus;
      return matchesSearch && matchesType && matchesStatus;
    });

    // Sort events: ongoing first, then upcoming, then completed
    // Within each category, sort by event date (earliest first)
    return filtered.sort((a, b) => {
      const statusA = getAutoStatus(a);
      const statusB = getAutoStatus(b);
      
      // Status priority: ongoing > upcoming > completed
      const statusPriority = { ongoing: 0, upcoming: 1, completed: 2 };
      const priorityDiff = statusPriority[statusA] - statusPriority[statusB];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Same status: sort by event date (earliest first)
      return new Date(a.eventDate) - new Date(b.eventDate);
    });
  }, [events, searchQuery, selectedType, selectedStatus]);

  const getTimeUntil = (dateStr) => {
    const diff = new Date(dateStr) - new Date();
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const getRegistrationPercent = (event) => {
    if (!event.maxParticipants) return 0;
    return Math.min(100, Math.round((event.registeredCount / event.maxParticipants) * 100));
  };

  const isDeadlinePassed = (event) => new Date() > new Date(event.registrationDeadline);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] event-dark-theme">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/6 rounded-full blur-[100px]" />
      </div>

      {/* Top Navigation */}
      <nav className="relative z-20 bg-[#0d0d20]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition group"
            >
              <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Home</span>
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="text-white font-bold text-lg">Coding Nexus</span>
            </div>
            <button
              onClick={() => navigate('/event-login')}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-lg border border-white/10 hover:border-white/20 transition"
            >
              Event Login
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-12 pb-4 sm:pb-8">
          <div className="text-center mb-4 sm:mb-10">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-xs sm:text-sm font-medium mb-3 sm:mb-6">
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              Discover &amp; Register
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-2 sm:mb-4 tracking-tight">
              Upcoming <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">Events</span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-lg max-w-2xl mx-auto">
              Explore workshops, hackathons, and competitions. Expand your skills with hands-on experiences.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-4 sm:mb-8">
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events by name, description, or venue..."
                className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition text-sm"
              />
            </div>
          </div>

          {/* Type Filter Chips */}
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-3 sm:mb-6">
            {EVENT_TYPES.map(type => (
              <button
                key={type.key}
                onClick={() => setSelectedType(type.key)}
                className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  selectedType === type.key
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                <span className="mr-1 sm:mr-1.5">{type.icon}</span>
                {type.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex justify-center gap-1 mb-4 sm:mb-8">
            {STATUS_FILTERS.map(status => (
              <button
                key={status.key}
                onClick={() => setSelectedStatus(status.key)}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium transition ${
                  selectedStatus === status.key
                    ? 'bg-white/10 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {status.key === 'ongoing' && '● '}
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-20">
        <div className="flex items-center justify-between mb-3 sm:mb-6">
          <p className="text-gray-500 text-xs sm:text-sm">
            {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Events Found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {searchQuery
                ? `No events match "${searchQuery}". Try adjusting your filters.`
                : 'Check back soon for exciting new events!'}
            </p>
            {(searchQuery || selectedType !== 'all' || selectedStatus !== 'all') && (
              <button
                onClick={() => { setSearchQuery(''); setSelectedType('all'); setSelectedStatus('all'); }}
                className="mt-6 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
            {filteredEvents.map((event) => {
              const deadlinePassed = isDeadlinePassed(event);
              const regPercent = getRegistrationPercent(event);
              const timeUntil = getTimeUntil(event.eventDate);
              const isExpanded = expandedDesc[event.id];
              const autoStatus = getAutoStatus(event);

              return (
                <div
                  key={event.id}
                  className="group bg-gradient-to-br from-[#151530] to-[#0d0d20] rounded-3xl overflow-hidden border border-white/5 hover:border-purple-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-900/20 flex flex-col"
                >
                  {/* Banner Image - Larger */}
                  <div className="relative aspect-[2/1] overflow-hidden bg-gradient-to-br from-purple-900/50 to-blue-900/50">
                    {event.posterUrl ? (
                      <img
                        src={event.posterUrl}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-800/30 to-indigo-900/30">
                        <div className="text-center">
                          <span className="text-7xl block mb-3 drop-shadow-2xl">
                            {EVENT_TYPES.find(t => t.key === event.eventType)?.icon || '🎯'}
                          </span>
                          <span className="text-white/40 text-lg font-semibold capitalize tracking-wide">{event.eventType}</span>
                        </div>
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#151530] via-transparent to-transparent opacity-60" />

                    {/* Status Badge */}
                    <div className="absolute top-4 left-4">
                      <span className={`px-4 py-2 rounded-full text-sm font-bold backdrop-blur-xl shadow-lg ${
                        autoStatus === 'ongoing'
                          ? 'bg-green-500/90 text-white shadow-green-500/30'
                          : autoStatus === 'upcoming'
                          ? 'bg-blue-500/90 text-white shadow-blue-500/30'
                          : autoStatus === 'completed'
                          ? 'bg-gray-600/90 text-gray-200'
                          : 'bg-red-500/90 text-white shadow-red-500/30'
                      }`}>
                        {autoStatus === 'ongoing' && <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse mr-2" />}
                        {autoStatus.charAt(0).toUpperCase() + autoStatus.slice(1)}
                      </span>
                    </div>

                    {/* Countdown Badge */}
                    {timeUntil && autoStatus === 'upcoming' && (
                      <div className="absolute top-4 right-4">
                        <span className="px-4 py-2 bg-black/70 backdrop-blur-xl rounded-full text-sm font-bold text-yellow-300 border border-yellow-500/30 shadow-lg">
                          ⏱ {timeUntil}
                        </span>
                      </div>
                    )}

                    {/* Event Type Pill */}
                    <div className="absolute bottom-4 left-4">
                      <span className="px-4 py-2 bg-black/70 backdrop-blur-xl rounded-full text-sm font-semibold text-purple-200 capitalize border border-purple-500/20">
                        {EVENT_TYPES.find(t => t.key === event.eventType)?.icon} {event.eventType}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col p-6 sm:p-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight group-hover:text-purple-300 transition-colors duration-300">
                      {event.title}
                    </h2>

                    {/* Description */}
                    {event.description && (
                      <div className="mb-5">
                        <p className={`text-gray-400 text-base leading-relaxed whitespace-pre-wrap break-words ${isExpanded ? '' : 'line-clamp-3'}`}>
                          {event.description}
                        </p>
                        {event.description.length > 150 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedDesc(prev => ({ ...prev, [event.id]: !prev[event.id] }));
                            }}
                            className="text-purple-400 hover:text-purple-300 text-sm font-medium mt-2 flex items-center gap-1.5 transition"
                          >
                            {isExpanded ? (
                              <>Show less <ChevronUp className="w-4 h-4" /></>
                            ) : (
                              <>Read more <ChevronDown className="w-4 h-4" /></>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Event Info Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6 flex-1">
                      <div className="bg-white/3 rounded-2xl p-4 border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-white font-semibold">{formatDate(event.eventDate)}</p>
                            <p className="text-gray-500 text-sm">{formatTime(event.eventDate)}</p>
                          </div>
                        </div>
                      </div>

                      {event.venue && (
                        <div className="bg-white/3 rounded-2xl p-4 border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                              <MapPin className="w-5 h-5 text-blue-400" />
                            </div>
                            <p className="text-gray-300 text-sm font-medium truncate">{event.venue}</p>
                          </div>
                        </div>
                      )}

                      <div className="bg-white/3 rounded-2xl p-4 border border-white/5 col-span-2 sm:col-span-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-amber-400" />
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs">Registration Deadline</p>
                            <p className="text-white font-semibold text-sm">{formatDate(event.registrationDeadline)}</p>
                            <p className="text-gray-300 text-xs">{formatTime(event.registrationDeadline)}</p>
                            {deadlinePassed && <p className="text-red-400 text-xs font-semibold mt-0.5">Closed</p>}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/3 rounded-2xl p-4 border border-white/5 col-span-2 sm:col-span-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                            <Users className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <p className="text-white font-bold text-lg">{event.registeredCount}<span className="text-gray-500 font-normal">/{event.maxParticipants}</span></p>
                            {event.spotsLeft > 0 && event.spotsLeft <= 20 && (
                              <p className="text-amber-400 text-xs font-semibold">{event.spotsLeft} spots left!</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Registration Progress Bar */}
                    <div className="mb-6">
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            regPercent >= 90
                              ? 'bg-gradient-to-r from-red-500 to-orange-500 shadow-lg shadow-red-500/30'
                              : regPercent >= 60
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 shadow-lg shadow-amber-500/30'
                              : 'bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg shadow-purple-500/30'
                          }`}
                          style={{ width: `${regPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Button */}
                    {autoStatus === 'completed' ? (
                      <div className="w-full py-4 rounded-2xl bg-gray-600/20 text-gray-400 text-center text-base font-semibold border border-gray-500/20">
                        Event Ended
                      </div>
                    ) : autoStatus === 'ongoing' ? (
                      <div className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white text-center text-base font-bold shadow-xl shadow-green-600/30 flex items-center justify-center gap-2">
                        <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse" />
                        Event is Live Now!
                      </div>
                    ) : deadlinePassed ? (
                      <div className="w-full py-4 rounded-2xl bg-white/5 text-gray-500 text-center text-base font-semibold border border-white/5">
                        Registration Closed
                      </div>
                    ) : event.spotsLeft <= 0 ? (
                      <div className="w-full py-4 rounded-2xl bg-red-500/10 text-red-400 text-center text-base font-semibold border border-red-500/20">
                        Event Full
                      </div>
                    ) : (
                      <button
                        onClick={() => navigate(`/events/${event.id}/register`)}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 hover:from-purple-500 hover:via-purple-400 hover:to-blue-500 text-white text-base font-bold transition-all duration-300 flex items-center justify-center gap-2.5 group/btn shadow-xl shadow-purple-600/30 hover:shadow-purple-500/40 hover:-translate-y-0.5"
                      >
                        Register Now
                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} Coding Nexus. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
