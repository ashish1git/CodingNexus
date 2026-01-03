// src/utils/constants.js

export const COURSES = [
  { value: 'bca', label: 'BCA' },
  { value: 'mca', label: 'MCA' },
  { value: 'btech', label: 'B.Tech' },
  { value: 'mtech', label: 'M.Tech' }
];

export const SEMESTERS = [
  { value: '1', label: 'Semester 1' },
  { value: '2', label: 'Semester 2' },
  { value: '3', label: 'Semester 3' },
  { value: '4', label: 'Semester 4' },
  { value: '5', label: 'Semester 5' },
  { value: '6', label: 'Semester 6' },
  { value: '7', label: 'Semester 7' },
  { value: '8', label: 'Semester 8' }
];

export const SUBJECTS = {
  bca: {
    '1': ['C Programming', 'Digital Electronics', 'Mathematics', 'English'],
    '2': ['Data Structures', 'Database Management', 'Web Development', 'Statistics'],
    '3': ['Java Programming', 'Operating Systems', 'Computer Networks', 'Software Engineering'],
    '4': ['Python', 'Cloud Computing', 'Mobile Development', 'AI Fundamentals'],
    '5': ['Machine Learning', 'Big Data', 'Cyber Security', 'Project Management'],
    '6': ['Advanced Java', 'DevOps', 'Blockchain', 'Final Project']
  },
  mca: {
    '1': ['Advanced Programming', 'Data Analytics', 'Cloud Architecture', 'Research Methods'],
    '2': ['Deep Learning', 'Distributed Systems', 'Advanced Database', 'Thesis']
  }
};

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused'
};

export const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
};

export const TICKET_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

export const QUIZ_DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

export const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
  SUB_ADMIN: 'sub_admin'
};

export const FILE_TYPES = {
  PDF: 'application/pdf',
  DOC: 'application/msword',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  PPT: 'application/vnd.ms-powerpoint',
  PPTX: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  IMAGE: 'image/*'
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  ADMIN_LOGIN: '/admin/login',
  STUDENT_DASHBOARD: '/student/dashboard',
  STUDENT_PROFILE: '/student/profile',
  STUDENT_NOTES: '/student/notes',
  STUDENT_ATTENDANCE: '/student/attendance',
  STUDENT_QUIZ: '/student/quiz',
  STUDENT_SUPPORT: '/student/support',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_STUDENTS: '/admin/students',
  ADMIN_NOTES: '/admin/notes',
  ADMIN_ANNOUNCEMENTS: '/admin/announcements',
  ADMIN_ATTENDANCE: '/admin/attendance',
  ADMIN_QUIZ: '/admin/quiz',
  ADMIN_TICKETS: '/admin/tickets',
  ADMIN_SUB_ADMINS: '/admin/sub-admins'
};