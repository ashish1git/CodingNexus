// src/components/student/AttendanceView.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this import
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Download,
  Info
} from 'lucide-react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithCustomToken 
} from 'firebase/auth';
import { useAuth } from '../../context/AuthContext'; // Import your AuthContext
import toast from 'react-hot-toast';

// --- Firebase Configuration & Initialization ---
// Safety check for environment-injected globals to prevent ReferenceErrors
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {};

// Prevent "Firebase App named '[DEFAULT]' already exists" error
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'attendance-system';

export default function AttendanceView() {
  const navigate = useNavigate(); // Add this hook
  const { currentUser, userDetails } = useAuth(); // Use your existing AuthContext
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    percentage: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Use actual user details from AuthContext
  const studentDetails = useMemo(() => ({
    name: userDetails?.name || "Student",
    batch: userDetails?.batch || "Basic",
    rollNo: userDetails?.rollNo || "",
    moodleId: userDetails?.moodleId || ""
  }), [userDetails]);

  // Rule 3: Auth Initialization before queries
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Don't use anonymous auth if user is already authenticated
        if (!currentUser) {
          console.log('No user logged in, skipping anonymous auth');
          return;
        }
        
        // If you need anonymous auth for some reason, catch the error gracefully
        try {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else {
            // Only try anonymous auth if user is not already logged in
            await signInAnonymously(auth);
          }
        } catch (authError) {
          console.warn("Auth initialization warning (non-critical):", authError);
          // Don't show error toast for non-critical auth issues
        }
      } catch (err) {
        console.error("Auth initialization failed:", err);
      }
    };
    
    // Only initialize auth if user is not already authenticated
    if (!currentUser) {
      initAuth();
    }
    
    // Keep the auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Firebase auth state:', user?.uid);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Fetch Attendance Logic (Rule 1 & 2)
  const fetchAttendance = async () => {
    if (!currentUser || !studentDetails.moodleId) {
      console.log('Waiting for user authentication or student details...');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Fetching attendance for:', {
        studentId: currentUser.uid,
        moodleId: studentDetails.moodleId,
        rollNo: studentDetails.rollNo,
        batch: studentDetails.batch
      });
      
      // FIXED: Use the correct Firestore path from your rules
      // Your rules show attendance is at /attendance/{attendanceId}
      const attendanceRef = collection(db, 'attendance');
      
      // Create query to filter by batch
      const attendanceQuery = query(
        attendanceRef,
        where('batch', '==', studentDetails.batch)
      );
      
      const snapshot = await getDocs(attendanceQuery);
      console.log(`Found ${snapshot.docs.length} attendance records for batch ${studentDetails.batch}`);
      
      const records = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Check multiple identifiers for attendance matching
        const isPresent = 
          data.presentStudents?.includes(currentUser.uid) || 
          data.presentMoodleIds?.includes(studentDetails.moodleId) ||
          data.presentRollNos?.includes(studentDetails.rollNo);
        
        let dateObj;
        try {
          if (data.date?.toDate) {
            dateObj = data.date.toDate();
          } else if (data.date instanceof Date) {
            dateObj = data.date;
          } else if (data.date) {
            dateObj = new Date(data.date);
          } else {
            dateObj = new Date(); // Fallback
          }
        } catch (dateError) {
          console.warn('Date parsing error:', dateError);
          dateObj = new Date(); // Fallback
        }
        
        // Skip invalid dates
        if (!dateObj || isNaN(dateObj.getTime())) {
          console.warn('Invalid date for record:', data);
          return;
        }

        records.push({
          id: doc.id,
          date: dateObj,
          isPresent: isPresent,
          markedBy: data.markedBy || 'Unknown'
        });
      });

      // Filter by month/year and sort in memory
      const filteredRecords = records.filter(record => {
        return record.date.getMonth() === selectedMonth && 
               record.date.getFullYear() === selectedYear;
      });

      filteredRecords.sort((a, b) => b.date - a.date);

      console.log('Filtered records:', filteredRecords.length);
      setAttendance(filteredRecords);

      // Calculate stats
      const total = filteredRecords.length;
      const present = filteredRecords.filter(r => r.isPresent).length;
      const absent = total - present;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      setStats({ total, present, absent, percentage });
      
      if (total === 0) {
        // FIXED: Use toast() instead of toast.info()
        toast(`No attendance records found for ${getMonthName(selectedMonth)} ${selectedYear}`, {
          icon: '📅',
          duration: 3000
        });
      } else {
        toast.success(`Loaded ${total} attendance records`);
      }
      
    } catch (error) {
      console.error('Error fetching attendance:', error);
      
      // Show user-friendly error message
      if (error.code === 'permission-denied' || error.message.includes('permissions')) {
        toast.error('Permission denied. Please make sure you are logged in as a student.');
      } else if (error.code === 'unavailable') {
        toast.error('Network error. Please check your internet connection.');
      } else {
        toast.error(`Failed to load attendance: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [currentUser, studentDetails, selectedMonth, selectedYear]);

  const getMonthName = (month) => {
    return ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'][month];
  };

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const isDateMarked = (day) => {
    return attendance.find(record => {
      return record.date.getDate() === day && 
             record.date.getMonth() === selectedMonth && 
             record.date.getFullYear() === selectedYear;
    });
  };

  const exportAttendance = () => {
    if (attendance.length === 0) {
      toast.error('No attendance records to export');
      return;
    }

    const headers = ['Date', 'Status', 'Marked By'];
    const rows = attendance.map(record => [
      record.date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      record.isPresent ? 'Present' : 'Absent',
      record.markedBy
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${studentDetails.name}_attendance_${getMonthName(selectedMonth)}_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Attendance exported successfully!');
  };

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
  const daysHeader = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/student/dashboard')} // Add navigation here
                className="p-2 hover:bg-gray-100 rounded-full text-gray-600 hover:text-gray-800 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">My Attendance Log</h1>
            </div>
            <button
              onClick={exportAttendance}
              disabled={attendance.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition text-sm font-bold active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Student Info */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{studentDetails.name}</h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                  {studentDetails.batch} Batch
                </span>
                <span>Roll No: {studentDetails.rollNo}</span>
                <span>Moodle ID: {studentDetails.moodleId}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Current Status</p>
              <p className={`text-lg font-bold ${stats.percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.percentage}% Attendance
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Classes', value: stats.total, color: 'blue', icon: Calendar },
            { label: 'Present', value: stats.present, color: 'green', icon: CheckCircle },
            { label: 'Absent', value: stats.absent, color: 'red', icon: XCircle },
            { label: 'Percentage', value: `${stats.percentage}%`, color: 'purple', icon: TrendingUp }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-transform hover:scale-[1.02]">
              <div className={`w-10 h-10 rounded-xl ${stat.color === 'blue' ? 'bg-blue-50' : stat.color === 'green' ? 'bg-green-50' : stat.color === 'red' ? 'bg-red-50' : 'bg-purple-50'} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-6 h-6 ${stat.color === 'blue' ? 'text-blue-600' : stat.color === 'green' ? 'text-green-600' : stat.color === 'red' ? 'text-red-600' : 'text-purple-600'}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Calendar Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-gray-900">Attendance Calendar</h2>
            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>{getMonthName(i)}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {[2023, 2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-sm font-medium">Loading attendance records...</p>
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <div className="grid grid-cols-7 gap-1">
                  {daysHeader.map(day => (
                    <div key={day} className="text-center font-bold text-gray-400 py-2 text-[10px] uppercase tracking-tighter">
                      {day}
                    </div>
                  ))}

                  {Array.from({ length: firstDay }, (_, i) => (
                    <div key={`empty-${i}`} className="aspect-square"></div>
                  ))}

                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const record = isDateMarked(day);
                    const isToday = day === new Date().getDate() &&
                                   selectedMonth === new Date().getMonth() &&
                                   selectedYear === new Date().getFullYear();

                    return (
                      <div
                        key={day}
                        className={`aspect-square flex flex-col items-center justify-center rounded-xl border transition-all text-xs relative ${
                          isToday
                            ? 'border-2 border-indigo-600 bg-indigo-50 font-black z-10 scale-105 shadow-sm'
                            : record
                            ? record.isPresent
                              ? 'border-green-200 bg-green-50/50'
                              : 'border-red-200 bg-red-50/50'
                            : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <span className={`font-bold ${
                          record ? (record.isPresent ? 'text-green-700' : 'text-red-700') : 'text-gray-600'
                        }`}>
                          {day}
                        </span>
                        {record && (
                          <div className={`w-1.5 h-1.5 rounded-full mt-1 ${
                            record.isPresent ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-center gap-6 mt-10 pt-6 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Present</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Absent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-600 shadow-sm" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Today</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Low Attendance Alert */}
        {!loading && stats.total > 0 && (
          <div className={`mt-6 p-5 rounded-2xl border-l-4 flex items-start gap-4 transition-all ${
            stats.percentage < 75 
              ? 'bg-red-50 border-red-500' 
              : 'bg-green-50 border-green-500'
          }`}>
            <div className={`p-2 rounded-xl ${stats.percentage < 75 ? 'bg-red-100' : 'bg-green-100'}`}>
              {stats.percentage < 75 ? 
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                : <CheckCircle className="w-5 h-5 text-green-600" />}
            </div>
            <div>
              <h3 className={`font-bold ${stats.percentage < 75 ? 'text-red-900' : 'text-green-900'}`}>
                {stats.percentage < 75 ? 'Attendance Warning' : 'Status: Excellent'}
              </h3>
              <p className={`text-sm font-medium mt-1 ${stats.percentage < 75 ? 'text-red-700' : 'text-green-700'}`}>
                {stats.percentage < 75 
                  ? `Your attendance is currently ${stats.percentage}%. APSIT policy requires at least 75% for exam eligibility.`
                  : "You are maintaining high attendance. Keep up the consistent participation!"}
              </p>
            </div>
          </div>
        )}

        {/* Recent Attendance Table */}
        {!loading && attendance.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-6 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Recent Attendance Records</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marked By</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {attendance.slice(0, 10).map((record, index) => (
                    <tr key={record.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.date.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          record.isPresent 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.isPresent ? 'Present ✓' : 'Absent ✗'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.markedBy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Keep the existing icon components at the bottom
function RefreshCw(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
  );
}

function AlertCircle(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
  );
}