import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Trophy, Calendar, Clock, Users, Award, 
  Filter, Search, TrendingUp, Zap, Target, Medal,
  ChevronRight, Star, Code, CheckCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import competitionService from '../../services/competitionService';
import toast from 'react-hot-toast';
import Loading from '../shared/Loading';

const Competitions = () => {
  const [activeTab, setActiveTab] = useState('ongoing'); // ongoing, upcoming, past
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all'); // all, easy, medium, hard
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompetitions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filterDifficulty]);

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (activeTab !== 'all') filters.status = activeTab;
      if (filterDifficulty !== 'all') filters.difficulty = filterDifficulty;
      
      console.log('🔍 Fetching competitions with filters:', filters);
      const data = await competitionService.getAllCompetitions(filters);
      console.log('📊 Received data:', data);
      console.log('📊 Is array?', Array.isArray(data));
      console.log('📊 Data length:', data?.length);
      setCompetitions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Error fetching competitions:', error);
      toast.error('Failed to load competitions');
      setCompetitions([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (competitionId) => {
    try {
      await competitionService.registerForCompetition(competitionId);
      toast.success('Successfully registered!');
      fetchCompetitions(); // Refresh to update registration status
    } catch (error) {
      console.error('Error registering:', error);
      toast.error(error.response?.data?.error || 'Failed to register');
    }
  };

  // User stats - can be fetched from API later
  const userStats = {
    rating: 0,
    rank: 'Newbie',
    globalRank: '-',
    contestsParticipated: 0,
    problemsSolved: 0,
    badges: []
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-900/30 border-green-700/50';
      case 'medium': return 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50';
      case 'hard': return 'text-red-400 bg-red-900/30 border-red-700/50';
      default: return 'text-slate-400 bg-slate-900/30 border-slate-700/50';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ongoing': return 'text-green-400 bg-green-900/30 border-green-700/50';
      case 'upcoming': return 'text-blue-400 bg-blue-900/30 border-blue-700/50';
      case 'past': return 'text-slate-400 bg-slate-900/30 border-slate-700/50';
      default: return 'text-slate-400 bg-slate-900/30 border-slate-700/50';
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h left`;
    }
    return `${hours}h ${minutes}m left`;
  };

  const filteredCompetitions = (competitions || [])
    .filter(comp => 
      searchTerm === '' || 
      comp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800 shadow-lg border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/student/dashboard"
              className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <h1 className="text-xl sm:text-2xl font-bold text-white">Competitions</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* User Stats Card */}
        <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-xl p-6 mb-6 border border-indigo-700/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                <p className="text-2xl font-bold text-white">{userStats.rating}</p>
              </div>
              <p className="text-sm text-slate-400">Rating</p>
              <p className="text-xs text-indigo-400 font-semibold mt-1">{userStats.rank}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Medal className="w-5 h-5 text-yellow-400" />
                <p className="text-2xl font-bold text-white">#{userStats.globalRank}</p>
              </div>
              <p className="text-sm text-slate-400">Global Rank</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-green-400" />
                <p className="text-2xl font-bold text-white">{userStats.contestsParticipated}</p>
              </div>
              <p className="text-sm text-slate-400">Contests</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-purple-400" />
                <p className="text-2xl font-bold text-white">{userStats.problemsSolved}</p>
              </div>
              <p className="text-sm text-slate-400">Problems Solved</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-700">
            {userStats.badges.map((badge, idx) => (
              <span key={idx} className="px-3 py-1 bg-indigo-900/50 text-indigo-300 rounded-full text-xs font-medium border border-indigo-700/50 flex items-center gap-1">
                <Star className="w-3 h-3" />
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-slate-800 rounded-xl p-1 mb-6 border border-slate-700 inline-flex">
          <button
            onClick={() => setActiveTab('ongoing')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeTab === 'ongoing'
                ? 'bg-green-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Ongoing
            </div>
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeTab === 'upcoming'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Upcoming
            </div>
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeTab === 'past'
                ? 'bg-slate-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Past
            </div>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-slate-800 rounded-xl p-4 mb-6 border border-slate-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search competitions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Levels</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Competitions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCompetitions.map((competition) => (
            <div
              key={competition.id}
              className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-indigo-600/50 transition group"
            >
              {/* Competition Image */}
              <div className="h-40 bg-gradient-to-r from-indigo-600 to-purple-600 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Code className="w-16 h-16 text-white/20" />
                </div>
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(competition.status)}`}>
                    {competition.status.toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(competition.difficulty)}`}>
                    {competition.difficulty.toUpperCase()}
                  </span>
                </div>
                {competition.type === 'rated' && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-yellow-900/50 text-yellow-400 rounded-full text-xs font-semibold border border-yellow-700/50 flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      RATED
                    </span>
                  </div>
                )}
              </div>

              {/* Competition Details */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition">
                  {competition.title}
                </h3>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                  {competition.description}
                </p>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">{formatDateTime(competition.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">{competition.status === 'ongoing' ? getTimeRemaining(competition.endTime) : formatDateTime(competition.endTime)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">{competition.participantCount} participants</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">{competition.problemCount || 0} problems</span>
                  </div>
                </div>

                {/* Progress for registered competitions */}
                {competition.registered && (competition.status === 'ongoing' || competition.status === 'past') && (
                  <div className="mb-4 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">Your Progress</span>
                      <span className="text-xs font-semibold text-indigo-400">{competition.problemsSolved || 0}/{competition.problemCount || 0} solved</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${competition.problemCount > 0 ? ((competition.problemsSolved || 0) / competition.problemCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Prize and Category */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                  <div>
                    <p className="text-xs text-slate-500">Prize Pool</p>
                    <p className="text-lg font-bold text-yellow-400">{competition.prize}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Category</p>
                    <p className="text-sm font-semibold text-indigo-400">{competition.category}</p>
                  </div>
                </div>

                {/* Past Contest Results */}
                {competition.status === 'past' && competition.myRank && (
                  <div className="mt-4 p-3 bg-indigo-900/30 rounded-lg border border-indigo-700/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400">Your Rank</p>
                        <p className="text-xl font-bold text-white">#{competition.myRank}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500 mb-1">Problems Solved</p>
                        <p className="text-xl font-bold text-green-400">{competition.problemsSolved || 0}/{competition.problemCount || 0}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                {!competition.isRegistered && competition.status !== 'past' ? (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleRegister(competition.id);
                    }}
                    className="mt-4 w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Calendar className="w-5 h-5" />
                    Register Now
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : competition.hasSubmitted ? (
                  <div className="mt-4 flex gap-2">
                    <div className="flex-1 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 bg-slate-700 border-2 border-green-500/50 text-green-400 cursor-not-allowed">
                      <CheckCircle className="w-5 h-5" />
                      Attempted
                    </div>
                    <Link
                      to={`/student/competition/${competition.id}/results`}
                      className="flex-1 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Award className="w-5 h-5" />
                      View Results
                    </Link>
                  </div>
                ) : (
                  <Link
                    to={`/student/competition/${competition.id}`}
                    className={`mt-4 w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                      competition.status === 'ongoing'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : competition.status === 'upcoming'
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                  >
                    {competition.status === 'ongoing' && (
                      <>
                        <Code className="w-5 h-5" />
                        Continue Solving
                      </>
                    )}
                    {competition.status === 'upcoming' && (
                      <>
                        <Calendar className="w-5 h-5" />
                        View Details
                      </>
                    )}
                    {competition.status === 'past' && (
                      <>
                        <Award className="w-5 h-5" />
                        View Solutions
                      </>
                    )}
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCompetitions.length === 0 && (
          <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
            <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Competitions Found</h3>
            <p className="text-slate-400">
              {searchTerm
                ? 'Try adjusting your search or filters'
                : `No ${activeTab} competitions at the moment`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Competitions;
