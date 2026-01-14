// src/context/AuthContext.jsx - PostgreSQL/JWT version
import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { apiClient } from '../services/apiClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Load user on mount if token exists
  useEffect(() => {
    const initAuth = async () => {
      const token = apiClient.getToken();
      const storedUser = authService.getStoredUser();

      console.log('🔐 Auth initialization:', { hasToken: !!token, hasStoredUser: !!storedUser });

      if (token) {
        // If we have token but no stored user, or need to verify token
        try {
          const user = await authService.getCurrentUser();
          if (user) {
            console.log('✅ User authenticated:', user.email, user.role);
            setCurrentUser(user);
            setUserDetails(user);
          } else {
            // Token invalid, clear auth
            console.log('❌ Token invalid, clearing auth');
            apiClient.removeToken();
            localStorage.removeItem('user');
            setCurrentUser(null);
            setUserDetails(null);
          }
        } catch (error) {
          console.error('❌ Auth init error:', error);
          // Token might be expired or invalid
          apiClient.removeToken();
          localStorage.removeItem('user');
          setCurrentUser(null);
          setUserDetails(null);
        }
      } else if (storedUser) {
        // Have stored user but no token - clear stale data
        console.log('⚠️ Found stale user data, clearing');
        localStorage.removeItem('user');
        setCurrentUser(null);
        setUserDetails(null);
      } else {
        console.log('ℹ️ No authentication found');
      }
      
      setLoading(false);
      setInitialCheckDone(true);
    };

    initAuth();
  }, []);

  const login = async (email, password, isAdmin = false) => {
    setLoading(true);
    try {
      const response = isAdmin 
        ? await authService.loginAdmin(email, password)
        : await authService.loginStudent(email, password);

      if (response.success && response.user) {
        setCurrentUser(response.user);
        setUserDetails(response.user);
        
        // Fetch fresh user data to ensure we have all details including student profile
        try {
          const freshUser = await authService.getCurrentUser();
          if (freshUser) {
            setCurrentUser(freshUser);
            setUserDetails(freshUser);
          }
        } catch (error) {
          console.warn('Could not fetch fresh user data, using login response:', error);
        }
        
        return { success: true };
      }
      return response;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, userData) => {
    setLoading(true);
    try {
      const response = await authService.signupStudent(email, password, userData);
      return response;
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setCurrentUser(null);
      setUserDetails(null);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setUserDetails(user);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const value = {
    currentUser,
    userDetails,
    userData: userDetails, // Alias for consistency
    loading,
    login,
    signup,
    logout,
    refreshUser,
    // Helper properties for compatibility
    user: currentUser,
    isAuthenticated: !!currentUser,
    role: userDetails?.role || null
  };

  // Show loading spinner only on initial load when we have a token to verify
  if (!initialCheckDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
