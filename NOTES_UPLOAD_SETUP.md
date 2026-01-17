# Notes Upload Setup - Separate Folder

## Overview
Notes uploads are now separated from profile photos and stored in the `codingnexus_notes` folder in Cloudinary.

## Required Steps

### 1. Create Upload Preset in Cloudinary
1. Go to **Cloudinary Dashboard** → **Settings** → **Upload**
2. Scroll down to **Upload Presets** section
3. Click **Add upload preset**
4. Configure:
   - **Name**: `codingnexus_notes`
   - **Folder**: `codingnexus_notes` (or your desired folder)
   - **Unsigned**: Toggle ON
   - **Save**

### 2. Add Environment Variables

**Local (.env.local):**
```
VITE_CLOUDINARY_CLOUD_NAME=dtxktmolj
VITE_CLOUDINARY_UPLOAD_PRESET=profile_photos
VITE_CLOUDINARY_NOTES_PRESET=codingnexus_notes
```

**Vercel Environment Variables:**
In Vercel Dashboard → Project Settings → Environment Variables, add:
```
VITE_CLOUDINARY_CLOUD_NAME = dtxktmolj
VITE_CLOUDINARY_UPLOAD_PRESET = profile_photos
VITE_CLOUDINARY_NOTES_PRESET = codingnexus_notes
```

### 3. Redeploy
After adding environment variables to Vercel:
1. Go to **Vercel Dashboard** → **Deployments**
2. Click **⋯** on the latest deployment
3. Click **Redeploy**
4. Wait 2-3 minutes for build to complete

### 4. Test
- Upload a profile photo - should go to `profiles` folder
- Upload notes - should go to `codingnexus_notes` folder
- Both should work on deployed site

## Environment Variables Summary

| Variable | Value | Usage |
|----------|-------|-------|
| `VITE_CLOUDINARY_CLOUD_NAME` | `dtxktmolj` | Cloudinary account ID |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | `profile_photos` | Profile photo uploads |
| `VITE_CLOUDINARY_NOTES_PRESET` | `codingnexus_notes` | Notes/documents uploads |

## Code Changes Made

1. **cloudinaryUpload.js**:
   - Added `NOTES_UPLOAD_PRESET` constant
   - Modified `uploadToCloudinary()` to accept `uploadType` parameter
   - Uses appropriate preset based on upload type

2. **NotesUpload.jsx**:
   - Passes `'notes'` as upload type when calling `uploadToCloudinary()`

## Verification

After redeploy, check:
- Profile photos appear in Cloudinary under `profiles` folder
- Notes appear in Cloudinary under `codingnexus_notes` folder
- Both upload properly without errors
