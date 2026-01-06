# CodingNexus - Learning Management System

A modern, full-stack learning management platform built with **React**, **Express.js**, **PostgreSQL**, and **Prisma ORM**. Designed for educational institutions to manage students, courses, quizzes, attendance, and more.

## 🚀 Tech Stack

### Frontend
- **React 19** with Vite
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide Icons** for UI components
- **React Hot Toast** for notifications

### Backend
- **Express.js** REST API
- **PostgreSQL** database
- **Prisma ORM** for database management
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Cloudinary** for file storage

## 📋 Features

### For Students
- 📝 View and download course notes
- 🧪 Take quizzes with auto-grading
- 📊 View attendance records
- 📢 Receive announcements
- 🎫 Create support tickets
- 👤 Manage profile and photo

### For Admins
- 👥 Student management (CRUD operations)
- 📚 Upload and organize notes
- ✏️ Create and manage quizzes
- ✅ Mark attendance
- 📣 Post announcements
- 🎫 Respond to support tickets
- 👔 Manage sub-admins (Super Admin only)

## 🛠️ Installation

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- Cloudinary account (for file uploads)

### Setup Steps

1. **Clone the repository**
```bash
git clone https://github.com/ashish1git/CodingNexus.git
cd CodingNexus
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# JWT Secret (use a strong random string)
JWT_SECRET="your-secure-jwt-secret-key-here"

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Frontend API URL
VITE_API_URL="http://localhost:5000/api"
```

4. **Initialize the database**
```bash
npx prisma generate
npx prisma db push
```

5. **Create an admin user**
```bash
npm run create-admin
```

6. **Run the application**
```bash
# Run both frontend and backend
npm run dev:all

# Or run separately:
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run dev
```

7. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## 📁 Project Structure

```
CodingNexus/
├── server/                 # Backend Express server
│   ├── index.js           # Main server file
│   ├── config/
│   │   └── db.js          # Prisma client
│   ├── middleware/
│   │   ├── auth.js        # JWT authentication
│   │   └── upload.js      # File upload (Cloudinary)
│   └── routes/
│       ├── auth.js        # Authentication routes
│       ├── admin.js       # Admin routes
│       └── student.js     # Student routes
├── src/                   # Frontend React app
│   ├── components/        # React components
│   │   ├── admin/        # Admin components
│   │   ├── student/      # Student components
│   │   ├── auth/         # Auth components
│   │   ├── shared/       # Shared components
│   │   └── layout/       # Layout components
│   ├── context/          # React context
│   ├── services/         # API service layer
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   └── styles/           # Global styles
├── prisma/               # Database schema
│   └── schema.prisma
├── scripts/              # Utility scripts
└── public/              # Static assets
```

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication:
- Tokens are stored in localStorage
- Tokens expire after 24 hours
- Role-based access control (student, admin, superadmin)

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Admin Routes (Protected)
- `GET /api/admin/students` - Get all students
- `POST /api/admin/notes` - Upload notes
- `POST /api/admin/quizzes` - Create quiz
- `POST /api/admin/attendance` - Mark attendance
- `POST /api/admin/announcements` - Create announcement
- `GET /api/admin/tickets` - Get all tickets

### Student Routes (Protected)
- `GET /api/student/notes` - Get notes
- `GET /api/student/quizzes` - Get quizzes
- `POST /api/student/quizzes/:id/submit` - Submit quiz
- `GET /api/student/attendance` - Get attendance
- `POST /api/student/tickets` - Create ticket

## 🧪 Testing

### Admin Login
1. Use credentials from `npm run create-admin`
2. Navigate to `/admin-login`
3. Access admin dashboard

### Student Signup
1. Navigate to `/signup`
2. Fill in student details
3. Login and access student dashboard

## 📦 Production Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy the 'dist' folder
```

### Backend (Railway/Render/Heroku)
- Set environment variables
- Deploy from main branch
- Ensure PostgreSQL addon is configured

## 🔧 Scripts

- `npm run dev` - Start frontend dev server
- `npm run server` - Start backend server
- `npm run dev:all` - Start both concurrently
- `npm run create-admin` - Create admin user
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🐛 Known Issues & Roadmap

- [ ] Add email notifications
- [ ] Implement WebSocket for real-time updates
- [ ] Add bulk student import (CSV)
- [ ] Add analytics dashboard
- [ ] Mobile responsive improvements
- [ ] Add unit tests

## 📞 Support

For support, email support@codingnexus.com or create an issue in the repository.

## 🙏 Acknowledgments

- Built with React and Express.js
- Database powered by PostgreSQL and Prisma
- File storage by Cloudinary
- UI components inspired by modern design systems

---

**Made with ❤️ for education**

