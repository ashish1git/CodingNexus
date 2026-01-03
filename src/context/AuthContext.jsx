// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

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
  const isFetchingRef = useRef(false);
  const lastUserUidRef = useRef('');

  useEffect(() => {
    console.log('AuthContext useEffect running');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.uid);
      
      if (isFetchingRef.current || lastUserUidRef.current === user?.uid) {
        console.log('Skipping duplicate fetch for user:', user?.uid);
        return;
      }
      
      isFetchingRef.current = true;
      lastUserUidRef.current = user?.uid || '';
      
      setCurrentUser(user);
      
      if (user) {
        try {
          const adminDoc = await getDoc(doc(db, 'admins', user.uid));
          
          if (adminDoc.exists()) {
            const adminData = adminDoc.data();
            console.log('Admin data found:', adminData);
            setUserDetails({
              uid: user.uid,
              email: user.email,
              ...adminData
            });
          } else {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              console.log('User data found:', userData);
              setUserDetails({
                uid: user.uid,
                email: user.email,
                ...userData
              });
            } else {
              console.log('No document found for user:', user.uid);
              setUserDetails(null);
              toast.error('User profile not found. Please contact administrator.');
              await authService.logout();
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserDetails(null);
        }
      } else {
        setUserDetails(null);
        lastUserUidRef.current = '';
      }
      
      setLoading(false);
      isFetchingRef.current = false;
    });

    return () => {
      console.log('AuthContext cleanup');
      unsubscribe();
    };
  }, []);

  const signup = async (email, password, userData) => {
    try {
      const result = await authService.signupStudent(email, password, userData);
      if (!result.success) {
        return { success: false, error: result.error };
      }
      return { success: true };
    } catch (error) {
      console.error('Signup error in context:', error);
      return { success: false, error: error.message };
    }
  };

  const login = async (emailOrMoodleId, password) => {
    try {
      const result = await authService.loginStudent(emailOrMoodleId, password);
      return result; // Return full result including needsActivation flag
    } catch (error) {
      console.error('Login error in context:', error);
      return { success: false, error: error.message };
    }
  };

  const activateAccount = async (email, password, moodleId) => {
    try {
      const result = await authService.activateStudentAccount(email, password, moodleId);
      return result;
    } catch (error) {
      console.error('Activation error in context:', error);
      return { success: false, error: error.message };
    }
  };

  const loginAdmin = async (email, password) => {
    try {
      const result = await authService.loginAdmin(email, password);
      if (!result.success) {
        return { success: false, error: result.error };
      }
      return { success: true };
    } catch (error) {
      console.error('Admin login error in context:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      const result = await authService.logout();
      setCurrentUser(null);
      setUserDetails(null);
      lastUserUidRef.current = '';
      return result;
    } catch (error) {
      console.error('Logout error in context:', error);
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (email) => {
    try {
      const result = await authService.resetPassword(email);
      return result;
    } catch (error) {
      console.error('Reset password error in context:', error);
      return { success: false, error: error.message };
    }
  };

  const changePassword = async (newPassword) => {
    try {
      const result = await authService.changePassword(newPassword);
      return result;
    } catch (error) {
      console.error('Change password error in context:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    currentUser,
    userDetails,
    loading,
    isStudent: userDetails?.role === 'student',
    isAdmin: userDetails?.role === 'admin' || userDetails?.role === 'superadmin' || userDetails?.role === 'subadmin',
    isSuperAdmin: userDetails?.role === 'superadmin',
    signup,
    login,
    activateAccount,
    loginAdmin,
    logout,
    resetPassword,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };