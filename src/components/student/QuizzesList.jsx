import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Award, 
  Clock, 
  Calendar, 
  ChevronRight, 
  Search, 
  Filter,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle,
  FileText,
  Eye,
  BarChart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { studentService } from '../../services/studentService';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const QuizList = () => {
  const navigate = useNavigate();
  const { currentUser, userDetails } = useAuth();
  const [refreshAttempted, setRefreshAttempted] = useState(false); // Prevent infinite refresh loops
  
  // Debug: Log user details on component mount ONCE
  useEffect(() => {
    console.log('🔍 QuizList - User Details:', {
      hasCurrentUser: !!currentUser,
      hasUserDetails: !!userDetails,
      batch: userDetails?.batch,
      name: userDetails?.name,
      email: userDetails?.email,
      role: userDetails?.role
    });
    
    // If user is logged in but batch is missing, clear cache and force refresh (ONCE only)
    if (currentUser && userDetails && !userDetails.batch && !refreshAttempted) {
      console.log('⚠️ Batch missing! Clearing cache and fetching fresh data...');
      setRefreshAttempted(true); // Mark that we've attempted refresh to prevent loops
      
      // Clear localStorage and fetch fresh
      const token = localStorage.getItem('token');
      if (token) {
        // Keep token but clear user data
        localStorage.removeItem('user');
        
        // Fetch fresh data
        authService.getCurrentUser().then(freshUser => {
          if (freshUser && freshUser.batch) {
            console.log('✅ Fresh user data loaded with batch:', freshUser.batch);
            toast.success(`Loaded profile for ${freshUser.name} (${freshUser.batch})`);
            // Force page reload to update context
            setTimeout(() => window.location.reload(), 500);
          } else {
            console.error('❌ Fresh user data still missing batch:', freshUser);
            toast.error('Your profile is missing batch information. Please contact admin.');
          }
        }).catch(err => {
          console.error('❌ Failed to fetch fresh user:', err);
          toast.error('Failed to load profile. Please try logging in again.');
        });
      }
    }
  }, []); // Run once on mount only to prevent infinite loops

  // Function to refresh user data
  const refreshUserData = async () => {
    try {
      const freshUser = await authService.getCurrentUser();
      if (freshUser && freshUser.batch) {
        console.log('✅ User data refreshed with batch:', freshUser.batch);
        // The AuthContext should update automatically
        window.location.reload(); // Force reload to get updated context
      }
    } catch (error) {
      console.error('❌ Failed to refresh user data:', error);
    }
  };
  
  const [quizzes, setQuizzes] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('upcoming');

  // Refresh data when component becomes visible (e.g., after completing a quiz or switching tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && currentUser && userDetails?.batch) {
        console.log('🔄 Page visible again, refreshing data...');
        fetchQuizAttempts();
        // Refetch quizzes to get latest status
        const fetchQuizzes = async () => {
          try {
            const response = await studentService.getQuizzes();
            if (response.success) {
              const list = response.data.map(quiz => ({
                ...quiz,
                startTime: quiz.startTime ? new Date(quiz.startTime) : new Date(),
                endTime: quiz.endTime ? new Date(quiz.endTime) : new Date()
              }));
              const filteredByBatch = list.filter(quiz => {
                const quizBatch = quiz.batch?.trim();
                const studentBatch = userDetails.batch?.trim();
                const isForAllBatches = quizBatch?.toLowerCase() === 'all';
                const isForStudentBatch = quizBatch === studentBatch;
                return isForAllBatches || isForStudentBatch;
              });
              const sortedList = filteredByBatch.sort((a, b) => b.startTime - a.startTime);
              setQuizzes(sortedList);
            }
          } catch (error) {
            console.error('❌ Error refreshing quizzes:', error);
          }
        };
        fetchQuizzes();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []); // Run once on mount to avoid re-registering event listener

  // Fetch Quiz Attempts
  const fetchQuizAttempts = async () => {
    if (!currentUser) {
      console.log('⚠️ No user logged in, cannot fetch quiz attempts');
      return;
    }

    try {
      const response = await studentService.getQuizAttempts();
      if (response.success) {
        const attempts = response.data.map(attempt => ({
          ...attempt,
          submittedAt: attempt.submittedAt ? new Date(attempt.submittedAt) : new Date()
        }));
        setQuizAttempts(attempts);
        console.log('✅ Quiz attempts loaded:', attempts.length);
      }
    } catch (error) {
      console.error("❌ Error fetching quiz attempts:", error);
      toast.error("Failed to load quiz attempts");
    }
  };

  // Fetch Quiz Attempts on mount (no polling to reduce server load)
  useEffect(() => {
    fetchQuizAttempts();
  }, []);

  // Fetch Quizzes
  useEffect(() => {
    if (!currentUser || !userDetails?.batch) {
      console.log('⚠️ Cannot fetch quizzes:', { hasUser: !!currentUser, hasBatch: !!userDetails?.batch });
      setLoading(false);
      return;
    }

    console.log('📚 Fetching quizzes for batch:', userDetails.batch);
    
    const fetchQuizzes = async () => {
      setLoading(true);
      try {
        const response = await studentService.getQuizzes();
        console.log('📥 Quiz fetch response:', { success: response.success, count: response.data?.length });
        
        if (response.success) {
          const list = response.data.map(quiz => ({
            ...quiz,
            startTime: quiz.startTime ? new Date(quiz.startTime) : new Date(),
            endTime: quiz.endTime ? new Date(quiz.endTime) : new Date()
          }));

          console.log('📋 Total quizzes received:', list.length);

          // Filter quizzes for student's batch
          const filteredByBatch = list.filter(quiz => {
            const quizBatch = quiz.batch?.trim();
            const studentBatch = userDetails.batch?.trim();
            
            // Show quiz if batch is "All" or matches student's batch
            const isForAllBatches = quizBatch?.toLowerCase() === 'all';
            const isForStudentBatch = quizBatch === studentBatch;
            
            return isForAllBatches || isForStudentBatch;
          });
          
          console.log(`✅ Filtered quizzes for "${userDetails.batch}":`, filteredByBatch.length);
          
          // Sort by start time (newest first)
          const sortedList = filteredByBatch.sort((a, b) => b.startTime - a.startTime);
          
          setQuizzes(sortedList);
        } else {
          console.error('❌ Failed to fetch quizzes:', response.error);
          toast.error(response.error || "Failed to load quizzes");
        }
      } catch (error) {
        console.error("❌ Error fetching quizzes:", error);
        toast.error("Failed to load quizzes");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []); // Run once on mount (no polling to reduce server load)

  const getQuizStatus = (quiz) => {
    const now = new Date();
    if (now >= quiz.startTime && now <= quiz.endTime) return 'active';
    if (now < quiz.startTime) return 'upcoming';
    return 'ended';
  };

  const getQuizAttempt = (quizId) => {
    const attempt = quizAttempts.find(attempt => attempt.quizId === quizId);
    if (!attempt) return null;
    
    // Calculate derived fields if not present
    return {
      ...attempt,
      totalQuestions: attempt.maxScore || 0,
      percentage: attempt.maxScore > 0 
        ? Math.round((attempt.score / attempt.maxScore) * 100) 
        : 0
    };
  };

  const handleQuizClick = (quiz) => {
    const status = getQuizStatus(quiz);
    const attempt = getQuizAttempt(quiz.id);
    
    if (attempt) {
      // Navigate to quiz results
      console.log('Navigating to results for quiz:', quiz.id);
      navigate(`/student/quiz/results/${quiz.id}`);
    } else if (status === 'active') {
      // Navigate to quiz attempt page
      console.log('Navigating to attempt quiz:', quiz.id);
      navigate(`/student/quiz/${quiz.id}`);
    } else if (status === 'upcoming') {
      toast.error("This quiz hasn't started yet");
    } else {
      toast.error("This quiz has ended");
    }
  };

  // FIXED: Calculate attempted quizzes count from filtered quizzes that match student's batch
  const attemptedQuizzesCount = useMemo(() => {
    // Get unique quiz IDs that have been attempted
    const attemptedQuizIds = new Set(quizAttempts.map(attempt => attempt.quizId));
    
    // Count only quizzes from the filtered list that have been attempted
    const count = quizzes.filter(quiz => attemptedQuizIds.has(quiz.id)).length;
    
    console.log('Attempted quizzes count calculation:', {
      totalAttempts: quizAttempts.length,
      uniqueAttemptedQuizIds: attemptedQuizIds.size,
      filteredQuizzesInBatch: quizzes.length,
      attemptedQuizzesInBatch: count
    });
    
    return count;
  }, [quizzes, quizAttempts]);

  const filteredQuizzes = useMemo(() => {
    let filtered = [];
    
    if (viewMode === 'attempted') {
      // For attempted view, show all quizzes that have attempts
      const attemptedQuizIds = new Set(quizAttempts.map(a => a.quizId));
      
      // Filter quizzes that have been attempted
      filtered = quizzes.filter(quiz => {
        const matchesSearch = quiz.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const hasAttempt = attemptedQuizIds.has(quiz.id);
        return matchesSearch && hasAttempt;
      });
      
      console.log('📊 Attempted quizzes filter:', {
        totalQuizzes: quizzes.length,
        totalAttempts: quizAttempts.length,
        attemptedQuizIds: Array.from(attemptedQuizIds),
        matchedQuizzes: filtered.length
      });
    } else {
      // For upcoming view, show ALL quizzes (including attempted ones) but mark them differently
      filtered = quizzes.filter(quiz => {
        const matchesSearch = quiz.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const status = getQuizStatus(quiz);
        const matchesFilter = filterStatus === 'all' || filterStatus === status;
        return matchesSearch && matchesFilter;
      });
    }

    console.log('Filtered quizzes:', {
      viewMode,
      searchTerm,
      filterStatus,
      resultCount: filtered.length
    });

    return filtered;
  }, [quizzes, searchTerm, filterStatus, viewMode, quizAttempts]);

  if (!userDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading user details...</p>
        </div>
      </div>
    );
  }

  // Show message if not logged in
  if (!currentUser || !userDetails) {
    console.log('🔴 Not logged in or no user details:', { currentUser: !!currentUser, userDetails: !!userDetails });
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-700 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Not Logged In</h2>
          <p className="text-slate-300 mb-6">You need to log in as a student to view quizzes.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20">
      {/* Header */}
      <div className="bg-slate-800 shadow-lg border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/student/dashboard')}
                className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-300"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Quizzes</h1>
                <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest">{userDetails?.batch || 'Unknown'} Batch</p>
              </div>
            </div>
            <button
              onClick={() => {
                fetchQuizAttempts();
                // Refetch quizzes
                const refreshQuizzes = async () => {
                  setLoading(true);
                  try {
                    const response = await studentService.getQuizzes();
                    if (response.success) {
                      const list = response.data.map(quiz => ({
                        ...quiz,
                        startTime: quiz.startTime ? new Date(quiz.startTime) : new Date(),
                        endTime: quiz.endTime ? new Date(quiz.endTime) : new Date()
                      }));
                      const filteredByBatch = list.filter(quiz => {
                        const quizBatch = quiz.batch?.trim();
                        const studentBatch = userDetails.batch?.trim();
                        const isForAllBatches = quizBatch?.toLowerCase() === 'all';
                        const isForStudentBatch = quizBatch === studentBatch;
                        return isForAllBatches || isForStudentBatch;
                      });
                      const sortedList = filteredByBatch.sort((a, b) => b.startTime - a.startTime);
                      setQuizzes(sortedList);
                      toast.success('Quizzes refreshed!');
                    }
                  } catch (error) {
                    console.error('❌ Error refreshing:', error);
                    toast.error('Failed to refresh');
                  } finally {
                    setLoading(false);
                  }
                };
                refreshQuizzes();
              }}
              className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-300 hover:text-indigo-400"
              title="Refresh quizzes"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toggle View Mode with FIXED count */}
        <div className="flex gap-2 p-1 bg-slate-800 rounded-xl border border-slate-700 shadow-sm mb-6">
          <button
            onClick={() => setViewMode('upcoming')}
            className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              viewMode === 'upcoming' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Upcoming Quizzes
          </button>
          <button
            onClick={() => setViewMode('attempted')}
            className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              viewMode === 'attempted' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-slate-400 hover:bg-slate-700'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Attempted Quizzes ({attemptedQuizzesCount})
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-white placeholder-slate-400"
            />
          </div>
          {viewMode === 'upcoming' && (
            <div className="flex gap-2 p-1 bg-slate-800 border border-slate-700 rounded-xl shadow-sm">
              {['all', 'active', 'upcoming', 'ended'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    filterStatus === status 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quiz List */}
        {loading ? (
          <div className="text-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-400" />
            <p className="font-medium text-slate-300">Loading quizzes...</p>
          </div>
        ) : filteredQuizzes.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredQuizzes.map((quiz) => {
              const status = getQuizStatus(quiz);
              const attempt = getQuizAttempt(quiz.id);
              
              return (
                <div
                  key={quiz.id}
                  onClick={() => handleQuizClick(quiz)}
                  className="group bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-lg hover:border-slate-600 hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg ${
                          attempt ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/30' :
                          status === 'active' ? 'bg-blue-900/30 text-blue-400 border border-blue-700/30' : 
                          status === 'upcoming' ? 'bg-purple-900/30 text-purple-400 border border-purple-700/30' : 
                          'bg-slate-700 text-slate-400 border border-slate-600'
                        }`}>
                          {attempt ? <CheckCircle className="w-6 h-6" /> : <Award className="w-6 h-6" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                            {quiz.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className={`text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                              attempt ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50' :
                              status === 'active' ? 'bg-blue-900/50 text-blue-300 border border-blue-700/50 animate-pulse' : 
                              status === 'upcoming' ? 'bg-purple-900/50 text-purple-300 border border-purple-700/50' : 
                              'bg-slate-700 text-slate-400 border border-slate-600'
                            }`}>
                              {attempt ? 'Completed' : status}
                            </span>
                            {/* Show "Already Attempted" badge for active quizzes that have been attempted */}
                            {!attempt && status === 'active' && getQuizAttempt(quiz.id) && (
                              <span className="text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-orange-900/50 text-orange-300 border border-orange-700/50">
                                ✓ Already Attempted
                              </span>
                            )}
                            {/* Show "Live - Attempt Again" for truly active quizzes without attempt */}
                            {!attempt && status === 'active' && !getQuizAttempt(quiz.id) && (
                              <span className="text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-green-900/50 text-green-300 border border-green-700/50 animate-pulse">
                                🔴 Live Now
                              </span>
                            )}
                            <span className="text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-indigo-900/50 text-indigo-300 border border-indigo-700/50">
                              {quiz.batch}
                            </span>
                            {attempt && (
                              <span className="text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-amber-900/50 text-amber-300 border border-amber-700/50">
                                Score: {attempt.score}/{attempt.totalQuestions} ({attempt.percentage}%)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                        <div className="flex items-center gap-2 text-slate-400 font-semibold text-xs">
                          <Clock className="w-4 h-4" />
                          <span>{quiz.duration || 60} Minutes</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 font-semibold text-xs">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {quiz.startTime.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric' 
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 font-semibold text-xs">
                          <Award className="w-4 h-4" />
                          <span>{quiz.questions?.length || 0} Questions</span>
                        </div>
                        {attempt && (
                          <div className="flex items-center gap-2 text-slate-400 font-semibold text-xs">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Submitted: {attempt.submittedAt.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {attempt ? (
                        <button className="w-full md:w-auto px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                          <Eye className="w-4 h-4" />
                          View Results
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : getQuizAttempt(quiz.id) ? (
                        // Show for already attempted quizzes that are still active
                        <button 
                          className="w-full md:w-auto px-6 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.info("You've already attempted this quiz. Click to view results.");
                            handleQuizClick(quiz);
                          }}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Already Attempted
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : status === 'active' ? (
                        <button className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                          <FileText className="w-4 h-4" />
                          Attempt Now
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : status === 'upcoming' ? (
                        <div className="text-center md:text-right">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Starts at</p>
                          <p className="text-sm font-bold text-purple-300">
                            {quiz.startTime.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                          </p>
                        </div>
                      ) : (
                        <button className="w-full md:w-auto px-6 py-3 bg-slate-700 text-slate-400 font-bold rounded-xl cursor-not-allowed">
                          Closed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 bg-slate-800 rounded-xl border border-dashed border-slate-700">
            <Award className="w-16 h-16 text-slate-600 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">No quizzes found</h3>
            <p className="text-slate-400 max-w-xs mx-auto">
              {viewMode === 'attempted' 
                ? "You haven't attempted any quizzes yet." 
                : searchTerm 
                  ? "No quizzes match your search criteria."
                  : `There are no ${filterStatus !== 'all' ? filterStatus : ''} quizzes for ${userDetails?.batch || 'your'} batch at the moment.`}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default QuizList;