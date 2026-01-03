// src/hooks/useStorage.js
import { useState } from 'react';
import { storageService } from '../services/storageService';

export const useStorage = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadFile = async (file, path) => {
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Simulate progress (Firebase doesn't provide real-time upload progress easily)
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await storageService.uploadFile(file, path);
      
      clearInterval(progressInterval);
      setProgress(100);
      setUploading(false);

      return result;
    } catch (err) {
      setError(err.message);
      setUploading(false);
      setProgress(0);
      return { success: false, error: err.message };
    }
  };

  const uploadNotes = async (file, course, semester, subject) => {
    return await uploadFile(
      file, 
      `notes/${course}/${semester}/${subject}/${Date.now()}_${file.name}`
    );
  };

  const uploadProfilePicture = async (file, userId) => {
    return await uploadFile(
      file, 
      `profiles/${userId}_${Date.now()}.jpg`
    );
  };

  const deleteFile = async (path) => {
    setError(null);
    try {
      return await storageService.deleteFile(path);
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  return {
    uploadFile,
    uploadNotes,
    uploadProfilePicture,
    deleteFile,
    uploading,
    progress,
    error
  };
};