# Sub-Admin Permission System - API Reference

## Base URL
```
http://localhost:5000/api/admin
```

## Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer {jwt_token}
```

---

## 1. GET /subadmins
### Get all sub-admins with their permissions

**Method**: GET
**URL**: `/api/admin/subadmins`
**Authentication**: Required (admin role)
**Body**: None

### Response (200 OK)
```json
{
  "success": true,
  "subAdmins": [
    {
      "id": "f44ab1be-3874-4f81-af93-c84dc332517a",
      "userId": "f44ab1be-3874-4f81-af93-c84dc332517a",
      "adminId": "ed8b07e5-e871-4020-95bf-1d0aed71ce6f",
      "email": "demo@apsit.edu.in",
      "name": "demo subadmin",
      "permissions": {
        "manageStudents": false,
        "manageNotes": false,
        "manageAnnouncements": false,
        "markAttendance": false,
        "createQuizzes": false,
        "manageCompetitions": false,
        "viewTickets": true,
        "respondTickets": true
      }
    },
    {
      "id": "87104d67-273c-4c84-8b26-9358d81ad364",
      "userId": "87104d67-273c-4c84-8b26-9358d81ad364",
      "adminId": "56ccee4f-65ae-44e0-aa53-fb17412f53e1",
      "email": "demo@gmail.com",
      "name": "demo subadmin 2",
      "permissions": {
        "manageStudents": true,
        "manageNotes": true,
        "manageAnnouncements": true,
        "markAttendance": true,
        "createQuizzes": true,
        "manageCompetitions": true,
        "viewTickets": true,
        "respondTickets": true
      }
    }
  ]
}
```

### Error Responses

**401 Unauthorized** - Missing or invalid token
```json
{
  "success": false,
  "error": "No token provided"
}
```

**403 Forbidden** - User is not an admin
```json
{
  "success": false,
  "error": "Access denied. Insufficient permissions."
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "Error message describing the issue"
}
```

### Example Usage
```bash
curl -X GET http://localhost:5000/api/admin/subadmins \
  -H "Authorization: Bearer your_jwt_token"
```

### cURL Example
```bash
curl -X GET http://localhost:5000/api/admin/subadmins \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 2. POST /subadmins
### Create a new sub-admin with permissions

**Method**: POST
**URL**: `/api/admin/subadmins`
**Authentication**: Required (super admin role)
**Content-Type**: application/json

### Request Body
```json
{
  "email": "newsubadmin@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "permissions": {
    "manageStudents": true,
    "manageNotes": false,
    "manageAnnouncements": true,
    "markAttendance": false,
    "createQuizzes": true,
    "manageCompetitions": false,
    "viewTickets": true,
    "respondTickets": true
  }
}
```

### Response (201 Created)
```json
{
  "success": true,
  "message": "Sub-admin created successfully",
  "user": {
    "id": "new-uuid-here",
    "email": "newsubadmin@example.com",
    "role": "subadmin",
    "adminProfile": {
      "id": "admin-uuid-here",
      "name": "John Doe",
      "permissions": {
        "manageStudents": true,
        "manageNotes": false,
        "manageAnnouncements": true,
        "markAttendance": false,
        "createQuizzes": true,
        "manageCompetitions": false,
        "viewTickets": true,
        "respondTickets": true
      }
    }
  }
}
```

### Error Responses

**400 Bad Request** - Email already exists
```json
{
  "success": false,
  "error": "User with this email already exists"
}
```

**400 Bad Request** - Missing required fields
```json
{
  "success": false,
  "error": "Email, password, and name are required"
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "error": "No token provided"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "Failed to create sub-admin"
}
```

### Example Usage
```bash
curl -X POST http://localhost:5000/api/admin/subadmins \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newsubadmin@example.com",
    "password": "securePassword123",
    "name": "John Doe",
    "permissions": {
      "manageStudents": true,
      "manageNotes": false,
      "manageAnnouncements": true,
      "markAttendance": false,
      "createQuizzes": true,
      "manageCompetitions": false,
      "viewTickets": true,
      "respondTickets": true
    }
  }'
```

---

## 3. PUT /subadmins/:id
### Update sub-admin name and permissions

**Method**: PUT
**URL**: `/api/admin/subadmins/{userId}`
**Authentication**: Required (super admin role)
**Content-Type**: application/json

### Path Parameters
- `id` (required) - User ID (UUID)

### Request Body
```json
{
  "name": "Updated Name",
  "permissions": {
    "manageStudents": true,
    "manageNotes": true,
    "manageAnnouncements": true,
    "markAttendance": true,
    "createQuizzes": true,
    "manageCompetitions": true,
    "viewTickets": true,
    "respondTickets": true
  }
}
```

### Response (200 OK)
```json
{
  "success": true
}
```

### Error Responses

**404 Not Found** - User doesn't exist
```json
{
  "success": false,
  "error": "User not found"
}
```

**400 Bad Request** - User is not a sub-admin
```json
{
  "success": false,
  "error": "User is not a sub-admin"
}
```

**400 Bad Request** - Admin profile doesn't exist
```json
{
  "success": false,
  "error": "Admin profile not found. Please contact support."
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "error": "No token provided"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "Update failed: error description"
}
```

### Backend Verification Steps
1. Verify user exists by ID
2. Verify user role is 'subadmin'
3. Verify admin profile exists for user
4. Update admin profile with new permissions
5. Log successful update with admin ID

### Example Usage
```bash
curl -X PUT http://localhost:5000/api/admin/subadmins/f44ab1be-3874-4f81-af93-c84dc332517a \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Demo Sub-Admin",
    "permissions": {
      "manageStudents": true,
      "manageNotes": true,
      "manageAnnouncements": true,
      "markAttendance": true,
      "createQuizzes": true,
      "manageCompetitions": true,
      "viewTickets": true,
      "respondTickets": true
    }
  }'
```

### Expected Server Logs
```
Update request for user: f44ab1be-3874-4f81-af93-c84dc332517a with permissions: {...}
Successfully updated admin: ed8b07e5-e871-4020-95bf-1d0aed71ce6f
```

---

## 4. DELETE /subadmins/:id
### Delete a sub-admin and their admin profile

**Method**: DELETE
**URL**: `/api/admin/subadmins/{userId}`
**Authentication**: Required (super admin role)
**Body**: None

### Path Parameters
- `id` (required) - User ID (UUID)

### Response (200 OK)
```json
{
  "success": true,
  "message": "Sub-admin deleted successfully"
}
```

### Error Responses

**404 Not Found** - User doesn't exist
```json
{
  "success": false,
  "error": "Sub-admin not found"
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "error": "No token provided"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "Failed to delete sub-admin"
}
```

### Example Usage
```bash
curl -X DELETE http://localhost:5000/api/admin/subadmins/f44ab1be-3874-4f81-af93-c84dc332517a \
  -H "Authorization: Bearer your_jwt_token"
```

### Side Effects
- Deletes User record (cascade)
- Deletes Admin profile record
- Removes all permissions
- User can no longer login

---

## Permission Keys

All 8 permission keys available:

| Key | Display Name | Description |
|-----|--------------|-------------|
| `manageStudents` | Manage Students | Add, edit, delete student accounts |
| `manageNotes` | Manage Notes | Upload and delete course notes |
| `manageAnnouncements` | Manage Announcements | Create, edit, delete announcements |
| `markAttendance` | Mark Attendance | Record student attendance |
| `createQuizzes` | Manage Quizzes | Create, edit, manage quizzes |
| `manageCompetitions` | Manage Competitions | Create, manage competitions |
| `viewTickets` | View Support Tickets | View support tickets |
| `respondTickets` | Respond to Tickets | Reply to support tickets |

---

## Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid data, validation error |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | User role doesn't have permission |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Database or server error |

---

## Rate Limiting
Currently no rate limiting. (Can be added if needed)

## CORS
CORS is enabled for configured origins.

## Versioning
Current API version: v1 (implicit, no version in URL)

---

## Common Usage Patterns

### Get all sub-admins and display
```javascript
// Frontend
const response = await fetch('/api/admin/subadmins', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
const subAdmins = data.subAdmins;
```

### Update sub-admin permissions
```javascript
// Frontend
const response = await fetch(`/api/admin/subadmins/${userId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name, permissions })
});
const result = await response.json();
if (result.success) {
  toast.success('Permissions updated');
}
```

### Check permission
```javascript
// Frontend
const canAccess = hasPermission(userDetails, 'manageStudents');
if (!canAccess) {
  return <AccessDeniedScreen />;
}
```

---

## Debugging Tips

### Enable server logging
Check terminal where `npm run server` is running for:
- `Update request for user: [id]`
- `Successfully updated admin: [id]`
- `Update sub-admin error: [error]`

### Check API response in browser
1. Open DevTools (F12)
2. Go to Network tab
3. Look for `/admin/subadmins` requests
4. Check Response tab for returned data

### Verify JWT token
```javascript
// In browser console
const token = localStorage.getItem('token');
console.log(token);
```

---

## References

- **Frontend API calls**: `src/services/adminService.js`
- **Backend endpoints**: `server/routes/admin.js`
- **Permission checks**: `src/utils/permissions.js`
- **Protected components**: See list in PERMISSION_SYSTEM_COMPLETE.md

---

## Support

For API issues:
1. Check response status code and error message
2. Verify JWT token is valid
3. Check server logs for detailed error
4. Run `check-subadmin-db.mjs` to verify database state
5. Review TESTING_GUIDE.md for troubleshooting
