# Certificate Name Correction Guide

## Problem
Students can enter the wrong name when downloading their certificate, and the name gets locked after first download to prevent multiple certificates with different names.

## Admin Solutions

### 1. **Edit Certificate Name Directly** (Recommended)
Admin can fix typos/mistakes without requiring re-download:

**Steps:**
1. Go to Admin Panel → Event Management
2. Click on the event
3. Click the registrations count
4. Find the participant with wrong certificate name
5. In the Certificate column, you'll see:
   - "Issued" badge
   - 📄 **Certificate Name** (the name currently on certificate)
   - **Edit button** (✏️ blue icon)
   - **Reset button** (✕ red icon)
6. Click the **Edit button** (✏️)
7. Enter the corrected name
8. The certificate name is updated immediately
9. Student can re-download with the corrected name

**Use Case:** Minor typos, spelling corrections, name format changes

**Result:** Certificate name updated in database. Next download uses the corrected name.

---

### 2. **Reset Certificate** (Full Reset)
Admin can delete the certificate record entirely, allowing student to download again with a new name:

**Steps:**
1. Follow steps 1-4 above
2. Click the **Reset button** (✕ red icon)
3. Confirm the reset action
4. Certificate record is deleted
5. Student can now go to "My Certificates" and download again
6. Student will see the name input dialog again (not locked anymore)
7. Student can enter the correct name

**Use Case:** Major name changes, student wants to use a completely different name

**Result:** Certificate record deleted. Student must re-download.

---

## How It Works

### Database Structure
```sql
EventCertificate {
  id
  eventId
  participantId
  certificateNumber
  certificateName       -- ← LOCKED after first download
  issueDate
  templateType
  verified
}
```

### Name Locking Mechanism
1. **First Download**: Student enters name → Certificate record created with `certificateName`
2. **Subsequent Downloads**: Uses locked `certificateName` from database (no editing allowed)
3. **Admin Edit**: Updates `certificateName` directly in database
4. **Admin Reset**: Deletes EventCertificate record → Student can re-download

### Issue Date
- Added at bottom right corner of certificate
- Format: "Issued: February 20, 2026"
- Locked when certificate first created
- Shows on all subsequent downloads

---

## API Endpoints

### Edit Certificate Name (Admin)
```http
PATCH /api/events/admin/events/:eventId/certificate/:participantId/name
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "newName": "Corrected Name"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Certificate name updated successfully",
  "certificateName": "Corrected Name"
}
```

**Error Cases:**
- 400: Name is empty
- 404: Certificate not yet downloaded by student
- 500: Database error

---

### Reset Certificate (Admin)
```http
DELETE /api/events/admin/events/:eventId/certificate/:participantId
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Certificate reset successfully. Student can now re-download with corrected name."
}
```

**Effect:**
- Deletes EventCertificate record
- Sets `certificateGenerated = false` in EventRegistration
- Sets `certificateApprovedByAdmin = false`
- Student can download again and enter new name

---

## Student Experience

### First Download
1. Student goes to "My Certificates"
2. Clicks "Download Certificate"
3. Modal appears: "Certificate Name"
4. Pre-filled with registered name
5. **Warning shown**: "You can only set this once - after download, the name will be locked"
6. Student can edit or keep the name
7. Clicks Download
8. Certificate generated and downloaded
9. Name is now locked in database

### After First Download
1. Student clicks "Download Certificate" again
2. Modal shows: "Certificate already issued - name is locked"
3. Shows the locked name (read-only)
4. Student can only download with that name
5. Cannot change name themselves

### After Admin Edit
- Student sees updated name on next download
- No re-download needed if they already have the PDF

### After Admin Reset
- Student can download again
- Name input dialog appears again (not locked)
- Can enter corrected name

---

## Production Deployment

### Database Migration (Already Applied Locally)
```sql
ALTER TABLE "EventCertificate" 
ADD COLUMN IF NOT EXISTS "certificateName" TEXT;
```

### Files Changed
- `prisma/schema.prisma` - Added certificateName field
- `server/routes/events.js` - Added PATCH endpoint, enhanced registrations response
- `server/utils/certificateGenerator.js` - Added issue date rendering
- `src/components/admin/EventManagement.jsx` - Added Edit/Reset buttons and UI
- `src/components/events/EventCertificates.jsx` - Added name locking UI

### Testing Checklist
- [ ] Student downloads certificate with custom name
- [ ] Name is locked on second download attempt
- [ ] Admin can see certificate name in registrations
- [ ] Admin can edit certificate name
- [ ] Admin can reset certificate
- [ ] Student can re-download after reset
- [ ] Issue date appears on certificate (bottom right)
- [ ] Bulk certificates include certificateName

---

## Troubleshooting

### "Certificate not found" when editing name
**Cause**: Student hasn't downloaded certificate yet
**Solution**: Ask student to download first, or use "Issue Certificate" button to create record

### Student can't change name
**Cause**: Certificate already issued (name locked)
**Solution**: Use Admin Edit or Admin Reset features

### Certificate shows old name after edit
**Cause**: Student has old PDF file saved
**Solution**: Ask student to re-download from dashboard

### Issue date not showing
**Cause**: Older certificates created before this feature
**Solution**: Use Admin Reset + student re-download to get issue date

---

## Best Practices

1. **For Minor Typos**: Use Admin Edit (faster, no re-download needed)
2. **For Major Changes**: Use Admin Reset (student gets fresh dialog)
3. **Verify Name Before Approving**: Check certificate name before bulk issuing
4. **Communicate with Students**: Inform them about one-time name locking
5. **Preview Before Issuing**: Use Preview button to check certificate appearance

---

## Common Scenarios

### Scenario 1: Student misspelled their name
```
Problem: Certificate says "Jhon Doe" instead of "John Doe"
Solution: Admin → Edit Name → "John Doe" → Save
Result: Next download uses corrected name
```

### Scenario 2: Student wants to use nickname
```
Problem: Certificate has full name "Jonathan Michael Smith"
Want: "Jon Smith"
Solution: Admin → Reset Certificate → Student re-downloads with "Jon Smith"
Result: Fresh certificate with preferred name
```

### Scenario 3: Student didn't notice auto-fill was wrong
```
Problem: Downloaded with database name "RAHUL KUMAR" (all caps)
Want: "Rahul Kumar" (proper case)
Solution: Admin → Edit Name → "Rahul Kumar" → Save
Result: Updated in database, ready for next download
```

---

## Summary

✅ **One-time name locking** prevents multiple certificates with different names  
✅ **Admin can edit** certificate names to fix mistakes  
✅ **Admin can reset** to allow complete re-download  
✅ **Issue date** automatically added to all certificates  
✅ **Student feedback** clear about name locking rules  
✅ **Database integrity** maintained with certificateName field  

*Last Updated: February 20, 2026*
