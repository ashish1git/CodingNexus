// src/components/student/AttendanceView.jsx - Professional Student Attendance with Mobile Support
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, CheckCircle, XCircle, Clock, TrendingUp, 
  Download, QrCode, MapPin, Award, AlertCircle, BarChart3, 
  Activity, Target, Zap, ChevronLeft, ChevronRight, Shield, RefreshCw
} from 'lucide-react';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import QRCodeScanner from './QRCodeScanner';

export default function AttendanceView() {
  const navigate = useNavigate();
  const { currentUser, userDetails } = useAuth();
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    late: 0,
    absent: 0,
    percentage: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showScanner, setShowScanner] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [view, setView] = useState('overview'); // overview, calendar, history

  useEffect(() => {
    fetchAttendance();
    
    // Auto-refresh every 30 seconds to get latest manual attendance updates
    const interval = setInterval(() => {
      fetchAttendance(true); // silent refresh
    }, 30000);
    
    return () => clearInterval(interval);
  }, [currentUser]);

  const fetchAttendance = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setRefreshing(true);
      
      const response = await studentService.getAttendanceRecords();
      
      if (response.success) {
        console.log(`📅 Fetched ${response.records?.length || 0} attendance records`);
        
        setRecords(response.records || []);
        
        // Calculate stats
        const total = response.records?.length || 0;
        const present = response.records?.filter(r => r.status === 'present').length || 0;
        const late = response.records?.filter(r => r.status === 'late').length || 0;
        const absent = response.records?.filter(r => r.status === 'absent').length || 0;
        const percentage = total > 0 ? ((present + late) / total * 100).toFixed(1) : 0;
        
        setStats({ total, present, late, absent, percentage });
        
        if (silent) {
          console.log('✅ Attendance auto-refreshed');
        } else {
          console.log('✅ Attendance loaded successfully');
        }
      }
    } catch (error) {
      console.error('❌ Error fetching attendance:', error);
      if (!silent) {
        toast.error('Failed to load attendance');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    toast.success('Refreshing attendance...');
    fetchAttendance();
  };

  const handleScanQR = async (scanData) => {
    setScanLoading(true);
    try {
      const response = await studentService.markAttendanceByQR({
        qrCode: scanData.qrCode,
        userId: currentUser.uid,
        latitude: scanData.latitude,
        longitude: scanData.longitude,
        deviceFingerprint: scanData.deviceFingerprint
      });

      if (response.success) {
        toast.success(response.message || 'Attendance marked successfully! ✓');
        setShowScanner(false);
        fetchAttendance();
      } else {
        toast.error(response.error || 'Failed to mark attendance');
      }
    } catch (error) {
      console.error('QR scan error:', error);
      toast.error(error.message || 'Failed to mark attendance');
    } finally {
      setScanLoading(false);
    }
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const startPadding = firstDay.getDay();
    const days = [];

    // Add empty cells for padding
    for (let i = 0; i < startPadding; i++) {
      days.push({ empty: true });
    }

    // Add actual days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const record = records.find(r => {
        const recordDate = new Date(r.date || r.session?.date).toISOString().split('T')[0];
        return recordDate === dateStr;
      });
      
      days.push({
        day,
        date: dateStr,
        status: record?.status,
        method: record?.markedMethod,
        locationVerified: record?.locationVerified
      });
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  // Stats Card Component
  const StatCard = ({ icon: Icon, value, label, color, bgColor }) => (
    <div className={`${bgColor} rounded-xl p-4 text-center`}>
      <Icon className={`w-6 h-6 ${color} mx-auto mb-2`} />
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-600">{label}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading attendance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/student/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">My Attendance</h1>
                <p className="text-sm text-gray-500">{userDetails?.batch || 'Basic'} Batch</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                title="Refresh attendance"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowScanner(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-lg"
              >
                <QrCode className="w-5 h-5" />
                <span className="hidden sm:inline">Mark Attendance</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Attendance Rate Card */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-6 text-white mb-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-200 text-sm mb-1">Overall Attendance Rate</p>
              <p className="text-5xl font-bold">{stats.percentage}%</p>
              <p className="text-indigo-200 text-sm mt-2">
                {stats.present + stats.late} present out of {stats.total} sessions
              </p>
            </div>
            <div className="relative">
              {/* Circular Progress */}
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="white"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${stats.percentage * 2.51} 251`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-white/80" />
              </div>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="mt-4 flex items-center gap-2">
            {parseFloat(stats.percentage) >= 75 ? (
              <span className="px-3 py-1 bg-green-500/30 text-green-100 rounded-full text-sm flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Good Standing
              </span>
            ) : (
              <span className="px-3 py-1 bg-red-500/30 text-red-100 rounded-full text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Needs Improvement
              </span>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard 
            icon={Calendar} 
            value={stats.total} 
            label="Total" 
            color="text-blue-600" 
            bgColor="bg-blue-50" 
          />
          <StatCard 
            icon={CheckCircle} 
            value={stats.present} 
            label="Present" 
            color="text-green-600" 
            bgColor="bg-green-50" 
          />
          <StatCard 
            icon={Clock} 
            value={stats.late} 
            label="Late" 
            color="text-yellow-600" 
            bgColor="bg-yellow-50" 
          />
          <StatCard 
            icon={XCircle} 
            value={stats.absent} 
            label="Absent" 
            color="text-red-600" 
            bgColor="bg-red-50" 
          />
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['overview', 'calendar', 'history'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                view === v 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview View */}
        {view === 'overview' && (
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                Recent Activity
              </h3>
              
              {records.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No attendance records yet</p>
                  <p className="text-sm">Mark your first attendance using the button above</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {records.slice(0, 5).map((record, idx) => (
                    <div 
                      key={idx}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        record.status === 'present' ? 'bg-green-50' :
                        record.status === 'late' ? 'bg-yellow-50' : 'bg-red-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          record.status === 'present' ? 'bg-green-100' :
                          record.status === 'late' ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          {record.status === 'present' ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : record.status === 'late' ? (
                            <Clock className="w-5 h-5 text-yellow-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {new Date(record.date || record.session?.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{record.session?.location || 'Coding Nexus'}</span>
                            {record.duration && (
                              <>
                                <span className="w-1 h-1 bg-gray-400 rounded-full" />
                                <Clock className="w-3 h-3" />
                                <span className="font-medium text-indigo-600">
                                  {record.duration} min
                                </span>
                              </>
                            )}
                            {record.startTime && record.endTime && (
                              <>
                                <span className="w-1 h-1 bg-gray-400 rounded-full" />
                                <span className="text-xs">
                                  {record.startTime} - {record.endTime}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-medium capitalize ${
                          record.status === 'present' ? 'text-green-600' :
                          record.status === 'late' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {record.status}
                        </span>
                        {record.markedMethod === 'qr' && (
                          <div className="flex items-center gap-1 text-xs text-indigo-600 mt-1">
                            <QrCode className="w-3 h-3" />
                            <span>QR</span>
                            {record.locationVerified && (
                              <>
                                <MapPin className="w-3 h-3 ml-1" />
                                <span>Verified</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
              <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Attendance Tips
              </h3>
              <ul className="space-y-2 text-sm text-amber-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-amber-600" />
                  <span>Maintain 75%+ attendance to be in good standing</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5 text-amber-600" />
                  <span>Enable location for faster QR attendance marking</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 mt-0.5 text-amber-600" />
                  <span>Arrive on time to avoid being marked as late</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Calendar View */}
        {view === 'calendar' && (
          <div className="bg-white rounded-xl shadow-sm border p-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-base font-bold text-gray-800">
                {monthNames[selectedMonth]} {selectedYear}
              </h3>
              <button
                onClick={() => navigateMonth('next')}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-[10px] font-medium text-gray-500 py-1">
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {generateCalendarDays().map((dayInfo, idx) => (
                <div
                  key={idx}
                  className={`aspect-square p-0.5 ${dayInfo.empty ? '' : 'cursor-pointer'}`}
                >
                  {!dayInfo.empty && (
                    <div
                      className={`w-full h-full rounded-md flex flex-col items-center justify-center text-xs transition ${
                        dayInfo.status === 'present' ? 'bg-green-100 text-green-700' :
                        dayInfo.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                        dayInfo.status === 'absent' ? 'bg-red-100 text-red-700' :
                        'hover:bg-gray-100'
                      }`}
                    >
                      <span className="font-medium text-[11px]">{dayInfo.day}</span>
                      {dayInfo.status && (
                        <span className="text-[8px] capitalize">{dayInfo.status.charAt(0)}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-100 rounded" />
                <span className="text-[10px] text-gray-600">Present</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-100 rounded" />
                <span className="text-[10px] text-gray-600">Late</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-100 rounded" />
                <span className="text-[10px] text-gray-600">Absent</span>
              </div>
            </div>
          </div>
        )}

        {/* History View */}
        {view === 'history' && (
          <div className="bg-white rounded-xl shadow-sm border divide-y">
            {records.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No attendance history yet</p>
              </div>
            ) : (
              records.map((record, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      record.status === 'present' ? 'bg-green-500' :
                      record.status === 'late' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-800">
                        {new Date(record.date || record.session?.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{record.session?.sessionType || 'Regular'}</span>
                        <span className="w-1 h-1 bg-gray-400 rounded-full" />
                        <span>{record.session?.location || 'Coding Nexus'}</span>
                        {record.duration && (
                          <>
                            <span className="w-1 h-1 bg-gray-400 rounded-full" />
                            <Clock className="w-3 h-3" />
                            <span className="font-medium text-indigo-600">{record.duration} min</span>
                          </>
                        )}
                      </div>
                      {record.startTime && record.endTime && (
                        <p className="text-xs text-gray-400 mt-1">
                          {record.startTime} - {record.endTime}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      record.status === 'present' ? 'bg-green-100 text-green-700' :
                      record.status === 'late' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {record.status}
                    </span>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      {record.markedMethod === 'qr' && <QrCode className="w-3 h-3" />}
                      {record.locationVerified && <MapPin className="w-3 h-3 text-green-500" />}
                      <span>{new Date(record.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRCodeScanner
          onScan={handleScanQR}
          onClose={() => setShowScanner(false)}
          isLoading={scanLoading}
        />
      )}
    </div>
  );
}
