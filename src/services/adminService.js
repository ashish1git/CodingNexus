// src/services/adminService.js
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

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

  // Quiz Management
  async createQuiz(quizData) {
    try {
      await addDoc(collection(db, 'quizzes'), {
        ...quizData,
        isActive: true,
        createdAt: serverTimestamp()
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
  }
};