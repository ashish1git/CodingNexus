// src/components/admin/AttendanceManager.jsx - Cheating-Proof Professional Attendance System
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, UserCheck, Save, Calendar, Download, Search, 
  QrCode, Clock, MapPin, TrendingUp, Users, 
  CheckCircle, XCircle, AlertTriangle, BarChart3, FileText,
  RefreshCw, Plus, X, Eye, Activity, Shield, Smartphone,
  Target, Award, AlertCircle, ChevronDown, ChevronUp,
  Wifi, Navigation, Timer, Zap, Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import { hasPermission } from '../../utils/permissions';
import toast from 'react-hot-toast';

const AttendanceManager = () => {
  const { userDetails } = useAuth();
  const [view, setView] = useState('sessions'); // sessions, manual, analytics
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]); // All students for manual search
  const [selectedBatch, setSelectedBatch] = useState('Basic');
  const [attendance, setAttendance] = useState({});
  const [manualAttendance, setManualAttendance] = useState({}); // For manual attendance mode
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]); // Auto-fetch current date
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [manualSearchTerm, setManualSearchTerm] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [sessionType, setSessionType] = useState('regular');
  const [location, setLocation] = useState('Coding Nexus Lab');
  const [showQR, setShowQR] = useState(false);
  const [qrExpiry, setQrExpiry] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [useGeolocation, setUseGeolocation] = useState(true);
  const [adminLocation, setAdminLocation] = useState(null);
  const [maxDistance, setMaxDistance] = useState(100);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [codeValidity, setCodeValidity] = useState(5); // minutes
  const [markingAttendance, setMarkingAttendance] = useState(null); // Track which student is being marked
  const [selectedStudents, setSelectedStudents] = useState([]); // For bulk delete
  const [showHistory, setShowHistory] = useState(false); // Show attendance history
  const [historyRecords, setHistoryRecords] = useState([]); // Historical attendance records

  const canMarkAttendance = hasPermission(userDetails, 'markAttendance');
  
  // Memoize the short code to prevent re-renders
  const shortCode = useMemo(() => {
    return currentSession?.qrCode?.slice(-8)?.toUpperCase() || '';
  }, [currentSession?.qrCode]);
  
  // Calculate manual attendance stats
  const manualAttendanceStatus = useMemo(() => {
    const batchStudents = allStudents.filter(s => s.batch === selectedBatch);
    return {
      present: Object.values(manualAttendance).filter(s => s === 'present').length,
      late: Object.values(manualAttendance).filter(s => s === 'late').length,
      absent: Object.values(manualAttendance).filter(s => s === 'absent').length
    };
  }, [manualAttendance, allStudents, selectedBatch]);

  // Get admin's current location
  const getAdminLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setAdminLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setGettingLocation(false);
        toast.success(`Location captured! Accuracy: ${Math.round(position.coords.accuracy)}m`);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Failed to get location. Students can still mark via QR.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchStudents();
    fetchAnalytics();
  }, [selectedBatch]);

  useEffect(() => {
    // QR expiry countdown
    if (currentSession?.qrExpiresAt) {
      const interval = setInterval(() => {
        const remaining = new Date(currentSession.qrExpiresAt) - new Date();
        if (remaining <= 0) {
          setQrExpiry(null);
          toast.error('QR code expired. Please refresh.');
        } else {
          setQrExpiry(Math.floor(remaining / 1000));
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentSession]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAttendanceSessions({ batch: selectedBatch });
      if (response.success) {
        setSessions(response.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (batchOverride) => {
    try {
      const response = await adminService.getAllStudents();
      if (response.success) {
        // Store all students for manual search
        setAllStudents(response.students);
        
        const batchToUse = batchOverride || currentSession?.batch || selectedBatch;
        const studentsList = response.students.filter(s => s.batch === batchToUse);
        console.log('Fetched students for batch:', batchToUse, 'Count:', studentsList.length);
        setStudents(studentsList);
        // Initialize attendance state
        const initialAttendance = {};
        studentsList.forEach(s => {
          initialAttendance[s.userId] = 'absent';
        });
        setAttendance(initialAttendance);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  // Mark single student attendance manually
  const markSingleAttendance = async (student, status) => {
    if (!currentSession) {
      toast.error('No active session. Please start a session first.');
      return;
    }
    
    setMarkingAttendance(student.userId);
    try {
      const response = await adminService.markBulkAttendance({
        sessionId: currentSession.id,
        records: [{ userId: student.userId, status }]
      });
      
      if (response.success) {
        toast.success(`${student.name} marked as ${status}`);
        // Refresh session to get updated records
        fetchSessions();
      }
    } catch (error) {
      toast.error('Failed to mark attendance');
    } finally {
      setMarkingAttendance(null);
    }
  };

  // Mark manual attendance (independent of session)
  const markManualAttendance = async (userId, status) => {
    setMarkingAttendance(userId);
    try {
      // Calculate duration in minutes
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      const durationMinutes = Math.round((end - start) / 60000);
      
      const student = allStudents.find(s => s.userId === userId);
      console.log('📝 Marking manual attendance:', { 
        studentName: student?.name, 
        userId, 
        status, 
        date, 
        batch: selectedBatch,
        startTime,
        endTime,
        duration: durationMinutes
      });
      
      const response = await adminService.markManualAttendance({
        userId,
        status,
        date,
        batch: selectedBatch,
        startTime,
        endTime,
        duration: durationMinutes
      });
      
      if (response.success) {
        console.log('✅ Manual attendance saved successfully:', response.record);
        // Update local state immediately
        setManualAttendance(prev => ({ ...prev, [userId]: status }));
        toast.success(`${student?.name || 'Student'} marked as ${status} for ${date}`);
      } else {
        console.error('❌ Failed to save attendance:', response);
        toast.error('Failed to mark attendance');
      }
    } catch (error) {
      console.error('❌ Manual attendance error:', error);
      toast.error('Failed to mark attendance: ' + error.message);
    } finally {
      setMarkingAttendance(null);
    }
  };

  // Delete manual attendance record
  const deleteManualAttendance = async (userId) => {
    const student = allStudents.find(s => s.userId === userId);
    if (!window.confirm(`Delete attendance record for ${student?.name}?`)) {
      return;
    }

    try {
      const response = await adminService.deleteAttendanceRecord(null, userId, date, true);
      if (response.success) {
        setManualAttendance(prev => {
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });
        toast.success('Attendance record deleted');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete record');
    }
  };

  // Delete attendance from session
  const deleteSessionAttendance = async (userId) => {
    if (!currentSession) return;
    
    const student = students.find(s => s.userId === userId);
    if (!window.confirm(`Delete attendance record for ${student?.name}?`)) {
      return;
    }

    try {
      const response = await adminService.deleteAttendanceRecord(currentSession.id, userId);
      if (response.success) {
        // Refresh session to get updated records
        fetchSessions();
        toast.success('Attendance record deleted');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete record');
    }
  };

  // Bulk delete manual attendance for selected students
  const bulkDeleteAttendance = async () => {
    if (selectedStudents.length === 0) {
      toast.error('No students selected');
      return;
    }

    if (!window.confirm(`Delete attendance for ${selectedStudents.length} student(s) on ${date}?`)) {
      return;
    }

    try {
      const deletePromises = selectedStudents.map(userId => 
        adminService.deleteAttendanceRecord(null, userId, date, true)
      );
      
      const results = await Promise.all(deletePromises);
      const successCount = results.filter(r => r.success).length;
      
      if (successCount > 0) {
        // Update local state
        setManualAttendance(prev => {
          const updated = { ...prev };
          selectedStudents.forEach(userId => delete updated[userId]);
          return updated;
        });
        setSelectedStudents([]);
        toast.success(`Deleted ${successCount} attendance record(s)`);
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete records');
    }
  };

  // Toggle student selection for bulk operations
  const toggleStudentSelection = (userId) => {
    setSelectedStudents(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Select all students with attendance on current date
  const selectAllWithAttendance = () => {
    const studentsWithAttendance = allStudents
      .filter(s => s.batch === selectedBatch && manualAttendance[s.userId])
      .map(s => s.userId);
    setSelectedStudents(studentsWithAttendance);
  };

  // Load attendance history for date range
  const loadAttendanceHistory = async (startDate, endDate) => {
    try {
      setLoading(true);
      const response = await adminService.getManualAttendance({ 
        batch: selectedBatch,
        startDate: startDate || date,
        endDate: endDate || date
      });
      
      if (response.success) {
        setHistoryRecords(response.records || []);
      }
    } catch (error) {
      console.error('Load history error:', error);
      toast.error('Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  };

  // Load existing manual attendance for selected date/batch
  const loadManualAttendance = async () => {
    try {
      const response = await adminService.getManualAttendance({ date, batch: selectedBatch });
      if (response.success && response.records) {
        const attendanceMap = {};
        response.records.forEach(r => {
          attendanceMap[r.userId] = r.status;
        });
        setManualAttendance(attendanceMap);
      } else {
        setManualAttendance({});
      }
    } catch (error) {
      console.error('Error loading manual attendance:', error);
      setManualAttendance({});
    }
  };

  // Load manual attendance when date or batch changes
  useEffect(() => {
    if (view === 'manual') {
      loadManualAttendance();
    }
  }, [date, selectedBatch, view]);

  const fetchAnalytics = async () => {
    try {
      const response = await adminService.getAttendanceAnalytics({ batch: 'all' });
      if (response.success) {
        setAnalytics(response.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchStudentDetails = async (userId) => {
    try {
      setLoading(true);
      const response = await adminService.getStudentAttendanceDetails(userId);
      if (response.success) {
        setStudentDetails(response);
        setSelectedStudent(userId);
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
      toast.error('Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  const createSession = async () => {
    if (!location.trim()) {
      toast.error('Please enter location');
      return;
    }

    setLoading(true);
    try {
      const sessionData = {
        batch: selectedBatch,
        date,
        sessionType,
        startTime: new Date().toISOString(),
        location,
        maxDistance,
        codeValidity // minutes
      };

      // Add geolocation if enabled and available
      if (useGeolocation && adminLocation) {
        sessionData.latitude = adminLocation.latitude;
        sessionData.longitude = adminLocation.longitude;
      }

      const response = await adminService.createAttendanceSession(sessionData);

      if (response.success) {
        toast.success('Session created! Choose QR or Manual mode.');
        setCurrentSession(response.session);
        // Don't auto-show QR - let user choose between QR and Manual
        fetchSessions();
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const refreshQRCode = async () => {
    if (!currentSession) return;

    try {
      const response = await adminService.refreshSessionQR(currentSession.id);
      if (response.success) {
        setCurrentSession(response.session);
        toast.success('QR code refreshed!');
      }
    } catch (error) {
      toast.error('Failed to refresh QR');
    }
  };

  const markAttendance = async (userId, status) => {
    if (!currentSession) {
      toast.error('Please create a session first');
      return;
    }

    try {
      const response = await adminService.markBulkAttendance({
        sessionId: currentSession.id,
        records: [{ userId, status }],
        method: 'manual'
      });

      if (response.success) {
        setAttendance(prev => ({ ...prev, [userId]: status }));
        toast.success(`Marked ${status}`);
        fetchSessions();
      }
    } catch (error) {
      toast.error('Failed to mark attendance');
    }
  };

  const markAllAttendance = async (status) => {
    if (!currentSession) {
      toast.error('Please create a session first');
      return;
    }

    const records = students.map(s => ({ userId: s.userId, status }));
    
    try {
      const response = await adminService.markBulkAttendance({
        sessionId: currentSession.id,
        records,
        method: 'manual'
      });

      if (response.success) {
        const newAttendance = {};
        students.forEach(s => { newAttendance[s.userId] = status; });
        setAttendance(newAttendance);
        toast.success(`Marked all as ${status}`);
        fetchSessions();
      }
    } catch (error) {
      toast.error('Failed to mark attendance');
    }
  };

  const closeSession = async () => {
    if (!currentSession) return;

    try {
      const response = await adminService.closeAttendanceSession(currentSession.id);
      if (response.success) {
        toast.success('Session closed');
        setCurrentSession(null);
        setShowQR(false);
        fetchSessions();
      }
    } catch (error) {
      toast.error('Failed to close session');
    }
  };

  const exportReport = async () => {
    try {
      const response = await adminService.exportAttendanceReport({
        batch: selectedBatch,
        format: 'csv'
      });
      
      if (response.success && response.data) {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_${selectedBatch}_${date}.csv`;
        a.click();
        toast.success('Report exported!');
      }
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Delete session
  const deleteSession = async (sessionId) => {
    if (!confirm('Are you sure you want to delete this session? This cannot be undone.')) return;
    
    try {
      const response = await adminService.deleteAttendanceSession(sessionId);
      if (response.success) {
        toast.success('Session deleted');
        fetchSessions();
        if (currentSession?.id === sessionId) {
          setCurrentSession(null);
        }
      }
    } catch (error) {
      toast.error('Failed to delete session');
    }
  };

  // Student Details Modal
  const StudentDetailsModal = () => {
    if (!studentDetails) return null;

    const { student, stats, records, monthlyBreakdown } = studentDetails;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 animate-scale-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                  {student?.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{student?.name}</h3>
                  <p className="text-indigo-200">{student?.rollNumber} • {student?.batch}</p>
                  <p className="text-indigo-200 text-sm">{student?.email}</p>
                </div>
              </div>
              <button onClick={() => { setSelectedStudent(null); setStudentDetails(null); }} className="p-2 hover:bg-white/20 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{stats?.percentage || 0}%</p>
                <p className="text-xs text-green-700">Attendance</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{stats?.present || 0}</p>
                <p className="text-xs text-blue-700">Present</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats?.late || 0}</p>
                <p className="text-xs text-yellow-700">Late</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-red-600">{stats?.absent || 0}</p>
                <p className="text-xs text-red-700">Absent</p>
              </div>
            </div>

            {/* Streaks */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 text-white">
                <div className="flex items-center gap-2">
                  <Zap className="w-6 h-6" />
                  <div>
                    <p className="text-2xl font-bold">{stats?.currentStreak || 0}</p>
                    <p className="text-sm opacity-80">Current Streak</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-white">
                <div className="flex items-center gap-2">
                  <Award className="w-6 h-6" />
                  <div>
                    <p className="text-2xl font-bold">{stats?.maxStreak || 0}</p>
                    <p className="text-sm opacity-80">Best Streak</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Stats */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h4 className="font-medium text-gray-800 mb-3">Verification Methods</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-indigo-600 mb-1">
                    <QrCode className="w-5 h-5" />
                    <span className="text-lg font-bold">{stats?.qrMarked || 0}</span>
                  </div>
                  <p className="text-xs text-gray-500">QR Scans</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                    <MapPin className="w-5 h-5" />
                    <span className="text-lg font-bold">{stats?.locationVerified || 0}</span>
                  </div>
                  <p className="text-xs text-gray-500">Location Verified</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                    <UserCheck className="w-5 h-5" />
                    <span className="text-lg font-bold">{stats?.manualMarked || 0}</span>
                  </div>
                  <p className="text-xs text-gray-500">Manual</p>
                </div>
              </div>
            </div>

            {/* Recent Records */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Recent Attendance</h4>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {records?.slice(0, 10).map((record, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        record.status === 'present' ? 'bg-green-500' :
                        record.status === 'late' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="font-medium text-sm">{new Date(record.date).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">{record.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        record.status === 'present' ? 'bg-green-100 text-green-700' :
                        record.status === 'late' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {record.status}
                      </span>
                      {record.locationVerified && (
                        <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>{record.distanceFromSession}m</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {(!records || records.length === 0) && (
                  <p className="text-gray-500 text-center py-4">No attendance records yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Analytics View with Bar Charts
  const AnalyticsView = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{analytics?.totalSessions || 0}</p>
              <p className="text-sm opacity-80">Total Sessions</p>
            </div>
            <Calendar className="w-10 h-10 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{analytics?.avgAttendanceRate || 0}%</p>
              <p className="text-sm opacity-80">Avg Attendance</p>
            </div>
            <TrendingUp className="w-10 h-10 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{analytics?.totalStudents || 0}</p>
              <p className="text-sm opacity-80">Total Students</p>
            </div>
            <Users className="w-10 h-10 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{analytics?.atRisk?.length || 0}</p>
              <p className="text-sm opacity-80">At Risk (&lt;75%)</p>
            </div>
            <AlertTriangle className="w-10 h-10 opacity-50" />
          </div>
        </div>
      </div>

      {/* Batch Comparison Chart */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          Batch Comparison - Attendance Rate
        </h3>
        <div className="flex items-end justify-center gap-16 h-64 pt-8">
          {/* Basic Batch */}
          <div className="flex flex-col items-center">
            <div className="relative w-28">
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xl font-bold text-blue-600">
                {analytics?.batchStats?.Basic?.avgRate || 0}%
              </span>
              <div 
                className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-500 shadow-lg"
                style={{ height: `${Math.max((analytics?.batchStats?.Basic?.avgRate || 0) * 1.8, 20)}px` }}
              />
            </div>
            <div className="mt-4 text-center">
              <p className="font-bold text-gray-800 text-lg">Basic</p>
              <p className="text-sm text-gray-500">{analytics?.batchStats?.Basic?.sessions || 0} sessions</p>
              <p className="text-xs text-gray-400">{analytics?.batchStats?.Basic?.totalPresent || 0} present</p>
            </div>
          </div>
          {/* Advanced Batch */}
          <div className="flex flex-col items-center">
            <div className="relative w-28">
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xl font-bold text-purple-600">
                {analytics?.batchStats?.Advanced?.avgRate || 0}%
              </span>
              <div 
                className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all duration-500 shadow-lg"
                style={{ height: `${Math.max((analytics?.batchStats?.Advanced?.avgRate || 0) * 1.8, 20)}px` }}
              />
            </div>
            <div className="mt-4 text-center">
              <p className="font-bold text-gray-800 text-lg">Advanced</p>
              <p className="text-sm text-gray-500">{analytics?.batchStats?.Advanced?.sessions || 0} sessions</p>
              <p className="text-xs text-gray-400">{analytics?.batchStats?.Advanced?.totalPresent || 0} present</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      {analytics?.monthlyTrends?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Monthly Attendance Trends</h3>
          <div className="overflow-x-auto">
            <div className="flex items-end gap-6 min-w-max pb-4 px-4">
              {analytics.monthlyTrends.map((trend, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className="flex items-end gap-2 h-40">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-blue-600 font-medium mb-1">{trend.Basic}%</span>
                      <div 
                        className="w-10 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t shadow"
                        style={{ height: `${Math.max(trend.Basic * 1.2, 10)}px` }}
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-purple-600 font-medium mb-1">{trend.Advanced}%</span>
                      <div 
                        className="w-10 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t shadow"
                        style={{ height: `${Math.max(trend.Advanced * 1.2, 10)}px` }}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3 font-medium">{trend.month}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-6 justify-center mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded" />
                <span className="text-sm text-gray-600">Basic Batch</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded" />
                <span className="text-sm text-gray-600">Advanced Batch</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Performers & At Risk */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Top Performers (≥90%)
          </h3>
          <div className="space-y-3">
            {analytics?.topPerformers?.map((student, idx) => (
              <div 
                key={student.userId}
                onClick={() => fetchStudentDetails(student.userId)}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg cursor-pointer hover:shadow-md transition"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : 'bg-orange-400'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-800">{student.name}</p>
                    <p className="text-sm text-gray-500">{student.batch}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-green-600">{student.percentage}%</span>
                  <Eye className="w-4 h-4 text-gray-400 inline ml-2" />
                </div>
              </div>
            ))}
            {!analytics?.topPerformers?.length && (
              <p className="text-gray-500 text-center py-4">No data yet - create sessions first</p>
            )}
          </div>
        </div>

        {/* At Risk Students */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            At Risk Students (&lt;75%)
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {analytics?.atRisk?.map((student) => (
              <div 
                key={student.userId}
                onClick={() => fetchStudentDetails(student.userId)}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg cursor-pointer hover:shadow-md transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold">
                    {student.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{student.name}</p>
                    <p className="text-sm text-gray-500">{student.batch} • {student.total} sessions</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-red-600">{student.percentage}%</span>
                  <Eye className="w-4 h-4 text-gray-400 inline ml-2" />
                </div>
              </div>
            ))}
            {!analytics?.atRisk?.length && (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2" />
                <p className="text-green-600 font-medium">No at-risk students!</p>
                <p className="text-sm text-gray-500">All students are above 75%</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All Students Ranking */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            All Students Ranking
          </h3>
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Rank</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Student</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Batch</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Present</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Late</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Absent</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Rate</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {analytics?.studentStats?.slice(0, 20).map((student, idx) => (
                <tr key={student.userId} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    {idx < 3 ? (
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : 'bg-orange-400'
                      }`}>
                        {idx + 1}
                      </span>
                    ) : (
                      <span className="text-gray-500 font-medium pl-2">{idx + 1}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-800">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.rollNumber}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      student.batch === 'Basic' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {student.batch}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-green-600 font-medium">{student.present}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-yellow-600 font-medium">{student.late}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-red-600 font-medium">{student.absent}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${
                      student.percentage >= 90 ? 'text-green-600' :
                      student.percentage >= 75 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {student.percentage}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => fetchStudentDetails(student.userId)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!analytics?.studentStats || analytics.studentStats.length === 0) && (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No attendance data yet</p>
              <p className="text-sm">Create sessions and mark attendance to see rankings</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link to="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">Attendance System</h1>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  Cheating-proof with geolocation verification
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'sessions', label: 'QR Sessions', icon: QrCode },
                { key: 'manual', label: 'Manual Entry', icon: UserCheck },
                { key: 'analytics', label: 'Analytics', icon: BarChart3 }
              ].map((v) => (
                <button
                  key={v.key}
                  onClick={() => {
                    setShowQR(false); // Close QR modal when switching tabs
                    setView(v.key);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                    view === v.key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <v.icon className="w-4 h-4" />
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {view === 'sessions' && (
          <div className="space-y-6">
            {/* Create Session Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-shrink-0">
                  <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 text-gray-800">
                    <QrCode className="w-8 h-8 text-indigo-600" />
                    Start Attendance Session
                  </h2>
                  <p className="text-gray-500">Generate secure QR code for students to scan</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Batch</label>
                    <select
                      value={selectedBatch}
                      onChange={(e) => setSelectedBatch(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="Basic">Basic</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Type</label>
                    <select
                      value={sessionType}
                      onChange={(e) => setSessionType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="regular">Regular</option>
                      <option value="makeup">Makeup</option>
                      <option value="special">Special</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter location"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Max Distance</label>
                    <select
                      value={maxDistance}
                      onChange={(e) => setMaxDistance(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value={50}>50m (Strict)</option>
                      <option value={100}>100m (Default)</option>
                      <option value={200}>200m (Relaxed)</option>
                      <option value={500}>500m (Wide)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Code Valid For</label>
                    <select
                      value={codeValidity}
                      onChange={(e) => setCodeValidity(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value={5}>5 minutes</option>
                      <option value={10}>10 minutes</option>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={120}>2 hours</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Geolocation Toggle */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-100 transition">
                  <input
                    type="checkbox"
                    checked={useGeolocation}
                    onChange={(e) => setUseGeolocation(e.target.checked)}
                    className="w-5 h-5 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="text-indigo-700 font-medium">Enable Location Verification (Anti-Cheat)</span>
                </label>

                {useGeolocation && (
                  <button
                    onClick={getAdminLocation}
                    disabled={gettingLocation}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                      adminLocation 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    <Navigation className={`w-4 h-4 ${gettingLocation ? 'animate-spin' : ''}`} />
                    {adminLocation ? '✓ Location Captured' : gettingLocation ? 'Getting...' : 'Capture My Location'}
                  </button>
                )}

                <button
                  onClick={createSession}
                  disabled={loading || (useGeolocation && !adminLocation)}
                  className="ml-auto flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  {loading ? 'Creating...' : 'Start Session'}
                </button>
              </div>

              {useGeolocation && !adminLocation && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <p className="text-sm text-amber-700 font-medium">
                    Capture your location first to enable cheating protection
                  </p>
                </div>
              )}
            </div>

            {/* Active Session */}
            {currentSession && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Session Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-4 h-4 bg-white rounded-full animate-pulse" />
                        <div className="absolute inset-0 w-4 h-4 bg-white rounded-full animate-ping opacity-50" />
                      </div>
                      <div>
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-bold rounded-full">
                          Active Session
                        </span>
                        <p className="text-white/90 text-sm mt-1 flex items-center gap-2">
                          <span className="font-semibold">{currentSession.batch}</span>
                          <span className="w-1 h-1 bg-white/60 rounded-full" />
                          <span>{currentSession.location}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setShowQR(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-600 rounded-xl hover:bg-emerald-50 font-semibold shadow-md hover:shadow-lg transition-all"
                      >
                        <QrCode className="w-5 h-5" />
                        Show QR
                      </button>
                      <button
                        onClick={() => markAllAttendance('present')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-md hover:shadow-lg transition-all border border-emerald-400"
                      >
                        <UserCheck className="w-5 h-5" />
                        Mark All Present
                      </button>
                      <button
                        onClick={closeSession}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 font-semibold border border-white/30 transition-all"
                      >
                        <XCircle className="w-5 h-5" />
                        Close Session
                      </button>
                    </div>
                  </div>
                </div>

                {/* Search and Stats Bar */}
                <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search students by name or roll number..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <span className="text-gray-500">Total:</span>
                        <span className="font-bold text-gray-800 ml-1">{filteredStudents.length}</span>
                      </span>
                      <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <span className="text-emerald-600">Present:</span>
                        <span className="font-bold text-emerald-700 ml-1">
                          {currentSession?.records?.filter(r => r.status === 'present').length || 0}
                        </span>
                      </span>
                      <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                        <span className="text-amber-600">Late:</span>
                        <span className="font-bold text-amber-700 ml-1">
                          {currentSession?.records?.filter(r => r.status === 'late').length || 0}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Students List */}
                <div className="p-6">
                  {filteredStudents.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="w-10 h-10 text-gray-400" />
                      </div>
                      <p className="font-semibold text-gray-700">No students found</p>
                      <p className="text-sm text-gray-500 mt-1">Add students to {currentSession?.batch || selectedBatch} batch first</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {filteredStudents.map((student, index) => {
                        const record = currentSession?.records?.find(r => r.userId === student.userId);
                        const status = record?.status || attendance[student.userId] || 'absent';

                        return (
                          <div
                            key={student.userId}
                            className={`group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                              status === 'present' 
                                ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 shadow-emerald-100' 
                                : status === 'late' 
                                ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 shadow-amber-100' 
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm ${
                                status === 'present' 
                                  ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white' 
                                  : status === 'late' 
                                  ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white' 
                                  : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600'
                              }`}>
                                {student.name.charAt(0).toUpperCase()}
                                {status === 'present' && (
                                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                  </div>
                                )}
                                {status === 'late' && (
                                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
                                    <Clock className="w-4 h-4 text-amber-500" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-800">{student.name}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  {student.rollNumber && (
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                      {student.rollNumber}
                                    </span>
                                  )}
                                  {record?.markedMethod === 'qr' && (
                                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full flex items-center gap-1 font-medium">
                                      <QrCode className="w-3 h-3" /> QR Scan
                                    </span>
                                  )}
                                  {record?.locationVerified && (
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full flex items-center gap-1 font-medium">
                                      <MapPin className="w-3 h-3" /> {record.distanceFromSession}m away
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3 sm:mt-0">
                              <button
                                onClick={() => markAttendance(student.userId, 'present')}
                                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                  status === 'present' 
                                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-emerald-100 hover:text-emerald-700'
                                }`}
                              >
                                Present
                              </button>
                              <button
                                onClick={() => markAttendance(student.userId, 'late')}
                                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                  status === 'late' 
                                    ? 'bg-amber-500 text-white shadow-md shadow-amber-200' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700'
                                }`}
                              >
                                Late
                              </button>
                              <button
                                onClick={() => markAttendance(student.userId, 'absent')}
                                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                  status === 'absent' 
                                    ? 'bg-red-500 text-white shadow-md shadow-red-200' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-700'
                                }`}
                              >
                                Absent
                              </button>
                              <button
                                onClick={() => deleteSessionAttendance(student.userId)}
                                disabled={!record}
                                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                                  record 
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                                    : 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'
                                }`}
                                title={record ? 'Delete attendance record' : 'No record to delete'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Sessions */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Recent Sessions</h3>
                <button
                  onClick={fetchSessions}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {sessions.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="font-medium text-gray-700">No sessions yet</p>
                  <p className="text-sm text-gray-500">Create your first session above to start tracking attendance</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.slice(0, 10).map((session) => (
                    <div
                      key={session.id}
                      onClick={() => {
                        if (session.isActive) {
                          // Sync batch and fetch students for this session
                          setSelectedBatch(session.batch);
                          fetchStudents(session.batch);
                          setCurrentSession(session);
                          setShowQR(true);
                        }
                      }}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition gap-4 border border-gray-200 ${
                        session.isActive ? 'cursor-pointer ring-2 ring-green-500 ring-offset-2' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          session.isActive ? 'bg-green-100' : 'bg-indigo-100'
                        }`}>
                          <Calendar className={`w-6 h-6 ${session.isActive ? 'text-green-600' : 'text-indigo-600'}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {new Date(session.date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                          <p className="text-sm flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              session.batch === 'Basic' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                            }`}>
                              {session.batch}
                            </span>
                            <span className="text-gray-700">{session.location}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">{session.sessionType}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {session.presentCount + session.lateCount}/{session.records?.length || 0}
                          </p>
                          <p className="text-sm text-gray-600">Present</p>
                        </div>
                        {session.isActive ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium animate-pulse">
                            Active
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-full font-medium">
                            Closed
                          </span>
                        )}
                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.id);
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Delete session"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manual Attendance Entry View - Works independently without session */}
        {view === 'manual' && (
          <div className="space-y-6">
            {/* Manual Entry Card */}
            <div className="bg-white rounded-2xl shadow-xl border p-6">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
                    <UserCheck className="w-8 h-8 text-indigo-600" />
                    Manual Attendance Entry
                  </h2>
                  <p className="text-gray-500 mt-1">Search by name or Moodle ID and mark attendance with time tracking</p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg w-fit">
                    <Calendar className="w-4 h-4" />
                    <span>Change the date below to view & delete past attendance records</span>
                  </div>
                </div>
                
                {/* Date, Time and Batch Selector for Manual */}
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Select Date to View/Edit
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                      />
                      <button
                        onClick={() => setDate(new Date().toISOString().split('T')[0])}
                        className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-xs font-medium whitespace-nowrap"
                        title="Set to today"
                      >
                        Today
                      </button>
                    </div>
                    {/* Quick date buttons */}
                    <div className="flex gap-1 mt-1">
                      <button
                        onClick={() => {
                          const yesterday = new Date();
                          yesterday.setDate(yesterday.getDate() - 1);
                          setDate(yesterday.toISOString().split('T')[0]);
                        }}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                      >
                        Yesterday
                      </button>
                      <button
                        onClick={() => {
                          const lastWeek = new Date();
                          lastWeek.setDate(lastWeek.getDate() - 7);
                          setDate(lastWeek.toISOString().split('T')[0]);
                        }}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                      >
                        Last Week
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Start Time</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">End Time</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Batch</label>
                    <select
                      value={selectedBatch}
                      onChange={(e) => setSelectedBatch(e.target.value)}
                      className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      <option value="Basic">Basic</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 text-center">
                    <p className="text-lg font-bold text-indigo-600">{allStudents.filter(s => s.batch === selectedBatch).length}</p>
                    <p className="text-xs text-indigo-700">{selectedBatch} Students</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 text-center">
                    <p className="text-lg font-bold text-purple-600">
                      {(() => {
                        const start = new Date(`2000-01-01T${startTime}`);
                        const end = new Date(`2000-01-01T${endTime}`);
                        const mins = Math.round((end - start) / 60000);
                        return mins > 0 ? mins : 0;
                      })()}
                    </p>
                    <p className="text-xs text-purple-700">Minutes</p>
                  </div>
                </div>
              </div>

              {/* Search Input */}
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  type="text"
                  value={manualSearchTerm}
                  onChange={(e) => setManualSearchTerm(e.target.value)}
                  placeholder="Search by name or Moodle ID..."
                  className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                  autoFocus
                />
                {manualSearchTerm && (
                  <button
                    onClick={() => setManualSearchTerm('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Quick Stats */}
              <div className="mb-4">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-700 font-medium">Viewing Attendance For:</p>
                      <p className="text-lg font-bold text-purple-900">
                        {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    {Object.keys(manualAttendance).length > 0 && (
                      <div className="text-right">
                        <p className="text-sm text-purple-700">Already Marked:</p>
                        <p className="text-2xl font-bold text-purple-900">{Object.keys(manualAttendance).length}</p>
                        <p className="text-xs text-purple-600">students have attendance</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-gray-700">{allStudents.filter(s => s.batch === selectedBatch).length}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-green-600">{manualAttendanceStatus.present}</p>
                    <p className="text-xs text-green-700">Present</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-yellow-600">{manualAttendanceStatus.late}</p>
                    <p className="text-xs text-yellow-700">Late</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-red-600">{manualAttendanceStatus.absent}</p>
                    <p className="text-xs text-red-700">Absent</p>
                  </div>
                </div>
              </div>

              {/* Bulk Actions Bar */}
              {Object.keys(manualAttendance).length > 0 && (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl mb-4 border-2 border-red-200">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-bold text-red-900 text-sm">Manage Attendance Records</p>
                      <p className="text-xs text-red-700">Select students to delete their attendance for {new Date(date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={selectAllWithAttendance}
                      className="px-4 py-2 bg-white text-red-700 rounded-lg hover:bg-red-50 font-medium text-sm border-2 border-red-300 transition"
                    >
                      Select All ({Object.keys(manualAttendance).length})
                    </button>
                    {selectedStudents.length > 0 && (
                      <>
                        <span className="text-sm font-bold text-red-700 bg-white px-3 py-2 rounded-lg border border-red-200">
                          {selectedStudents.length} selected
                        </span>
                        <button
                          onClick={bulkDeleteAttendance}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold text-sm shadow-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Selected
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Students List */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {allStudents
                  .filter(s => s.batch === selectedBatch)
                  .filter(s => {
                    if (!manualSearchTerm) return true;
                    const search = manualSearchTerm.toLowerCase();
                    return s.name?.toLowerCase().includes(search) ||
                           s.moodleId?.toLowerCase().includes(search) ||
                           s.rollNumber?.toLowerCase().includes(search);
                  })
                  .map((student) => {
                    const status = manualAttendance[student.userId];
                    const isMarking = markingAttendance === student.userId;

                    return (
                      <div
                        key={student.userId}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition ${
                          status === 'present' ? 'bg-green-50 border-green-300' :
                          status === 'late' ? 'bg-yellow-50 border-yellow-300' :
                          status === 'absent' ? 'bg-red-50 border-red-300' :
                          'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          {status && (
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.userId)}
                              onChange={() => toggleStudentSelection(student.userId)}
                              className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                            />
                          )}
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                            status === 'present' ? 'bg-green-500 text-white' :
                            status === 'late' ? 'bg-yellow-500 text-white' :
                            status === 'absent' ? 'bg-red-400 text-white' :
                            'bg-gradient-to-br from-indigo-500 to-purple-500 text-white'
                          }`}>
                            {student.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{student.name}</p>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                              {student.moodleId && (
                                <span className="bg-gray-100 px-2 py-0.5 rounded font-mono text-xs">{student.moodleId}</span>
                              )}
                              {student.rollNumber && (
                                <span className="text-xs">Roll: {student.rollNumber}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => markManualAttendance(student.userId, 'present')}
                            disabled={isMarking}
                            className={`px-3 py-2 rounded-lg font-medium transition flex items-center gap-1 text-sm ${
                              status === 'present' 
                                ? 'bg-green-500 text-white ring-2 ring-green-300' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            } disabled:opacity-50`}
                          >
                            {isMarking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Present
                          </button>
                          <button
                            onClick={() => markManualAttendance(student.userId, 'late')}
                            disabled={isMarking}
                            className={`px-3 py-2 rounded-lg font-medium transition flex items-center gap-1 text-sm ${
                              status === 'late' 
                                ? 'bg-yellow-500 text-white ring-2 ring-yellow-300' 
                                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            } disabled:opacity-50`}
                          >
                            <Clock className="w-4 h-4" />
                            Late
                          </button>
                          <button
                            onClick={() => markManualAttendance(student.userId, 'absent')}
                            disabled={isMarking}
                            className={`px-3 py-2 rounded-lg font-medium transition flex items-center gap-1 text-sm ${
                              status === 'absent' 
                                ? 'bg-red-500 text-white ring-2 ring-red-300' 
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            } disabled:opacity-50`}
                          >
                            <XCircle className="w-4 h-4" />
                            Absent
                          </button>
                          <button
                            onClick={() => deleteManualAttendance(student.userId)}
                            disabled={isMarking || !status}
                            className={`px-3 py-2 rounded-lg font-medium transition flex items-center gap-1 text-sm ${
                              status 
                                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                                : 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'
                            } disabled:opacity-50`}
                            title={status ? 'Delete attendance record' : 'Mark attendance first'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                {allStudents.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No students found</p>
                    <p className="text-sm">Add students to the system first</p>
                  </div>
                )}

                {allStudents.length > 0 && allStudents.filter(s => {
                  const search = manualSearchTerm.toLowerCase();
                  return s.name?.toLowerCase().includes(search) ||
                         s.moodleId?.toLowerCase().includes(search) ||
                         s.rollNumber?.toLowerCase().includes(search) ||
                         s.batch?.toLowerCase().includes(search);
                }).length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Search className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No matching students</p>
                    <p className="text-sm">Try a different search term</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'analytics' && <AnalyticsView />}
      </div>

      {/* QR Modal - Inline to prevent re-render issues */}
      {showQR && currentSession && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 animate-scale-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-800">Attendance Code</h3>
              <button onClick={() => setShowQR(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Code Display - Compact */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6 mb-4 text-center">
              <p className="text-xs uppercase tracking-wider mb-2 text-indigo-200">Share this code</p>
              <p className="text-4xl font-mono font-bold tracking-[0.3em] text-white select-all">
                {shortCode}
              </p>
            </div>

            {/* Security indicators - Compact */}
            <div className="bg-green-50 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-green-700 text-sm">
                <Shield className="w-4 h-4" />
                <span className="font-medium">Anti-Cheat Active</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-green-600">
                <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Time-limited</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Location</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> One-time</span>
              </div>
            </div>

            {/* Expiry Timer - Compact */}
            {qrExpiry !== null && (
              <div className={`text-center p-2 rounded-lg mb-3 text-sm ${
                qrExpiry < 60 ? 'bg-red-100 text-red-700' : 
                qrExpiry < 300 ? 'bg-yellow-100 text-yellow-700' : 
                'bg-green-100 text-green-700'
              }`}>
                <div className="flex items-center justify-center gap-2">
                  <Timer className="w-4 h-4" />
                  <span className="font-bold">{formatTime(qrExpiry)}</span>
                  <span>remaining</span>
                </div>
              </div>
            )}

            {/* Session Info - Compact */}
            <div className="text-xs text-gray-500 mb-3 flex flex-wrap gap-x-4 gap-y-1">
              <span><strong>Batch:</strong> {currentSession?.batch}</span>
              <span><strong>Location:</strong> {currentSession?.location}</span>
              {adminLocation && <span><strong>Max:</strong> {maxDistance}m</span>}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={refreshQRCode}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={closeSession}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
              >
                <XCircle className="w-4 h-4" />
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {selectedStudent && studentDetails && <StudentDetailsModal />}

      <style>{`
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default AttendanceManager;