import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Trophy, Calendar, Clock, Users, Award, 
  Filter, Search, TrendingUp, Zap, Target, Medal,
  ChevronRight, Star, Code, CheckCircle, Flame,
  Timer, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import competitionService from '../../services/competitionService';
import toast from 'react-hot-toast';

const Competitions = () => {
  const [activeTab, setActiveTab] = useState('ongoing'); // ongoing, upcoming, past
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all'); // all, easy, medium, hard
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const preloadedRef = useRef(false);

  // Preload Monaco + CompetitionProblems chunk on hover (reduces click-to-visible by ~3-5s)
  const preloadEditor = () => {
    if (preloadedRef.current) return;
    preloadedRef.current = true;
    import('./competition/CompetitionProblems');
  };

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

      const data = await competitionService.getAllCompetitions(filters);
      setCompetitions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Error fetching competitions:', error);
      toast.error('Failed to load competitions');
      setCompetitions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (competitionId) => {
    try {
      await competitionService.registerForCompetition(competitionId);
      toast.success('Successfully registered!');
      fetchCompetitions();
    } catch (error) {
      console.error('Error registering:', error);
      toast.error(error.response?.data?.error || 'Failed to register');
    }
  };

  const getDifficultyStyle = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
      case 'medium': return 'bg-amber-50 text-amber-700 ring-amber-200';
      case 'hard': return 'bg-rose-50 text-rose-700 ring-rose-200';
      default: return 'bg-gray-50 text-gray-600 ring-gray-200';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'ongoing': return 'bg-green-50 text-green-700 ring-green-200';
      case 'upcoming': return 'bg-blue-50 text-blue-700 ring-blue-200';
      case 'past': return 'bg-gray-100 text-gray-600 ring-gray-200';
      default: return 'bg-gray-100 text-gray-600 ring-gray-200';
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
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
    .filter(comp => comp.isVisible !== false)
    .filter(comp => 
      searchTerm === '' || 
      comp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const tabConfig = [
    { key: 'ongoing', label: 'Ongoing', icon: Zap, active: 'bg-green-600 text-white shadow-lg shadow-green-600/30' },
    { key: 'upcoming', label: 'Upcoming', icon: Calendar, active: 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' },
    { key: 'past', label: 'Past', icon: Award, active: 'bg-gray-800 text-white shadow-lg shadow-gray-800/30' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sticky Header */}
      <div className="bg-slate-900/80 backdrop-blur-md shadow-lg border-b border-slate-700/60 sticky top-0 z-40">
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
            <div className="w-10" /> {/* spacer for centering */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl mb-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 p-6 sm:p-10 text-white shadow-2xl">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-16 w-80 h-80 bg-purple-300/30 rounded-full blur-3xl" />
          </div>
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white/90 text-xs font-semibold mb-4 border border-white/20">
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                Coding Challenges
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-3">
                Sharpen your skills.
                <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400">Compete and climb.</span>
              </h2>
              <p className="text-indigo-100 text-sm sm:text-base mb-6 max-w-lg">
                Solve problems, race the clock, and see where you stand against your batchmates in live leaderboards.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveTab('ongoing')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 font-semibold text-sm shadow-lg hover:bg-indigo-50 transition active:scale-95"
                >
                  <Zap className="w-4 h-4" />
                  Join Ongoing
                </button>
                <button
                  onClick={() => setActiveTab('upcoming')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-900/50 text-white font-semibold text-sm border border-white/20 hover:bg-indigo-900/70 transition active:scale-95"
                >
                  <Calendar className="w-4 h-4" />
                  View Upcoming
                </button>
              </div>
            </div>

            {/* Live stats chips */}
            <div className="grid grid-cols-3 gap-3 md:w-72 shrink-0">
              <div className="rounded-xl bg-white/10 border border-white/15 backdrop-blur p-4 text-center">
                <TrendingUp className="w-5 h-5 mx-auto mb-1.5 text-emerald-300" />
                <p className="text-xl font-bold">{(competitions || []).length}</p>
                <p className="text-[11px] text-indigo-100 mt-0.5">{activeTab} contests</p>
              </div>
              <div className="rounded-xl bg-white/10 border border-white/15 backdrop-blur p-4 text-center">
                <Users className="w-5 h-5 mx-auto mb-1.5 text-cyan-300" />
                <p className="text-xl font-bold">
                  {(competitions || []).reduce((s, c) => s + (c.participantCount || 0), 0)}
                </p>
                <p className="text-[11px] text-indigo-100 mt-0.5">participants</p>
              </div>
              <div className="rounded-xl bg-white/10 border border-white/15 backdrop-blur p-4 text-center">
                <Code className="w-5 h-5 mx-auto mb-1.5 text-amber-300" />
                <p className="text-xl font-bold">
                  {(competitions || []).reduce((s, c) => s + (c.problemCount || 0), 0)}
                </p>
                <p className="text-[11px] text-indigo-100 mt-0.5">problems</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-slate-800/80 backdrop-blur rounded-xl p-1.5 mb-6 border border-slate-700 inline-flex w-full sm:w-auto overflow-x-auto">
          {tabConfig.map(({ key, label, icon: Icon, active }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 sm:px-6 py-2.5 rounded-lg font-medium transition flex items-center gap-2 whitespace-nowrap flex-1 sm:flex-none justify-center ${
                activeTab === key ? active : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-slate-800/80 backdrop-blur rounded-xl p-4 mb-8 border border-slate-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search competitions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400 shrink-0" />
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none cursor-pointer"
              >
                <option value="all">All Levels</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Skeleton Loader */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden animate-pulse">
                <div className="h-40 bg-slate-700" />
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-slate-700 rounded w-2/3" />
                  <div className="h-4 bg-slate-700 rounded w-full" />
                  <div className="h-4 bg-slate-700 rounded w-4/5" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-4 bg-slate-700 rounded" />
                    <div className="h-4 bg-slate-700 rounded" />
                  </div>
                  <div className="h-10 bg-slate-700 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Competitions Grid */}
        {!loading && filteredCompetitions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCompetitions.map((competition) => {
              return (
                <div
                  key={competition.id}
                  className="group bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-indigo-500/60 hover:shadow-2xl hover:shadow-indigo-900/30 hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Banner */}
                  <div className="h-36 sm:h-40 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-25">
                      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/40 rounded-full blur-2xl" />
                    </div>
                    <Code className="absolute right-6 bottom-4 w-16 h-16 text-white/15 group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ring-1 inline-flex items-center gap-1 ${getStatusStyle(competition.status)}`}>
                        {competition.status === 'ongoing' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                        {competition.status.toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ring-1 ${getDifficultyStyle(competition.difficulty)}`}>
                        {competition.difficulty.toUpperCase()}
                      </span>
                    </div>
                    {competition.type === 'rated' && (
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 bg-amber-100/90 text-amber-800 rounded-full text-xs font-semibold flex items-center gap-1 shadow">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          RATED
                        </span>
                      </div>
                    )}
                    {/* Time badge */}
                    <div className="absolute bottom-3 right-4">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur inline-flex items-center gap-1.5 ${
                        competition.status === 'ongoing'
                          ? 'bg-emerald-500/90 text-white'
                          : competition.status === 'upcoming'
                            ? 'bg-blue-500/90 text-white'
                            : 'bg-slate-900/60 text-slate-200'
                      }`}>
                        <Timer className="w-3.5 h-3.5" />
                        {competition.status === 'ongoing'
                          ? getTimeRemaining(competition.endTime)
                          : formatDateTime(competition.endTime)}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-5 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition line-clamp-1">
                      {competition.title}
                    </h3>
                    <p className="text-slate-400 text-sm mb-5 line-clamp-2 leading-relaxed">
                      {competition.description}
                    </p>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-5">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="text-slate-300 text-xs sm:text-sm">{formatDateTime(competition.startTime)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="text-slate-300 text-xs sm:text-sm">{competition.participantCount} participants</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-slate-300 text-xs sm:text-sm">{competition.status === 'ongoing' ? getTimeRemaining(competition.endTime) : formatDateTime(competition.endTime)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="text-slate-300 text-xs sm:text-sm">{competition.problemCount || 0} problems</span>
                      </div>
                    </div>

                    {/* Progress for registered competitions */}
                    {competition.isRegistered && (competition.status === 'ongoing' || competition.status === 'past') && (
                      <div className="mb-5 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-400">Your Progress</span>
                          <span className="text-xs font-semibold text-indigo-300">{competition.problemsSolved || 0}/{competition.problemCount || 0} solved</span>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${competition.problemCount > 0 ? ((competition.problemsSolved || 0) / competition.problemCount) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Prize + Category */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Prize Pool</p>
                        <p className="text-base sm:text-lg font-bold text-amber-400">{competition.prize || '—'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 mb-0.5">Category</p>
                        <p className="text-sm font-semibold text-indigo-300 capitalize">{competition.category || 'general'}</p>
                      </div>
                    </div>

                    {/* Past Rank */}
                    {competition.status === 'past' && competition.myRank && (
                      <div className="mt-4 p-3 bg-indigo-900/40 rounded-lg border border-indigo-700/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Medal className="w-5 h-5 text-amber-400" />
                          <p className="text-xs text-slate-400">Your Rank</p>
                        </div>
                        <p className="text-xl font-bold text-white">#{competition.myRank}</p>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="mt-5">
                      {!competition.isRegistered && competition.status !== 'past' ? (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleRegister(competition.id);
                          }}
                          className="w-full py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.98] shadow-lg shadow-indigo-900/30"
                        >
                          <Calendar className="w-5 h-5" />
                          Register Now
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      ) : competition.hasSubmitted ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <div className="flex-1 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 bg-slate-700/60 border border-emerald-500/40 text-emerald-400 cursor-not-allowed">
                            <CheckCircle className="w-5 h-5" />
                            Attempted
                          </div>
                          <Link
                            to={`/student/competition/${competition.id}/results`}
                            className="flex-1 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.98]"
                          >
                            <Award className="w-5 h-5" />
                            View Results
                          </Link>
                        </div>
                      ) : (
                        <Link
                          to={competition.status === "upcoming" ? "#" : `/student/competition/${competition.id}`}
                          onMouseEnter={competition.status === 'ongoing' ? preloadEditor : undefined}
                          onClick={(e) => {
                            if (competition.status === "upcoming") {
                              e.preventDefault();
                              toast("📖 Competition is read-only until it starts");
                            }
                          }}
                          className={`w-full py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 active:scale-[0.98] ${
                            competition.status === 'ongoing'
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/30'
                              : competition.status === 'upcoming'
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/30'
                                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                          }`}
                        >
                          {competition.status === 'ongoing' && (<><Code className="w-5 h-5" /> Continue Solving</>)}
                          {competition.status === 'upcoming' && (<><Calendar className="w-5 h-5" /> View Details</>)}
                          {competition.status === 'past' && (<><Award className="w-5 h-5" /> View Solutions</>)}
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredCompetitions.length === 0 && (
          <div className="bg-slate-800 rounded-2xl p-10 sm:p-14 text-center border border-slate-700">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-700/50 flex items-center justify-center mb-5">
              <Trophy className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {searchTerm || filterDifficulty !== 'all' ? 'No Matches Found' : `No ${activeTab} competitions right now`}
            </h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              {searchTerm || filterDifficulty !== 'all'
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : activeTab === 'ongoing'
                  ? 'There are no live competitions at the moment. Check back soon or explore upcoming ones.'
                  : activeTab === 'upcoming'
                    ? 'New competitions are being prepared. Stay tuned!'
                    : 'No past competitions yet — participate in one to see results here.'}
            </p>
            {(searchTerm || filterDifficulty !== 'all') && (
              <button
                onClick={() => { setSearchTerm(''); setFilterDifficulty('all'); }}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Competitions;
