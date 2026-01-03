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
  AlertCircle
} from 'lucide-react';

// Firebase Imports
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  onSnapshot 
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
const appId = typeof __app_id !== 'undefined' ? __app_id : 'quiz-manager';

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
  const [user, setUser] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, upcoming, ended
  const [toasts, setToasts] = useState([]);

  // Mock student details (In a real app, fetched from /users/ profile)
  const userDetails = useMemo(() => ({
    name: user?.displayName || "Student",
    batch: "Basic", // Default batch for filtering
    moodleId: "STU12345"
  }), [user]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Auth Initialization (RULE 3)
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

  // Fetch Quizzes (RULE 1 & 2)
  useEffect(() => {
    if (!user) return;

    // Rule 1: Specific collection path
    const quizzesCollection = collection(db, 'artifacts', appId, 'public', 'data', 'quizzes');
    
    setLoading(true);
    const unsubscribe = onSnapshot(quizzesCollection, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Handle Firestore Timestamps or ISO strings
        startTime: doc.data().startTime?.toDate ? doc.data().startTime.toDate() : new Date(doc.data().startTime),
        endTime: doc.data().endTime?.toDate ? doc.data().endTime.toDate() : new Date(doc.data().endTime)
      }));

      // Rule 2: Manual filtering and sorting in memory
      const filteredByBatch = list.filter(q => q.batch === 'All' || q.batch === userDetails.batch);
      const sortedList = filteredByBatch.sort((a, b) => b.startTime - a.startTime);
      
      setQuizzes(sortedList);
      setLoading(false);
    }, (error) => {
      console.error("Firestore sync error:", error);
      addToast("Failed to sync quizzes", "error");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, userDetails.batch]);

  const getQuizStatus = (quiz) => {
    const now = new Date();
    if (now >= quiz.startTime && now <= quiz.endTime) return 'active';
    if (now < quiz.startTime) return 'upcoming';
    return 'ended';
  };

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter(quiz => {
      const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase());
      const status = getQuizStatus(quiz);
      const matchesFilter = filterStatus === 'all' || filterStatus === status;
      return matchesSearch && matchesFilter;
    });
  }, [quizzes, searchTerm, filterStatus]);

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {toasts.map(t => <Toast key={t.id} {...t} onClose={() => removeToast(t.id)} />)}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Quizzes</h1>
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{userDetails.batch} Batch</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search quizzes by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex gap-2 p-1 bg-white border border-gray-200 rounded-2xl shadow-sm">
            {['all', 'active', 'upcoming', 'ended'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  filterStatus === status 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Quiz List */}
        {loading ? (
          <div className="text-center py-20 opacity-50">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="font-medium text-gray-500">Updating your quiz list...</p>
          </div>
        ) : filteredQuizzes.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredQuizzes.map((quiz) => {
              const status = getQuizStatus(quiz);
              return (
                <div
                  key={quiz.id}
                  className="group bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    status === 'active' ? 'bg-emerald-500' : status === 'upcoming' ? 'bg-blue-500' : 'bg-gray-300'
                  }`} />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${
                          status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'
                        }`}>
                          <Award className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {quiz.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                              status === 'active' ? 'bg-emerald-100 text-emerald-700 animate-pulse' : 
                              status === 'upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-2 text-gray-500 font-semibold text-xs">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{quiz.duration} Minutes</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 font-semibold text-xs">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{quiz.startTime.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 font-semibold text-xs">
                          <Award className="w-4 h-4 text-gray-400" />
                          <span>{quiz.questions?.length || 0} Questions</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {status === 'active' ? (
                        <button className="w-full md:w-auto px-8 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2 active:scale-95">
                          Attempt Now
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : status === 'upcoming' ? (
                        <div className="text-center md:text-right">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Opens at</p>
                          <p className="text-sm font-bold text-blue-600">{quiz.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      ) : (
                        <button className="w-full md:w-auto px-8 py-3 bg-gray-100 text-gray-500 font-bold rounded-2xl cursor-not-allowed opacity-60">
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
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-300">
            <Award className="w-16 h-16 text-gray-200 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No quizzes found</h3>
            <p className="text-gray-500 max-w-xs mx-auto">
              There are no quizzes matching your criteria at the moment.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}