# CodingNexus - PostgreSQL Migration Guide

## ✅ Migration Complete!

Your application has been successfully migrated from Firebase to PostgreSQL + Prisma ORM.

## 📋 What Changed

### Backend (New)
- **Database**: PostgreSQL hosted on Render
- **ORM**: Prisma for type-safe database access
- **Auth**: JWT-based authentication (replacing Firebase Auth)
- **API**: RESTful Express.js server
- **File Storage**: Cloudinary (maintained)

### Database Schema
- `User` - Unified auth table for students and admins
- `Student` - Student profile data
- `Admin` - Admin profile data
- `Note` - Notes/resources
- `Quiz` - Quiz metadata and questions
- `QuizAttempt` - Student quiz submissions
- `Attendance` - Attendance records
- `Announcement` - Announcements
- `SupportTicket` - Support tickets

## 🚀 Setup Instructions

### 1. Environment Variables

Create/update `.env` file in the project root:

```bash
# Database
DATABASE_URL="postgresql://codingnexus_user:nUOTxBglKrnRaktTu5L2AAxjlj650RCD@dpg-d5e0uo24d50c73fibuu0-a.oregon-postgres.render.com/codingnexus"

# JWT Secret (CHANGE THIS!)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV="development"

# CORS
FRONTEND_URL="http://localhost:5173"

# Cloudinary (optional - for file uploads)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

Create `.env.local` for frontend (in project root):

```bash
VITE_API_URL=http://localhost:5000/api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

The database schema is already pushed. If you need to reset or migrate:

```bash
# Push schema to database
npx prisma db push

# Generate Prisma Client
npx prisma generate

# (Optional) Open Prisma Studio to view/edit data
npx prisma studio
```

### 4. Create First Super Admin

You'll need to manually create the first admin user in the database:

```bash
# Open Prisma Studio
npx prisma studio
```

Then manually create a `User` record with:
- `email`: your admin email
- `password`: bcrypt hash (use online tool or create via API)
- `role`: "superadmin"
- `isActive`: true

Then create corresponding `Admin` record linked to the user.

**OR** use this SQL directly in your database:

```sql
-- Replace with your actual email and a bcrypt hash
INSERT INTO "User" (id, email, password, role, "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'admin@codingnexus.com', '$2a$10$YOUR_BCRYPT_HASH_HERE', 'superadmin', true, NOW(), NOW());
```

### 5. Run the Application

**Option A: Run both frontend and backend together**
```bash
npm run dev:all
```

**Option B: Run separately**

Terminal 1 (Backend):
```bash
npm run server
```

Terminal 2 (Frontend):
```bash
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **API Health Check**: http://localhost:5000/api/health

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Student signup
- `POST /api/auth/login` - Student login
- `POST /api/auth/login/admin` - Admin login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/activate/:userId` - Activate student (admin only)

### Admin Routes (require admin token)
- **Students**: `/api/admin/students` (GET, PUT/:id, DELETE/:id)
- **Notes**: `/api/admin/notes` (GET, POST, DELETE/:id)
- **Announcements**: `/api/admin/announcements` (GET, POST, PUT/:id, DELETE/:id)
- **Attendance**: `/api/admin/attendance` (POST, GET/:date)
- **Quizzes**: `/api/admin/quizzes` (GET, POST, PUT/:id, DELETE/:id)
- **Tickets**: `/api/admin/tickets` (GET, PUT/:id)
- **Sub-admins**: `/api/admin/subadmins` (GET, POST, PUT/:id, DELETE/:id)
- **Upload**: `/api/admin/upload` (POST - multipart/form-data)

### Student Routes (require student token)
- **Notes**: `/api/student/notes` (GET)
- **Quizzes**: `/api/student/quizzes` (GET, GET/:id, POST/:id/attempt, GET/:id/attempt)
- **Attendance**: `/api/student/attendance` (GET)
- **Announcements**: `/api/student/announcements` (GET)
- **Tickets**: `/api/student/tickets` (GET, POST)
- **Profile**: `/api/student/profile` (PUT, POST /photo)

## 🔐 Authentication Flow

1. User logs in → receives JWT token
2. Frontend stores token in localStorage
3. All subsequent requests include token in `Authorization: Bearer <token>` header
4. Backend validates token and authorizes access

## 📦 Backup Files

Old Firebase implementations are backed up:
- `src/services/authService.firebase.backup.js`
- `src/services/adminService.firebase.backup.js`
- `src/services/studentService.firebase.backup.js`
- `src/context/AuthContext.firebase.backup.jsx`
- `src/services/firebase.backup.js`

These can be safely deleted once you verify everything works.

## 🛠️ Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL in `.env`
- Check if Render PostgreSQL instance is active
- Run `npx prisma db push` to ensure schema is synced

### Token Issues
- Clear localStorage in browser
- Verify JWT_SECRET is set in backend `.env`
- Check token expiration time

### CORS Issues
- Verify FRONTEND_URL in backend `.env` matches your frontend URL
- Check that frontend is using correct VITE_API_URL

### File Upload Issues
- Ensure Cloudinary credentials are set
- Check file size limits (default 10MB)

## 📝 Next Steps

1. **Security**: Change the JWT_SECRET to a strong random string
2. **Production**: Set up production environment variables
3. **Testing**: Test all features thoroughly
4. **Deployment**: Deploy backend to a hosting service (Render, Railway, etc.)
5. **Firebase Cleanup**: Remove firebase package if no longer needed

## 🎯 Features Preserved

✅ Student signup/login
✅ Admin dashboard
✅ Notes management
✅ Quiz creation and attempts
✅ Attendance tracking
✅ Announcements
✅ Support tickets
✅ Sub-admin management
✅ File uploads (Cloudinary)
✅ Profile management

All functionality from the Firebase version has been maintained!
