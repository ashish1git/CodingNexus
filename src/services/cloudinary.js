// src/services/cloudinary.js
import { Cloudinary } from '@cloudinary/url-gen';

// Initialize Cloudinary with your cloud name
const cld = new Cloudinary({
  cloud: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.REACT_APP_CLOUDINARY_CLOUD_NAME
  }
});

export default cld;