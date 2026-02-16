import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return badges[status] || badges.upcoming;
  };

  const getEventTypeBadge = (type) => {
    const badges = {
      workshop: '🛠️ Workshop',
      hackathon: '💻 Hackathon',
      seminar: '🎓 Seminar',
      competition: '🏆 Competition',
      webinar: '📹 Webinar'
    };
    return badges[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black py-12 px-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            Coding Nexus <span className="text-purple-400">Events</span>
          </h1>
          <p className="text-gray-300 text-lg">
            Join our exciting events and expand your knowledge
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition transform hover:scale-105 duration-200"
          >
            ← Back to Home
          </button>
          <button
            onClick={() => navigate('/event-login')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition transform hover:scale-105 duration-200"
          >
            Event Login
          </button>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-7xl mx-auto">
        {events.length === 0 ? (
          <div className="text-center text-gray-400 py-20">
            <p className="text-2xl mb-4">📅 No upcoming events</p>
            <p>Check back soon for exciting new events!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-gray-700"
              >
                {/* Event Poster */}
                {event.posterUrl ? (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={event.posterUrl}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    <span className="text-6xl">🎯</span>
                  </div>
                )}

                {/* Event Details */}
                <div className="p-6">
                  {/* Title */}
                  <h2 className="text-2xl font-bold text-white mb-3 line-clamp-2">
                    {event.title}
                  </h2>

                  {/* Type and Status */}
                  <div className="flex gap-2 mb-3">
                    <span className="px-3 py-1 bg-purple-900 text-purple-200 text-sm rounded-full">
                      {getEventTypeBadge(event.eventType)}
                    </span>
                    <span className={`px-3 py-1 text-sm rounded-full ${getStatusBadge(event.status)}`}>
                      {event.status}
                    </span>
                  </div>

                  {/* Description */}
                  {event.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                      {event.description}
                    </p>
                  )}

                  {/* Event Info */}
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center text-gray-300">
                      <span className="mr-2">📅</span>
                      <span>{new Date(event.eventDate).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}</span>
                    </div>
                    
                    {event.venue && (
                      <div className="flex items-center text-gray-300">
                        <span className="mr-2">📍</span>
                        <span>{event.venue}</span>
                      </div>
                    )}

                    <div className="flex items-center text-gray-300">
                      <span className="mr-2">👥</span>
                      <span>
                        {event.registeredCount}/{event.maxParticipants} registered
                        {event.spotsLeft > 0 && (
                          <span className="text-green-400 ml-2">
                            ({event.spotsLeft} spots left)
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center text-gray-300">
                      <span className="mr-2">⏰</span>
                      <span>
                        Deadline: {new Date(event.registrationDeadline).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  {new Date() > new Date(event.registrationDeadline) ? (
                    <div className="w-full bg-gradient-to-r from-red-900 to-red-800 text-red-100 py-3 rounded-lg font-semibold text-center border-2 border-red-700">
                      ⏱️ Registration Closed
                    </div>
                  ) : event.spotsLeft > 0 ? (
                    <button
                      onClick={() => navigate(`/events/${event.id}/register`)}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 active:from-purple-800 active:to-pink-800 text-white py-3 rounded-lg font-bold transition duration-200 transform hover:scale-105 shadow-lg"
                    >
                      ✓ Register Now
                    </button>
                  ) : (
                    <div className="w-full bg-gradient-to-r from-gray-700 to-gray-600 text-gray-200 py-3 rounded-lg font-semibold text-center border-2 border-gray-500">
                      🚫 Event Full
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
