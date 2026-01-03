// src/services/adminService.js
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  setDoc, 
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signOut,
  getAuth
} from 'firebase/auth';
import { initializeApp, getApp, deleteApp } from 'firebase/app'; 
import { db, auth } from './firebase';

const COLLECTION_NAME = 'admins';

export const adminService = {
  // Student Management
  async getAllStudents() {
    try {
      const querySnapshot = await getDocs(collection(db, 'students'));
      const students = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, data: students };
    } catch (error) {
      console.error('Get students error:', error);
      return { success: false, error: error.message };
    }
  },

  async updateStudent(studentId, data) {
    try {
      const docRef = doc(db, 'students', studentId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Update student error:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteStudent(studentId) {
    try {
      await deleteDoc(doc(db, 'students', studentId));
      return { success: true };
    } catch (error) {
      console.error('Delete student error:', error);
      return { success: false, error: error.message };
    }
  },

  // Notes Management
  async uploadNote(noteData) {
    try {
      await addDoc(collection(db, 'notes'), {
        ...noteData,
        uploadedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Upload note error:', error);
      return { success: false, error: error.message };
    }
  },

  async getAllNotes() {
    try {
      const q = query(collection(db, 'notes'), orderBy('uploadedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const notes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, data: notes };
    } catch (error) {
      console.error('Get notes error:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteNote(noteId) {
    try {
      await deleteDoc(doc(db, 'notes', noteId));
      return { success: true };
    } catch (error) {
      console.error('Delete note error:', error);
      return { success: false, error: error.message };
    }
  },

  // Announcement Management
  async createAnnouncement(announcementData) {
    try {
      await addDoc(collection(db, 'announcements'), {
        ...announcementData,
        isActive: true,
        createdAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Create announcement error:', error);
      return { success: false, error: error.message };
    }
  },

  async getAllAnnouncements() {
    try {
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const announcements = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, data: announcements };
    } catch (error) {
      console.error('Get announcements error:', error);
      return { success: false, error: error.message };
    }
  },

  async updateAnnouncement(announcementId, data) {
    try {
      const docRef = doc(db, 'announcements', announcementId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Update announcement error:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteAnnouncement(announcementId) {
    try {
      await deleteDoc(doc(db, 'announcements', announcementId));
      return { success: true };
    } catch (error) {
      console.error('Delete announcement error:', error);
      return { success: false, error: error.message };
    }
  },

  // Attendance Management
  async markAttendance(attendanceData) {
    try {
      await addDoc(collection(db, 'attendance'), {
        ...attendanceData,
        markedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Mark attendance error:', error);
      return { success: false, error: error.message };
    }
  },

  async getAttendanceByDate(date) {
    try {
      const q = query(
        collection(db, 'attendance'),
        where('date', '==', date)
      );
      const querySnapshot = await getDocs(q);
      const attendance = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, data: attendance };
    } catch (error) {
      console.error('Get attendance error:', error);
      return { success: false, error: error.message };
    }
  },

  async getCurrentAdminProfile() {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      // Check if they exist in the admins collection
      const subAdminDoc = await getDoc(doc(db, COLLECTION_NAME, user.uid));
      
      if (subAdminDoc.exists()) {
        return { ...subAdminDoc.data(), role: 'subadmin' }; // Return profile
      }
      
      // If not in admins, return null (or handle Super Admin logic if stored differently)
      return null; 
    } catch (error) {
      console.error("Error fetching admin profile:", error);
      return null;
    }
  },

  // --- QUIZ MANAGEMENT ---
  async createQuiz(quizData) {
    try {
      if (!auth.currentUser) throw new Error("No user logged in");

      // We explicitly handle the date conversion here to ensure Firestore accepts it
      await addDoc(collection(db, 'quizzes'), {
        ...quizData,
        startTime: Timestamp.fromDate(new Date(quizData.startTime)),
        endTime: Timestamp.fromDate(new Date(quizData.endTime)),
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        isActive: true
      });
      
      return { success: true };
    } catch (error) {
      console.error('Create quiz error:', error);
      return { success: false, error: error.message };
    }
  },
  async getAllQuizzes() {
    try {
      const q = query(collection(db, 'quizzes'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const quizzes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, data: quizzes };
    } catch (error) {
      console.error('Get quizzes error:', error);
      return { success: false, error: error.message };
    }
  },

  async updateQuiz(quizId, data) {
    try {
      const docRef = doc(db, 'quizzes', quizId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Update quiz error:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteQuiz(quizId) {
    try {
      await deleteDoc(doc(db, 'quizzes', quizId));
      return { success: true };
    } catch (error) {
      console.error('Delete quiz error:', error);
      return { success: false, error: error.message };
    }
  },

  // Support Ticket Management
  async getAllTickets() {
    try {
      const q = query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const tickets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, data: tickets };
    } catch (error) {
      console.error('Get tickets error:', error);
      return { success: false, error: error.message };
    }
  },

  async updateTicket(ticketId, data) {
    try {
      const docRef = doc(db, 'supportTickets', ticketId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Update ticket error:', error);
      return { success: false, error: error.message };
    }
  },

  // Sub-Admin Management

async getAllSubAdmins() {
    try {
      // Fetch users from 'admins' collection where role is 'subadmin'
      const q = query(collection(db, COLLECTION_NAME), where('role', '==', 'subadmin'));
      const querySnapshot = await getDocs(q);
      const admins = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, data: admins };
    } catch (error) {
      console.error('Get sub-admins error:', error);
      return { success: false, error: error.message };
    }
  },

  // 2. Create Sub-Admin (The Safe Way)
  async createSubAdmin(adminData, password) {
    let secondaryApp = null;
    try {
      // 1. Load config explicitly
      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
      };

      if (!firebaseConfig.apiKey) throw new Error("API Key missing in .env");

      // 2. Initialize Secondary App (to create user without logging out current admin)
      secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
      const secondaryAuth = getAuth(secondaryApp);

      // 3. Create Auth User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth, 
        adminData.email, 
        password
      );
      const uid = userCredential.user.uid;

      // 4. Create Firestore Doc in the MAIN 'admins' collection
      // ✅ This ensures they can login via loginAdmin()
      await setDoc(doc(db, COLLECTION_NAME, uid), {
        uid: uid,
        name: adminData.name,
        email: adminData.email,
        role: 'subadmin',         // Role identifies them
        permissions: 'all',       // ✅ Giving them full access as requested
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || 'system'
      });

      // 5. Logout Secondary User (Cleanup)
      await signOut(secondaryAuth);
      
      return { success: true };
    } catch (error) {
      console.error('Create sub-admin error:', error);
      return { success: false, error: error.message };
    } finally {
      if (secondaryApp) await deleteApp(secondaryApp).catch(console.error);
    }
  },

  // 3. Update Sub-Admin
  async updateSubAdmin(adminId, data) {
    try {
      const docRef = doc(db, COLLECTION_NAME, adminId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Update sub-admin error:', error);
      return { success: false, error: error.message };
    }
  },

  // 4. Delete Sub-Admin
  async deleteSubAdmin(adminId) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, adminId));
      return { success: true };
    } catch (error) {
      console.error('Delete sub-admin error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // 5. Get Current Admin Profile (Helper for Dashboard)
  async getCurrentAdminProfile() {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      const adminDoc = await getDoc(doc(db, COLLECTION_NAME, user.uid));
      
      if (adminDoc.exists()) {
        return adminDoc.data(); 
      }
      return null; 
    } catch (error) {
      console.error("Error fetching admin profile:", error);
      return null;
    }
  },
};