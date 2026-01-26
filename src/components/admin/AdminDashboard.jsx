// src/components/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, BookOpen, Bell, Calendar, Award, HelpCircle,
  LogOut, Menu, X, Shield, TrendingUp, FileText, UserPlus, Trophy
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import dataCache from '../../utils/dataCache';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { userDetails, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    basicBatch: 0,
    advancedBatch: 0,
    totalNotes: 0,
    totalQuizzes: 0,
    pendingTickets: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const userId = userDetails?.id || userDetails?.userId;
    
    // Try to load cached data first for instant display
    const cachedData = dataCache.get('admin_dashboard', userId);
    if (cachedData) {
      console.log('📦 Loading cached admin dashboard data...');
      setStats(cachedData);
    }
    
    try {
      // Fetch fresh data in background
      const [studentsRes, notesRes, quizzesRes, ticketsRes] = await Promise.all([
        adminService.getAllStudents(),
        adminService.getAllNotes(),
        adminService.getAllQuizzes(),
        adminService.getAllTickets()
      ]);

      const students = studentsRes.success ? (studentsRes.students || []) : [];
      const notes = notesRes.success ? (notesRes.notes || []) : [];
      const quizzes = quizzesRes.success ? (quizzesRes.quizzes || []) : [];
      const tickets = ticketsRes.success ? (ticketsRes.tickets || []) : [];

      const newStats = {
        totalStudents: students.length,
        basicBatch: students.filter(s => s.batch === 'Basic').length,
        advancedBatch: students.filter(s => s.batch === 'Advanced').length,
        totalNotes: notes.length,
        totalQuizzes: quizzes.length,
        pendingTickets: tickets.filter(t => t.status === 'open').length
      };
      
      setStats(newStats);
      
      // Cache the fresh data
      dataCache.set('admin_dashboard', userId, newStats);
      console.log('✅ Admin dashboard data refreshed and cached');
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Don't show error if we have cached data
      if (!cachedData) {
        toast.error('Failed to load dashboard data');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/admin-login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const menuItems = userDetails?.role === 'superadmin' ? [
    { icon: <Users />, label: 'Students', path: '/admin/students' },
    { icon: <BookOpen />, label: 'Notes', path: '/admin/notes' },
    { icon: <Bell />, label: 'Announcements', path: '/admin/announcements' },
    { icon: <Calendar />, label: 'Attendance', path: '/admin/attendance' },
    { icon: <Award />, label: 'Quizzes', path: '/admin/quiz' },
    { icon: <Trophy />, label: 'Competitions', path: '/admin/competitions' },
    { icon: <HelpCircle />, label: 'Support Tickets', path: '/admin/tickets' },
    { icon: <UserPlus />, label: 'Sub-Admins', path: '/admin/sub-admins' }
  ] : [
    { icon: <Users />, label: 'Students', path: '/admin/students' },
    { icon: <BookOpen />, label: 'Notes', path: '/admin/notes' },
    { icon: <Bell />, label: 'Announcements', path: '/admin/announcements' },
    { icon: <Calendar />, label: 'Attendance', path: '/admin/attendance' },
    { icon: <Award />, label: 'Quizzes', path: '/admin/quiz' },
    { icon: <Trophy />, label: 'Competitions', path: '/admin/competitions' },
    { icon: <HelpCircle />, label: 'Support Tickets', path: '/admin/tickets' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center gap-2">
                <Shield className="w-8 h-8 text-indigo-600" />
                <span className="text-xl font-bold text-gray-800">Admin Portal</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-lg">
                <Shield className="w-5 h-5 text-indigo-600" />
                <span className="text-sm font-medium text-gray-700">
                  {userDetails?.role === 'superadmin' ? 'Super Admin' : 'Sub Admin'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:sticky top-16 left-0 z-30 w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-transform duration-300 overflow-y-auto`}
        >
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200">
              <div className="w-12 h-12 bg-gradient-to-r from-gray-700 to-indigo-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {userDetails?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{userDetails?.name}</h3>
                <p className="text-sm text-gray-500">
                  {userDetails?.role === 'superadmin' ? 'Super Admin' : 'Sub Admin'}
                </p>
              </div>
            </div>

            <nav className="space-y-2">
              {menuItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.path}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Welcome, {userDetails?.name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-gray-600">Here's an overview of the Coding Nexus platform.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.totalStudents}</h3>
                <p className="text-gray-600 text-sm">Total Students</p>
                <div className="mt-3 flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                    Basic: {stats.basicBatch}
                  </span>
                  <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded">
                    Advanced: {stats.advancedBatch}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <BookOpen className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.totalNotes}</h3>
                <p className="text-gray-600 text-sm">Notes Uploaded</p>
                <Link
                  to="/admin/notes"
                  className="inline-block mt-3 text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Upload more →
                </Link>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.totalQuizzes}</h3>
                <p className="text-gray-600 text-sm">Quizzes Created</p>
                <Link
                  to="/admin/quiz"
                  className="inline-block mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Create quiz →
                </Link>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <HelpCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  {stats.pendingTickets > 0 && (
                    <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                      {stats.pendingTickets}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.pendingTickets}</h3>
                <p className="text-gray-600 text-sm">Pending Tickets</p>
                <Link
                  to="/admin/tickets"
                  className="inline-block mt-3 text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  View tickets →
                </Link>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-pink-100 rounded-lg">
                    <Bell className="w-6 h-6 text-pink-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">Active</h3>
                <p className="text-gray-600 text-sm">Announcements</p>
                <Link
                  to="/admin/announcements"
                  className="inline-block mt-3 text-sm text-pink-600 hover:text-pink-700 font-medium"
                >
                  Manage →
                </Link>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">Today</h3>
                <p className="text-gray-600 text-sm">Attendance</p>
                <Link
                  to="/admin/attendance"
                  className="inline-block mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Mark attendance →
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                  to="/admin/students"
                  className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition"
                >
                  <Users className="w-8 h-8 text-indigo-600" />
                  <span className="text-sm font-medium text-gray-700">Manage Students</span>
                </Link>
                <Link
                  to="/admin/notes"
                  className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition"
                >
                  <FileText className="w-8 h-8 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Upload Notes</span>
                </Link>
                <Link
                  to="/admin/quiz"
                  className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition"
                >
                  <Award className="w-8 h-8 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Create Quiz</span>
                </Link>
                <Link
                  to="/admin/announcements"
                  className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition"
                >
                  <Bell className="w-8 h-8 text-pink-600" />
                  <span className="text-sm font-medium text-gray-700">Announce</span>
                </Link>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">Admin Dashboard</h2>
              <p className="text-indigo-100 mb-4">
                Manage your coding club efficiently. All tools at your fingertips.
              </p>
              <div className="flex gap-4">
                {userDetails?.role === 'superadmin' && (
                  <Link
                    to="/admin/sub-admins"
                    className="px-6 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-100 transition"
                  >
                    Manage Sub-Admins
                  </Link>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;