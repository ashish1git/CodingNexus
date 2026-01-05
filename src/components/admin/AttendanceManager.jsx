// src/components/admin/AttendanceManager.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, UserCheck, Save, Calendar, Download, Search, Filter } from 'lucide-react';
import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const AttendanceManager = () => {
  const { userDetails } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('Basic');
  const [attendance, setAttendance] = useState({});
  // Initialize with today's date formatted as YYYY-MM-DD
  const [date, setDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // --- LOGIC: Calculate "Today" to block Future Dates ---
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const maxDate = getTodayString(); // This restricts the Date Picker
  // -----------------------------------------------------

  useEffect(() => {
    fetchStudents();
    fetchAttendanceHistory();
  }, [selectedBatch]);

  useEffect(() => {
    // Check if attendance for selected date already exists
    if (students.length > 0) {
      checkExistingAttendance();
    }
  }, [date, selectedBatch, students]);

  const checkExistingAttendance = async () => {
    try {
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('date', '==', new Date(date)),
        where('batch', '==', selectedBatch)
      );
      const snapshot = await getDocs(attendanceQuery);
      
      if (!snapshot.empty) {
        const existingRecord = snapshot.docs[0].data();
        const existingAttendance = {};
        
        existingRecord.presentStudents?.forEach(studentId => {
          existingAttendance[studentId] = true;
        });
        
        const finalAttendance = {};
        students.forEach(student => {
          finalAttendance[student.id] = existingAttendance[student.id] || false;
        });
        
        setAttendance(finalAttendance);
        setLastSaved(snapshot.docs[0].id);
        
        toast('Attendance for this date already exists. Editing existing record.', {
          icon: '📝',
          duration: 3000
        });
      } else {
        const initialAttendance = {};
        students.forEach(s => {
          initialAttendance[s.id] = false;
        });
        setAttendance(initialAttendance);
        setLastSaved(null);
      }
    } catch (error) {
      console.error('Error checking existing attendance:', error);
      const initialAttendance = {};
      students.forEach(s => {
        initialAttendance[s.id] = false;
      });
      setAttendance(initialAttendance);
    }
  };

  const fetchStudents = async () => {
    try {
      const studentsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'student'),
        where('batch', '==', selectedBatch)
      );
      const snapshot = await getDocs(studentsQuery);
      const studentsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentsList);
      
      const initialAttendance = {};
      studentsList.forEach(s => {
        initialAttendance[s.id] = false;
      });
      setAttendance(initialAttendance);
      
      toast.success(`Loaded ${studentsList.length} students from ${selectedBatch} batch`);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('batch', '==', selectedBatch),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(attendanceQuery);
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate()
      }));
      setAttendanceHistory(history);
      toast.success(`Loaded ${history.length} attendance records`);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      toast.error('Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (studentId, studentName) => {
    // --- CHECK: Prevent future date editing ---
    if (date > maxDate) {
      toast.error("Cannot edit attendance for future dates.");
      return;
    }
    
    const newStatus = !attendance[studentId];
    setAttendance(prev => ({
      ...prev,
      [studentId]: newStatus
    }));
    
    if (newStatus) {
      toast(`${studentName} marked Present ✓`, {
        icon: '✅',
        duration: 1500
      });
    } else {
      toast(`${studentName} marked Absent ✗`, {
        icon: '❌',
        duration: 1500
      });
    }
  };

  const markAllPresent = () => {
    if (date > maxDate) return; 
    const allPresent = {};
    students.forEach(s => {
      allPresent[s.id] = true;
    });
    setAttendance(allPresent);
    toast(`All ${students.length} students marked Present ✓`, {
      icon: '✅',
      duration: 2000
    });
  };

  const markAllAbsent = () => {
    if (date > maxDate) return;
    const allAbsent = {};
    students.forEach(s => {
      allAbsent[s.id] = false;
    });
    setAttendance(allAbsent);
    toast(`All ${students.length} students marked Absent ✗`, {
      icon: '❌',
      duration: 2000
    });
  };

  const handleSubmit = async () => {
    // --- VALIDATION: Only allow Today or Past ---
    if (date > maxDate) {
      toast.error('Cannot mark attendance for future dates!');
      return;
    }
    
    if (students.length === 0) {
      toast.error('No students found for this batch');
      return;
    }

    setLoading(true);
    try {
      const presentStudents = Object.keys(attendance).filter(id => attendance[id]);
      const presentMoodleIds = students
        .filter(s => attendance[s.id])
        .map(s => s.moodleId);
      const presentRollNos = students
        .filter(s => attendance[s.id])
        .map(s => s.rollNo);
      const absentStudents = students
        .filter(s => !attendance[s.id])
        .map(s => ({ id: s.id, name: s.name, rollNo: s.rollNo }));

      const attendancePercentage = students.length > 0 
        ? Math.round((presentStudents.length / students.length) * 100)
        : 0;

      const attendanceData = {
        date: new Date(date),
        batch: selectedBatch,
        presentStudents,
        presentMoodleIds,
        presentRollNos,
        absentStudents,
        totalStudents: students.length,
        presentCount: presentStudents.length,
        absentCount: students.length - presentStudents.length,
        attendancePercentage,
        markedBy: userDetails.name,
        markedByUid: userDetails.uid,
        markedAt: new Date()
      };

      let result;
      if (lastSaved) {
        const docRef = doc(db, 'attendance', lastSaved);
        await updateDoc(docRef, attendanceData);
        result = { id: lastSaved };
        toast.success(`✅ Attendance updated! ${presentStudents.length}/${students.length} present`);
      } else {
        const docRef = await addDoc(collection(db, 'attendance'), attendanceData);
        result = docRef;
        setLastSaved(docRef.id);
        toast.success(`✅ Attendance saved! ${presentStudents.length}/${students.length} present`);
      }

      await updateStudentAttendanceRecords(presentStudents, absentStudents);
      await fetchAttendanceHistory();
      showAttendanceSummary(presentStudents.length, students.length, absentStudents);
      
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error(`❌ Failed to save attendance: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateStudentAttendanceRecords = async (presentStudents, absentStudents) => {
    try {
      const updatePromises = [];
      const attendanceDate = new Date(date);
      
      presentStudents.forEach(studentId => {
        const studentDoc = doc(db, 'users', studentId);
        updatePromises.push(
          updateDoc(studentDoc, {
            lastAttendanceDate: attendanceDate,
            lastAttendanceStatus: 'present',
            attendanceUpdated: new Date()
          })
        );
      });
      
      absentStudents.forEach(student => {
        const studentDoc = doc(db, 'users', student.id);
        updatePromises.push(
          updateDoc(studentDoc, {
            lastAttendanceDate: attendanceDate,
            lastAttendanceStatus: 'absent',
            attendanceUpdated: new Date()
          })
        );
      });
      
      await Promise.all(updatePromises);
      toast.success('📊 Student records updated');
    } catch (error) {
      console.error('Error updating student records:', error);
      toast.error('⚠️ Could not update all student records');
    }
  };

  const showAttendanceSummary = (presentCount, totalCount, absentStudents) => {
    if (absentStudents.length > 0) {
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} 
          max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <span className="text-yellow-800 text-lg">📊</span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">Attendance Summary</p>
                <div className="mt-1 text-sm text-gray-500">
                  <p className="text-green-600 font-semibold">Present: {presentCount}/{totalCount}</p>
                  <p className="text-red-600 font-semibold">Absent: {absentStudents.length}/{totalCount}</p>
                  {absentStudents.length <= 5 && (
                    <p className="mt-1 text-xs">
                      Absent: {absentStudents.map(s => s.name).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ), { duration: 5000 });
    }
  };

  const exportToCSV = () => {
    if (attendanceHistory.length === 0) {
      toast.error('No attendance records to export');
      return;
    }

    const headers = ['Date', 'Batch', 'Total Students', 'Present', 'Absent', 'Percentage', 'Marked By'];
    const rows = attendanceHistory.map(record => [
      record.date?.toLocaleDateString(),
      record.batch,
      record.totalStudents,
      record.presentCount,
      record.totalStudents - record.presentCount,
      `${Math.round((record.presentCount / record.totalStudents) * 100)}%`,
      record.markedBy
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${selectedBatch}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`📥 Exported ${attendanceHistory.length} records`);
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.moodleId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Attendance Management</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-2xl font-bold text-blue-600">{students.length}</p>
            <p className="text-sm text-gray-600">Total Students</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-2xl font-bold text-green-600">
              {Object.values(attendance).filter(Boolean).length}
            </p>
            <p className="text-sm text-gray-600">Present Today</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-2xl font-bold text-red-600">
              {students.length - Object.values(attendance).filter(Boolean).length}
            </p>
            <p className="text-sm text-gray-600">Absent Today</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-2xl font-bold text-purple-600">
              {students.length > 0 
                ? Math.round((Object.values(attendance).filter(Boolean).length / students.length) * 100)
                : 0}%
            </p>
            <p className="text-sm text-gray-600">Attendance Rate</p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={date}
                max={maxDate} // <--- THIS is what blocks Future dates only
                // No 'min' attribute, so past dates are allowed
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Batch</label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Basic">Basic Batch</option>
                <option value="Advanced">Advanced Batch</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={markAllPresent}
              disabled={date > maxDate}
              className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition ${
                date > maxDate ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Mark All Present
            </button>
            <button
              onClick={markAllAbsent}
              disabled={date > maxDate}
              className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition ${
                date > maxDate ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              Mark All Absent
            </button>
            <button
              onClick={() => {
                setShowHistory(!showHistory);
                if (!showHistory) fetchAttendanceHistory();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              <Calendar className="w-4 h-4" />
              {showHistory ? 'Hide History' : 'View History'}
            </button>
            <button
              onClick={exportToCSV}
              disabled={attendanceHistory.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Students List */}
        {!showHistory ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Students ({filteredStudents.length})
              </h2>
              <div className="text-sm text-gray-500">
                Click on a student to toggle attendance
              </div>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {filteredStudents.map(student => (
                <div
                  key={student.id}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-[1.01] ${
                    attendance[student.id]
                      ? 'bg-green-50 border-green-500 shadow-sm'
                      : 'bg-red-50 border-red-300'
                  }`}
                  onClick={() => toggleAttendance(student.id, student.name)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold transition-all ${
                      attendance[student.id] ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                      {student.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{student.name}</p>
                      <p className="text-sm text-gray-600">
                        Roll: {student.rollNo} | Moodle: {student.moodleId}
                      </p>
                    </div>
                  </div>
                  <span className={`px-6 py-2 rounded-lg font-semibold text-white transition-all ${
                    attendance[student.id] ? 'bg-green-600' : 'bg-red-600'
                  }`}>
                    {attendance[student.id] ? 'Present ✓' : 'Absent ✗'}
                  </span>
                </div>
              ))}
              {filteredStudents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No students found matching your search
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || students.length === 0 || date > maxDate}
              className={`w-full mt-6 flex items-center justify-center gap-2 px-6 py-3 text-white rounded-lg shadow-md transition ${
                loading || students.length === 0 || date > maxDate
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {lastSaved ? 'Update Attendance' : 'Save Attendance'}
                </>
              )}
            </button>
          </div>
        ) : (
          /* Attendance History */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Attendance History</h2>
              <span className="text-sm text-gray-500">
                Showing {attendanceHistory.length} records
              </span>
            </div>
            <div className="space-y-4">
              {attendanceHistory.map(record => (
                <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                      <span className="font-semibold text-gray-800">
                        {record.date?.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      record.batch === 'Basic' 
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {record.batch}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-3">
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{record.totalStudents}</p>
                      <p className="text-xs text-gray-600">Total</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{record.presentCount}</p>
                      <p className="text-xs text-gray-600">Present</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">
                        {record.totalStudents - record.presentCount}
                      </p>
                      <p className="text-xs text-gray-600">Absent</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">
                        {Math.round((record.presentCount / record.totalStudents) * 100)}%
                      </p>
                      <p className="text-xs text-gray-600">Rate</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Marked by: {record.markedBy} at {record.markedAt?.toDate?.()?.toLocaleTimeString()}
                  </p>
                </div>
              ))}
              {attendanceHistory.length === 0 && (
                <p className="text-center text-gray-500 py-8">No attendance records found</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceManager;