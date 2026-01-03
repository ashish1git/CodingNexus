// src/components/shared/Sidebar.jsx
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  FileText,
  MessageSquare,
  Users,
  Bell,
  ClipboardList,
  UserCog,
  Code,
  Shield
} from 'lucide-react';
import { classNames } from '../../utils/helpers';

const Sidebar = () => {
  const location = useLocation();
  const { userDetails, isStudent, isAdmin } = useAuth();

  const studentLinks = [
    { path: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/student/notes', label: 'Notes', icon: BookOpen },
    { path: '/student/attendance', label: 'Attendance', icon: Calendar },
    { path: '/student/quiz/sample', label: 'Quizzes', icon: ClipboardList },
    { path: '/student/code-editor', label: 'Code Editor', icon: Code },
    { path: '/student/support', label: 'Support', icon: MessageSquare }
  ];

  const adminLinks = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/students', label: 'Students', icon: Users },
    { path: '/admin/notes', label: 'Notes', icon: BookOpen },
    { path: '/admin/announcements', label: 'Announcements', icon: Bell },
    { path: '/admin/attendance', label: 'Attendance', icon: Calendar },
    { path: '/admin/quiz', label: 'Quizzes', icon: ClipboardList },
    { path: '/admin/tickets', label: 'Support Tickets', icon: MessageSquare }
  ];

  // Add sub-admin management link for super admin
  if (userDetails?.role === 'superadmin') {
    adminLinks.push({ 
      path: '/admin/sub-admins', 
      label: 'Sub Admins', 
      icon: UserCog,
      isSuperAdminOnly: true
    });
  }

  const links = isStudent ? studentLinks : isAdmin ? adminLinks : [];

  return (
    <aside className="w-64 bg-white shadow-md h-screen sticky top-0 overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            {isAdmin ? (
              <Shield className={`w-5 h-5 ${userDetails?.role === 'superadmin' ? 'text-purple-600' : 'text-green-600'}`} />
            ) : (
              <Users className="w-5 h-5 text-blue-600" />
            )}
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              {isStudent ? 'Student Portal' : isAdmin ? 'Admin Panel' : 'Portal'}
            </h2>
          </div>
          {userDetails?.role && (
            <div className="text-xs text-gray-500 px-2">
              {userDetails.role === 'superadmin' && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-semibold">
                  Super Admin
                </span>
              )}
              {userDetails.role === 'admin' && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                  Admin
                </span>
              )}
              {userDetails.role === 'student' && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                  Student
                </span>
              )}
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;

            return (
              <Link
                key={link.path}
                to={link.path}
                className={classNames(
                  'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all',
                  isActive
                    ? link.isSuperAdminOnly
                      ? 'bg-purple-50 text-purple-600 font-medium'
                      : 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{link.label}</span>
                {link.isSuperAdminOnly && (
                  <span className="ml-auto text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                    Super
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <p className="font-semibold text-gray-700">
              {userDetails?.fullName || 'User'}
            </p>
            {userDetails?.course && userDetails?.semester && (
              <p>{userDetails.course.toUpperCase()} - Semester {userDetails.semester}</p>
            )}
            {userDetails?.enrollmentNumber && (
              <p className="text-gray-400">{userDetails.enrollmentNumber}</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;