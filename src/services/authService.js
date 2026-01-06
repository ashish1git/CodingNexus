// src/services/authService.js
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile, 
  sendPasswordResetEmail, 
  updatePassword 
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteField, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import toast from 'react-hot-toast';

export const authService = {
  // Student signup function
  signupStudent: async (email, password, userData) => {
    try {
      // Check if email already has domain, if not add it
      let studentEmail = email;
      if (!studentEmail.includes('@')) {
        studentEmail = `${studentEmail}@codingnexus.com`;
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, studentEmail, password);
      const user = userCredential.user;
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: studentEmail,
        ...userData,
        role: 'student',
        createdAt: new Date(),
      });
      
      toast.success('Account created successfully!');
      return { success: true, user };
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Signup failed. Please try again.');
      return { success: false, error: error.message };
    }
  },

  // Helper function to check if student exists in Firestore (created by admin)
  checkStudentExistsInFirestore: async (email) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email), where('role', '==', 'student'));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const studentDoc = querySnapshot.docs[0];
        return { exists: true, data: studentDoc.data(), id: studentDoc.id };
      }
      return { exists: false };
    } catch (error) {
      console.error('Error checking Firestore:', error);
      return { exists: false };
    }
  },

  // Student login function - WITH ACCOUNT ACTIVATION SUPPORT
  loginStudent: async (input, password) => {
    try {
      console.log('Login attempt with input:', input);
      
      // Handle both email and moodle ID inputs
      let studentEmail = input;
      
      // Check if input is already an email (contains @)
      if (!studentEmail.includes('@')) {
        // Use @codingnexus.com domain consistently
        studentEmail = `${studentEmail}@codingnexus.com`;
      }
      
      console.log('Normalized email for login:', studentEmail);

      try {
        // TRY 1: Attempt normal Firebase Auth login
        const userCredential = await signInWithEmailAndPassword(auth, studentEmail, password);
        const user = userCredential.user;
        
        // Verify the user is actually a student
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
          await signOut(auth);
          toast.error('Student account not found. Please contact admin.');
          return { success: false, error: 'Not a student account' };
        }
        
        const userData = userDoc.data();
        
        if (userData.role !== 'student') {
          await signOut(auth);
          toast.error('This is not a student account. Please use the correct login portal.');
          return { success: false, error: 'Not a student account' };
        }
        
        toast.success('Login successful!');
        return { success: true, user };
        
      } catch (authError) {
        console.log('Auth error:', authError.code);
        
        // TRY 2: If auth fails, check if student exists in Firestore
        if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
          console.log('Checking if student exists in Firestore...');
          
          // Check if student exists in Firestore with @codingnexus.com domain
          const firestoreCheck = await authService.checkStudentExistsInFirestore(studentEmail);
          
          if (firestoreCheck.exists) {
            console.log('Student found in Firestore, needs account activation');
            // Student exists in Firestore but not in Auth - they need to activate
            toast.error('Account not activated. Please contact admin or use the signup page to set your password.');
            return { 
              success: false, 
              error: 'Account not activated',
              needsActivation: true,
              email: studentEmail
            };
          } else {
            // Student doesn't exist anywhere
            toast.error('No account found with this ID. Please contact admin.');
            return { success: false, error: 'User not found' };
          }
        }
        
        // For other auth errors, show appropriate message
        if (authError.code === 'auth/wrong-password') {
          toast.error('Incorrect password.');
          return { success: false, error: 'Incorrect password' };
        } else if (authError.code === 'auth/too-many-requests') {
          toast.error('Too many failed attempts. Please try again later.');
          return { success: false, error: 'Too many attempts' };
        }
        
        throw authError;
      }
      
    } catch (error) {
      console.error('Login error details:', {
        code: error.code,
        message: error.message,
        input: input
      });
      
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid ID or password.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found. Please contact admin.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  // Activate account for admin-created students
  activateStudentAccount: async (email, password, moodleId) => {
    try {
      console.log('Activating account for:', email);
      
      // Ensure email has @codingnexus.com domain
      let studentEmail = email;
      if (!studentEmail.includes('@')) {
        studentEmail = `${studentEmail}@codingnexus.com`;
      }
      
      // Check if student exists in Firestore
      const firestoreCheck = await authService.checkStudentExistsInFirestore(studentEmail);
      
      if (!firestoreCheck.exists) {
        toast.error('No student record found. Please contact admin.');
        return { success: false, error: 'Student not found' };
      }
      
      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, studentEmail, password);
      const user = userCredential.user;
      
      const oldData = firestoreCheck.data;
      
      // Delete old document if it has a different ID
      if (firestoreCheck.id !== user.uid) {
        await deleteDoc(doc(db, 'users', firestoreCheck.id));
      }
      
      // Create/update document with correct UID
      await setDoc(doc(db, 'users', user.uid), {
        ...oldData,
        uid: user.uid,
        email: studentEmail,
        moodleId: moodleId,
        activated: true,
        activatedAt: new Date(),
      });
      
      toast.success('Account activated successfully!');
      return { success: true, user };
      
    } catch (error) {
      console.error('Activation error:', error);
      
      let errorMessage = 'Account activation failed.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This account is already activated. Please try logging in.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      }
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  // Admin login function
  loginAdmin: async (email, password) => {
    try {
      console.log('Admin login attempt for:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if user exists in admins collection
      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      
      if (!adminDoc.exists()) {
        await signOut(auth);
        toast.error('You are not authorized as an admin.');
        return { success: false, error: 'Not authorized as admin' };
      }
      
      // ✅ EXTRACT DATA TO GET ROLE
      const adminData = adminDoc.data();
      
      toast.success('Admin login successful!');
      
      // ✅ RETURN ROLE SO DASHBOARD KNOWS PERMISSIONS
      return { 
        success: true, 
        user, 
        role: adminData.role // e.g., 'superadmin'
      };

    } catch (error) {
      console.error('Admin login error:', error);
      
      let errorMessage = 'Admin login failed.';
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid admin credentials.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'Admin account not found.';
      }
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully!');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed. Please try again.');
      return { success: false, error: error.message };
    }
  },

  resetPassword: async (email) => {
    try {
      let studentEmail = email;
      if (!studentEmail.includes('@')) {
        studentEmail = `${studentEmail}@codingnexus.com`;
      }
      
      await sendPasswordResetEmail(auth, studentEmail);
      toast.success('Password reset email sent! Check your inbox.');
      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      
      let errorMessage = error.message || 'Failed to send reset email.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      }
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  changePassword: async (newPassword) => {
    try {
      await updatePassword(auth.currentUser, newPassword);
      toast.success('Password changed successfully!');
      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      toast.error(error.message || 'Failed to change password.');
      return { success: false, error: error.message };
    }
  },
  

  updateProfile: async (displayName, photoURL) => {
    try {
      await updateProfile(auth.currentUser, {
        displayName,
        photoURL
      });
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error(error.message || 'Failed to update profile.');
      return { success: false, error: error.message };
    }
  },

  // Check if a student can log in (for debugging)
  checkStudentLogin: async (moodleId) => {
    try {
      const email = `${moodleId}@codingnexus.com`;
      console.log('Checking student login for:', { moodleId, email });
      
      return { 
        success: true, 
        emailExists: true,
        normalizedEmail: email 
      };
    } catch (error) {
      console.error('Check student login error:', error);
      return { success: false, error: error.message };
    }
  }
};