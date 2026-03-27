import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, Bell, Calendar, Award, Code, HelpCircle,
  LogOut, Menu, X, User, Clock, TrendingUp, FileText, Trophy
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/studentService';
import { certificateService } from '../../services/certificateService';
import dataCache from '../../utils/dataCache';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────
   Scoped styles injected once into <head>
───────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

.sdb-root {
  font-family: 'Inter', sans-serif;
  min-height: 100vh;
  background: #0b0b1a;
  background-image:
    radial-gradient(ellipse 80% 60% at 50% -10%, rgba(120,60,255,0.25) 0%, transparent 65%),
    radial-gradient(ellipse 50% 40% at 90% 80%, rgba(99,102,241,0.18) 0%, transparent 60%);
  color: #e2e8f0;
}

/* ── Navbar ── */
.sdb-navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  background: rgba(15,10,35,0.75);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(139,92,246,0.22);
  box-shadow: 0 4px 30px rgba(109,40,217,0.12);
}
.sdb-navbar-inner {
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sdb-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}
.sdb-logo-icon {
  width: 38px; height: 38px;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 18px rgba(124,58,237,0.55);
}
.sdb-logo-text {
  font-size: 1.2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #a78bfa, #818cf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
}
.sdb-batch-pill {
  display: flex; align-items: center; gap: 6px;
  background: rgba(109,40,217,0.18);
  border: 1px solid rgba(139,92,246,0.35);
  border-radius: 50px;
  padding: 5px 14px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #c4b5fd;
  letter-spacing: 0.3px;
}
.sdb-logout-btn {
  display: flex; align-items: center; gap: 7px;
  padding: 7px 16px;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.3);
  border-radius: 10px;
  color: #f87171;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.sdb-logout-btn:hover {
  background: rgba(239,68,68,0.22);
  border-color: rgba(239,68,68,0.6);
  box-shadow: 0 0 14px rgba(239,68,68,0.2);
}
.sdb-hamburger {
  background: none; border: none; cursor: pointer; padding: 6px;
  color: #a78bfa; display: none;
}
@media (max-width: 1023px) { .sdb-hamburger { display: flex; } }

/* ── Layout ── */
.sdb-layout { display: flex; }

/* ── Sidebar ── */
.sdb-sidebar {
  position: sticky;
  top: 64px;
  height: calc(100vh - 64px);
  width: 264px;
  flex-shrink: 0;
  background: rgba(15,10,40,0.75);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  border-right: 1px solid rgba(139,92,246,0.18);
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px 16px;
  transition: transform 0.3s cubic-bezier(.4,0,.2,1);
  scrollbar-width: thin;
  scrollbar-color: rgba(124,58,237,0.3) transparent;
}
@media (max-width: 1023px) {
  .sdb-sidebar {
    position: fixed;
    left: 0; top: 64px; z-index: 40;
    transform: translateX(-100%);
  }
  .sdb-sidebar.open { transform: translateX(0); box-shadow: 10px 0 40px rgba(109,40,217,0.3); }
}

/* Profile card in sidebar */
.sdb-profile-card {
  display: flex; align-items: center; gap: 12px;
  padding: 14px;
  background: rgba(109,40,217,0.12);
  border: 1px solid rgba(139,92,246,0.25);
  border-radius: 14px;
  margin-bottom: 28px;
  text-decoration: none;
  transition: all 0.2s ease;
}
.sdb-profile-card:hover {
  background: rgba(109,40,217,0.22);
  border-color: rgba(139,92,246,0.5);
  box-shadow: 0 0 20px rgba(124,58,237,0.2);
}
.sdb-avatar {
  width: 44px; height: 44px;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 1rem; color: #fff;
  flex-shrink: 0;
  overflow: hidden;
  border: 2px solid rgba(167,139,250,0.5);
  box-shadow: 0 0 14px rgba(124,58,237,0.45);
}
.sdb-profile-name {
  font-size: 0.9rem; font-weight: 700; color: #e2e8f0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  transition: color 0.2s;
}
.sdb-profile-card:hover .sdb-profile-name { color: #c4b5fd; }
.sdb-profile-roll {
  font-size: 0.75rem; color: #94a3b8; margin-top: 1px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* Nav Items */
.sdb-nav { display: flex; flex-direction: column; gap: 4px; }
.sdb-nav-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px;
  border-radius: 12px;
  text-decoration: none;
  color: #94a3b8;
  font-size: 0.88rem;
  font-weight: 500;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  position: relative;
}
.sdb-nav-item:hover {
  background: rgba(109,40,217,0.18);
  color: #c4b5fd;
  border-color: rgba(139,92,246,0.3);
  box-shadow: 0 0 12px rgba(124,58,237,0.15);
  transform: translateX(3px);
}
.sdb-nav-icon { position: relative; flex-shrink: 0; }
.sdb-badge-dot {
  position: absolute; top: -7px; right: -7px;
  background: #ef4444; color: #fff;
  font-size: 0.6rem; font-weight: 800;
  width: 16px; height: 16px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  animation: sdpulse 2s infinite;
}
.sdb-new-pill {
  margin-left: auto;
  background: linear-gradient(135deg, #10b981, #34d399);
  color: #fff; font-size: 0.6rem; font-weight: 800;
  padding: 2px 7px; border-radius: 50px;
  animation: sdpulse 2s infinite;
  box-shadow: 0 0 10px rgba(16,185,129,0.4);
}
.sdb-count-pill {
  margin-left: auto;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  color: #fff; font-size: 0.65rem; font-weight: 700;
  padding: 2px 8px; border-radius: 50px;
}

@keyframes sdpulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* ── Main ── */
.sdb-main {
  flex: 1;
  padding: 32px 28px;
  min-width: 0;
}
@media (max-width: 768px) { .sdb-main { padding: 20px 16px; } }

/* Welcome Banner */
.sdb-welcome {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(109,40,217,0.35), rgba(99,102,241,0.25));
  border: 1px solid rgba(139,92,246,0.3);
  border-radius: 20px;
  padding: 28px 32px;
  margin-bottom: 28px;
  box-shadow: 0 8px 32px rgba(109,40,217,0.2);
}
.sdb-welcome::before {
  content: '';
  position: absolute; top: -60px; right: -60px;
  width: 240px; height: 240px;
  background: radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%);
  border-radius: 50%; pointer-events: none;
}
.sdb-welcome::after {
  content: '';
  position: absolute; bottom: -40px; left: 30%;
  width: 160px; height: 160px;
  background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%);
  border-radius: 50%; pointer-events: none;
}
.sdb-welcome-title {
  font-size: 1.9rem; font-weight: 800;
  color: #f1f5f9;
  letter-spacing: -0.6px;
  margin-bottom: 6px;
  position: relative; z-index: 1;
}
@media (max-width: 640px) { .sdb-welcome-title { font-size: 1.4rem; } }
.sdb-welcome-sub {
  font-size: 0.9rem; color: #a5b4fc; font-weight: 400;
  position: relative; z-index: 1;
}

/* Stats Grid */
.sdb-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 28px;
}
@media (max-width: 1024px) { .sdb-stats-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 500px) { .sdb-stats-grid { grid-template-columns: 1fr; } }

.sdb-stat-card {
  position: relative; overflow: hidden;
  border-radius: 18px;
  padding: 22px;
  border: 1px solid;
  transition: all 0.28s ease;
  cursor: default;
}
.sdb-stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(0,0,0,0.4);
}
.sdb-stat-card::before {
  content: ''; position: absolute;
  inset: 0; border-radius: inherit;
  background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%);
  pointer-events: none;
}
.sdb-stat-glow {
  position: absolute; top: -30px; right: -30px;
  width: 100px; height: 100px;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(22px);
  opacity: 0.45;
}

.sdb-stat-blue  { background: linear-gradient(135deg, rgba(37,99,235,0.2), rgba(29,78,216,0.1)); border-color: rgba(59,130,246,0.35); }
.sdb-stat-emerald { background: linear-gradient(135deg, rgba(5,150,105,0.2), rgba(4,120,87,0.1)); border-color: rgba(16,185,129,0.35); }
.sdb-stat-purple { background: linear-gradient(135deg, rgba(109,40,217,0.25), rgba(79,70,229,0.15)); border-color: rgba(139,92,246,0.4); }
.sdb-stat-amber  { background: linear-gradient(135deg, rgba(217,119,6,0.22), rgba(180,83,9,0.12)); border-color: rgba(245,158,11,0.35); }
.sdb-glow-blue   { background: #3b82f6; }
.sdb-glow-emerald { background: #10b981; }
.sdb-glow-purple  { background: #8b5cf6; }
.sdb-glow-amber   { background: #f59e0b; }

.sdb-stat-head {
  display: flex; align-items: center;
  justify-content: space-between; margin-bottom: 16px;
}
.sdb-stat-badge {
  font-size: 0.68rem; font-weight: 700;
  padding: 3px 9px; border-radius: 50px;
  background: rgba(0,0,0,0.25);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.65);
  letter-spacing: 0.5px; text-transform: uppercase;
}
.sdb-stat-value {
  font-size: 2.2rem; font-weight: 800;
  color: #f1f5f9; letter-spacing: -1px;
  line-height: 1;
  margin-bottom: 4px;
}
.sdb-stat-label {
  font-size: 0.8rem; color: #94a3b8; font-weight: 400;
}

/* Content Grid */
.sdb-content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}
@media (max-width: 900px) { .sdb-content-grid { grid-template-columns: 1fr; } }

/* Glass Cards */
.sdb-glass-card {
  background: rgba(15,10,40,0.55);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(139,92,246,0.2);
  border-radius: 20px;
  padding: 24px;
  transition: all 0.25s ease;
}
.sdb-glass-card:hover {
  border-color: rgba(139,92,246,0.4);
  box-shadow: 0 8px 32px rgba(109,40,217,0.18);
}
.sdb-card-header {
  display: flex; align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.sdb-card-title-row {
  display: flex; align-items: center; gap: 10px;
}
.sdb-card-icon-wrap {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.sdb-indigo-bg { background: rgba(99,102,241,0.2); }
.sdb-purple-bg { background: rgba(139,92,246,0.2); }
.sdb-card-title {
  font-size: 1rem; font-weight: 700; color: #e2e8f0;
}
.sdb-view-all {
  font-size: 0.78rem; font-weight: 600; color: #a78bfa;
  text-decoration: none; transition: color 0.2s;
}
.sdb-view-all:hover { color: #c4b5fd; }

/* Announcement item */
.sdb-announce-item {
  border-left: 3px solid #6366f1;
  padding: 12px 14px;
  background: rgba(99,102,241,0.08);
  border-radius: 0 12px 12px 0;
  transition: background 0.2s;
  margin-bottom: 10px;
}
.sdb-announce-item:last-child { margin-bottom: 0; }
.sdb-announce-item:hover { background: rgba(99,102,241,0.16); }
.sdb-announce-title { font-size: 0.88rem; font-weight: 600; color: #e2e8f0; }
.sdb-announce-body { font-size: 0.78rem; color: #94a3b8; margin-top: 4px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.sdb-announce-date { font-size: 0.7rem; color: #64748b; margin-top: 6px; }

/* Quiz item */
.sdb-quiz-item {
  background: rgba(109,40,217,0.12);
  border: 1px solid rgba(139,92,246,0.25);
  border-radius: 14px;
  padding: 14px 16px;
  transition: all 0.2s ease;
  margin-bottom: 10px;
}
.sdb-quiz-item:last-child { margin-bottom: 0; }
.sdb-quiz-item:hover {
  background: rgba(109,40,217,0.22);
  border-color: rgba(139,92,246,0.5);
  transform: translateX(3px);
}
.sdb-quiz-title { font-size: 0.88rem; font-weight: 600; color: #e2e8f0; }
.sdb-quiz-meta { display: flex; align-items: center; gap: 14px; margin-top: 8px; flex-wrap: wrap; }
.sdb-quiz-meta-item { display: flex; align-items: center; gap: 5px; font-size: 0.76rem; color: #a78bfa; }
.sdb-quiz-meta-ends { font-size: 0.76rem; color: #64748b; }
.sdb-attempt-btn {
  display: inline-flex; align-items: center; gap: 6px;
  margin-top: 12px;
  padding: 7px 16px;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  color: #fff; border-radius: 10px;
  font-size: 0.78rem; font-weight: 700;
  text-decoration: none;
  border: none; cursor: pointer;
  transition: all 0.22s ease;
  box-shadow: 0 4px 14px rgba(124,58,237,0.4);
}
.sdb-attempt-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(124,58,237,0.55);
}

/* Empty state */
.sdb-empty {
  text-align: center; padding: 40px 0;
  color: #475569; font-size: 0.85rem;
}
.sdb-empty-icon { font-size: 2.2rem; margin-bottom: 8px; }

/* Quick Actions */
.sdb-quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
@media (max-width: 900px) { .sdb-quick-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 400px) { .sdb-quick-grid { grid-template-columns: 1fr 1fr; } }

.sdb-quick-card {
  position: relative; overflow: hidden;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 10px;
  padding: 24px 16px;
  background: rgba(15,10,40,0.55);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(139,92,246,0.2);
  border-radius: 18px;
  text-decoration: none;
  transition: all 0.28s cubic-bezier(.4,0,.2,1);
  cursor: pointer;
}
.sdb-quick-card::before {
  content: '';
  position: absolute; inset: 0; border-radius: inherit;
  background: linear-gradient(135deg, rgba(139,92,246,0) 0%, rgba(139,92,246,0.08) 100%);
  opacity: 0; transition: opacity 0.28s;
}
.sdb-quick-card:hover {
  border-color: rgba(139,92,246,0.5);
  transform: translateY(-6px);
  box-shadow: 0 16px 40px rgba(109,40,217,0.28);
}
.sdb-quick-card:hover::before { opacity: 1; }
.sdb-quick-icon {
  width: 52px; height: 52px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.28s ease, box-shadow 0.28s ease;
}
.sdb-quick-card:hover .sdb-quick-icon {
  transform: scale(1.12);
}
.sdb-quick-blue   { background: rgba(59,130,246,0.18); box-shadow: 0 0 18px rgba(59,130,246,0.25); }
.sdb-quick-emerald { background: rgba(16,185,129,0.18); box-shadow: 0 0 18px rgba(16,185,129,0.25); }
.sdb-quick-purple  { background: rgba(139,92,246,0.18); box-shadow: 0 0 18px rgba(139,92,246,0.25); }
.sdb-quick-amber   { background: rgba(245,158,11,0.18); box-shadow: 0 0 18px rgba(245,158,11,0.25); }
.sdb-quick-card:hover .sdb-quick-blue   { box-shadow: 0 0 28px rgba(59,130,246,0.5); }
.sdb-quick-card:hover .sdb-quick-emerald { box-shadow: 0 0 28px rgba(16,185,129,0.5); }
.sdb-quick-card:hover .sdb-quick-purple  { box-shadow: 0 0 28px rgba(139,92,246,0.5); }
.sdb-quick-card:hover .sdb-quick-amber   { box-shadow: 0 0 28px rgba(245,158,11,0.5); }
.sdb-quick-label {
  font-size: 0.82rem; font-weight: 600; color: #cbd5e1;
  letter-spacing: 0.2px; text-align: center;
}

/* Overlay */
.sdb-overlay {
  display: none;
  position: fixed; inset: 0; z-index: 35;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(2px);
}
@media (max-width: 1023px) { .sdb-overlay.open { display: block; } }

/* Section divider label */
.sdb-section-label {
  font-size: 0.7rem; font-weight: 700;
  letter-spacing: 1.5px; text-transform: uppercase;
  color: #4c4f7a; padding: 8px 14px 4px;
}
`;

/* inject styles once */
if (typeof document !== 'undefined' && !document.getElementById('sdb-styles')) {
  const tag = document.createElement('style');
  tag.id = 'sdb-styles';
  tag.textContent = STYLES;
  document.head.appendChild(tag);
}

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
const StudentDashboard = () => {
  const { userDetails, logout, currentUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalNotes: 0,
    attendance: 0,
    attendancePercentage: 0,
    quizzesAttempted: 0,
    pendingQuizzes: 0
  });
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [upcomingQuizzes, setUpcomingQuizzes] = useState([]);
  const [availableCertificatesCount, setAvailableCertificatesCount] = useState(0);

  // Helper function to format quiz duration
  const formatQuizDuration = (minutes) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim();
    }
    return `${mins}m`;
  };

  // Helper function to format date with time
  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    try {
      if (typeof date.toDate === 'function') { date = date.toDate(); }
      return date.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });
    } catch (error) { return 'Invalid Date'; }
  };

  useEffect(() => {
    refreshUser();
    fetchDashboardData();
    fetchAvailableCertificates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAvailableCertificates = async () => {
    try {
      const response = await certificateService.getAvailableCertificates();
      if (response.success) {
        const unclaimedCount = response.data.filter(cert => !cert.requested).length;
        setAvailableCertificatesCount(unclaimedCount);
      }
    } catch (error) { console.error('Error fetching certificates:', error); }
  };

  const fetchDashboardData = async () => {
    if (!userDetails || !currentUser) return;
    const userId = currentUser.uid || currentUser.id || userDetails.id;
    const cachedData = dataCache.get('dashboard', userId);
    if (cachedData) {
      console.log('📦 Loading cached dashboard data...');
      setStats(cachedData.stats);
      setUpcomingQuizzes(cachedData.upcomingQuizzes);
      setRecentAnnouncements(cachedData.recentAnnouncements);
    }
    try {
      const [notesRes, attendanceRes, quizzesRes, attemptsRes, announcementsRes] = await Promise.all([
        studentService.getNotes(),
        studentService.getAttendance(),
        studentService.getQuizzes(),
        studentService.getQuizAttempts(),
        studentService.getAnnouncements()
      ]);
      const totalNotesCount = notesRes.success ? notesRes.data.length : 0;
      let attendancePercentage = 0;
      if (attendanceRes.success) {
        const records = attendanceRes.data;
        const totalClasses = records.length;
        const presentClasses = records.filter(r => r.isPresent).length;
        attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;
      }
      let quizzesAttemptedCount = 0;
      let upcomingQuizzesList = [];
      if (quizzesRes.success && attemptsRes.success) {
        const allQuizzes = quizzesRes.data;
        const attemptedQuizIds = new Set(attemptsRes.data.map(a => a.quizId));
        quizzesAttemptedCount = allQuizzes.filter(q => attemptedQuizIds.has(q.id)).length;
        const now = new Date();
        upcomingQuizzesList = allQuizzes
          .map(quiz => ({
            ...quiz,
            endTime: new Date(quiz.endTime),
            startTime: new Date(quiz.startTime),
            isEnded: new Date(quiz.endTime) < now,
            isStarted: new Date(quiz.startTime) <= now
          }))
          .filter(quiz => !quiz.isEnded && !attemptedQuizIds.has(quiz.id))
          .sort((a, b) => a.startTime - b.startTime)
          .slice(0, 5);
      }
      const announcements = announcementsRes.success
        ? announcementsRes.data.slice(0, 5).map(a => ({ ...a, createdAt: new Date(a.createdAt) }))
        : [];
      const newStats = {
        totalNotes: totalNotesCount, attendance: attendancePercentage,
        attendancePercentage, quizzesAttempted: quizzesAttemptedCount,
        pendingQuizzes: upcomingQuizzesList.length
      };
      setStats(newStats);
      setUpcomingQuizzes(upcomingQuizzesList);
      setRecentAnnouncements(announcements);
      dataCache.set('dashboard', userId, { stats: newStats, upcomingQuizzes: upcomingQuizzesList, recentAnnouncements: announcements });
      console.log('✅ Dashboard data refreshed and cached');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      const cachedData2 = dataCache.get('dashboard', currentUser.uid || currentUser.id || userDetails.id);
      if (!cachedData2) toast.error('Failed to load dashboard data');
    }
  };

  const handleLogout = async () => {
    navigate('/', { replace: true });
    setTimeout(async () => {
      try { await logout(); }
      catch (error) { console.error('Logout error:', error); toast.error('Failed to logout'); }
    }, 10);
  };

  const menuItems = [
    { icon: <User className="w-4 h-4" />, label: 'Profile', path: '/student/profile' },
    { icon: <BookOpen className="w-4 h-4" />, label: 'Notes', path: '/student/notes' },
    { icon: <Calendar className="w-4 h-4" />, label: 'Attendance', path: '/student/attendance' },
    { icon: <Award className="w-4 h-4" />, label: 'Quizzes', path: '/student/quiz/list' },
    { icon: <Trophy className="w-4 h-4" />, label: 'Competitions', path: '/student/competitions' },
    { icon: <FileText className="w-4 h-4" />, label: 'Certificates', path: '/student/certificates', badge: availableCertificatesCount, isNew: true },
    { icon: <Code className="w-4 h-4" />, label: 'Code Editor', path: '/student/code-editor' },
    { icon: <HelpCircle className="w-4 h-4" />, label: 'Support', path: '/student/support' },
  ];

  const firstName = userDetails?.studentProfile?.name?.split(' ')[0] || userDetails?.name?.split(' ')[0];
  const profilePhoto = userDetails?.studentProfile?.profilePhotoUrl || userDetails?.photoURL;
  const profileInitial = userDetails?.studentProfile?.name?.charAt(0).toUpperCase() || userDetails?.name?.charAt(0).toUpperCase();

  return (
    <div className="sdb-root">
      {/* ── Navbar ── */}
      <nav className="sdb-navbar">
        <div className="sdb-navbar-inner">
          <div className="sdb-logo">
            <button className="sdb-hamburger" onClick={() => setIsSidebarOpen(!isSidebarOpen)} aria-label="Toggle Sidebar">
              {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <div className="sdb-logo-icon">
                <Code size={20} color="#fff" />
              </div>
              <span className="sdb-logo-text">Coding Nexus</span>
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="sdb-batch-pill">
              <Award size={14} />
              <span>{userDetails?.studentProfile?.batch || userDetails?.batch} Batch</span>
            </div>
            <button className="sdb-logout-btn" onClick={handleLogout}>
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Overlay (mobile) ── */}
      <div className={`sdb-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)} />

      <div className="sdb-layout">
        {/* ── Sidebar ── */}
        <aside className={`sdb-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          {/* Profile */}
          <Link
            to="/student/profile"
            className="sdb-profile-card"
            onClick={() => setIsSidebarOpen(false)}
          >
            <div className="sdb-avatar">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none'; }} />
              ) : profileInitial}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="sdb-profile-name">
                {userDetails?.studentProfile?.name || userDetails?.name}
              </div>
              <div className="sdb-profile-roll">
                {userDetails?.studentProfile?.rollNo || userDetails?.rollNo}
              </div>
            </div>
          </Link>

          <div className="sdb-section-label">Navigation</div>

          {/* Nav */}
          <nav className="sdb-nav">
            {menuItems.map((item, idx) => (
              <Link
                key={idx}
                to={item.path}
                className="sdb-nav-item"
                onClick={() => setIsSidebarOpen(false)}
              >
                <span className="sdb-nav-icon">
                  {item.icon}
                  {item.badge > 0 && (
                    <span className="sdb-badge-dot">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </span>
                <span>{item.label}</span>
                {item.isNew && <span className="sdb-new-pill">NEW</span>}
                {item.badge > 0 && !item.isNew && (
                  <span className="sdb-count-pill">{item.badge}</span>
                )}
              </Link>
            ))}
          </nav>
        </aside>

        {/* ── Main Content ── */}
        <main className="sdb-main">

          {/* Welcome Banner */}
          <div className="sdb-welcome">
            <div className="sdb-welcome-title">
              Hey, {firstName}! 👋 Welcome back
            </div>
            <div className="sdb-welcome-sub">
              Here's what's happening with your learning today.
            </div>
          </div>

          {/* Stats */}
          <div className="sdb-stats-grid">
            <StatCard icon={<BookOpen size={24} />} badge="Total" value={stats.totalNotes} label="Notes Available" color="blue" />
            <StatCard icon={<Calendar size={24} />} badge="Current" value={`${stats.attendancePercentage}%`} label="Attendance Rate" color="emerald" />
            <StatCard icon={<Award size={24} />} badge="Pending" value={stats.pendingQuizzes} label="Quizzes to Attempt" color="purple" />
            <StatCard icon={<TrendingUp size={24} />} badge="Progress" value={stats.quizzesAttempted} label="Quizzes Completed" color="amber" />
          </div>

          {/* Announcements & Quizzes */}
          <div className="sdb-content-grid">
            {/* Announcements */}
            <div className="sdb-glass-card">
              <div className="sdb-card-header">
                <div className="sdb-card-title-row">
                  <div className="sdb-card-icon-wrap sdb-indigo-bg">
                    <Bell size={17} color="#818cf8" />
                  </div>
                  <span className="sdb-card-title">Recent Announcements</span>
                </div>
              </div>

              {recentAnnouncements.length > 0 ? (
                recentAnnouncements.map((ann) => (
                  <div key={ann.id} className="sdb-announce-item">
                    <div className="sdb-announce-title">{ann.title}</div>
                    <div className="sdb-announce-body">{ann.content}</div>
                    <div className="sdb-announce-date">
                      {ann.createdAt && ann.createdAt.toLocaleDateString
                        ? ann.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : 'N/A'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="sdb-empty">
                  <div className="sdb-empty-icon">📭</div>
                  No announcements yet
                </div>
              )}
            </div>

            {/* Upcoming Quizzes */}
            <div className="sdb-glass-card">
              <div className="sdb-card-header">
                <div className="sdb-card-title-row">
                  <div className="sdb-card-icon-wrap sdb-purple-bg">
                    <Clock size={17} color="#a78bfa" />
                  </div>
                  <span className="sdb-card-title">Upcoming Quizzes</span>
                </div>
                <Link to="/student/quiz/list" className="sdb-view-all">View All →</Link>
              </div>

              {upcomingQuizzes.length > 0 ? (
                upcomingQuizzes.map((quiz) => (
                  <div key={quiz.id} className="sdb-quiz-item">
                    <div className="sdb-quiz-title">{quiz.title}</div>
                    <div className="sdb-quiz-meta">
                      <div className="sdb-quiz-meta-item">
                        <Clock size={13} />
                        <span>{formatQuizDuration(quiz.duration)}</span>
                      </div>
                      <div className="sdb-quiz-meta-ends">
                        Ends: {formatDateTime(quiz.endTime)}
                      </div>
                    </div>
                    <Link to={`/student/quiz/${quiz.id}`} className="sdb-attempt-btn">
                      Attempt Now →
                    </Link>
                  </div>
                ))
              ) : (
                <div className="sdb-empty">
                  <div className="sdb-empty-icon">🎯</div>
                  No upcoming quizzes
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="sdb-quick-grid">
            <QuickActionCard icon={<FileText size={22} color="#60a5fa" />} iconClass="sdb-quick-blue" label="View Notes" link="/student/notes" />
            <QuickActionCard icon={<Code size={22} color="#34d399" />} iconClass="sdb-quick-emerald" label="Code Editor" link="/student/code-editor" />
            <QuickActionCard icon={<Calendar size={22} color="#a78bfa" />} iconClass="sdb-quick-purple" label="Attendance" link="/student/attendance" />
            <QuickActionCard icon={<HelpCircle size={22} color="#fbbf24" />} iconClass="sdb-quick-amber" label="Support" link="/student/support" />
          </div>

        </main>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   Stat Card
───────────────────────────────────────── */
const colorMap = {
  blue:    { card: 'sdb-stat-blue',    glow: 'sdb-glow-blue',    icon: '#60a5fa' },
  emerald: { card: 'sdb-stat-emerald', glow: 'sdb-glow-emerald', icon: '#34d399' },
  purple:  { card: 'sdb-stat-purple',  glow: 'sdb-glow-purple',  icon: '#c4b5fd' },
  amber:   { card: 'sdb-stat-amber',   glow: 'sdb-glow-amber',   icon: '#fbbf24' },
};

function StatCard({ icon, badge, value, label, color }) {
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className={`sdb-stat-card ${c.card}`}>
      <div className={`sdb-stat-glow ${c.glow}`} />
      <div className="sdb-stat-head">
        <span style={{ color: c.icon, display: 'flex' }}>{icon}</span>
        <span className="sdb-stat-badge">{badge}</span>
      </div>
      <div className="sdb-stat-value">{value}</div>
      <div className="sdb-stat-label">{label}</div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Quick Action Card
───────────────────────────────────────── */
function QuickActionCard({ icon, iconClass, label, link }) {
  return (
    <Link to={link} className="sdb-quick-card">
      <div className={`sdb-quick-icon ${iconClass}`}>{icon}</div>
      <span className="sdb-quick-label">{label}</span>
    </Link>
  );
}

export default StudentDashboard;