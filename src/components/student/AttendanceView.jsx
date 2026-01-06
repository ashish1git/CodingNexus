import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Download,
} from 'lucide-react';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function AttendanceView() {
  const navigate = useNavigate();
  const { currentUser, userDetails } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent:  0,
    percentage: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const studentDetails = useMemo(() => ({
    name: userDetails?.name || "Student",
    batch: userDetails?.batch || "Basic",
    rollNo: userDetails?.rollNo || "",
    moodleId: userDetails?.moodleId || ""
  }), [userDetails]);



  const fetchAttendance = async () => {
    if (!currentUser || !studentDetails.moodleId) {
      console.log('Waiting for user authentication or student details...');
      return;
    }
    
    setLoading(true);
    try {
      const response = await studentService.getAttendance();
      
      if (!response.success) {
        toast.error(response.error || 'Failed to load attendance');
        setLoading(false);
        return;
      }
      
      const records = response.attendance.map(record => ({
        id: record.id,
        date: new Date(record.date),
        isPresent: record.isPresent,
        markedBy: record.markedBy || 'Unknown'
      }));
      
      const filteredRecords = records.filter(record => {
        return record.date.getMonth() === selectedMonth && 
               record.date.getFullYear() === selectedYear;
      });

      filteredRecords.sort((a, b) => b.date - a.date);

      setAttendance(filteredRecords);

      const total = filteredRecords.length;
      const present = filteredRecords.filter(r => r.isPresent).length;
      const absent = total - present;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      setStats({ total, present, absent, percentage });
      
      if (total === 0) {
        toast(`No attendance records found for ${getMonthName(selectedMonth)} ${selectedYear}`, {
          icon: '📅',
          duration: 3000
        });
      } else {
        toast.success(`Loaded ${total} attendance records`);
      }
      
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error(error.message || 'Failed to load attendance');
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
      toast. error('No attendance records to export');
      return;
    }

    const headers = ['Date', 'Status', 'Marked By'];
    const rows = attendance.map(record => [
      record.date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month:  'long', 
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
    a.download = `${studentDetails. name}_attendance_${getMonthName(selectedMonth)}_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Attendance exported successfully! ');
  };

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
  const daysHeader = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-10">
      {/* Header */}
      <nav className="bg-slate-800 shadow-lg border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button 
              onClick={() => navigate('/student/dashboard')}
              className="inline-flex items-center gap-2 text-slate-300 hover:text-indigo-400 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline text-sm">Back to Dashboard</span>
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-white">My Attendance</h1>
            <button
              onClick={exportAttendance}
              disabled={attendance.length === 0}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover: bg-indigo-700 transition text-sm font-medium disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Student Info */}
        <div className="bg-slate-800 rounded-xl p-4 sm:p-6 mb-6 shadow-lg border border-slate-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">{studentDetails.name}</h2>
              <div className="flex items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-slate-400 flex-wrap">
                <span className="bg-indigo-900/50 text-indigo-300 px-3 py-1 rounded-lg font-medium">
                  {studentDetails.batch} Batch
                </span>
                <span>Roll No: {studentDetails.rollNo}</span>
                <span className="hidden sm:inline">Moodle ID: {studentDetails.moodleId}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Current Status</p>
              <p className={`text-2xl sm:text-3xl font-bold ${stats.percentage >= 75 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.percentage}%
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Classes', value: stats.total, color: 'blue', icon: Calendar },
            { label: 'Present', value: stats.present, color: 'green', icon:  CheckCircle },
            { label: 'Absent', value:  stats.absent, color: 'red', icon: XCircle },
            { label: 'Percentage', value: `${stats.percentage}%`, color: 'purple', icon: TrendingUp }
          ]. map((stat, i) => (
            <div key={i} className="bg-slate-800 p-4 sm:p-5 rounded-xl border border-slate-700 shadow-lg hover:border-slate-600 transition">
              <div className={`w-10 h-10 rounded-lg mb-3 flex items-center justify-center ${
                stat.color === 'blue' ? 'bg-blue-900/30' : 
                stat.color === 'green' ?  'bg-green-900/30' : 
                stat.color === 'red' ?  'bg-red-900/30' : 
                'bg-purple-900/30'
              }`}>
                <stat.icon className={`w-6 h-6 ${
                  stat.color === 'blue' ? 'text-blue-400' : 
                  stat.color === 'green' ? 'text-green-400' : 
                  stat. color === 'red' ? 'text-red-400' :  
                  'text-purple-400'
                }`} />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Calendar Card */}
        <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white">Attendance Calendar</h2>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="flex-1 sm:flex-none px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm font-medium text-white outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>{getMonthName(i)}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target. value))}
                className="flex-1 sm:flex-none px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm font-medium text-white outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {[2023, 2024, 2025, 2026]. map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-sm font-medium">Loading attendance records...</p>
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <div className="grid grid-cols-7 gap-1">
                  {daysHeader.map(day => (
                    <div key={day} className="text-center font-bold text-slate-500 py-2 text-xs uppercase">
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
                        className={`aspect-square flex flex-col items-center justify-center rounded-lg border transition-all text-xs font-bold ${
                          isToday
                            ? 'border-2 border-indigo-500 bg-indigo-900/30 scale-105 shadow-lg'
                            :  record
                            ? record.isPresent
                              ? 'border-green-700/50 bg-green-900/30 text-green-400'
                              : 'border-red-700/50 bg-red-900/30 text-red-400'
                            : 'border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <span>{day}</span>
                        {record && (
                          <div className={`w-1. 5 h-1.5 rounded-full mt-1 ${
                            record.isPresent ? 'bg-green-400' : 'bg-red-400'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <span className="text-xs font-medium text-slate-400">Present</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="text-xs font-medium text-slate-400">Absent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500" />
                    <span className="text-xs font-medium text-slate-400">Today</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Low Attendance Alert */}
        {! loading && stats.total > 0 && (
          <div className={`mt-6 p-5 rounded-xl border-l-4 flex items-start gap-4 transition-all ${
            stats.percentage < 75 
              ? 'bg-red-900/30 border-red-500' 
              : 'bg-green-900/30 border-green-500'
          }`}>
            <div className={`p-2 rounded-lg flex-shrink-0 ${stats.percentage < 75 ? 'bg-red-900/50' : 'bg-green-900/50'}`}>
              {stats.percentage < 75 ?  
                <AlertCircle className="w-5 h-5 text-red-400" />
                : <CheckCircle className="w-5 h-5 text-green-400" />}
            </div>
            <div>
              <h3 className={`font-bold text-sm sm:text-base ${stats.percentage < 75 ? 'text-red-300' : 'text-green-300'}`}>
                {stats.percentage < 75 ? 'Attendance Warning' : 'Status:  Excellent'}
              </h3>
              <p className={`text-xs sm:text-sm font-medium mt-1 ${stats.percentage < 75 ? 'text-red-400' : 'text-green-400'}`}>
                {stats.percentage < 75 
                  ? `Your attendance is currently ${stats.percentage}%.  APSIT policy requires at least 75% for exam eligibility.`
                  : "You are maintaining high attendance.  Keep up the consistent participation!"}
              </p>
            </div>
          </div>
        )}

        {/* Recent Attendance Table */}
        {!loading && attendance.length > 0 && (
          <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 mt-6 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">Recent Attendance Records</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Marked By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {attendance.slice(0, 10).map((record, index) => (
                    <tr key={record.id} className={index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-700/30'}>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {record.date.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          record.isPresent 
                            ? 'bg-green-900/30 text-green-400' 
                            : 'bg-red-900/30 text-red-400'
                        }`}>
                          {record.isPresent ? 'Present ✓' : 'Absent ✗'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-400">
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

function AlertCircle(props) {
  return (
    <svg {... props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
  );
}