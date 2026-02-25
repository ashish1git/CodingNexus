# Sub-Admin Permission System - Visual Architecture

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SUPER ADMIN                                  │
│                    (Full Access - All Features)                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ Creates/Updates Permissions
                           ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    SUB-ADMIN MANAGER UI                              │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Sub-Admin Name: demo                                          │   │
│  │ Email: demo@apsit.edu.in                                     │   │
│  │                                                              │   │
│  │ Permissions:                                                 │   │
│  │ ☑ Manage Students    ☐ View Tickets                         │   │
│  │ ☐ Manage Notes       ☐ Respond to Tickets                  │   │
│  │ ☐ Manage Announcements                                      │   │
│  │ ☑ Mark Attendance    ☑ Manage Competitions                │   │
│  │ ☐ Create Quizzes                                            │   │
│  │                                                              │   │
│  │              [Save] [Cancel]                                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
└────────────────┬──────────────────────────────────────────────────────┘
                 │
        PUT /api/admin/subadmins/:id
        ├─ Verify User exists
        ├─ Verify role is 'subadmin'
        ├─ Verify Admin profile exists
        └─ Update permissions
                 │
                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                                 │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ User Table                                                    │   │
│  │ ├─ id: f44ab1be-3874-4f81-af93-c84dc332517a                │   │
│  │ ├─ email: demo@apsit.edu.in                                  │   │
│  │ ├─ role: 'subadmin'                                          │   │
│  │ └─ adminProfile: (relation to Admin)                         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Admin Table                                                   │   │
│  │ ├─ id: ed8b07e5-e871-4020-95bf-1d0aed71ce6f                │   │
│  │ ├─ userId: f44ab1be-3874-4f81-af93-c84dc332517a (FK)        │   │
│  │ ├─ name: demo subadmin                                       │   │
│  │ └─ permissions: {                                            │   │
│  │     "manageStudents": true,                                  │   │
│  │     "manageNotes": false,                                    │   │
│  │     "markAttendance": true,                                  │   │
│  │     ... 5 more                                               │   │
│  │   }                                                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                 ↓
         GET /api/admin/subadmins
         Returns: {
           id: User UUID,
           permissions: { parsed object }
         }
                 │
                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      SUB-ADMIN LOGIN                                 │
│               Receives Permission Object                             │
│              Stored in Auth Context                                  │
└────────┬────────────────────────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    PROTECTED COMPONENTS                              │
│                                                                      │
│  At Component Mount:                                                │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ const [userDetails] = useAuth();                             │  │
│  │ const canAccess = hasPermission(                             │  │
│  │   userDetails,                                               │  │
│  │   'permissionKey'                                            │  │
│  │ );                                                           │  │
│  │                                                              │  │
│  │ if (!canAccess) return <AccessDeniedScreen />;             │  │
│  │ return <FeatureComponent />;                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Component Access Path:                                       │  │
│  │ ┌────────────────────────────────────────────────────────┐  │  │
│  │ │ StudentManagement.jsx                                  │  │  │
│  │ │ Permission: manageStudents ✓                          │  │  │
│  │ │                                                        │  │  │
│  │ │ ✓ Can add/edit/delete students                        │  │  │
│  │ │ ✓ All buttons enabled                                 │  │  │
│  │ │ ✓ Full feature access                                 │  │  │
│  │ └────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Component Denied Path:                                       │  │
│  │ ┌────────────────────────────────────────────────────────┐  │  │
│  │ │ AttendanceManager.jsx                                  │  │  │
│  │ │ Permission: markAttendance ✗                          │  │  │
│  │ │                                                        │  │  │
│  │ │ ┌──────────────────────────────────────────────────┐ │  │  │
│  │ │ │         ⚠️ ACCESS DENIED                         │ │  │  │
│  │ │ │ You don't have permission to mark attendance    │ │  │  │
│  │ │ │                                                  │ │  │  │
│  │ │ │ Contact your administrator for access.          │ │  │  │
│  │ │ └──────────────────────────────────────────────────┘ │  │  │
│  │ └────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Permission Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                      REQUEST FLOW                                    │
└─────────────────────────────────────────────────────────────────────┘

1. SUB-ADMIN LOGIN
   ├─ POST /api/auth/login/admin
   ├─ Backend verifies credentials
   └─ Returns JWT token + user details with permissions

2. FRONTEND STORES
   ├─ useAuth() context stores user details
   └─ Permissions available globally

3. COMPONENT MOUNT
   ├─ Read user details from useAuth()
   ├─ Call hasPermission(userDetails, permission)
   └─ Check permission key in permissions object

4. ACCESS CONTROL
   ├─ If permission = true → Show component
   └─ If permission = false → Show AccessDenied screen

5. PERMISSION UPDATE
   ├─ Super admin edits sub-admin permissions
   ├─ PUT /api/admin/subadmins/:id
   ├─ Backend verifies user + admin profile exist
   ├─ Updates Admin.permissions in database
   └─ Sub-admin logs out/in to get new permissions
```

## Permission Types Overview

```
┌────────────────────────────────────────────────────────────────┐
│                  8 PERMISSION TYPES                            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ 1. manageStudents              2. manageNotes                 │
│    └─ StudentManagement           └─ NotesUpload              │
│       ├─ Add students              ├─ Upload notes            │
│       ├─ Edit students             └─ Delete notes            │
│       └─ Delete students                                      │
│                                                                │
│ 3. manageAnnouncements         4. markAttendance              │
│    └─ AnnouncementManager         └─ AttendanceManager        │
│       ├─ Create                       ├─ Record attendance     │
│       ├─ Edit                         └─ View reports         │
│       └─ Delete                                               │
│                                                                │
│ 5. createQuizzes               6. manageCompetitions (NEW)    │
│    └─ QuizManager                 └─ CompetitionManager       │
│       ├─ Create quizzes             ├─ Create competitions    │
│       ├─ Edit quizzes               ├─ Edit competitions      │
│       └─ Manage submissions         └─ Manage participants    │
│                                                                │
│ 7. viewTickets                 8. respondTickets              │
│    └─ TicketManagement            └─ TicketManagement        │
│       └─ View all tickets             ├─ View tickets        │
│                                       └─ Reply to tickets     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Data Structure Flow

```
DATABASE (JSON)
┌─────────────────────────────────────────┐
│ permissions: "{"manageStudents": true..." │
│             (String format)              │
└────────────┬────────────────────────────┘
             │ GET /api/admin/subadmins
             │ JSON.parse()
             ↓
FRONTEND (Object)
┌─────────────────────────────────────────┐
│ permissions: {                          │
│   manageStudents: true,                 │
│   manageNotes: false,                   │
│   ... (Object format)                   │
│ }                                       │
└────────────┬────────────────────────────┘
             │ hasPermission(userDetails, key)
             │
             ↓ if (permissions[key] === true)
             │
             ├─ TRUE → Show component
             │
             └─ FALSE → Show AccessDenied
```

## Error Handling Flow

```
PUT /api/admin/subadmins/:id
    │
    ├─ Verify User exists?
    │   ├─ NO → 404 "User not found"
    │   └─ YES ↓
    │
    ├─ Verify User is subadmin?
    │   ├─ NO → 400 "User is not a sub-admin"
    │   └─ YES ↓
    │
    ├─ Verify Admin profile exists?
    │   ├─ NO → 400 "Admin profile not found"
    │   └─ YES ↓
    │
    ├─ Update Admin.permissions
    │   ├─ ERROR → 500 with error message
    │   └─ SUCCESS → 200 { success: true }
    │
    └─ Log result
```

## Complete Data Example

```
REQUEST:
PUT /api/admin/subadmins/f44ab1be-3874-4f81-af93-c84dc332517a
{
  "name": "demo subadmin",
  "permissions": {
    "manageStudents": true,
    "manageNotes": false,
    "manageAnnouncements": true,
    "markAttendance": true,
    "createQuizzes": false,
    "manageCompetitions": true,
    "viewTickets": true,
    "respondTickets": true
  }
}

DATABASE UPDATE:
UPDATE Admin
SET permissions = '{"manageStudents":true,"manageNotes":false,...}'
WHERE userId = 'f44ab1be-3874-4f81-af93-c84dc332517a'

RESPONSE:
{
  "success": true
}

USER EXPERIENCE:
- Sub-admin can access: Students, Announcements, Attendance, Competitions, Tickets
- Sub-admin cannot access: Notes, Quizzes
- Action buttons disabled for restricted features
```

## Component Permission Check Pattern

```javascript
// Pattern used in all protected components

export const FeatureComponent = () => {
  // 1. Get user details from auth context
  const [userDetails] = useAuth();
  
  // 2. Check if user has required permission
  const canAccess = hasPermission(userDetails, 'permissionKey');
  
  // 3. If no permission, show access denied
  if (!canAccess) {
    return (
      <div className="p-8 bg-red-50 border-l-4 border-red-500">
        <h2 className="text-xl font-bold text-red-800">Access Denied</h2>
        <p className="text-red-700 mt-2">
          You don't have permission to {getPermissionDeniedMessage('permissionKey')}
        </p>
        <p className="text-red-600 text-sm mt-2">
          Contact your administrator to request access.
        </p>
      </div>
    );
  }
  
  // 4. Otherwise show full feature
  return <FullFeatureUI />;
};
```

---

This visual representation shows how the permission system works from database level all the way to the UI, with proper error handling and access control at every step.
