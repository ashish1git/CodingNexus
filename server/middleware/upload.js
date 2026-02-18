import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Use memory storage for multer (we'll upload to Cloudinary manually)
const storage = multer.memoryStorage();

export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB limit
  }
});

// Helper function to upload buffer to Cloudinary
export const uploadToCloudinary = (buffer, folder = 'codingnexus') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

export default upload;

