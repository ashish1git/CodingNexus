# 🧪 Complete Testing Guide - Event Management System

## 🚀 Setup & Start

### Step 1: Run Database Migration

1. Open **Neon Dashboard**: https://console.neon.tech/
2. Go to **SQL Editor**
3. Copy the entire content from: `prisma/migrations/event_management_migration.sql`
4. Paste and click **Run**
5. ✅ You should see: "Migration completed successfully!"

### Step 2: Install Dependencies & Generate Prisma

```powershell
npm install
npx prisma generate
```

### Step 3: Start the Application

**Terminal 1 - Backend:**
```powershell
npm run server
```
Wait for: `🚀 Server running on port 21000`

**Terminal 2 - Frontend:**
```powershell
npm run dev
```
Wait for: `Local: http://localhost:22000/`

---

## 📝 Complete Testing Workflow

### Phase 1️⃣: Admin Login & Event Creation

#### 1. Login as Admin

1. Open browser: `http://localhost:22000/`
2. Click **"Admin Login"** (top right)
3. Enter your admin credentials
4. ✅ You should see Admin Dashboard

#### 2. Navigate to Events Management

1. In Admin Dashboard sidebar, click **"Events"** (📅 icon)
2. OR go directly to: `http://localhost:22000/admin/events`
3. ✅ You should see "Event Management" page with "Create New Event" button

#### 3. Create Your First Event

Click **"Create New Event"** and fill in:

**Test Event Details:**
```
Title: Web Development Workshop 2026
Description: Learn MERN Stack development with hands-on projects and real-world examples
Event Type: Workshop
Event Start Date: (Select tomorrow's date and time, e.g., Feb 17, 2026 10:00 AM)
Event End Date: (Select tomorrow's date + 3 hours, e.g., Feb 17, 2026 1:00 PM)
Registration Deadline: (Select today + 12 hours)
Venue: Main Auditorium, A.P. Shah Institute
Max Participants: 50
```

**Upload Poster (Optional):**
- Click "Choose File"
- Select any image (PNG/JPG, max 5MB)
- Wait for "Poster uploaded successfully!" toast
- ✅ Preview will appear below

Click **"Create Event"**

✅ **Expected Results:**
- ✅ Success toast: "Event created successfully!"
- ✅ Modal closes
- ✅ Event appears in the list with poster
- ✅ Status shows "upcoming"
- ✅ Shows "0/50 registered"

---

### Phase 2️⃣: Public Event Registration (Guest Participant)

#### 4. View Public Events Page

1. Open new **Incognito/Private browser window**
2. Go to: `http://localhost:22000/events`
3. ✅ You should see your created event displayed with:
   - Event poster (if uploaded)
   - Title, description
   - Date, venue
   - Available spots
   - "Register Now" button

#### 5. Register as Event Participant

Click **"Register Now"** on your event

**Fill Registration Form:**
```
Full Name: Rahul Sharma
Email: rahul.test@gmail.com (use a real email you can access)
Phone: 9876543210
Year: SE (Second Year)
Branch: Computer Engineering
Division: A
College Name: A.P. Shah Institute of Technology
Password: test123
Confirm Password: test123
```

Click **"Register for Event"**

✅ **Expected Results:**
- ✅ Toast: "Registration successful! Check your email for confirmation."
- ✅ Redirects to `/event-login`
- ✅ Email sent to rahul.test@gmail.com with:
  - Welcome message
  - Event details
  - Login credentials
  - Email verification link

**Check Your Email:**
- Open the email inbox for rahul.test@gmail.com
- Look for email from: codingnexus.apsit.edu.in
- Subject: "Registration Confirmed - Web Development Workshop 2026"
- ✅ Email should have event details and login info

---

### Phase 3️⃣: Test Access Control (Time-Based Login)

#### 6. Try Login BEFORE Event Starts (Should FAIL)

On `/event-login` page:
```
Email: rahul.test@gmail.com
Password: test123
```

Click **"Login to Event"**

✅ **Expected Result:**
- ❌ Error toast: "No active events"
- ❌ Message: "You can only access the portal during registered events that are currently ongoing."
- ✅ This is CORRECT behavior! Participants can only login during "ongoing" events

---

### Phase 4️⃣: Start Event & Enable Access

#### 7. Return to Admin Dashboard

1. Switch back to admin browser window
2. Go to `/admin/events`
3. Find your created event

#### 8. Change Event Status to "Ongoing"

1. In the event card, find the dropdown (currently shows "upcoming")
2. Change to: **"Ongoing"**
3. ✅ Toast: "Event status updated to ongoing"

#### 9. View Registrations

1. Click **"View Registrations"** button
2. ✅ You should see:
   - Rahul Sharma
   - Email: rahul.test@gmail.com
   - Phone, Year, Branch, Division, College
   - Registration date
   - Email verified status

---

### Phase 5️⃣: Event Participant Login & Dashboard

#### 10. Try Login DURING Event (Should SUCCEED)

Switch to incognito window, go to `/event-login`:
```
Email: rahul.test@gmail.com
Password: test123
```

Click **"Login to Event"**

✅ **Expected Results:**
- ✅ Toast: "Login successful!"
- ✅ Redirects to `/event-dashboard`
- ✅ Shows welcome message with participant name
- ✅ Shows active event card with:
  - Event title
  - Status: "ongoing"
  - Event details
  - Event resources buttons

#### 11. Explore Event Dashboard

Check the following features:
- ✅ Event title displays correctly
- ✅ Welcome message shows participant name
- ✅ Active event card shows correctly
- ✅ Resource buttons are visible (Materials, Quizzes, Certificate, Announcements)
- ✅ Stats cards show (Total Events, Certificates, Attendance)

#### 12. Test Logout

1. Click **"Logout"** button (top right)
2. ✅ Redirects to `/event-login`
3. ✅ Cannot access `/event-dashboard` without login

---

### Phase 6️⃣: Attendance & Certificates

#### 13. Mark Attendance (Admin)

Go back to admin window:
1. Navigate to `/admin/events`
2. Click **"View Registrations"**
3. Click **"Mark Attendance"** for Rahul Sharma
4. ✅ Toast: "Attendance marked successfully"
5. ✅ Attendance time recorded

#### 14. Generate Individual Certificate (Admin)

1. In registrations view
2. Click **"Generate Certificate"** for Rahul Sharma
3. ✅ Toast: "Certificate generated successfully"
4. ✅ Certificate number created (e.g., CN-WEB-1739836800000)
5. ✅ Email sent to participant with certificate

**Check Email:**
- New email received
- Subject: "🎓 Your Certificate - Web Development Workshop 2026"
- Contains certificate number
- Download link (if PDF generated)

---

### Phase 7️⃣: Multiple Participants Test

#### 15. Register 2 More Participants

Repeat registration process (Phase 2) with:

**Participant 2:**
```
Name: Priya Patel
Email: priya.test@gmail.com
Phone: 9876543211
Year: TE
Branch: IT
Division: B
College: Mumbai University
Password: test123
```

**Participant 3:**
```
Name: Amit Kumar
Email: amit.test@gmail.com
Phone: 9876543212
Year: BE
Branch: Computer
Division: A
College: VJTI
Password: test123
```

✅ After each registration:
- Check admin dashboard
- Registration count should increase: 1/50 → 2/50 → 3/50

#### 16. Check Admin View

In `/admin/events`:
- ✅ Event card shows "3/50 registered"
- ✅ View Registrations shows all 3 participants
- ✅ All details are correct

---

### Phase 8️⃣: Bulk Certificate Generation

#### 17. Complete Event & Generate All Certificates

Admin dashboard:
1. Change event status to **"Completed"**
2. ✅ Button appears: "Generate Certificates (3)"
3. Click **"Generate Certificates"**
4. ✅ Toast: "Generated 3 certificates"
5. ✅ All participants receive certificate emails

---

### Phase 9️⃣: Test Access After Event Ends

#### 18. Try Login AFTER Event Completed (Should FAIL)

Go to incognito window:
1. Go to `/event-login`
2. Try login with any participant credentials
3. ✅ Should fail with: "No active events"

This confirms time-based access control works!

---

### Phase 🔟: Verify Batch Students Unaffected

#### 19. Test Normal Student Login

Open new browser window:
1. Go to `http://localhost:22000/login`
2. Login with batch student credentials
3. ✅ Dashboard loads normally
4. ✅ All features work (Notes, Quiz, Competitions, etc.)
5. ✅ No event-related interference

---

## 🎯 Advanced Testing

### Test Event Poster Upload

1. Create event without poster → ✅ Shows default icon
2. Create event with poster → ✅ Shows uploaded image
3. Upload large image (>5MB) → ❌ Error: "Image size should be less than 5MB"
4. Upload non-image file → ❌ Error: "Please upload an image file"

### Test Registration Validation

Try registering with:
- Same email twice → ❌ "You have already registered for this event"
- Invalid email format → ❌ Browser validation
- Phone non-numeric → ❌ Browser validation
- Password < 6 chars → ❌ "Password must be at least 6 characters"
- Passwords don't match → ❌ "Passwords do not match"

### Test Event Capacity

1. Set max participants to 3
2. Register 3 participants → ✅ Works
3. Try 4th registration → ❌ "Event is full. No more spots available."

### Test Registration Deadline

1. Create event with past deadline
2. Try to register → ❌ "Registration deadline has passed"

### Test Email Functionality

Check emails contain:
- ✅ Proper formatting (HTML)
- ✅ Event details (title, date, venue)
- ✅ Login credentials
- ✅ Verification link
- ✅ Professional design

---

## 📊 Database Verification

### Check Tables in Neon

Run in SQL Editor:
```sql
-- Check event created
SELECT * FROM "Event" ORDER BY "createdAt" DESC LIMIT 5;

-- Check participants
SELECT * FROM "EventParticipant" ORDER BY "createdAt" DESC LIMIT 5;

-- Check registrations
SELECT * FROM "EventRegistration" ORDER BY "registrationDate" DESC LIMIT 5;

-- Check certificates
SELECT * FROM "EventCertificate" ORDER BY "issueDate" DESC LIMIT 5;

-- Check email logs
SELECT * FROM "EventEmailLog" ORDER BY "sentAt" DESC LIMIT 10;
```

✅ All queries should return data

---

## 🔍 Browser Console Check

### No Errors

Open browser DevTools (F12):
1. Check Console tab → ✅ No errors (warnings OK)
2. Check Network tab → ✅ All API calls return 200/201
3. Check Application tab → ✅ Token and user stored in localStorage

### API Endpoints Working

Check these endpoints return data:
- `GET /api/events/public/events` → ✅ Returns events list
- `POST /api/events/public/events/:id/register` → ✅ Creates registration
- `POST /api/events/event-login` → ✅ Returns token
- `GET /api/events/admin/events` → ✅ Admin events list

---

## ✅ Complete Testing Checklist

### Event Management
- [x] Admin can create events
- [x] Can upload event posters
- [x] Events display on public page
- [x] Can update event status
- [x] Can view registrations
- [x] Can delete events

### Registration & Login
- [x] Participants can register
- [x] Email confirmation sent
- [x] Duplicate registration prevented
- [x] Validation works correctly
- [x] Login blocked before event starts
- [x] Login works during ongoing events
- [x] Login blocked after event ends

### Access Control
- [x] Event participants isolated from batch students
- [x] Time-based access enforced
- [x] Event dashboard accessible only during events
- [x] Batch student features unaffected

### Certificates & Emails
- [x] Individual certificates generated
- [x] Bulk certificates work
- [x] Registration emails sent
- [x] Certificate emails sent
- [x] Email format is professional

### Data Integrity
- [x] Event data stored correctly
- [x] Participant data complete
- [x] Registrations tracked
- [x] No data conflicts with batch students
- [x] All foreign keys working

---

## 🐛 Common Issues & Solutions

### Issue: Email not sending
**Check:**
- Server logs show email attempt
- .env has correct EMAIL_USER and EMAIL_PASSWORD
- Brevo SMTP credentials are valid

**Fix:** Restart server after updating .env

### Issue: Login always fails
**Check:**
- Event status is "ongoing"
- Participant used correct email/password
- Registration was successful

### Issue: Poster not uploading
**Check:**
- File is image type
- File size < 5MB
- Cloudinary credentials in .env

### Issue: Database tables missing
- Run migration SQL in Neon
- Check you're on correct database

---

## 🎉 Success Criteria

**You've successfully implemented the system when:**

✅ Can create events as admin
✅ Events show on public page
✅ Participants can register
✅ Registration emails sent
✅ Login blocked before event starts
✅ Login works during ongoing events
✅ Event dashboard accessible
✅ Certificates generated
✅ Certificate emails sent
✅ Batch students unaffected
✅ No console errors

**Congratulations! Your Event Management System is fully functional!** 🎊

---

## 📱 Quick Test Scenario (5 Minutes)

1. **Admin:** Create event, upload poster (2 min)
2. **Public:** Register as participant (1 min)
3. **Admin:** Set status to "ongoing" (10 sec)
4. **Participant:** Login → access dashboard (1 min)
5. **Admin:** Generate certificate (30 sec)
6. **Check:** Email received with certificate (30 sec)

Done! ✅

---

## 🚀 Ready for Production

After successful testing:
1. Update FRONTEND_URL in .env for production
2. Run migration on production database
3. Test once in production
4. Share event links with real participants!

**Your event management system is production-ready!** 🎯
