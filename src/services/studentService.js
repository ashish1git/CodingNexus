// src/services/studentService.js
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  addDoc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export const studentService = {
  // Get Student Profile
  async getProfile(studentId) {
    try {
      const docRef = doc(db, 'students', studentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { success: true, data: docSnap.data() };
      }
      return { success: false, error: 'Profile not found' };
    } catch (error) {
      console.error('Get profile error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update Student Profile
  async updateProfile(studentId, data) {
    try {
      const docRef = doc(db, 'students', studentId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get Notes by Course and Semester
  async getNotes(course, semester) {
    try {
      const q = query(
        collection(db, 'notes'),
        where('course', '==', course),
        where('semester', '==', semester),
        orderBy('uploadedAt', 'desc')
      );
      
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

  // Get Announcements
  async getAnnouncements(course, semester) {
    try {
      const q = query(
        collection(db, 'announcements'),
        where('targetCourses', 'array-contains', course),
        where('targetSemesters', 'array-contains', semester),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      
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

  // Get Attendance Records
  async getAttendance(studentId) {
    try {
      const q = query(
        collection(db, 'attendance'),
        where('studentId', '==', studentId),
        orderBy('date', 'desc')
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

  // Get Quizzes
  async getQuizzes(course, semester) {
    try {
      const q = query(
        collection(db, 'quizzes'),
        where('course', '==', course),
        where('semester', '==', semester),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      
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

  // Submit Quiz
  async submitQuiz(studentId, quizId, answers, score) {
    try {
      await addDoc(collection(db, 'quizSubmissions'), {
        studentId,
        quizId,
        answers,
        score,
        submittedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Submit quiz error:', error);
      return { success: false, error: error.message };
    }
  },

  // Create Support Ticket
  async createTicket(studentId, ticketData) {
    try {
      await addDoc(collection(db, 'supportTickets'), {
        studentId,
        ...ticketData,
        status: 'open',
        createdAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Create ticket error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get Student Tickets
  async getTickets(studentId) {
    try {
      const q = query(
        collection(db, 'supportTickets'),
        where('studentId', '==', studentId),
        orderBy('createdAt', 'desc')
      );
      
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
  }
};