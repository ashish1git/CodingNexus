import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, Bell, Calendar, Award, Code, HelpCircle,
  LogOut, Menu, X, User, Clock, TrendingUp, FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/studentService';
import toast from 'react-hot-toast';

const StudentDashboard = () => {
  const { userDetails, logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalNotes: 0,
    attendance: 0,
    attendancePercentage: 0,
    quizzesAttempted: 0,
    pendingQuizzes: 0
  });
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [upcomingQuizzes, setUpcomingQuizzes] = useState([]);

  // Helper function to format quiz duration
  const formatQuizDuration = (minutes) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim();
    }
    return `${mins}m`;
  };

  // Helper function to format date with time
  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    try {
      if (typeof date.toDate === 'function') {
        date = date.toDate();
      }
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true 
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userDetails, currentUser]);

  const fetchDashboardData = async () => {
    if (!userDetails || !currentUser) return;
    
    try {
      // Fetch all dashboard data in parallel using studentService
      const [notesRes, attendanceRes, quizzesRes, attemptsRes, announcementsRes] = await Promise.all([
        studentService.getNotes(),
        studentService.getAttendance(),
        studentService.getQuizzes(),
        studentService.getQuizAttempts(),
        studentService.getAnnouncements()
      ]);

      // Process notes count
      const totalNotesCount = notesRes.success ? notesRes.data.length : 0;

      // Process attendance
      let attendancePercentage = 0;
      if (attendanceRes.success) {
        const records = attendanceRes.data;
        const totalClasses = records.length;
        const presentClasses = records.filter(r => r.isPresent).length;
        attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;
      }

      // Process quizzes
      let quizzesAttemptedCount = 0;
      let upcomingQuizzesList = [];
      
      if (quizzesRes.success && attemptsRes.success) {
        const allQuizzes = quizzesRes.data;
        const attemptedQuizIds = new Set(attemptsRes.data.map(a => a.quizId));
        
        quizzesAttemptedCount = allQuizzes.filter(q => attemptedQuizIds.has(q.id)).length;
        
        // Get upcoming quizzes (not ended and not attempted)
        const now = new Date();
        upcomingQuizzesList = allQuizzes
          .map(quiz => ({
            ...quiz,
            endTime: new Date(quiz.endTime),
            startTime: new Date(quiz.startTime),
            isEnded: new Date(quiz.endTime) < now,
            isStarted: new Date(quiz.startTime) <= now
          }))
          .filter(quiz => !quiz.isEnded && !attemptedQuizIds.has(quiz.id))
          .sort((a, b) => a.startTime - b.startTime)
          .slice(0, 5);
      }

      // Process announcements
      const announcements = announcementsRes.success 
        ? announcementsRes.data.slice(0, 5).map(a => ({
            ...a,
            createdAt: new Date(a.createdAt)
          }))
        : [];

      // Update state
      setStats({
        totalNotes: totalNotesCount,
        attendance: attendancePercentage,
        attendancePercentage,
        quizzesAttempted: quizzesAttemptedCount,
        pendingQuizzes: upcomingQuizzesList.length
      });
      
      setUpcomingQuizzes(upcomingQuizzesList);
      setRecentAnnouncements(announcements);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const handleLogout = async () => {
  // Navigate FIRST, then logout
  navigate('/', { replace: true });
  
  // Logout in background after navigation starts
  setTimeout(async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  }, 10);
};

  const menuItems = [
    { icon: <User className="w-5 h-5" />, label: 'Profile', path: '/student/profile' },
    { icon: <BookOpen className="w-5 h-5" />, label: 'Notes', path: '/student/notes' },
    { icon: <Calendar className="w-5 h-5" />, label: 'Attendance', path: '/student/attendance' },
    { icon: <Award className="w-5 h-5" />, label: 'Quizzes', path: '/student/quiz/list' }, 
    { icon: <Code className="w-5 h-5" />, label: 'Code Editor', path: '/student/code-editor' },
    { icon: <HelpCircle className="w-5 h-5" />, label: 'Support', path: '/student/support' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Top Navbar */}
      <nav className="bg-slate-800 shadow-lg border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-700 transition text-slate-300"
              >
                {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center gap-2">
                <Code className="w-8 h-8 text-indigo-500" />
                <span className="text-lg sm:text-xl font-bold text-white hidden sm:inline">Coding Nexus</span>
                <span className="text-xl font-bold text-white sm:hidden">CN</span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-indigo-900/50 px-4 py-2 rounded-lg border border-indigo-700/50">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-300" />
                <span className="text-xs sm:text-sm font-medium text-indigo-200">{userDetails?.studentProfile?.batch || userDetails?.batch} Batch</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-red-400 hover:bg-red-900/30 rounded-lg transition border border-red-700/30 hover:border-red-600/50"
                title="Logout"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline text-sm">Logout</span>
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
          } lg:translate-x-0 fixed lg:sticky top-16 left-0 z-30 w-64 h-[calc(100vh-4rem)] bg-slate-800 border-r border-slate-700 transition-transform duration-300 overflow-y-auto`}
        >
          <div className="p-4 sm:p-6">
            {/* Profile Card */}
            <Link
              to="/student/profile"
              className="flex items-center gap-3 mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-slate-700 hover:opacity-80 transition group"
              onClick={() => setIsSidebarOpen(false)}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden ring-2 ring-indigo-500/50 border border-indigo-400/30">
                {userDetails?.photoURL ? (
                  <img
                    src={userDetails.photoURL}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  userDetails?.studentProfile?.name?.charAt(0).toUpperCase() || userDetails?.name?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-white truncate text-sm sm:text-base group-hover:text-indigo-400 transition">{userDetails?.studentProfile?.name || userDetails?.name}</h3>
                <p className="text-xs sm:text-sm text-slate-400 truncate">{userDetails?.studentProfile?.rollNo || userDetails?.rollNo}</p>
              </div>
            </Link>

            <nav className="space-y-1 sm:space-y-2">
              {menuItems.map((item, idx) => (
                <Link
                  key={idx}
                  to={item.path}
                  className="flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 text-slate-300 hover:bg-indigo-600/20 hover:text-indigo-400 rounded-lg transition border border-transparent hover:border-indigo-600/50 text-sm sm:text-base"
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
        <main className="flex-1 p-3 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Welcome back, {userDetails?.studentProfile?.name?.split(' ')[0] || userDetails?.name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-sm sm:text-base text-slate-400">Here's what's happening with your learning today.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
              <StatCard
                icon={<BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />}
                badge="Total"
                value={stats.totalNotes}
                label="Notes Available"
                color="blue"
              />
              <StatCard
                icon={<Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />}
                badge="Current"
                value={`${stats.attendancePercentage}%`}
                label="Attendance Rate"
                color="emerald"
              />
              <StatCard
                icon={<Award className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />}
                badge="Pending"
                value={stats.pendingQuizzes}
                label="Quizzes to Attempt"
                color="purple"
              />
              <StatCard
                icon={<TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />}
                badge="Progress"
                value={stats.quizzesAttempted}
                label="Quizzes Completed"
                color="amber"
              />
            </div>

            {/* Recent Announcements & Upcoming Quizzes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Announcements */}
              <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-4 sm:p-6 hover:border-slate-600 transition">
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                  <h2 className="text-lg sm:text-xl font-bold text-white">Recent Announcements</h2>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  {recentAnnouncements.length > 0 ? (
                    recentAnnouncements.map((announcement) => (
                      <div key={announcement.id} className="border-l-4 border-indigo-500 pl-3 sm:pl-4 py-2 bg-slate-700/30 rounded p-3 hover:bg-slate-700/50 transition">
                        <h3 className="font-semibold text-white text-sm sm:text-base">{announcement.title}</h3>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1 line-clamp-2">{announcement.content}</p>
                        <p className="text-xs text-slate-500 mt-2">
                          {announcement.createdAt && announcement.createdAt.toLocaleDateString 
                            ? announcement.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : 'N/A'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-center py-6 sm:py-8 text-sm">No announcements yet</p>
                  )}
                </div>
              </div>

              {/* Upcoming Quizzes */}
              <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-4 sm:p-6 hover:border-slate-600 transition">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                  <h2 className="text-lg sm:text-xl font-bold text-white">Upcoming Quizzes</h2>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  {upcomingQuizzes.length > 0 ? (
                    upcomingQuizzes.map((quiz) => (
                      <div key={quiz.id} className="bg-purple-900/30 rounded-lg p-3 sm:p-4 border border-purple-700/50 hover:border-purple-600/50 transition">
                        <h3 className="font-semibold text-white text-sm sm:text-base">{quiz.title}</h3>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 text-xs sm:text-sm text-purple-300">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{formatQuizDuration(quiz.duration)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-400">
                            <span>Ends: {formatDateTime(quiz.endTime)}</span>
                          </div>
                        </div>
                        <Link
                          to={`/student/quiz/${quiz.id}`}
                          className="inline-block mt-3 px-3 sm:px-4 py-1 sm:py-2 bg-purple-600 text-white rounded-lg text-xs sm:text-sm hover:bg-purple-700 transition border border-purple-700/50"
                        >
                          Attempt Now
                        </Link>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-center py-6 sm:py-8 text-sm">No upcoming quizzes</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              <QuickActionCard
                icon={<FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />}
                label="View Notes"
                link="/student/notes"
              />
              <QuickActionCard
                icon={<Code className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />}
                label="Code Editor"
                link="/student/code-editor"
              />
              <QuickActionCard
                icon={<Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />}
                label="Attendance"
                link="/student/attendance"
              />
              <QuickActionCard
                icon={<HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />}
                label="Support"
                link="/student/support"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// Stat Card Component
function StatCard({ icon, badge, value, label, color }) {
  const colorStyles = {
    blue: 'from-blue-600/20 to-blue-700/20 border-blue-600/30 hover:border-blue-500/50',
    emerald: 'from-emerald-600/20 to-emerald-700/20 border-emerald-600/30 hover:border-emerald-500/50',
    purple: 'from-purple-600/20 to-purple-700/20 border-purple-600/30 hover:border-purple-500/50',
    amber: 'from-amber-600/20 to-amber-700/20 border-amber-600/30 hover:border-amber-500/50'
  };

  return (
    <div className={`bg-gradient-to-br ${colorStyles[color]} rounded-xl p-4 sm:p-6 text-white border transition`}>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        {icon}
        <div className="bg-slate-900/30 rounded-lg px-2 sm:px-3 py-1 text-xs sm:text-sm border border-slate-700/50">
          {badge}
        </div>
      </div>
      <h3 className="text-2xl sm:text-3xl font-bold mb-1">{value}</h3>
      <p className="text-xs sm:text-sm text-slate-300">{label}</p>
    </div>
  );
}

// Quick Action Card Component
function QuickActionCard({ icon, label, link }) {
  return (
    <Link
      to={link}
      className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-4 sm:p-6 hover:border-slate-600 hover:shadow-lg transition text-center group"
    >
      <div className="group-hover:scale-110 transition">
        {icon}
      </div>
      <h3 className="font-semibold text-white text-xs sm:text-sm mt-2 sm:mt-3">{label}</h3>
    </Link>
  );
}

export default StudentDashboard;