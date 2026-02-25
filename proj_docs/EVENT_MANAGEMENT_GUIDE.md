# Event Management System - Implementation Guide

## 🎯 Overview

The Event Management System allows Coding Nexus to host events for external participants (non-batch students) who can register, access event resources during the event, and receive certificates - all without impacting existing batch student data.

## ✨ Features

✅ **Event Creation & Management** - Admins can create events with posters, venue details, and participant limits
✅ **Public Event Registration** - External participants can register with their details
✅ **Email Notifications** - Automatic confirmation emails and certificate delivery
✅ **Time-Based Access Control** - Participants can only login during active events
✅ **Certificate Generation** - Automatic participation certificates
✅ **Attendance Tracking** - Mark attendance for registered participants
✅ **Separate User System** - Event participants are completely isolated from batch students
✅ **No Impact on Existing Features** - All current functionality remains unchanged

## 📋 Implementation Steps

### Step 1: Database Migration

1. Go to your **Neon Dashboard** (https://console.neon.tech/)
2. Select your database
3. Click on **SQL Editor**
4. Copy the contents of `prisma/migrations/event_management_migration.sql`
5. Paste and run the SQL migration
6. Verify all tables were created successfully

You should see these new tables:
- `Event`
- `EventParticipant`
- `EventRegistration`
- `EventCertificate`
- `EventAccessControl`
- `EventEmailLog`
- `EventAnnouncement`

### Step 2: Install Dependencies

Run the following command to install required packages:

```bash
npm install
```

This will install:
- `uuid` - For generating unique identifiers
- `nodemailer` - For sending emails

### Step 3: Configure Email (Optional but Recommended)

To enable email notifications for event registrations and certificates:

1. **Create Gmail App Password:**
   - Go to your Google Account settings
   - Navigate to Security > 2-Step Verification
   - Scroll to "App passwords"
   - Generate a new app password for "Mail"
   - Copy the 16-character password

2. **Update `.env` file:**

```env
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-16-char-app-password"
```

**Note:** If you don't configure email, the system will still work but won't send automated emails. Participants will still be registered successfully.

### Step 4: Update Prisma Client

Generate the Prisma client with the new schema:

```bash
npx prisma generate
```

### Step 5: Start Your Application

```bash
# Start backend server
npm run server

# Start frontend (in another terminal)
npm run dev
```

## 🚀 Usage Guide

### For Admins

#### 1. **Create an Event**

1. Login as Admin
2. Go to **Admin Dashboard**
3. Click on **Events** in the sidebar
4. Click **"Create New Event"**
5. Fill in event details:
   - **Title** (required)
   - **Description**
   - **Event Type** (Workshop, Hackathon, Seminar, etc.)
   - **Event Date & Time** (required)
   - **Event End Date & Time**
   - **Venue**
   - **Upload Poster** (optional - image will be uploaded to Cloudinary)
   - **Max Participants** (required)
   - **Registration Deadline** (required)
   - **Batch** (optional - leave empty for all)
6. Click **"Create Event"**

#### 2. **Manage Event Status**

Events have 4 statuses:
- **Upcoming** - Event is scheduled, registrations open
- **Ongoing** - Event is currently happening (participants can login)
- **Completed** - Event finished
- **Cancelled** - Event was cancelled

To change status:
1. Go to Events page
2. Select new status from dropdown for any event
3. Status updates automatically

> **Important:** Participants can only login when event status is "ongoing"

#### 3. **View Registrations**

1. Go to Events page
2. Click **"View Registrations"** on any event
3. See all registered participants with:
   - Name, Email, Phone
   - Year, Branch, Division, College
   - Registration date
   - Email verification status

#### 4. **Mark Attendance**

1. Go to Event Registrations
2. Click **"Mark Attendance"** for each participant
3. Attendance timestamp is recorded

#### 5. **Generate Certificates**

**For Individual Participant:**
1. Go to Event Registrations
2. Click **"Generate Certificate"**
3. Certificate is created and emailed automatically

**For All Participants (Bulk):**
1. Change event status to "Completed"
2. Click **"Generate Certificates"** button
3. All participants get certificates (with attendance if required)

### For Event Participants

#### 1. **Browse Events**

1. Go to website homepage
2. Click **"Events"** in navigation
3. See all upcoming events with:
   - Event details
   - Available spots
   - Registration deadline

#### 2. **Register for Event**

1. Click on event card
2. Click **"Register Now"**
3. Fill registration form:
   - Full Name
   - Email
   - Phone
   - Year (FE, SE, TE, BE)
   - Branch
   - Division
   - College Name
   - Password (for login)
4. Submit form
5. Check email for confirmation

#### 3. **Login During Event**

1. Click **"Event Login"** on homepage
2. Enter email and password
3. Login is only allowed when event is "ongoing"
4. Access event dashboard

#### 4. **Access Event Resources**

Once logged in during event:
- View event details
- Access materials
- Take quizzes (if enabled for event)
- View announcements
- Download certificate (after generation)

## 🔒 Security & Access Control

### Separation of Concerns

Event participants are completely separate from batch students:
- **Different tables** - `EventParticipant` vs `Student`
- **Different user types** - `event_guest` vs `student`
- **Different authentication** - Separate login endpoints
- **Time-based access** - Can only login during active events
- **No cross-access** - Event participants cannot access batch student features

### Access Rules

| User Type | Can Access | Cannot Access |
|-----------|-----------|---------------|
| Batch Students | All student features, competitions, quizzes for their batch | Event participant dashboard |
| Event Participants | Event dashboard during active events, event-specific resources | Batch student features, competitions not tied to their event |
| Admins | Everything including event management | - |

## 📧 Email Notifications

When configured, the system sends:

1. **Registration Confirmation** - Sent immediately after registration
   - Welcome message
   - Event details
   - Login credentials
   - Email verification link

2. **Event Reminder** - Can be triggered 24 hours before event
   - Reminder about event
   - Date, time, venue

3. **Certificate Email** - Sent when certificate is generated
   - Certificate number
   - Download link
   - Congratulations message

## 🎨 Customization

### Event Types

You can customize event types in the EventManagement component:
```jsx
<option value="workshop">Workshop</option>
<option value="hackathon">Hackathon</option>
<option value="seminar">Seminar</option>
<option value="competition">Competition</option>
<option value="webinar">Webinar</option>
// Add more types as needed
```

### Certificate Templates

Certificate types available:
- **participation** - Standard participation certificate
- **winner** - For competition winners
- **runner_up** - For runners up
- **excellence** - For exceptional performance

## 🐛 Troubleshooting

### Issue: Tables not created

**Solution:** Ensure you ran the SQL migration in Neon SQL Editor exactly as provided.

### Issue: Email not sending

**Possible causes:**
1. EMAIL_USER or EMAIL_PASSWORD not set in .env
2. App password not generated correctly
3. Gmail security blocking

**Solution:** 
- Verify .env configuration
- Check app password is 16 characters
- System will work without emails, just won't send notifications

### Issue: Participants can't login

**Check:**
1. Is event status set to "ongoing"?
2. Has participant verified email? (optional)
3. Is event date/time current?

### Issue: Poster upload failing

**Check:**
1. Cloudinary credentials in .env
2. File size (max 5MB)
3. File type (must be image)

## 📊 Database Schema

```
Event
├── EventParticipant (1:N)
│   └── EventRegistration (N:1)
│       ├── Event
│       └── EventParticipant
├── EventCertificate (1:N)
│   ├── Event
│   └── EventParticipant
├── EventAccessControl (1:N)
├── EventEmailLog (1:N)
└── EventAnnouncement (1:N)
```

## 🚦 Production Checklist

Before deploying to production:

- [ ] Database migration completed successfully
- [ ] Email credentials configured (or plan to add later)
- [ ] Cloudinary configured for poster uploads
- [ ] Test event creation works
- [ ] Test participant registration works
- [ ] Test participant login during ongoing event
- [ ] Test access denied outside event time
- [ ] Test certificate generation
- [ ] Verify no impact on existing batch student features
- [ ] Update FRONTEND_URL in .env for production domain

## 🎯 Future Enhancements

Potential features to add:
- Quiz access control per event
- Event-specific notes/materials upload
- Live leaderboard for competitions
- Participant feedback forms
- Event analytics dashboard
- QR code check-in
- Payment integration for paid events
- WhatsApp notifications

## 🤝 Support

If you encounter any issues:
1. Check the console for error messages
2. Verify database tables exist
3. Check .env configuration
4. Ensure all dependencies installed
5. Verify Prisma client generated

## ✅ Success Indicators

You'll know the system is working when:
- ✅ Events appear on `/events` page
- ✅ Registration form accepts submissions
- ✅ Participants receive confirmation (if email configured)
- ✅ Admin can see registrations
- ✅ Participants can login during ongoing events
- ✅ Participants cannot login outside event time
- ✅ Certificates can be generated
- ✅ Existing batch student features work unchanged

---

**Congratulations!** 🎉 Your Event Management System is ready to use!
