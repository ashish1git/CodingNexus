import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, AlertCircle, ArrowLeft, Award, Calendar, Timer, RefreshCw } from 'lucide-react';
import { eventService } from '../../services/eventService';
import toast from 'react-hot-toast';

export default function EventQuizList() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, upcoming, attempted

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await eventService.getQuizzes();
      if (response.success) {
        setQuizzes(response.quizzes || []);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const getQuizStatus = (quiz) => {
    const now = new Date();
    const start = new Date(quiz.startTime);
    const end = new Date(quiz.endTime);
    if (quiz.attempted) return 'attempted';
    if (now < start) return 'upcoming';
    if (now > end) return 'ended';
    return 'active';
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'active': return 'bg-green-900/40 text-green-300 border-green-600/30';
      case 'upcoming': return 'bg-blue-900/40 text-blue-300 border-blue-600/30';
      case 'ended': return 'bg-gray-700/40 text-gray-400 border-gray-600/30';
      case 'attempted': return 'bg-purple-900/40 text-purple-300 border-purple-600/30';
      default: return 'bg-gray-700/40 text-gray-400 border-gray-600/30';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return '● Live Now';
      case 'upcoming': return '◷ Upcoming';
      case 'ended': return '✕ Ended';
      case 'attempted': return '✓ Completed';
      default: return status;
    }
  };

  const filteredQuizzes = quizzes.filter(q => {
    const status = getQuizStatus(q);
    if (filter === 'all') return true;
    if (filter === 'active') return status === 'active';
    if (filter === 'upcoming') return status === 'upcoming';
    if (filter === 'attempted') return status === 'attempted';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black event-dark-theme">
      {/* Header */}
      <nav className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/event-dashboard')}
            className="flex items-center gap-2 text-gray-300 hover:text-purple-400 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline text-sm">Back to Dashboard</span>
          </button>
          <h1 className="text-lg font-bold text-white">Event Quizzes</h1>
          <button onClick={fetchQuizzes} className="text-gray-400 hover:text-white transition">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'active', 'upcoming', 'attempted'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {filteredQuizzes.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
            <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Quizzes Found</h3>
            <p className="text-gray-400">
              {filter === 'all'
                ? 'No quizzes available for your events yet.'
                : `No ${filter} quizzes right now.`}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredQuizzes.map(quiz => {
              const status = getQuizStatus(quiz);
              return (
                <div
                  key={quiz.id}
                  className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-purple-500/50 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-bold text-white truncate">{quiz.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyle(status)}`}>
                          {getStatusLabel(status)}
                        </span>
                      </div>
                      {quiz.description && (
                        <p className="text-gray-400 text-sm mb-2 line-clamp-2">{quiz.description}</p>
                      )}
                      <p className="text-gray-500 text-xs mb-2">Event: {quiz.eventTitle}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(quiz.startTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Timer className="w-4 h-4" />
                          {quiz.duration} min
                        </span>
                      </div>
                      {status === 'attempted' && quiz.attemptScore !== null && (
                        <div className="mt-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-green-400 font-medium text-sm">
                            Score: {quiz.attemptScore}/{quiz.attemptMaxScore}
                            ({Math.round((quiz.attemptScore / quiz.attemptMaxScore) * 100)}%)
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-col gap-2 sm:items-end flex-shrink-0">
                      {status === 'active' && (
                        <button
                          onClick={() => navigate(`/event-dashboard/quiz/${quiz.id}`)}
                          className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium whitespace-nowrap"
                        >
                          Start Quiz →
                        </button>
                      )}
                      {status === 'attempted' && (
                        <button
                          onClick={() => navigate(`/event-dashboard/quiz/${quiz.id}/results`)}
                          className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium whitespace-nowrap"
                        >
                          View Results
                        </button>
                      )}
                      {status === 'upcoming' && (
                        <div className="px-5 py-2.5 bg-gray-700 text-gray-400 rounded-lg text-sm font-medium">
                          Starts {new Date(quiz.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                      )}
                      {status === 'ended' && (
                        <div className="px-5 py-2.5 bg-gray-700 text-gray-500 rounded-lg text-sm font-medium">
                          Quiz Ended
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
