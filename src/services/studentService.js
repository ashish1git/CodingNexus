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
  Timestamp,
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

  // Get Notes by Batch (updated to match your app's structure)
  async getNotes(batch) {
    try {
      const q = query(
        collection(db, 'notes'),
        where('batch', 'in', [batch, 'All']),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const notes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      
      return { success: true, data: notes };
    } catch (error) {
      console.error('Get notes error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get Announcements by Batch (updated to match your app's structure)
  async getAnnouncements(batch) {
    try {
      const q = query(
        collection(db, 'announcements'),
        where('batch', 'in', [batch, 'All']),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const announcements = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      
      return { success: true, data: announcements };
    } catch (error) {
      console.error('Get announcements error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get Attendance Records by Batch and Student ID
  async getAttendance(studentId, batch) {
    try {
      const q = query(
        collection(db, 'attendance'),
        where('batch', '==', batch),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      // Process attendance to check if student was present
      const attendance = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const isPresent = 
          data.presentStudents?.includes(studentId) || 
          data.presentMoodleIds?.includes(data.moodleId) ||
          data.presentRollNos?.includes(data.rollNo);
        
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate?.() || new Date(),
          isPresent: isPresent
        };
      });
      
      return { success: true, data: attendance };
    } catch (error) {
      console.error('Get attendance error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get All Quizzes for a Batch
  async getQuizzes(batch) {
    try {
      const q = query(
        collection(db, 'quizzes'),
        where('batch', '==', batch),
        orderBy('startTime', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const quizzes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate?.() || new Date(),
        endTime: doc.data().endTime?.toDate?.() || new Date()
      }));
      
      return { success: true, data: quizzes };
    } catch (error) {
      console.error('Get quizzes error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get Specific Quiz
  async getQuiz(quizId) {
    try {
      const quizRef = doc(db, "quizzes", quizId);
      const quizSnap = await getDoc(quizRef);
      if (quizSnap.exists()) {
        const data = quizSnap.data();
        return { 
          success: true, 
          data: {
            id: quizSnap.id,
            ...data,
            startTime: data.startTime?.toDate?.() || new Date(),
            endTime: data.endTime?.toDate?.() || new Date()
          }
        };
      }
      return { success: false, error: 'Quiz not found' };
    } catch (error) {
      console.error('Get quiz error:', error);
      return { success: false, error: error.message };
    }
  },

  // Check if Student already attempted a quiz
  async checkAttempt(quizId, studentId) {
    try {
      const q = query(
        collection(db, "quiz_attempts"),
        where("quizId", "==", quizId),
        where("studentId", "==", studentId)
      );
      const snap = await getDocs(q);
      return { 
        success: true, 
        data: !snap.empty, // true if attempted, false if not
        attemptId: snap.empty ? null : snap.docs[0].id
      };
    } catch (error) {
      console.error("Error checking attempt:", error);
      return { success: false, error: error.message };
    }
  },

  // Get Quiz Attempt by ID
  async getQuizAttempt(attemptId) {
    try {
      const attemptRef = doc(db, "quiz_attempts", attemptId);
      const attemptSnap = await getDoc(attemptRef);
      if (attemptSnap.exists()) {
        const data = attemptSnap.data();
        return { 
          success: true, 
          data: {
            id: attemptSnap.id,
            ...data,
            submittedAt: data.submittedAt?.toDate?.() || new Date()
          }
        };
      }
      return { success: false, error: 'Quiz attempt not found' };
    } catch (error) {
      console.error('Get quiz attempt error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get All Quiz Attempts for a Student
  async getStudentQuizAttempts(studentId) {
    try {
      const q = query(
        collection(db, "quiz_attempts"),
        where("studentId", "==", studentId),
        orderBy("submittedAt", "desc")
      );
      
      const snap = await getDocs(q);
      const attempts = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt?.toDate?.() || new Date()
        };
      });
      
      return { success: true, data: attempts };
    } catch (error) {
      console.error("Error getting student attempts:", error);
      return { success: false, error: error.message };
    }
  },

  // Submit Quiz Response
  async submitQuiz(attemptData) {
    try {
      // Validate required fields
      if (!attemptData.quizId || !attemptData.studentId) {
        return { success: false, error: 'Missing required fields: quizId and studentId' };
      }

      const docRef = await addDoc(collection(db, "quiz_attempts"), {
        ...attemptData,
        submittedAt: Timestamp.now(),
        timestamp: serverTimestamp()
      });
      
      return { 
        success: true, 
        data: { 
          attemptId: docRef.id,
          message: 'Quiz submitted successfully' 
        }
      };
    } catch (error) {
      console.error("Error submitting quiz:", error);
      return { success: false, error: error.message };
    }
  },

  // Create Support Ticket
  async createTicket(studentId, ticketData) {
    try {
      const docRef = await addDoc(collection(db, 'support_tickets'), {
        studentId,
        ...ticketData,
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return { 
        success: true, 
        data: { ticketId: docRef.id } 
      };
    } catch (error) {
      console.error('Create ticket error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get Student Tickets
  async getTickets(studentId) {
    try {
      const q = query(
        collection(db, 'support_tickets'),
        where('studentId', '==', studentId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const tickets = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        };
      });
      
      return { success: true, data: tickets };
    } catch (error) {
      console.error('Get tickets error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update Ticket (add response)
  async updateTicket(ticketId, updateData) {
    try {
      const ticketRef = doc(db, 'support_tickets', ticketId);
      await updateDoc(ticketRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Update ticket error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get Quiz Results/Review (with correct answers)
  async getQuizResults(quizId, studentId) {
    try {
      // Get the quiz details
      const quizResult = await this.getQuiz(quizId);
      if (!quizResult.success) {
        return quizResult;
      }
      
      // Get the student's attempt
      const attemptResult = await this.checkAttempt(quizId, studentId);
      if (!attemptResult.success || !attemptResult.data) {
        return { 
          success: false, 
          error: 'No attempt found for this quiz' 
        };
      }
      
      // Get the specific attempt document
      const attemptsResult = await this.getStudentQuizAttempts(studentId);
      if (!attemptsResult.success) {
        return attemptsResult;
      }
      
      const studentAttempt = attemptsResult.data.find(
        attempt => attempt.quizId === quizId
      );
      
      if (!studentAttempt) {
        return { 
          success: false, 
          error: 'Attempt data not found' 
        };
      }
      
      // Combine quiz questions with student answers
      const quizWithResults = {
        quiz: quizResult.data,
        attempt: studentAttempt,
        questionsWithAnswers: quizResult.data.questions?.map((question, index) => ({
          ...question,
          studentAnswer: studentAttempt.answers?.[index],
          isCorrect: studentAttempt.answers?.[index] === question.correctAnswer,
          questionNumber: index + 1
        })) || []
      };
      
      return { success: true, data: quizWithResults };
    } catch (error) {
      console.error('Get quiz results error:', error);
      return { success: false, error: error.message };
    }
  }
};