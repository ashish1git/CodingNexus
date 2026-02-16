# 🚀 Production Deployment Guide

## ✅ Pre-Deployment Checklist

### 1. **Batch System (UNTOUCHED)**
The following systems remain **fully functional** and **unchanged**:
- ✅ Basic Batch student management
- ✅ Advanced Batch student management
- ✅ Batch-specific quiz filtering
- ✅ Batch-based attendance tracking
- ✅ Batch-specific certificate generation
- ✅ Admin batch management for events

**All existing batch-related functionality is 100% preserved.**

---

## 🔧 Environment Variables

### **Backend (.env)**

Create a `.env` file in the **root directory** with:

```env
# ==================== DATABASE ====================
DATABASE_URL="postgresql://username:password@host.database.com/database_name"
# Example for Neon: postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/codingnexus?sslmode=require

# ==================== SERVER ====================
NODE_ENV="production"
PORT=21000

# ==================== AUTHENTICATION ====================
JWT_SECRET="CHANGE_THIS_TO_A_RANDOM_64_CHARACTER_STRING"
# Generate secure secret: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ==================== CORS ====================
FRONTEND_URL="https://your-frontend-domain.vercel.app,https://www.your-domain.com"
# Comma-separated list of allowed frontend origins

# ==================== JUDGE0 (CODE EXECUTION) ====================
JUDGE0_URL="http://64.227.149.20:2358"
# Or your own Judge0 instance

# ==================== ASYNC SUBMISSIONS ====================
# ⚠️ For FREE TIER databases (Render/Neon): Keep ENABLE_POLLING=false
# Use on-demand result fetching instead (frontend calls /fetch-results endpoint)
ENABLE_POLLING=false
POLL_INTERVAL=15000  # Only used if ENABLE_POLLING=true

# ==================== EMAIL (Optional) ====================
# Currently disabled in code due to SMTP auth issues
# If you fix SMTP, uncomment these in server/routes/events.js:
# EMAIL_HOST="smtp.gmail.com"
# EMAIL_PORT=587
# EMAIL_USER="your-email@gmail.com"
# EMAIL_PASS="your-app-password"

# ==================== CLOUDINARY (Optional - for file uploads) ====================
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# ==================== AI EVALUATOR (Optional - for code evaluation) ====================
USE_GEMINI_DIRECT=false
GEMINI_API_KEY="your_gemini_api_key"
OPENROUTER_API_KEY="your_openrouter_api_key"
OPENROUTER_MODEL="google/gemini-2.0-flash-exp:free"
```

---

### **Frontend (.env for Vite)**

Create a `.env` file in the **root directory** with:

```env
# ==================== API ====================
VITE_API_URL="https://your-backend-api.onrender.com/api"
# OR if backend is on same domain: /api
# NO trailing slash!

# ==================== CLOUDINARY ====================
VITE_CLOUDINARY_CLOUD_NAME="your_cloud_name"
VITE_CLOUDINARY_UPLOAD_PRESET="profile_photos"
VITE_CLOUDINARY_NOTES_PRESET="course_notes"
```

---

## 📦 Deployment Steps

### **Backend (Render/Railway/Heroku)**

1. **Connect GitHub Repository**
2. **Set Build Command:** `npm install`
3. **Set Start Command:** `npm run server`
4. **Add Environment Variables** from Backend .env section above
5. **Set Root Directory:** `/` (or where server code is)
6. **Enable Auto-Deploy** from `main` branch

**Important:** 
- Run `npx prisma generate` before deployment (add to build script if needed)
- Run `npx prisma migrate deploy` if schema changed

### **Frontend (Vercel/Netlify)**

1. **Connect GitHub Repository**
2. **Framework Preset:** Vite
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. **Root Directory:** `/` (or where frontend code is)
6. **Add Environment Variables** from Frontend .env section above
7. **Enable Auto-Deploy** from `main` branch

**Vercel Configuration (vercel.json):**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
        { "key": "Access-Control-Allow-Headers", "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" }
      ]
    }
  ]
}
```

---

## 🗄️ Database Migration

### **For Production (First Time):**

```bash
# 1. Set DATABASE_URL environment variable
export DATABASE_URL="postgresql://..."

# 2. Generate Prisma Client
npx prisma generate

# 3. Push schema to production database
npx prisma migrate deploy

# OR if using db push for prototyping:
npx prisma db push
```

### **For Schema Updates:**

```bash
# 1. Create migration locally
npx prisma migrate dev --name your_migration_name

# 2. Commit migration files to Git

# 3. Deploy (automatic on Render/Railway if you add to build command)
npx prisma migrate deploy
```

---

## 🔒 Security Checklist

- [ ] Change `JWT_SECRET` to a random 64+ character string
- [ ] Use strong database password (16+ characters, mixed case, numbers, symbols)
- [ ] Enable SSL for database connection (`?sslmode=require` in DATABASE_URL)
- [ ] Set `NODE_ENV=production` in backend
- [ ] Update `FRONTEND_URL` to actual production domain(s)
- [ ] Enable CORS only for trusted domains
- [ ] DO NOT commit `.env` files to Git (already in .gitignore)
- [ ] Use environment secrets manager (Vercel/Render secrets)

---

## 🧪 Testing Production Deployment

### **Backend Health Check:**
```bash
curl https://your-backend-api.onrender.com/health
# Should return: {"status": "ok"}
```

### **Frontend Access:**
1. Visit `https://your-frontend.vercel.app`
2. Check browser console for errors
3. Test login flow
4. Test event registration
5. Test quiz creation/attempt
6. Test certificate generation

---

## 🐛 Common Issues

### **1. Database Connection Fails**
- Check `DATABASE_URL` format: `postgresql://user:pass@host:5432/dbname?sslmode=require`
- Verify database is accessible from deployment platform IP
- Check connection pool settings in `server/config/db.js`

### **2. CORS Errors**
- Ensure `FRONTEND_URL` in backend .env matches your frontend domain
- Check `Access-Control-Allow-Origin` headers
- Verify API_URL in frontend .env matches backend URL

### **3. Prisma Client Not Found**
- Run `npx prisma generate` in build command
- Add to `package.json` scripts:
  ```json
  "build": "prisma generate && npm run build"
  ```

### **4. Quiz Creation 500 Error**
- Verify Prisma client is regenerated after schema changes
- Check server logs for `TypeError: Cannot read properties of undefined (reading 'create')`
- Restart server after running `prisma generate`

### **5. Certificate PDF oklch Error**
- Fixed via iframe isolation in `EventCertificates.jsx`
- If still occurring, check browser console for Tailwind CSS interference

---

## 📊 Performance Optimization

### **Database (Free Tier):**
- Keep `ENABLE_POLLING=false` to avoid connection exhaustion
- Use on-demand result fetching for submissions
- Connection pool: max=5, min=1 (already configured)

### **Frontend:**
- Enable Vercel Edge Caching
- Compress images via Cloudinary
- Use lazy loading for components

### **Backend:**
- Enable response compression (gzip)
- Cache static assets
- Use CDN for large files

---

## 📝 Post-Deployment

1. **Monitor Logs:**
   - Backend: Render/Railway logs dashboard
   - Frontend: Vercel deployment logs

2. **Set Up Monitoring:**
   - Uptime monitoring (UptimeRobot, Better Uptime)
   - Error tracking (Sentry)
   - Performance monitoring (Vercel Analytics)

3. **Backup Database:**
   - Enable automated backups on database provider
   - Export schema periodically: `npx prisma db pull`

---

## 🎯 Event System Features (NEW)

All event-related features are **production-ready**:
- ✅ Event creation/management (admin)
- ✅ Event registration (external participants)
- ✅ Guest authentication (JWT-based)
- ✅ Event quizzes (create/attempt/results)
- ✅ Certificate generation (with PDF download)
- ✅ Attendance marking
- ✅ Bulk certificate issuance
- ✅ Certificate name customization

**Note:** Email notifications are currently disabled due to SMTP authentication issues. To enable:
1. Configure valid SMTP credentials in backend .env
2. Uncomment `sendCertificateEmail()` calls in `server/routes/events.js` (lines ~733, ~805)

---

## 🔗 Important URLs

- **Production Frontend:** `https://your-domain.vercel.app`
- **Production Backend:** `https://your-api.onrender.com`
- **Database Dashboard:** Your database provider dashboard
- **Judge0 Dashboard:** `http://64.227.149.20:2358` (or your instance)

---

## 🆘 Support

For issues:
1. Check server logs for errors
2. Verify all environment variables are set
3. Test locally with production ENVs first
4. Check database connection status
5. Verify Prisma client is up-to-date

---

**Last Updated:** February 16, 2026
**Version:** 2.0 (with Event System)
