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

// Firebase Imports
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithCustomToken 
} from 'firebase/auth';

// --- Firebase Configuration & Initialization ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {};

// Prevent duplicate app initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

/**
 * Custom Toast Component for feedback
 */
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg z-50 animate-in slide-in-from-bottom-2 ${
      type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'
    }`}>
      <AlertCircle className="w-5 h-5" />
      <p className="text-sm font-semibold">{message}</p>
      <button onClick={onClose} className="p-1 hover:bg-black/5 rounded">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, upcoming, ended
  const [toasts, setToasts] = useState([]);
  const [viewMode, setViewMode] = useState('upcoming'); // upcoming, attempted

  // Mock student details
  const userDetails = useMemo(() => ({
    name: user?.displayName || "Student",
    batch: "Basic",
    moodleId: "STU12345",
    uid: user?.uid || "temp-user-id"
  }), [user]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Auth Initialization
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Fetch Quiz Attempts
  useEffect(() => {
    if (!user?.uid) return;

    const attemptsQuery = query(
      collection(db, 'quiz_attempts'),
      where('studentId', '==', user.uid)
    );
    
    const unsubscribe = onSnapshot(attemptsQuery, (snapshot) => {
      const attempts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate ? doc.data().submittedAt.toDate() : new Date()
      }));
      setQuizAttempts(attempts);
    }, (error) => {
      console.error("Error fetching quiz attempts:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch Quizzes
  useEffect(() => {
    if (!user || !userDetails.batch) return;

    // Correct collection path
    const quizzesCollection = collection(db, 'quizzes');
    
    setLoading(true);
    const unsubscribe = onSnapshot(quizzesCollection, (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        const startTime = data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime);
        const endTime = data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime);
        
        return {
          id: doc.id,
          ...data,
          startTime,
          endTime,
          // Check if this quiz has been attempted
          attempted: quizAttempts.some(attempt => attempt.quizId === doc.id)
        };
      });

      // Filter by batch and All quizzes
      const filteredByBatch = list.filter(q => 
        q.batch === 'All' || q.batch === userDetails.batch
      );
      
      // Sort by start time (newest first)
      const sortedList = filteredByBatch.sort((a, b) => b.startTime - a.startTime);
      
      setQuizzes(sortedList);
      setLoading(false);
    }, (error) => {
      console.error("Firestore sync error:", error);
      addToast("Failed to sync quizzes", "error");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, userDetails.batch, quizAttempts]);

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
      // Navigate to quiz results/review page
      navigate(`/student/quiz/results/${quiz.id}`);
    } else if (status === 'active' || status === 'upcoming') {
      // Navigate to quiz attempt page
      navigate(`/student/quiz/${quiz.id}`);
    } else {
      addToast("This quiz has ended", "error");
    }
  };

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter(quiz => {
      const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase());
      const status = getQuizStatus(quiz);
      const attempt = getQuizAttempt(quiz.id);
      
      if (viewMode === 'attempted') {
        return matchesSearch && attempt;
      } else {
        const matchesFilter = filterStatus === 'all' || filterStatus === status;
        return matchesSearch && matchesFilter && !attempt;
      }
    });
  }, [quizzes, searchTerm, filterStatus, viewMode]);

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20">
      {toasts.map(t => <Toast key={t.id} {...t} onClose={() => removeToast(t.id)} />)}

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
                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">{userDetails.batch} Batch</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toggle View Mode */}
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
            Attempted Quizzes
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
          <div className="text-center py-20 opacity-50">
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
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg ${
                          attempt ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/30' :
                          status === 'active' ? 'bg-blue-900/30 text-blue-400 border border-blue-700/30' : 
                          status === 'upcoming' ? 'bg-purple-900/30 text-purple-400 border border-purple-700/30' : 
                          'bg-slate-700 text-slate-400 border border-slate-600'
                        }`}>
                          {attempt ? <CheckCircle className="w-6 h-6" /> : <Award className="w-6 h-6" />}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                            {quiz.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                              attempt ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50' :
                              status === 'active' ? 'bg-blue-900/50 text-blue-300 border border-blue-700/50 animate-pulse' : 
                              status === 'upcoming' ? 'bg-purple-900/50 text-purple-300 border border-purple-700/50' : 
                              'bg-slate-700 text-slate-400 border border-slate-600'
                            }`}>
                              {attempt ? 'Completed' : status}
                            </span>
                            {attempt && (
                              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-indigo-900/50 text-indigo-300 border border-indigo-700/50">
                                Score: {attempt.score}/{attempt.totalQuestions} ({attempt.percentage}%)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-6">
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
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Starts at</p>
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
                : "There are no quizzes matching your criteria at the moment."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}