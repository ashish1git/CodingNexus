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
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const QuizList = () => {
  const navigate = useNavigate();
  const { currentUser, userDetails } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('upcoming');

  // Fetch Quiz Attempts
  useEffect(() => {
    if (!currentUser?.uid) return;

    const fetchQuizAttempts = async () => {
      try {
        const response = await studentService.getQuizAttempts();
        if (response.success) {
          const attempts = response.data.map(attempt => ({
            ...attempt,
            submittedAt: attempt.submittedAt ? new Date(attempt.submittedAt) : new Date()
          }));
          setQuizAttempts(attempts);
          console.log('Quiz attempts loaded:', attempts.length);
        }
      } catch (error) {
        console.error("Error fetching quiz attempts:", error);
        toast.error("Failed to load quiz attempts");
      }
    };

    fetchQuizAttempts();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchQuizAttempts, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Fetch Quizzes
  useEffect(() => {
    if (!currentUser || !userDetails?.batch) {
      setLoading(false);
      return;
    }

    console.log('Fetching quizzes for batch:', userDetails.batch);
    
    const fetchQuizzes = async () => {
      setLoading(true);
      try {
        const response = await studentService.getQuizzes();
        if (response.success) {
          const list = response.data.map(quiz => ({
            ...quiz,
            startTime: quiz.startTime ? new Date(quiz.startTime) : new Date(),
            endTime: quiz.endTime ? new Date(quiz.endTime) : new Date()
          }));

          // Filter quizzes for student's batch
          const filteredByBatch = list.filter(quiz => {
            const quizBatch = quiz.batch?.trim();
            const studentBatch = userDetails.batch?.trim();
            
            // Show quiz if batch is "All" or matches student's batch
            const isForAllBatches = quizBatch?.toLowerCase() === 'all';
            const isForStudentBatch = quizBatch === studentBatch;
            
            return isForAllBatches || isForStudentBatch;
          });
          
          console.log('Total quizzes from API:', list.length);
          console.log('Filtered for batch', userDetails.batch, ':', filteredByBatch.length);
          
          // Sort by start time (newest first)
          const sortedList = filteredByBatch.sort((a, b) => b.startTime - a.startTime);
          
          setQuizzes(sortedList);
        }
      } catch (error) {
        console.error("Error fetching quizzes:", error);
        toast.error("Failed to load quizzes");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchQuizzes, 30000);
    return () => clearInterval(interval);
  }, [currentUser, userDetails]);

  const getQuizStatus = (quiz) => {
    const now = new Date();
    if (now >= quiz.startTime && now <= quiz.endTime) return 'active';
    if (now < quiz.startTime) return 'upcoming';
    return 'ended';
  };

  const getQuizAttempt = (quizId) => {
    return quizAttempts.find(attempt => attempt.quizId === quizId);
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
    const filtered = quizzes.filter(quiz => {
      const matchesSearch = quiz.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const status = getQuizStatus(quiz);
      const attempt = getQuizAttempt(quiz.id);
      
      if (viewMode === 'attempted') {
        // Show only quizzes that have been attempted
        return matchesSearch && attempt;
      } else {
        // Show only quizzes that haven't been attempted
        const matchesFilter = filterStatus === 'all' || filterStatus === status;
        return matchesSearch && matchesFilter && !attempt;
      }
    });

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
                <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest">{userDetails.batch} Batch</p>
              </div>
            </div>
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
                  : `There are no ${filterStatus !== 'all' ? filterStatus : ''} quizzes for ${userDetails.batch} batch at the moment.`}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default QuizList;