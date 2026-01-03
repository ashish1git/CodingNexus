// src/services/storageService.js
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export const storageService = {
  // Upload File
  async uploadFile(file, path) {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return { 
        success: true, 
        url: downloadURL,
        path: snapshot.ref.fullPath 
      };
    } catch (error) {
      console.error('Upload file error:', error);
      return { success: false, error: error.message };
    }
  },

  // Upload Notes
  async uploadNotes(file, course, semester, subject) {
    const fileName = `${Date.now()}_${file.name}`;
    const path = `notes/${course}/${semester}/${subject}/${fileName}`;
    return await this.uploadFile(file, path);
  },

  // Upload Profile Picture
  async uploadProfilePicture(file, userId) {
    const fileName = `${userId}_${Date.now()}.jpg`;
    const path = `profiles/${fileName}`;
    return await this.uploadFile(file, path);
  },

  // Delete File
  async deleteFile(path) {
    try {
      const fileRef = ref(storage, path);
      await deleteObject(fileRef);
      return { success: true };
    } catch (error) {
      console.error('Delete file error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get Download URL
  async getFileURL(path) {
    try {
      const fileRef = ref(storage, path);
      const url = await getDownloadURL(fileRef);
      return { success: true, url };
    } catch (error) {
      console.error('Get file URL error:', error);
      return { success: false, error: error.message };
    }
  }
};