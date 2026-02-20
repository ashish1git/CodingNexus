// src/utils/permissions.js - Permission utility functions

/**
 * Check if user has a specific permission
 * @param {Object} userDetails - User details from auth context
 * @param {string} permission - Permission key to check
 * @returns {boolean}
 */
export const hasPermission = (userDetails, permission) => {
  // Super admin has all permissions
  if (userDetails?.role === 'superadmin') return true;
  
  // If permissions is 'all', user has all permissions
  const permissions = userDetails?.permissions;
  if (permissions === 'all') return true;
  
  // Check specific permission
  if (typeof permissions === 'object' && permissions !== null) {
    // If the permission key exists, use its value
    if (permission in permissions) {
      const result = permissions[permission] === true;
      console.log(`🔐 Permission check: ${permission} = ${result}`, permissions);
      return result;
    }
    
    // For backward compatibility: if createEvents/editEvents/deleteEvents don't exist
    // but manageEvents is true, allow them
    if (['createEvents', 'editEvents', 'deleteEvents'].includes(permission)) {
      const result = permissions.manageEvents === true;
      console.log(`🔐 Permission check (fallback): ${permission} = ${result}`, permissions);
      return result;
    }
    
    // Default to false for unknown permissions
    console.log(`🔐 Permission check: ${permission} = false (not found)`, permissions);
    return false;
  }
  
  console.log(`🔐 Permission check: ${permission} = false (invalid permissions)`, permissions);
  return false;
};

/**
 * Permission definitions and their descriptions
 */
export const PERMISSIONS = {
  manageStudents: {
    key: 'manageStudents',
    label: 'Manage Students',
    description: 'Add, edit, and delete student accounts'
  },
  manageNotes: {
    key: 'manageNotes',
    label: 'Manage Notes',
    description: 'Upload and delete course notes'
  },
  manageAnnouncements: {
    key: 'manageAnnouncements',
    label: 'Manage Announcements',
    description: 'Create, edit, and delete announcements'
  },
  markAttendance: {
    key: 'markAttendance',
    label: 'Mark Attendance',
    description: 'Record student attendance'
  },
  createQuizzes: {
    key: 'createQuizzes',
    label: 'Manage Quizzes',
    description: 'Create, edit, and delete quizzes'
  },
  manageCompetitions: {
    key: 'manageCompetitions',
    label: 'Manage Competitions',
    description: 'Create, edit, and manage programming competitions'
  },
  viewTickets: {
    key: 'viewTickets',
    label: 'View Support Tickets',
    description: 'View support tickets and complaints'
  },
  respondTickets: {
    key: 'respondTickets',
    label: 'Respond to Tickets',
    description: 'Reply to and resolve support tickets'
  },
  manageEvents: {
    key: 'manageEvents',
    label: 'View Events',
    description: 'View events and registrations'
  },
  createEvents: {
    key: 'createEvents',
    label: 'Create Events',
    description: 'Create new events'
  },
  editEvents: {
    key: 'editEvents',
    label: 'Edit Events',
    description: 'Edit existing events'
  },
  deleteEvents: {
    key: 'deleteEvents',
    label: 'Delete Events',
    description: 'Delete events'
  },
  manageCertificates: {
    key: 'manageCertificates',
    label: 'Manage Certificates',
    description: 'Create and manage certificates'
  },
  sendBulkEmails: {
    key: 'sendBulkEmails',
    label: 'Send Bulk Emails',
    description: 'Send bulk emails to students'
  }
};

/**
 * Get user-friendly error message for permission denial
 * @param {string} permission - Permission key that was denied
 * @returns {string}
 */
export const getPermissionDeniedMessage = (permission) => {
  const permDef = PERMISSIONS[permission];
  if (permDef) {
    return `You don't have permission to ${permDef.description.toLowerCase()}. Contact your administrator.`;
  }
  return "You don't have permission to perform this action. Contact your administrator.";
};
