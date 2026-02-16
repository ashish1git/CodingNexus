# 🚀 Quick Setup Checklist - Event Management System

## ⚡ Fast Setup (5 Minutes)

### 1️⃣ Database Migration (2 minutes)

```bash
# Option A: Using Neon SQL Editor (Recommended)
1. Open Neon Dashboard → SQL Editor
2. Copy & paste contents from: prisma/migrations/event_management_migration.sql
3. Click Run
4. Verify "Migration completed successfully!" message

# Option B: Using Prisma (Alternative)
npx prisma db push
```

### 2️⃣ Install Dependencies (1 minute)

```bash
npm install
```

This installs:
- ✅ `uuid` - For unique IDs
- ✅ `nodemailer` - For emails

### 3️⃣ Email Configuration (Optional - 1 minute)

**To enable automated emails:**

1. Create Gmail App Password:
   - Google Account → Security → 2-Step Verification → App Passwords
   - Generate password for "Mail"

2. Update `.env`:
   ```env
   EMAIL_USER="your-email@gmail.com"
   EMAIL_PASSWORD="generated-app-password"
   ```

**Skip this step:** System works without emails, just won't send notifications.

### 4️⃣ Generate Prisma Client (30 seconds)

```bash
npx prisma generate
```

### 5️⃣ Start Application (30 seconds)

```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend  
npm run dev
```

---

## ✅ Verification Checklist

After setup, verify these work:

### Public Features
- [ ] Visit `http://localhost:22000/events` - See events page
- [ ] Click on navigation "Events" button - Works
- [ ] Can see "Event Login" button

### Admin Features (Login as admin first)
- [ ] Admin Dashboard shows "Events" menu item
- [ ] Can access `/admin/events`
- [ ] Can create a new event
- [ ] Can upload event poster
- [ ] Can view event registrations

### Event Flow Test
1. [ ] Create test event (as admin)
2. [ ] Register as participant (use different email)
3. [ ] Try to login as participant
   - Should FAIL if event is "upcoming"
4. [ ] Change event status to "ongoing" (as admin)
5. [ ] Try to login as participant again
   - Should SUCCEED
6. [ ] Access event dashboard
7. [ ] Change event to "completed"
8. [ ] Try to login
   - Should FAIL (no active events)

### Data Isolation Test
- [ ] Batch students can still login normally
- [ ] Batch students can access all their features
- [ ] Event participants cannot access batch student features
- [ ] No conflicts between event and batch student data

---

## 🎯 Quick Test Event Creation

Use these test values to create your first event:

```
Title: Web Development Workshop
Description: Learn modern web development with React and Node.js
Event Type: Workshop
Event Date: [Tomorrow's date]
Event End Date: [Tomorrow's date + 3 hours]
Venue: Main Auditorium
Max Participants: 50
Registration Deadline: [Today + 12 hours]
Poster: [Upload any image or skip]
```

---

## 🔧 Troubleshooting

### Issue: Tables not created
**Solution:** Re-run migration SQL in Neon SQL Editor

### Issue: `uuid` import error
**Solution:** 
```bash
npm install uuid
npx prisma generate
```

### Issue: Email not sending
**This is OK!** System works without email. To fix:
1. Check EMAIL_USER and EMAIL_PASSWORD in .env
2. Verify app password is 16 characters
3. Restart server

### Issue: Participant can't login
**Check:**
- Is event status "ongoing"?
- Is participant using correct email/password?
- Did registration succeed?

---

## 📱 Access URLs

| Feature | URL | Who Can Access |
|---------|-----|----------------|
| Events List | `/events` | Everyone |
| Event Registration | `/events/:id/register` | Everyone |
| Event Login | `/event-login` | Event Participants |
| Event Dashboard | `/event-dashboard` | Event Participants (during events) |
| Event Management | `/admin/events` | Admins Only |
| Batch Student Login | `/login` | Batch Students |
| Admin Login | `/admin-login` | Admins |

---

## 🎨 Customization Points

### Event Types
Edit `src/components/admin/EventManagement.jsx` line ~285:
```jsx
<option value="workshop">Workshop</option>
<option value="hackathon">Hackathon</option>
// Add more types here
```

### Certificate Templates
Edit `server/routes/events.js` - `generateCertificate` function

### Email Templates
Edit `server/services/emailService.js`

---

## 📊 What Was Added

### Backend
- ✅ `server/routes/events.js` - Event API routes
- ✅ `server/services/emailService.js` - Email notifications

### Frontend
- ✅ `src/components/events/EventsPage.jsx` - Browse events
- ✅ `src/components/events/EventRegistration.jsx` - Register for event
- ✅ `src/components/events/EventLogin.jsx` - Event participant login
- ✅ `src/components/events/EventDashboard.jsx` - Event participant dashboard
- ✅ `src/components/admin/EventManagement.jsx` - Admin event management

### Database
- ✅ 7 new tables for event management
- ✅ All with proper indexes and foreign keys
- ✅ Completely isolated from batch student data

### Configuration
- ✅ Updated `App.jsx` with event routes
- ✅ Updated `server/index.js` with event API
- ✅ Updated `AdminDashboard.jsx` with Events menu
- ✅ Updated `LandingPage.jsx` with Events button
- ✅ Updated `package.json` with dependencies

---

## 💡 Key Features

### For Admins
1. **Create Events** - With posters, details, limits
2. **Manage Status** - Control access with status changes
3. **View Registrations** - See all participants
4. **Mark Attendance** - Track who attended
5. **Generate Certificates** - Bulk or individual

### For Event Participants
1. **Browse Events** - See all upcoming events
2. **Register Online** - Quick registration form
3. **Email Confirmation** - Automated (if configured)
4. **Login During Event** - Time-based access
5. **Access Resources** - During active events only
6. **Get Certificate** - Automatic generation

---

## 🎯 Success Indicators

✅ **You're good to go when:**
- Events show up on `/events` page
- Can create events as admin
- Can register as participant
- Login works during "ongoing" events
- Login blocked outside event times
- Existing features still work perfectly
- No errors in browser console

---

## 📞 Next Steps

1. ✅ Complete setup checklist above
2. ✅ Create your first test event
3. ✅ Test registration and login flow
4. ✅ Configure email (optional)
5. ✅ Deploy to production
6. ✅ Share event links with participants!

**Documentation:** See `EVENT_MANAGEMENT_GUIDE.md` for detailed guide.

---

## 🚀 Deploy to Production

When ready to deploy:

1. Update `.env` variables:
   ```env
   NODE_ENV="production"
   FRONTEND_URL="https://your-domain.com"
   ```

2. Run build:
   ```bash
   npm run build
   ```

3. Deploy backend and frontend separately

4. Run migration on production database

5. Test all flows in production

---

**Ready to host amazing events! 🎉**
