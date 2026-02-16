import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import toast from 'react-hot-toast';

export default function EventDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeEvents, setActiveEvents] = useState([]);
  const [stats, setStats] = useState({ totalEvents: 0, quizzesAttempted: 0, certificatesEarned: 0 });
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black">
      {/* Header */}
      <div className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center py-3">
            <div className="text-lg sm:text-xl font-bold text-white">
              Coding Nexus <span className="text-purple-400">Events</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-gray-300 text-xs sm:text-sm hidden sm:block">
                Hey, <span className="text-white font-medium">{user?.name?.split(' ')[0]}</span>
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-red-600/80 text-white rounded-lg hover:bg-red-700 transition text-xs sm:text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl sm:rounded-2xl p-5 sm:p-8 mb-6 text-white">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1">Welcome, {user?.name?.split(' ')[0]}! 🎉</h1>
          <p className="text-purple-100 text-sm sm:text-base">
            Access your event quizzes, certificates, and resources here
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-gray-800 rounded-xl p-4 sm:p-5 border border-gray-700">
            <p className="text-gray-400 text-xs sm:text-sm mb-1">Events</p>
            <p className="text-2xl sm:text-3xl font-bold text-white">{stats.totalEvents}</p>
          </div>
          <button onClick={() => navigate('/event-dashboard/quizzes')} className="bg-gray-800 rounded-xl p-4 sm:p-5 border border-gray-700 hover:border-purple-500/50 transition text-left">
            <p className="text-gray-400 text-xs sm:text-sm mb-1">Quizzes Done</p>
            <p className="text-2xl sm:text-3xl font-bold text-white">{stats.quizzesAttempted}</p>
          </button>
          <button onClick={() => navigate('/event-dashboard/certificates')} className="bg-gray-800 rounded-xl p-4 sm:p-5 border border-gray-700 hover:border-purple-500/50 transition text-left">
            <p className="text-gray-400 text-xs sm:text-sm mb-1">Certificates</p>
            <p className="text-2xl sm:text-3xl font-bold text-white">{stats.certificatesEarned}</p>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => navigate('/event-dashboard/quizzes')}
            className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl p-4 sm:p-5 text-white hover:from-indigo-500 hover:to-indigo-700 transition group"
          >
            <div className="text-2xl sm:text-3xl mb-2">📝</div>
            <span className="font-semibold text-sm sm:text-base">My Quizzes</span>
            <p className="text-indigo-200 text-xs mt-1 hidden sm:block">Attempt event quizzes</p>
          </button>
          <button
            onClick={() => navigate('/event-dashboard/certificates')}
            className="bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl p-4 sm:p-5 text-white hover:from-amber-500 hover:to-amber-700 transition group"
          >
            <div className="text-2xl sm:text-3xl mb-2">🎓</div>
            <span className="font-semibold text-sm sm:text-base">Certificates</span>
            <p className="text-amber-200 text-xs mt-1 hidden sm:block">View & download certs</p>
          </button>
        </div>

        {/* Active Events */}
        <div className="mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Your Events</h2>

          {activeEvents.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-8 sm:p-12 text-center border border-gray-700">
              <div className="text-5xl mb-4">📅</div>
              <h3 className="text-lg font-semibold text-white mb-2">No Active Events</h3>
              <p className="text-gray-400 mb-5 text-sm">
                Check back during your registered event times!
              </p>
              <button
                onClick={() => navigate('/events')}
                className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
              >
                Browse Events
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {activeEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-purple-500/50 transition"
                >
                  {/* Poster + Info Layout */}
                  <div className="flex flex-col sm:flex-row">
                    {/* Event Poster */}
                    {event.posterUrl && (
                      <div className="sm:w-48 lg:w-56 flex-shrink-0">
                        <img
                          src={event.posterUrl}
                          alt={event.title}
                          className="w-full h-40 sm:h-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}

                    {/* Event Details */}
                    <div className="flex-1 p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-bold text-white mb-1 truncate">{event.title}</h3>
                          <span className={`inline-block px-2.5 py-0.5 text-xs rounded-full font-medium ${
                            event.status === 'ongoing'
                              ? 'bg-green-900/50 text-green-300 border border-green-600/30'
                              : 'bg-blue-900/50 text-blue-300 border border-blue-600/30'
                          }`}>
                            ● {event.status}
                          </span>
                        </div>
                      </div>

                      {event.description && (
                        <p className="text-gray-400 text-xs sm:text-sm mb-3 line-clamp-2">{event.description}</p>
                      )}

                      <div className="space-y-1.5 text-xs sm:text-sm mb-4">
                        <div className="flex items-center text-gray-300">
                          <span className="mr-2">📅</span>
                          <span>{new Date(event.eventDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                        {event.venue && (
                          <div className="flex items-center text-gray-300">
                            <span className="mr-2">📍</span>
                            <span>{event.venue}</span>
                          </div>
                        )}
                        {event.eventEndDate && (
                          <div className="flex items-center text-gray-300">
                            <span className="mr-2">⏰</span>
                            <span>Ends: {new Date(event.eventEndDate).toLocaleString('en-IN', { timeStyle: 'short' })}</span>
                          </div>
                        )}
                        {event.eventType && (
                          <div className="flex items-center text-gray-300">
                            <span className="mr-2">🎯</span>
                            <span className="capitalize">{event.eventType}</span>
                          </div>
                        )}
                      </div>


                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Notice */}
        <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="text-blue-400 text-lg flex-shrink-0">ℹ️</span>
            <div className="text-blue-200 text-xs sm:text-sm">
              <p className="font-medium mb-1">Quick Info</p>
              <ul className="space-y-0.5 text-blue-300/70">
                <li>• Certificates appear after event completion</li>
                <li>• Quizzes are time-limited — start when ready</li>
                <li>• Each quiz can only be attempted once</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
