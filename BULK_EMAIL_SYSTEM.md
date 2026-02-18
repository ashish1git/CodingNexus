# 📧 Bulk Email System Documentation

## 🎯 Quick Summary

**Purpose:** Send targeted emails to event participants and students  
**Primary Use:** Event communication (reminders, updates, follow-ups)  
**Access:** Admin Panel → Bulk Email section  
**Key Feature:** Search & select specific recipients from event registrations  

---

## Overview
The Bulk Email System is designed primarily for **event-based communications**, allowing administrators to send custom emails to event participants with advanced filtering, search, and selection capabilities.

---

## 🌟 What Makes This System Special?

### For Event Managers:
✅ **See all registered participants** for any event  
✅ **Search by name, email, or phone** to find specific people  
✅ **Select/deselect individuals** with checkboxes  
✅ **View event details** (status, date, venue) while composing  
✅ **Track sending statistics** in real-time  

### Visual Features:
- 🟢 **Status Badges**: Upcoming, Ongoing, Completed events
- 🔍 **Live Search**: Instant filtering as you type
- ✅ **Visual Selection**: Color-coded selected recipients
- 📊 **Quick Stats**: Total, Selected, Will Send counts
- 📱 **Full Details**: Name, email, phone, registration date

---

## ✨ Key Features

### 1. **Event-Centric Design** (Primary Use Case)
- **Select Any Event**: Ongoing, upcoming, or completed events
- **View Event Details**: Status badges, dates, venue, registration count
- **Auto-load Participants**: All registered attendees with their details
- **Event Context**: Emails automatically reference the event

### 2. **Advanced Recipient Management**
- **Smart Search**: Find recipients by name, email, or phone number
- **Individual Selection**: Tick/untick specific recipients
- **Batch Operations**: Select all or deselect all with one click
- **Visual Indicators**: Color-coded selected recipients
- **Detailed Info**: See phone numbers, batch, registration dates

### 3. **Multiple Filter Options**
- **By Event** (Recommended): Target specific event participants
- **By Batch**: Filter students by batch (Basic, Python, Web, etc.)
- **All Students**: System-wide announcements to active students

### 4. **Professional Email Templates**
- Automatic HTML formatting with Coding Nexus branding
- Personalized greetings with recipient names
- Mobile-responsive design
- Custom HTML support for advanced users
- Event-specific auto-suggestions

### 5. **Real-time Features**
- ✅ Live recipient count
- ✅ Search with instant results
- ✅ Selection statistics
- ✅ Success/failure tracking
- ✅ Delivery reports
- ✅ Error handling

---

## 🚀 Quick Start Guide

### Method 1: Admin Panel (Recommended for Events)

#### Scenario: Send Event Reminder to Registered Participants

1. **Login to Admin Portal**
   - Navigate to `http://localhost:22000/admin-login`
   - Use your admin credentials

2. **Access Bulk Email Manager**
   - Click "Bulk Email" in the sidebar menu
   - Or navigate to `/admin/bulk-email`

3. **Select Event**
   - Filter shows "By Event Registration" by default
   - Browse through events list showing:
     - Event title and date
     - Status badge (Upcoming/Ongoing/Completed)
     - Venue and type
     - Number of registrations
   - Click on your target event (e.g., "Python Workshop 2026")

4. **Load Participants**
   - Click "Load Recipients" button
   - View event info banner at top
   - See all registered participants with:
     - Full name
     - Email address
     - Phone number
     - Registration date
     - Batch info

5. **Search & Select Recipients** (Optional)
   - Use search bar to find specific participants:
     - Type name: "John"
     - Type email: "student@"
     - Type phone: "9876"
   - Tick/untick individual recipients
   - Use "Select All" to select everyone
   - View selection count in real-time

6. **Compose Email**
   - Subject auto-populates with event name
   - Write your message:
     ```
     The Python Workshop is tomorrow!
     
     Venue: Computer Lab B
     Time: 10:00 AM - 1:00 PM
     
     Please bring your laptop.
     Looking forward to seeing you!
     ```
   - Or enable "Use Custom HTML" for rich formatting

7. **Send Email**
   - Review: Shows "Send Email (25)" if 25 selected
   - Click "Send Email"
   - Confirm the action
   - Watch real-time sending progress
   - View results summary:
     - Total sent
     - Failed emails (if any)
     - Success rate

### Method 2: Command-Line Script

1. **Run the Script**
   ```bash
   node send-bulk-email-to-students.mjs
   ```

2. **Follow Interactive Prompts**
   - Choose whether to filter by batch
   - Enter subject
   - Write message (press Enter twice to finish)
   - Confirm before sending

3. **Monitor Progress**
   - Watch real-time sending status
   - View final statistics

---

## 🎨 User Interface Guide

### Main Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  📧 Bulk Email System                                       │
│  Send custom emails to students                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────┐  ┌──────────────────────────────────┐
│  FILTER PANEL       │  │  EMAIL COMPOSER                  │
│                     │  │                                  │
│  Filter By:         │  │  Subject: ___________________    │
│  [📅 Event]         │  │                                  │
│                     │  │  Message:                        │
│  Select Event:      │  │  ┌────────────────────────────┐ │
│  ┌───────────────┐  │  │  │                            │ │
│  │ Python Work.. │  │  │  │  Type your message...      │ │
│  │ 📅 Feb 20     │  │  │  │                            │ │
│  │ 🟢 Upcoming   │  │  │  └────────────────────────────┘ │
│  │ 45 registered │  │  │                                  │
│  └───────────────┘  │  │  [✓] Use Custom HTML            │
│                     │  │                                  │
│  [Load Recipients]  │  │  [Send Email (25)]              │
│                     │  │                                  │
│  ─────────────────  │  └──────────────────────────────────┘
│                     │
│  RECIPIENTS (25/45) │  ┌──────────────────────────────────┐
│                     │  │  📊 SEND RESULTS                 │
│  [🔍 Search...]     │  │                                  │
│                     │  │  Total: 25  Sent: 24  Failed: 1  │
│  [✓] Select All     │  │  Success Rate: 96%               │
│                     │  └──────────────────────────────────┘
│  ┌───────────────┐  │
│  │☑ John Doe     │  │
│  │  john@a.com   │  │
│  │  📱 98765...  │  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │☑ Jane Smith   │  │
│  │  jane@a.com   │  │
│  └───────────────┘  │
└─────────────────────┘
```

### Key UI Elements Explained

#### 1. **Event Selection Panel**
Shows clickable event cards with:
- Event title and date
- Status badge (color-coded)
- Venue location
- Registration count
- Click to select event

#### 2. **Search Bar**
- Real-time filtering
- Searches: name, email, phone
- Shows "X of Y recipients" count
- Clear button (X) to reset

#### 3. **Recipients List**
Each recipient card shows:
- ☑ Checkbox (click to toggle)
- 👤 Full name
- ✉️ Email address
- 📱 Phone number
- 🎓 Batch info
- 📅 Registration date

Selected recipients have:
- Purple background
- Purple border
- ✓ Check icon next to name

#### 4. **Quick Stats Footer**
Three boxes showing:
- **Total**: All loaded recipients
- **Selected**: Currently ticked
- **Will Send**: Final count

### Color Coding

| Color | Meaning |
|-------|---------|
| 🟢 Green | Ongoing events |
| 🔵 Blue | Upcoming events |
| ⚪ Gray | Completed events |
| 🟣 Purple | Selected items |

---

### 1. Get Recipients Preview
**Endpoint:** `POST /api/admin/email/recipients`

**Request Body:**
```json
{
  "filterType": "batch",  // "all", "batch", or "event"
  "filterValue": "Python" // batch name or event ID
}
```

**Response:**
```json
{
  "success": true,
  "recipients": [
    {
      "id": "user-id-1",
      "email": "student1@example.com",
      "name": "Student Name",
      "batch": "Python"
    }
  ],
  "count": 25
}
```

### 2. Send Bulk Email
**Endpoint:** `POST /api/admin/email/send-bulk`

**Request Body:**
```json
{
  "subject": "Important Announcement",
  "message": "Your message here",
  "htmlContent": "<optional custom html>",
  "filterType": "batch",
  "filterValue": "Python",
  "recipientIds": ["id1", "id2"] // optional, overrides filters
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk email operation completed",
  "stats": {
    "tReal-World Usage Examples

### Example 1: Event Reminder (Most Common)

**Scenario:** Workshop tomorrow, send reminder to 50 registered participants

**Steps:**
1. Select event: "Python Basics Workshop"
2. Filter shows all 50 registrations
3. Search for "no phone" to find participants missing contact info
4. Deselect those 3 participants (will contact separately)
5. Subject: "Tomorrow: Python Workshop @ 10 AM"
6. Message:
   ```
   Excited to see you tomorrow at the Python Workshop!
   
   📅 Date: February 20, 2026
   🕐 Time: 10:00 AM - 1:00 PM
   📍 Venue: Computer Lab B, 2nd Floor
   
   What to bring:
   ✓ Laptop with Python installed
   ✓ Charger
   ✓ Notebook for notes
   
   Can't wait to start coding with you!
   ```
7. Send to 47 selected recipients

### Example 2: Post-Event Follow-up

**Scenario:** Event completed, send thank you + feedback form

**Steps:**
1. Filter: "By Event Registration"
2. Select event: "Web Dev Bootcamp" (Status: Completed)
3. Load 75 participants who attended
4. Keep all selected
5. Subject: "Thank You & Share Your Feedback!"
6. Message:
   ```
   Thank you for attending the Web Dev Bootcamp!
   
   We hope you enjoyed the session and learned something new.
   
   📝 Please share your feedback: [Form Link]
   
   Your input helps us make our events better.
   
   🎓 Certificate: Will be emailed within 3 days
   
   Stay tuned for more events!
   ```
7. Send to all 75

### Example 3: Selective Communication

**Scenario:** Send additional material to specific participants

**Steps:**
1. Select event: "Data Science Workshop"
2. Load 100 registrations
3. Search: "Advanced" (finds 30 Advanced batch students)
4. Select only those 30
5. Subject: "Advanced Resources - Data Science"
6. Message:
   ```
   As promised, here are advanced resources for the Advanced batch:
   
   📚 Advanced Topics:
   - Machine Learning Algorithms
   - Deep Learning Basics
   - Neural Networks
   
   [Download Link]
   
   These complement what we covered in the workshop.
   ```
7. Send to 30 selected

### Example 4: Urgent Update

**Scenario:** Venue changed for tomorrow's event

**Steps:**
1. Select event: "Hackathon 2026"
2. Load 120 registered participants
3. Keep all selected (urgent for everyone)
4. Subject: "URGENT: Venue Change - Hackathon Tomorrow"
5. Message:
   ```
   IMPORTANT UPDATE
   
   Due to unforeseen circumstances, the venue for tomorrow's 
   Hackathon has been changed.
   
   ❌ OLD: Computer Lab A, 1st Floor
   ✅ NEW: Auditorium, Ground Floor
   
   Time remains the same: 9:00 AM
   
   We apologize for the inconvenience.
   See you tomorrow!
   ```
6. Send immediately to all 120

### Example 5: Batch-Specific Announcement

**Scenario:** New course for Python batch students

**Steps:**
1. Filter: "By Batch"
2. Select: "Python"
3. Load 45 Python batch students
4. Search: "23106" (finds 2025-26 academic year students only)
5. Select those 25 students
6. Subject: "New Advanced Python Course Starting Soon"
7. Send to 25 selecteject: "Reminder: Python Workshop Tomorrow"
4. Message:
   ```
   The Python Workshop is scheduled for tomorrow at 10 AM.
   
   Venue: Computer Lab, 3rd Floor
   Please bring your laptops.
   
   Looking forward to seeing you!
   ```
5. Click "Send Email"

### Example 3: Custom HTML Email

**Admin Panel Method:**
1. Load recipients
2. Subject: "New Course Launched"
3. Enable "Use Custom HTML"
4. HTML Content:
   ```html
   <div style="font-family: Arial; padding: 20px;">
     <h2 style="color: #667eea;">🚀 New Course Alert!</h2>
     <p>We're excited to announce our new <b>Data Science</b> course!</p>
     <ul>
       <li>Duration: 6 weeks</li>
       <li>Start Date: March 1, 2026</li>
       <li>Enrollment: Open Now</li>
     </ul>
     <a href="https://codingnexus.vercel.app/courses" 
        style="background: #667eea; color: white; padding: 10px 20px; 
               text-decoration: none; border-radius: 5px;">
       Enroll Now
     </a>
   </div>
   ```
5. Send

---

## 🔧 Configuration

### Environment Variables
Ensure these are set in your `.env` file:

```env
# Brevo Email Service
BREVO_API_KEY="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"
EMAIL_FROM="ashishapsit@gmail.com"
EMAIL_FROM_NAME="Coding Nexus"
EMAIL_SERVICE="brevo"
```

### Email Service (Brevo)
The system uses Brevo (formerly SendinBlue) for reliable email delivery:
- ✅ High deliverability rate
- ✅ Professional SMTP relay
- ✅ Detailed sending statistics
- ✅ Spam score optimization

---

## 📊 Features Breakdown

### Recipient Filtering

| Filter Type | Description | Use Case |
|------------|-------------|----------|
| **All Students** | Every active student | System-wide announcements |
| **By Batch** | Students in specific batch | Batch-specific content |
| **By Event** | Event registrants | Event reminders, updates |

### Email Personalization

The system automatically personalizes each email:
- **Greeting**: "Hello [Student Name],"
- **Batch-specific**: References student's batch
- **Professional**: Consistent branding

### Rate Limiting

Built-in protection:
- 100ms delay between emails
- Prevents API throttling
- Maintains delivery quality

---

## 🐛 Troubleshooting

### Issue: Email not sending

**Check:**
1. Brevo API key is correct in `.env`
2. Sender email is verified in Brevo account
3. Recipients have valid email addresses
4. Check console for error messages

**Solution:**
```bash
# Test email configuration
node test-brevo-setup.mjs
```

### Issue: Some emails failed

**Reasons:**
- Invalid email format
- Recipient email doesn't exist
- Temporary network issues

**Action:**
- Check the errors array in response
- Retry failed emails manually
- Verify email addresses

### Issue: Slow sending speed

**Cause:** Rate limiting protection

**Normal Behavior:**
- ~10 emails per second
- Prevents spam detection
- Ensures high deliverability

---

## 📈 Best Practices

### 1. **Subject Lines**
- ✅ Keep under 60 characters
- ✅ Be clear and specific
- ✅ Avoid spam trigger words
- ❌ Don't use ALL CAPS
- ❌ Avoid excessive punctuation!!!

### 2. **Message Content**
- ✅ Start with greeting
- ✅ Keep messages concise
- ✅ Include clear call-to-action
- ✅ Proofread before sending
- ❌ Avoid long paragraphs

### 3. **Timing**
- ✅ Send during business hours (9 AM - 6 PM)
- ✅ Avoid weekends for non-urgent emails
- ✅ Consider time zones
- ✅ Test with small group first

### 4. **Testing**
Before sending to all:
1. Send to yourself first
2. Check formatting on mobile
3. Verify all links work
4. Test with 2-3 recipients

---

## 🔒 Security & Privacy

### Data Protection
- ✅ Only active students receive emails
- ✅ Email addresses never exposed in UI
- ✅ Admin authentication required
- ✅ All activities logged

### Permissions
- Only admins and super admins can send bulk emails
- Sub-admins need explicit permission
- Role-based access control enforced

---

## 📝 Sample Templates

### Template 1: Course Announcement
```
Subject: New Python Course - Registration Open

Hello [Name],

We're excited to announce that registration for our Advanced Python course is now open!

Course Details:
- Duration: 8 weeks
- Schedule: Weekends, 10 AM - 1 PM
- Start Date: March 5, 2026
- Seats: Limited to 30 students

Enroll now: https://codingnexus.vercel.app/courses

Best regards,
Coding Nexus Team
```

### Template 2: Event Reminder
```
Subject: Tomorrow: Web Development Workshop

Hello [Name],

This is a quick reminder that the Web Development Workshop is tomorrow!

Event Details:
📅 Date: February 21, 2026
🕐 Time: 2:00 PM IST
📍 Venue: Computer Lab B, 2nd Floor

What to bring:
- Laptop with working browser
- Notepad for notes
- Enthusiasm to learn!

See you tomorrow!

Best regards,
Coding Nexus Team
```

### Template 3: Important Notice
```
Subject: Action Required: Update Your Profile

Hello [Name],

We've noticed that your profile information is incomplete. Please take a moment to update:

Required Information:
✓ Phone Number
✓ Batch Selection
✓ Profile Photo

Update your profile: https://codingnexus.vercel.app/profile

Complete profiles help us serve you better!

Best regards,
Coding Nexus Team
```

---

## 🎯 Feature Roadmap

### Planned Features
- [ ] Email templates library
- [ ] Scheduled email sending
- [ ] Email analytics dashboard
- [ ] A/B testing support
- [ ] Attachment support
- [ ] Unsubscribe management
- [ ] Email preview before sending

---

## 📞 Support

For issues or questions:
1. Check this documentation first
2. Review error messages in console
3. Test with `test-brevo-setup.mjs`
4. Contact system administrator

---

## 📜 License

Part of Coding Nexus Management System
© 2026 Coding Nexus. All rights reserved.

---

**Last Updated:** February 19, 2026  
**Version:** 1.0.0
