// src/services/cloudinaryUpload.js
import toast from 'react-hot-toast';

// Get Cloudinary configuration
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

// Validate configuration
export const validateCloudinaryConfig = () => {
  if (!CLOUD_NAME) {
    console.error('❌ Cloudinary Cloud Name is not configured');
    return false;
  }
  
  if (!UPLOAD_PRESET) {
    console.error('❌ Cloudinary Upload Preset is not configured');
    return false;
  }
  
  console.log('✅ Cloudinary Configuration:');
  console.log('  Cloud Name:', CLOUD_NAME);
  console.log('  Upload Preset:', UPLOAD_PRESET);
  
  return true;
};

// Check if Cloudinary is configured
export const isCloudinaryConfigured = () => {
  return !!CLOUD_NAME && !!UPLOAD_PRESET;
};

// Helper to determine if file is a PDF (can use image resource type)
const isPdfFile = (file) => {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  return fileType === 'application/pdf' || fileName.endsWith('.pdf');
};

// Helper to determine if file is a document (non-PDF, non-image)
const isDocumentFile = (file) => {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  
  // Check MIME types (excluding PDF)
  const documentMimeTypes = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];
  
  // Check file extensions (excluding PDF)
  const documentExtensions = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'csv'];
  const extension = fileName.split('.').pop();
  
  return documentMimeTypes.includes(fileType) || documentExtensions.includes(extension);
};

// Main upload function
export const uploadToCloudinary = async (file, folder = 'codingnexus/notes', customFileName = null) => {
  try {
    console.log('=== CLOUDINARY UPLOAD START ===');
    console.log('File:', {
      name: file.name,
      size: file.size,
      type: file.type,
      customFileName: customFileName
    });

    if (!CLOUD_NAME) {
      throw new Error('Cloudinary Cloud Name is not set in environment variables');
    }
    
    if (!UPLOAD_PRESET) {
      throw new Error('Cloudinary Upload Preset is not set in environment variables');
    }

    // CRITICAL: Upload PDFs as "image" resource type so they support transformations
    // Upload other documents as "raw"
    const isPdf = isPdfFile(file);
    const isDoc = isDocumentFile(file);
    
    let uploadEndpoint;
    let resourceType;
    
    if (isPdf) {
      uploadEndpoint = 'image'; // PDFs uploaded as images support fl_attachment
      resourceType = 'image';
    } else if (isDoc) {
      uploadEndpoint = 'raw'; // Other docs as raw
      resourceType = 'raw';
    } else {
      uploadEndpoint = 'auto'; // Images
      resourceType = 'auto';
    }
    
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${uploadEndpoint}/upload`;
    
    console.log(`📤 Upload type: ${uploadEndpoint.toUpperCase()}`);
    console.log(`📍 Endpoint: ${uploadUrl}`);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', folder);
    
    // Use custom filename if provided (for better readability)
    if (customFileName) {
      // Remove file extension and sanitize for Cloudinary public_id
      const sanitized = customFileName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      formData.append('public_id', sanitized);
    }
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    console.log('Response status:', response.status);
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Cloudinary API error:', data);
      throw new Error(data.error?.message || `Upload failed: ${response.status}`);
    }

    console.log('✅ Upload successful:', {
      url: data.secure_url,
      public_id: data.public_id,
      resource_type: data.resource_type,
      format: data.format
    });

    return {
      url: data.secure_url,
      publicId: data.public_id,
      format: data.format || file.name.split('.').pop(),
      bytes: data.bytes,
      resourceType: data.resource_type,
      fileName: file.name,
      displayName: customFileName || file.name // Store display name for UI
    };
    
  } catch (error) {
    console.error('=== CLOUDINARY UPLOAD ERROR ===');
    console.error('Error:', error.message);
    toast.error(`Upload failed: ${error.message}`);
    throw error;
  }
};

// Get proper download URL for Cloudinary files
// NOTE: fileName parameter is NOT used - we let Cloudinary handle the filename
export const getDownloadUrl = (url) => {
  if (!url) return null;
  
  try {
    console.log('🔗 Generating download URL from:', url);
    
    // Check if it's an IMAGE resource type (PDFs uploaded as images)
    if (url.includes('/image/upload/')) {
      const parts = url.split('/upload/');
      if (parts.length === 2) {
        // Add fl_attachment flag ONLY - no custom filename
        const downloadUrl = `${parts[0]}/upload/fl_attachment/${parts[1]}`;
        console.log('✅ Download URL generated:', downloadUrl);
        return downloadUrl;
      }
    }
    
    // For RAW files (DOCX, PPTX, etc.), return direct URL
    // Note: Raw files don't support fl_attachment transformation
    // Browser will try to open them directly - user can use "Save As"
    console.log('⚠️ Using direct URL (raw files - no forced download available)');
    return url;
    
  } catch (error) {
    console.error('❌ Error generating download URL:', error);
    return url;
  }
};

// Alternative download function for raw files using fetch
export const downloadRawFile = async (url, fileName) => {
  try {
    console.log('📥 Downloading raw file via fetch:', fileName);
    
    // Fetch the file
    const response = await fetch(url);
    if (!response.ok) throw new Error('Download failed');
    
    // Get the blob
    const blob = await response.blob();
    
    // Create download link
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName; // Use the display name for download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    window.URL.revokeObjectURL(blobUrl);
    
    console.log('✅ Download complete');
    return true;
    
  } catch (error) {
    console.error('❌ Download error:', error);
    throw error;
  }
};

// Get filename for download (converts title to filename)
export const getDownloadFileName = (title, format) => {
  // Sanitize title for use as filename
  const sanitized = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove multiple hyphens
    .trim();
  
  return `${sanitized}.${format}`;
};

// Get preview URL (for viewing in browser without download)
export const getPreviewUrl = (url) => {
  if (!url) return null;
  
  // Just return the original URL - it will preview in browser
  return url;
};

// Delete from Cloudinary
export const deleteFromCloudinary = async (publicId, resourceType = 'raw') => {
  try {
    console.log('🗑️ Attempting to delete from Cloudinary:', publicId);
    
    // Note: Deletion with unsigned uploads requires server-side implementation
    // or you need to set up a signed deletion endpoint
    
    toast('File removed from database. Cloudinary cleanup requires server-side setup.', {
      icon: '⚠️',
      duration: 4000
    });
    
    return { 
      success: true, 
      message: 'Database entry deleted. Note: Cloudinary file deletion requires server-side API.' 
    };
    
  } catch (error) {
    console.error('❌ Delete error:', error);
    throw error;
  }
};

// Format file size
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// Validate file before upload
export const validateFile = (file) => {
  const maxSize = 25 * 1024 * 1024; // 25MB for Cloudinary free tier
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 25MB'
    };
  }
  
  const allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'csv', 'jpg', 'jpeg', 'png', 'gif'];
  const extension = file.name.split('.').pop().toLowerCase();
  
  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: 'File type not supported'
    };
  }
  
  return { valid: true };
};

// Test if URL is accessible
export const testCloudinaryUrl = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return {
      accessible: response.ok,
      status: response.status
    };
  } catch (error) {
    return {
      accessible: false,
      error: error.message
    };
  }
};