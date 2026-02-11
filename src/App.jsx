// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';

// Import actual components
import LandingPage from './components/layout/LandingPage';
import MaintenancePage from './components/layout/MaintenancePage';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Auth components
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import AdminLogin from './components/auth/AdminLogin';
import ForgotPassword from './components/auth/ForgotPassword';

// Student components
import StudentDashboard from './components/student/StudentDashboard';
import StudentProfile from './components/student/StudentProfile';
import NotesViewer from './components/student/NotesViewer';
import AttendanceView from './components/student/AttendanceView';
import QuizAttempt from './components/student/QuizAttempt';
import QuizList from './components/student/QuizzesList'; // Add this import
import QuizResults from './components/student/QuizResults'; // Add this import
import CodeEditor from './components/student/CodeEditor';
import SupportTicket from './components/student/SupportTicket';
import Competitions from './components/student/Competitions';
import CompetitionProblems from './components/student/CompetitionProblems';
import CompetitionResults from './components/student/CompetitionResults';
import StudentCertificates from './components/student/StudentCertificates';

// Admin components
import AdminDashboard from './components/admin/AdminDashboard';
import StudentManagement from './components/admin/StudentManagement';
import NotesUpload from './components/admin/NotesUpload';
import AnnouncementManager from './components/admin/AnnouncementManager';
import AttendanceManager from './components/admin/AttendanceManager';
import QuizCreator from './components/admin/QuizCreator';
import QuizManager from './components/admin/QuizManager';
import QuizEditor from './components/admin/QuizEditor';
import QuizDetailViewer from './components/admin/QuizDetailViewer';
import QuizSubmissionsViewer from './components/admin/QuizSubmissionsViewer';
import TicketManagement from './components/admin/TicketManagement';
import SubAdminManager from './components/admin/SubAdminManager';
import CompetitionManager from './components/admin/CompetitionManager';
import SubmissionEvaluator from './components/admin/SubmissionEvaluator';
import CertificateManager from './components/admin/CertificateManager';

// Shared/Other components
import ClubMembers from './components/shared/ClubMembers';

function App() {
  // Check if maintenance mode is enabled
  const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

  // If in maintenance mode, show maintenance page instead of normal routes
  if (isMaintenanceMode) {
    return (
      <ThemeProvider>
        <Router>
          <MaintenancePage />
        </Router>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 2000,
                style: {
                  background: '#fff',
                  color: '#363636',
                },
                success: {
                  duration: 1500,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
              }}
            />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              
              {/* Club Members Page - Share this route directly with selected members */}
              <Route path="/club-members" element={<ClubMembers />} />

              {/* Student Protected Routes */}
              <Route 
                path="/student/dashboard" 
                element={
                  <ProtectedRoute>
                    <StudentDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/profile" 
                element={
                  <ProtectedRoute>
                    <StudentProfile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/notes" 
                element={
                  <ProtectedRoute>
                    <NotesViewer />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/attendance" 
                element={
                  <ProtectedRoute>
                    <AttendanceView />
                  </ProtectedRoute>
                } 
              />
              {/* Quiz Routes - Add these */}
              <Route 
                path="/student/quiz/list" 
                element={
                  <ProtectedRoute>
                    <QuizList />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/quiz/:quizId" 
                element={
                  <ProtectedRoute>
                    <QuizAttempt />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/quiz/results/:quizId" 
                element={
                  <ProtectedRoute>
                    <QuizResults />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/competitions" 
                element={
                  <ProtectedRoute>
                    <Competitions />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/competition/:competitionId" 
                element={
                  <ProtectedRoute>
                    <CompetitionProblems />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/competition/:id/results" 
                element={
                  <ProtectedRoute>
                    <CompetitionResults />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/code-editor" 
                element={
                  <ProtectedRoute>
                    <CodeEditor />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/support" 
                element={
                  <ProtectedRoute>
                    <SupportTicket />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/certificates" 
                element={
                  <ProtectedRoute>
                    <StudentCertificates />
                  </ProtectedRoute>
                } 
              />

              {/* Admin Protected Routes */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute adminOnly>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/students" 
                element={
                  <ProtectedRoute adminOnly>
                    <StudentManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/notes" 
                element={
                  <ProtectedRoute adminOnly>
                    <NotesUpload />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/announcements" 
                element={
                  <ProtectedRoute adminOnly>
                    <AnnouncementManager />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/attendance" 
                element={
                  <ProtectedRoute adminOnly>
                    <AttendanceManager />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/quiz" 
                element={
                  <ProtectedRoute adminOnly>
                    <QuizManager />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/quiz/create" 
                element={
                  <ProtectedRoute adminOnly>
                    <QuizCreator />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/quiz/edit/:id" 
                element={
                  <ProtectedRoute adminOnly>
                    <QuizEditor />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/quiz/details/:id" 
                element={
                  <ProtectedRoute adminOnly>
                    <QuizDetailViewer />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/quiz/submissions/:id" 
                element={
                  <ProtectedRoute adminOnly>
                    <QuizSubmissionsViewer />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/tickets" 
                element={
                  <ProtectedRoute adminOnly>
                    <TicketManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/sub-admins" 
                element={
                  <ProtectedRoute adminOnly>
                    <SubAdminManager />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/competitions" 
                element={
                  <ProtectedRoute adminOnly>
                    <CompetitionManager />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/competitions/:competitionId/evaluate" 
                element={
                  <ProtectedRoute adminOnly>
                    <SubmissionEvaluator />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/certificates" 
                element={
                  <ProtectedRoute adminOnly>
                    <CertificateManager />
                  </ProtectedRoute>
                } 
              />

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;