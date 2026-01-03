// src/components/student/ProfilePhotoUpload.jsx
import React, { useState } from 'react';
import { Camera, Upload, X, Check, Loader } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ProfilePhotoUpload = ({ currentPhotoUrl, onPhotoUpdate }) => {
  const { userDetails } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Get Cloudinary config
  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, etc.)');
      return;
    }

    // Validate file size (max 5MB for profile photos)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setShowModal(true);
    };
    reader.readAsDataURL(file);
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'codingnexus/profiles');
    formData.append('transformation', 'c_fill,g_face,h_400,w_400'); // Crop to 400x400, focus on face

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);

    try {
      toast.loading('Uploading profile photo...', { id: 'upload' });

      // Upload to Cloudinary
      const photoUrl = await uploadToCloudinary(selectedFile);

      // Update Firestore
      const userRef = doc(db, 'users', userDetails.uid);
      await updateDoc(userRef, {
        photoURL: photoUrl,
        updatedAt: new Date()
      });

      toast.success('Profile photo updated!', { id: 'upload' });
      
      // Callback to parent component
      if (onPhotoUpdate) {
        onPhotoUpdate(photoUrl);
      }

      // Reset state
      setShowModal(false);
      setPreview(null);
      setSelectedFile(null);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message}`, { id: 'upload' });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setPreview(null);
    setSelectedFile(null);
  };

  return (
    <>
      {/* Profile Photo Display with Upload Button */}
      <div className="relative inline-block">
        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
          {currentPhotoUrl ? (
            <img
              src={currentPhotoUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
              <span className="text-white text-4xl font-bold">
                {userDetails?.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
          )}
        </div>
        
        {/* Upload Button Overlay */}
        <label className="absolute bottom-0 right-0 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition shadow-lg border-2 border-white">
          <Camera className="w-5 h-5 text-white" />
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Update Profile Photo</h3>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-full transition"
                disabled={uploading}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Preview */}
            <div className="mb-6">
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-100">
                {preview && (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>

            {/* File Info */}
            {selectedFile && (
              <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 font-medium">
                  📸 {selectedFile.name}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={uploading}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Upload Photo
                  </>
                )}
              </button>
            </div>

            {/* Tips */}
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700 font-semibold mb-1">💡 Tips:</p>
              <ul className="text-xs text-blue-600 space-y-0.5">
                <li>• Use a clear, front-facing photo</li>
                <li>• Max file size: 5MB</li>
                <li>• Best results with square images</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfilePhotoUpload;