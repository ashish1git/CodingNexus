// src/components/shared/Navbar.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Sun, 
  Moon,
  Settings,
  Bell,
  Shield
} from 'lucide-react';
import { getInitials } from '../../utils/helpers';

const Navbar = () => {
  const { userData, logout, currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // TODO: Implement notifications via REST API
  // For now, notifications are disabled
  useEffect(() => {
    // Notifications will be added when backend API is ready
    setNotifications([]);
    setUnreadCount(0);
  }, []); // Run once on mount

  const handleLogout = async () => {
    await logout();
  };

  const getRoleBadge = () => {
    if (!userData?.role) return null;

    const roleConfig = {
      student: { label: 'Student', color: 'bg-blue-100 text-blue-700' },
      admin: { label: 'Admin', color: 'bg-green-100 text-green-700' },
      superadmin: { label: 'Super Admin', color: 'bg-purple-100 text-purple-700' }
    };

    const config = roleConfig[userData.role] || roleConfig.student;

    return (
      <span className={`px-2 py-1 ${config.color} text-xs font-semibold rounded-full`}>
        {config.label}
      </span>
    );
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">CN</span>
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">
                Coding Nexus
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Docs Link */}
            <a
              href="/docs"
              className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Docs
            </a>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-gray-600" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
                title="Notifications"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl py-2 border border-gray-200 max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-500 text-sm">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
                      >
                        <p className="text-sm text-gray-900 font-medium">{notif.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notif.createdAt?.toDate()).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {getInitials(userData?.fullName || userData?.email)}
                  </span>
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-sm font-semibold text-gray-900">
                    {userData?.fullName || 'User'}
                  </p>
                  <div className="flex items-center gap-2">
                    {getRoleBadge()}
                  </div>
                </div>
              </button>

              {/* Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 border border-gray-200">
                  {/* User Info in Dropdown */}
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">
                      {userData?.fullName || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{userData?.email}</p>
                    <div className="mt-2">{getRoleBadge()}</div>
                  </div>

                  <Link
                    to={userData?.role === 'admin' || userData?.role === 'superadmin' ? '/admin/profile' : '/student/profile'}
                    className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">Profile</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <Settings className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">Settings</span>
                  </Link>
                  
                  {userData?.role === 'superadmin' && (
                    <Link
                      to="/admin/sub-admins"
                      className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Shield className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-purple-600 font-medium">Manage Admins</span>
                    </Link>
                  )}
                  
                  <hr className="my-2" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors w-full text-left"
                  >
                    <LogOut className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-600">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {showMenu ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {showMenu && (
          <div className="md:hidden pb-4 border-t border-gray-200">
            <div className="pt-4 space-y-2">
              {/* User Info */}
              <div className="px-4 py-3 bg-gray-50 rounded-lg mb-2">
                <p className="text-sm font-semibold text-gray-900">
                  {userData?.fullName || 'User'}
                </p>
                <p className="text-xs text-gray-500 mt-1">{userData?.email}</p>
                <div className="mt-2">{getRoleBadge()}</div>
              </div>

              <Link
                to={userData?.role === 'admin' || userData?.role === 'superadmin' ? '/admin/profile' : '/student/profile'}
                className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">Profile</span>
              </Link>
              
              <a
                href="/docs"
                className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <span className="text-gray-700 font-medium">Docs</span>
              </a>
              
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                }}
                className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors w-full text-left"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">Notifications</span>
                {unreadCount > 0 && (
                  <span className="ml-auto px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              <button
                onClick={toggleTheme}
                className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors w-full text-left"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700">Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700">Dark Mode</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors w-full text-left"
              >
                <LogOut className="w-5 h-5 text-red-600" />
                <span className="text-red-600">Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;