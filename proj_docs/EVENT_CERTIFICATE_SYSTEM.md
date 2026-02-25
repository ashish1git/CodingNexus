# Event Certificate System - Implementation Guide

## Overview
The Event Certificate System is completely **separate** from the Student Certificate System. It uses a beautiful, elegant design with navy and gold colors to display event participation certificates for external participants (non-batch students).

## Architecture

### Database Models (Prisma Schema)

```
EventParticipant → EventCertificate ← Event
                     ↓
              Display in UI with Beautiful Design
```

**Key Models:**
1. **EventParticipant** - External event participants
   - name, email, phone, year, branch, division
   - userType: "event_guest"

2. **Event** - Event details
   - title, description, eventDate, eventEndDate
   - venue, eventType (workshop, hackathon, etc)

3. **EventCertificate** - Individual certificates
   - participantId (FK to EventParticipant)
   - eventId (FK to Event)
   - certificateNumber (unique)
   - templateType: "participation" | "winner" | "runner_up" | "excellence"
   - issueDate, verified

## Frontend Components

### 1. **EventCertificates.jsx** (Main Page)
- **Location:** `src/components/events/EventCertificates.jsx`
- **Functionality:**
  - Fetches all certificates for logged-in participant
  - Displays certificate list/gallery
  - Shows certificate cards with event details
  - Three action buttons:
    - **View Certificate** → Opens beautiful display
    - **Download PDF** → Generates PDF with custom name
    - **View Online** → Opens Cloudinary URL if available

### 2. **EventCertificateDisplay.jsx** (Beautiful Display)
- **Location:** `src/components/events/EventCertificateDisplay.jsx`
- **Functionality:**
  - Displays elegant certificate with:
    - Navy background (#0d1f3c)
    - Gold accents (#c9a84c)
    - Decorative medal with ribbon
    - Wavy top and bottom borders
    - Ornamental corner designs
  - Dynamic content from database:
    - Participant name
    - Event title and date
    - Certificate type (Participation/Winner/Runner-Up/Excellence)
    - Issue date
    - Certificate number
  - Features:
    - Print functionality
    - Download as PDF
    - Responsive design
    - Professional typography

### 3. **EventDashboard.jsx** (Navigation)
- Links to `/event-dashboard/certificates`
- Shows certificate count in stats

## Backend Routes

### API Endpoints

**File:** `server/routes/events.js`

#### Get All Certificates for Participant
```
GET /events/event-guest/certificates
Auth: authenticateEventGuest
Response:
{
  success: true,
  certificates: [
    {
      id: "uuid",
      eventId: "uuid",
      participantId: "uuid",
      certificateNumber: "CN-EVENT-1739836800000",
      templateType: "participation",
      issueDate: "2026-02-19T...",
      verified: true,
      event: {
        id: "uuid",
        title: "Web Development Workshop",
        eventDate: "2026-02-15T...",
        eventType: "workshop",
        venue: "Lab A",
        description: "..."
      },
      participant: {
        id: "uuid",
        name: "John Doe",
        email: "john@example.com"
      }
    }
  ]
}
```

#### Get Single Certificate
```
GET /events/event-guest/certificates/:certId
Auth: authenticateEventGuest
Response:
{
  success: true,
  certificate: { ... }
}
```

#### Generate Certificate (Admin)
```
POST /events/admin/events/:eventId/certificates/bulk
Auth: authenticate + Admin
Body: { participantIds: [...] }
```

## Service Layer

**File:** `src/services/eventService.js`

```javascript
// Get all certificates for current participant
getCertificates() → calls GET /events/event-guest/certificates

// Get single certificate by ID
getCertificateById(certId) → calls GET /events/event-guest/certificates/:certId
```

## Data Flow

```
1. EventParticipant Registers for Event
   ↓
2. Event Completes
   ↓
3. Admin Generates Certificates (bulk)
   ↓
4. EventCertificate created in DB with:
   - participantId
   - eventId
   - certificateNumber (auto-generated)
   - templateType (set by admin)
   ↓
5. Participant Views Dashboard
   ↓
6. Clicks "My Certificates" tab
   ↓
7. EventCertificates.jsx fetches all certificates
   ↓
8. User can:
   - View beautiful certificate design
   - Download as PDF
   - Print direct from browser
```

## Certificate Templates

### Available Types:
1. **Participation** (default)
   - Text: "For outstanding dedication and participation..."

2. **Winner**
   - Text: "For securing first place and demonstrating exceptional excellence..."

3. **Runner-Up**
   - Text: "For securing second place and demonstrating remarkable excellence..."

4. **Excellence**
   - Text: "For demonstrating outstanding excellence, integrity, and exceptional performance..."

## Design Details

### Colors Used
- **Navy Dark:** #0d1f3c (backgrounds, text)
- **Navy Mid:** #1a3560 (accents)
- **Gold:** #c9a84c (highlights, decorations)
- **Background:** #e8e0d0 (page background)
- **Certificate:** #fafaf5 (certificate background)

### Typography
- **Titles:** Playfair Display (serif, 700 weight)
- **Names:** Dancing Script (cursive)
- **Body:** Cormorant Garamond (serif, elegant)

### Elements
- Decorative wavy borders (top and bottom)
- Corner ornaments with gold details
- Ribbon-medal graphic (top-left)
- Gradient gold accents
- Professional layout with signatures

## Important: Separate from Student Certificates

### Student Certificate System
- **Location:** `src/components/admin/CertificateManager.jsx`
- **Models:** Certificate, CertificateRequest
- **Use:** For batch students to request certificates
- **Data:** Stored in `Certificate` and `CertificateRequest` tables

### Event Certificate System
- **Location:** `src/components/events/EventCertificates.jsx`
- **Models:** EventCertificate, EventParticipant
- **Use:** For event participants to view earned certificates
- **Data:** Stored in `EventCertificate` table
- **Status:** NOT a request system - auto-issued by admin

## Implementation Checklist

- [x] EventCertificateDisplay component created with beautiful design
- [x] EventCertificates updated to show certificate list and selection
- [x] Backend endpoint updated to include participant data
- [x] Colors: Navy (#0d1f3c) and Gold (#c9a84c) applied
- [x] Dynamic content from database (name, event, dates)
- [x] Certificate types supported (participation, winner, runner_up, excellence)
- [x] Print functionality
- [x] PDF download feature
- [x] Separate from existing student certificate system
- [x] Fonts: Playfair Display, Dancing Script, Cormorant Garamond

## Usage Example

```javascript
// Frontend - Viewing certificates
import EventCertificates from './EventCertificates.jsx';

// Route in App.jsx
<Route path="/event-dashboard/certificates" element={<EventCertificates />} />

// Clicking "View Certificate" shows:
import EventCertificateDisplay from './EventCertificateDisplay.jsx';

<EventCertificateDisplay certificate={selectedCert} />
```

## Notes

1. **Names from Database:** Automatically pulled from `EventParticipant.name`
2. **Events from Database:** Automatically pulled from `Event` table
3. **No Manual Entry:** All data is pre-filled from database
4. **Beautiful Display:** Elegant design suitable for printing and sharing
5. **Print Ready:** Optimized colors and layout for high-quality prints
6. **Responsive:** Works on desktop, tablet, and mobile devices
7. **Verifiable:** Each certificate has unique `certificateNumber`

---

**System Created:** February 19, 2026
**Version:** 1.0
**Status:** Production Ready
