// src/components/student/StudentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, Bell, Calendar, Award, Code, HelpCircle, 
  LogOut, Menu, X, User, Clock, TrendingUp, FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import toast from 'react-hot-toast';

const StudentDashboard = () => {
  const { userDetails, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalNotes: 0,
    attendance: 0,
    quizzesAttempted: 0,
    pendingQuizzes: 0
  });
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [upcomingQuizzes, setUpcomingQuizzes] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, [userDetails]);

  const fetchDashboardData = async () => {
    if (!userDetails) return;

    try {
      // Fetch notes count
      const notesQuery = query(
        collection(db, 'notes'),
        where('batch', '==', userDetails.batch)
      );
      const notesSnapshot = await getDocs(notesQuery);
      
      // Fetch announcements
      const announcementsQuery = query(
        collection(db, 'announcements'),
        where('batch', 'in', [userDetails.batch, 'All']),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const announcementsSnapshot = await getDocs(announcementsQuery);
      
      // Fetch upcoming quizzes
      const quizzesQuery = query(
        collection(db, 'quizzes'),
        where('batch', '==', userDetails.batch),
        where('endTime', '>', new Date())
      );
      const quizzesSnapshot = await getDocs(quizzesQuery);

      setStats({
        totalNotes: notesSnapshot.size,
        attendance: userDetails.attendance || 0,
        quizzesAttempted: 0,
        pendingQuizzes: quizzesSnapshot.size
      });

      setRecentAnnouncements(
        announcementsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      );

      setUpcomingQuizzes(
        quizzesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      );
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const menuItems = [
    { icon: <User />, label: 'Profile', path: '/student/profile' },
    { icon: <BookOpen />, label: 'Notes', path: '/student/notes' },
    { icon: <Calendar />, label: 'Attendance', path: '/student/attendance' },
    { icon: <Award />, label: 'Quizzes', path: '/student/quiz/list' },
    { icon: <Code />, label: 'Code Editor', path: '/student/code-editor' },
    { icon: <HelpCircle />, label: 'Support', path: '/student/support' }
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
                <Code className="w-8 h-8 text-indigo-600" />
                <span className="text-xl font-bold text-gray-800">Coding Nexus</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-lg">
                <Award className="w-5 h-5 text-indigo-600" />
                <span className="text-sm font-medium text-gray-700">{userDetails?.batch} Batch</span>
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
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {userDetails?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{userDetails?.name}</h3>
                <p className="text-sm text-gray-500">{userDetails?.rollNo}</p>
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
                Welcome back, {userDetails?.name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-gray-600">Here's what's happening with your learning today.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <BookOpen className="w-8 h-8" />
                  <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1 text-sm">
                    Total
                  </div>
                </div>
                <h3 className="text-3xl font-bold mb-1">{stats.totalNotes}</h3>
                <p className="text-blue-100">Notes Available</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <Calendar className="w-8 h-8" />
                  <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1 text-sm">
                    Current
                  </div>
                </div>
                <h3 className="text-3xl font-bold mb-1">{stats.attendance}%</h3>
                <p className="text-green-100">Attendance Rate</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <Award className="w-8 h-8" />
                  <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1 text-sm">
                    Pending
                  </div>
                </div>
                <h3 className="text-3xl font-bold mb-1">{stats.pendingQuizzes}</h3>
                <p className="text-purple-100">Quizzes to Attempt</p>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8" />
                  <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1 text-sm">
                    Progress
                  </div>
                </div>
                <h3 className="text-3xl font-bold mb-1">{stats.quizzesAttempted}</h3>
                <p className="text-orange-100">Quizzes Completed</p>
              </div>
            </div>

            {/* Recent Announcements & Upcoming Quizzes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Announcements */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-indigo-600" />
                    Recent Announcements
                  </h2>
                </div>
                <div className="space-y-4">
                  {recentAnnouncements.length > 0 ? (
                    recentAnnouncements.map((announcement) => (
                      <div key={announcement.id} className="border-l-4 border-indigo-500 pl-4 py-2">
                        <h3 className="font-semibold text-gray-800">{announcement.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(announcement.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">No announcements yet</p>
                  )}
                </div>
              </div>

              {/* Upcoming Quizzes */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    Upcoming Quizzes
                  </h2>
                </div>
                <div className="space-y-4">
                  {upcomingQuizzes.length > 0 ? (
                    upcomingQuizzes.map((quiz) => (
                      <div key={quiz.id} className="bg-purple-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-800">{quiz.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Duration: {quiz.duration} minutes
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Ends: {new Date(quiz.endTime.toDate()).toLocaleString()}
                        </p>
                        <Link
                          to={`/student/quiz/${quiz.id}`}
                          className="inline-block mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition"
                        >
                          Attempt Now
                        </Link>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">No upcoming quizzes</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                to="/student/notes"
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition text-center"
              >
                <FileText className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-800">View Notes</h3>
              </Link>
              <Link
                to="/student/code-editor"
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition text-center"
              >
                <Code className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-800">Code Editor</h3>
              </Link>
              <Link
                to="/student/attendance"
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition text-center"
              >
                <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-800">Attendance</h3>
              </Link>
              <Link
                to="/student/support"
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition text-center"
              >
                <HelpCircle className="w-8 h-8 text-orange-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-800">Get Support</h3>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;