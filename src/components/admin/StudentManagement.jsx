import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Search, UserPlus, Edit, Trash2, Filter, 
  Download, Phone, X, ShieldAlert, GraduationCap, Users, ChevronLeft, ChevronRight, Key
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import apiClient from '../../services/apiClient';
import { hasPermission, getPermissionDeniedMessage } from '../../utils/permissions';

const CLASS_YEARS = ['FE', 'SE', 'TE', 'BE'];
const DIVISIONS = ['A', 'B', 'C'];
const PAGE_SIZE = 15;

const StudentManagement = () => {
  const { userDetails } = useAuth();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBatch, setFilterBatch] = useState('All');
  const [filterClassYear, setFilterClassYear] = useState('All');
  const [filterDivision, setFilterDivision] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
    moodleId: '',
    mobile: '',
    batch: 'Basic',
    classYear: '',
    division: '',
    password: ''
  });

  const canManageStudents = hasPermission(userDetails, 'manageStudents');

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, filterBatch, filterClassYear, filterDivision]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterBatch, filterClassYear, filterDivision]);

  const fetchStudents = async () => {
    try {
      const response = await adminService.getAllStudents();
      if (response.success) {
        const normalized = (response.students || []).map(s => ({
          ...s,
          mobile: s.phone || s.mobile || '',
          classYear: s.classYear || '',
          division: s.division || ''
        }));
        setStudents(normalized);
      } else {
        toast.error(response.error || 'Failed to fetch students');
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
      setStudents([]);
    }
  };

  const filterStudents = () => {
    let filtered = students || [];

    if (filterBatch !== 'All') {
      filtered = filtered.filter(s => s.batch === filterBatch);
    }

    if (filterClassYear !== 'All') {
      filtered = filtered.filter(s => s.classYear === filterClassYear);
    }

    if (filterDivision !== 'All') {
      filtered = filtered.filter(s => s.division === filterDivision);
    }

    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rollNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.moodleId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
  };

  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    
    if (!canManageStudents) {
      toast.error(getPermissionDeniedMessage('manageStudents'));
      return;
    }

    setLoading(true);

    try {
      const email = `${formData.moodleId}@apsit.edu.in`;

      const data = await apiClient.post('/admin/students', {
        name: formData.name,
        rollNo: formData.rollNo,
        moodleId: formData.moodleId,
        phone: formData.mobile,
        batch: formData.batch,
        classYear: formData.classYear,
        division: formData.division || '',
        email: email,
        password: formData.password
      });

      if (data.success) {
        toast.success(
          (t) => (
            <div className="space-y-1">
              <p className="font-semibold">✅ Student Added & Registered!</p>
              <p className="text-sm"><strong>Name:</strong> {formData.name}</p>
              <p className="text-sm"><strong>Email:</strong> {email}</p>
              <p className="text-sm"><strong>Pass:</strong> {formData.password}</p>
              <p className="text-xs text-green-600 mt-2">Login enabled immediately.</p>
            </div>
          ),
          { duration: 5000 }
        );

        setShowAddModal(false);
        resetForm();
        fetchStudents();
      } else {
        toast.error(data.error || 'Failed to add student');
      }
      
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error('Failed to add student: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = async (e) => {
    e.preventDefault();
    
    if (!canManageStudents) {
      toast.error(getPermissionDeniedMessage('manageStudents'));
      return;
    }
    
    if (!selectedStudent) return;

    setLoading(true);

    try {
      const updateData = {
        name: formData.name,
        phone: formData.mobile,
        batch: formData.batch,
        classYear: formData.classYear,
        division: formData.division
      };
      
      const response = await adminService.updateStudent(selectedStudent.id, updateData);

      if (response.success) {
        if (response.studentProfile) {
          setStudents(prevStudents =>
            prevStudents.map(s =>
              s.id === selectedStudent.id
                ? {
                    ...s,
                    name: response.studentProfile.name,
                    batch: response.studentProfile.batch,
                    classYear: response.studentProfile.classYear,
                    division: response.studentProfile.division,
                    phone: response.studentProfile.phone,
                    mobile: response.studentProfile.phone
                  }
                : s
            )
          );
        } else {
          await fetchStudents();
        }
        
        toast.success('Student updated successfully!');
        setShowEditModal(false);
        resetForm();
        setSelectedStudent(null);
      } else {
        toast.error(response.error || 'Failed to update student');
      }
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error('Failed to update student');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!canManageStudents) {
      toast.error(getPermissionDeniedMessage('manageStudents'));
      return;
    }

    if (!window.confirm('Are you sure you want to delete this student?')) {
      return;
    }

    try {
      const response = await adminService.deleteStudent(studentId);
      if (response.success) {
        toast.success('Student deleted successfully!');
        fetchStudents();
      } else {
        toast.error(response.error || 'Failed to delete student');
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to delete student');
    }
  };

  const handleResetPassword = async (student) => {
    if (!window.confirm(`Reset password for ${student.name || student.email}? A new password will be generated and emailed to them.`)) {
      return;
    }

    try {
      const response = await apiClient.post('/admin/students/reset-password', {
        studentId: student.id
      });

      if (response.success) {
        toast.success(
          (t) => (
            <div className="space-y-1">
              <p className="font-semibold">🔑 Password Reset!</p>
              <p className="text-sm"><strong>Student:</strong> {response.studentName}</p>
              <p className="text-sm"><strong>New Password:</strong> <code className="bg-slate-700 px-2 py-0.5 rounded">{response.newPassword}</code></p>
              <p className="text-xs text-green-400 mt-1">Email sent with new credentials</p>
            </div>
          ),
          { duration: 8000 }
        );
      } else {
        toast.error(response.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password');
    }
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    
    let batchValue = student.batch || 'Basic';
    if (batchValue !== 'Basic' && batchValue !== 'Advanced') {
      batchValue = 'Basic';
    }
    
    setFormData({
      name: student.name || '',
      rollNo: student.rollNo || '',
      moodleId: student.moodleId || '',
      mobile: student.phone || student.mobile || '',
      batch: batchValue,
      classYear: student.classYear || '',
      division: student.division || '',
      password: ''
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      rollNo: '',
      moodleId: '',
      mobile: '',
      batch: 'Basic',
      classYear: '',
      division: '',
      password: ''
    });
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Roll No', 'Moodle ID', 'Mobile', 'Class Year', 'Division', 'Batch', 'Email'];
    const rows = filteredStudents.map(s => [
      s.name, s.rollNo, s.moodleId, s.mobile, s.classYear || '', s.division || '', s.batch, s.email
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Students exported successfully!');
  };

  // Pagination component
  const Pagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Showing {((currentPage - 1) * PAGE_SIZE) + 1}-{Math.min(currentPage * PAGE_SIZE, filteredStudents.length)} of {filteredStudents.length}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 rounded-lg text-sm font-medium ${
                  currentPage === pageNum
                    ? 'bg-indigo-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-100'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // Stats grouped by class year
  const statsData = {};
  CLASS_YEARS.forEach(cy => {
    statsData[cy] = filteredStudents.filter(s => s.classYear === cy).length;
  });
  statsData['N/A'] = filteredStudents.filter(s => !s.classYear).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm sm:text-base">Back to Dashboard</span>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Student Management</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {!canManageStudents ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldAlert className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Access Denied</h2>
              <p className="text-gray-600 mb-6">
                You don't have permission to manage students. Contact your administrator to request access.
              </p>
              <Link
                to="/admin/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <>
        {/* Filters and Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col gap-4">
            {/* Search and Filter Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search students by name, roll no, or moodle ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-gray-400" />
                <select
                  value={filterClassYear}
                  onChange={(e) => setFilterClassYear(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                >
                  <option value="All">All Years</option>
                  {CLASS_YEARS.map(cy => (
                    <option key={cy} value={cy}>{cy}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gray-400" />
                <select
                  value={filterDivision}
                  onChange={(e) => setFilterDivision(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                >
                  <option value="All">All Divisions</option>
                  {DIVISIONS.map(d => (
                    <option key={d} value={d}>Div {d}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterBatch}
                  onChange={(e) => setFilterBatch(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                >
                  <option value="All">All Batches</option>
                  <option value="Basic">Basic</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={exportToCSV}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              {canManageStudents && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Student
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mt-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-800">{filteredStudents.length}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            {CLASS_YEARS.map(cy => (
              <div key={cy} className="text-center">
                <p className={`text-xl font-bold ${
                  cy === 'FE' ? 'text-green-600' : cy === 'SE' ? 'text-blue-600' : cy === 'TE' ? 'text-purple-600' : 'text-orange-600'
                }`}>
                  {statsData[cy] || 0}
                </p>
                <p className="text-xs text-gray-500">{cy}</p>
              </div>
            ))}
            <div className="text-center">
              <p className="text-xl font-bold text-gray-400">{statsData['N/A'] || 0}</p>
              <p className="text-xs text-gray-500">N/A</p>
            </div>
          </div>
        </div>

        {/* Students Table - Desktop */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Moodle ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Div</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {student.profilePhotoUrl || student.photoURL ? (
                            <img className="h-10 w-10 rounded-full object-cover" src={student.profilePhotoUrl || student.photoURL} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                              {(student.name || student.email || 'S')?.charAt(0)?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{student.email || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.rollNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.moodleId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {student.mobile}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.classYear ? (
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          student.classYear === 'FE' ? 'bg-green-100 text-green-800' :
                          student.classYear === 'SE' ? 'bg-blue-100 text-blue-800' :
                          student.classYear === 'TE' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {student.classYear}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {student.division || <span className="text-gray-400 italic">—</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        student.batch === 'Basic' ? 'bg-sky-100 text-sky-800' : 'bg-violet-100 text-violet-800'
                      }`}>
                        {student.batch}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditModal(student)} className="text-indigo-600 hover:text-indigo-900" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleResetPassword(student)} className="text-amber-600 hover:text-amber-900" title="Reset Password">
                          <Key className="w-4 h-4" />
                        </button>
                        {userDetails?.role === 'superadmin' && (
                          <button onClick={() => handleDeleteStudent(student.id)} className="text-red-600 hover:text-red-900" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination />
          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No students found</p>
            </div>
          )}
        </div>

        {/* Students Cards - Mobile */}
        <div className="md:hidden space-y-4">
          {paginatedStudents.map((student) => (
            <div key={student.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {student.profilePhotoUrl || student.photoURL ? (
                      <img className="h-12 w-12 rounded-full object-cover" src={student.profilePhotoUrl || student.photoURL} alt="" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                        {(student.name || student.email || 'S')?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{student.name || 'N/A'}</h3>
                    <p className="text-xs text-gray-500">{student.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    student.batch === 'Basic' ? 'bg-sky-100 text-sky-800' : 'bg-violet-100 text-violet-800'
                  }`}>
                    {student.batch}
                  </span>
                  {student.classYear && (
                    <span className="text-xs font-medium text-gray-600">{student.classYear}{student.division ? `-${student.division}` : ''}</span>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Roll No:</span>
                  <span className="text-gray-900 font-medium">{student.rollNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Moodle ID:</span>
                  <span className="text-gray-900 font-medium">{student.moodleId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Mobile:</span>
                  <span className="text-gray-900 font-medium flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {student.mobile}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => openEditModal(student)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                {userDetails?.role === 'superadmin' && (
                  <button
                    onClick={() => handleDeleteStudent(student.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
          <Pagination />
          {filteredStudents.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-500">No students found</p>
            </div>
          )}
        </div>
        </>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Add New Student</h2>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <input type="text" placeholder="Full Name" value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900" required />
              <input type="text" placeholder="Roll Number" value={formData.rollNo}
                onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900" required />
              <input type="text" placeholder="Moodle ID (without domain)" value={formData.moodleId}
                onChange={(e) => setFormData({ ...formData, moodleId: e.target.value })}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900" required />
              <input type="tel" placeholder="Mobile Number" value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900" required />
              <div className="grid grid-cols-2 gap-3">
                <select value={formData.classYear}
                  onChange={(e) => setFormData({ ...formData, classYear: e.target.value })}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900">
                  <option value="">Class Year *</option>
                  {CLASS_YEARS.map(cy => <option key={cy} value={cy}>{cy}</option>)}
                </select>
                <select value={formData.division}
                  onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900">
                  <option value="">Division</option>
                  {DIVISIONS.map(d => <option key={d} value={d}>Div {d}</option>)}
                </select>
              </div>
              <select value={formData.batch}
                onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900">
                <option value="Basic">Basic Batch</option>
                <option value="Advanced">Advanced Batch</option>
              </select>
              <input type="password" placeholder="Password (min 6 characters)" value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900" required minLength="6" />
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">ℹ️ Student will be created in database. They can login immediately.</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={loading}
                  className="flex-1 bg-indigo-600 text-white py-2 text-sm rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                  {loading ? 'Adding...' : 'Add Student'}
                </button>
                <button type="button" onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 text-sm rounded-lg hover:bg-gray-300 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Edit Student</h2>
              <button onClick={() => { setShowEditModal(false); setSelectedStudent(null); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditStudent} className="space-y-4">
              <input type="text" placeholder="Full Name" value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900" required />
              <input type="tel" placeholder="Mobile Number" value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900" />
              <div className="grid grid-cols-2 gap-3">
                <select value={formData.classYear}
                  onChange={(e) => setFormData({ ...formData, classYear: e.target.value })}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900">
                  <option value="">Class Year</option>
                  {CLASS_YEARS.map(cy => <option key={cy} value={cy}>{cy}</option>)}
                </select>
                <select value={formData.division}
                  onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900">
                  <option value="">Division</option>
                  {DIVISIONS.map(d => <option key={d} value={d}>Div {d}</option>)}
                </select>
              </div>
              <select value={formData.batch}
                onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900">
                <option value="Basic">Basic Batch</option>
                <option value="Advanced">Advanced Batch</option>
              </select>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={loading}
                  className="flex-1 bg-indigo-600 text-white py-2 text-sm rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                  {loading ? 'Updating...' : 'Update Student'}
                </button>
                <button type="button" onClick={() => { setShowEditModal(false); setSelectedStudent(null); resetForm(); }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 text-sm rounded-lg hover:bg-gray-300 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
