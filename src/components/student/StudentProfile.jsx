import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Camera, User, Mail, Phone, Hash, Award, Calendar, X, Check, Loader, ZoomIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/studentService';
import toast from 'react-hot-toast';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';

const StudentProfile = () => {
  const { userDetails, currentUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [photoURL, setPhotoURL] = useState(userDetails?.photoURL || null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = import.meta.env. VITE_CLOUDINARY_UPLOAD_PRESET;

  const validateFile = (file) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedMimes.includes(file. type)) {
      toast.error('Only JPG, PNG, GIF, WebP allowed');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return false;
    }
    return true;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (! file || !validateFile(file)) return;

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImageSrc(reader.result);
      setShowCropModal(true);
    });
    reader.readAsDataURL(file);
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (err) => reject(err));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async () => {
    try {
      const image = await createImage(imageSrc);
      const canvas = canvasRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = 400;
      canvas.height = 400;

      const ctx = canvas.getContext('2d');

      ctx.drawImage(
        image,
        croppedAreaPixels.x * scaleX,
        croppedAreaPixels.y * scaleY,
        croppedAreaPixels.width * scaleX,
        croppedAreaPixels.height * scaleY,
        0,
        0,
        400,
        400
      );

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.95);
      });
    } catch (error) {
      console.error('Error cropping image:', error);
      toast.error('Failed to crop image');
      return null;
    }
  };

  const uploadPhoto = async (blob) => {
    if (!blob) return;

    setUploading(true);
    try {
      toast.loading('Uploading profile photo... ', { id: 'upload' });

      const formData = new FormData();
      formData.append('file', blob, 'profile. jpg');
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', 'codingnexus/profiles');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body:  formData }
      );

      if (! response.ok) throw new Error('Upload failed');

      const data = await response.json();
      const newPhotoUrl = data.secure_url;

      // Update profile photo using studentService
      await studentService.updateProfile({
        photoURL: newPhotoUrl
      });

      setPhotoURL(newPhotoUrl);
      setShowCropModal(false);
      setImageSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);

      toast.success('Profile photo updated successfully!', { id: 'upload' });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message}`, { id: 'upload' });
    } finally {
      setUploading(false);
    }
  };

  const handleUploadClick = async () => {
    if (!croppedAreaPixels) {
      toast.error('Please crop the image first');
      return;
    }
    const blob = await getCroppedImg();
    if (blob) {
      await uploadPhoto(blob);
    }
  };

  const attendance = userDetails?.attendance ??  0;
  const userFirstName = userDetails?.name?.split(' ')[0] || 'User';
  const joinedDate = new Date(userDetails?.createdAt?. toDate?. () || userDetails?.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800 shadow-lg border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4">
          <Link
            to="/student/dashboard"
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg: px-8 py-4 sm:py-8">
        {/* Profile Card */}
        <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
          {/* Header Background */}
          <div className="h-24 sm:h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600"></div>

          {/* Profile Content */}
          <div className="px-4 sm:px-8 pb-6 sm:pb-8">
            {/* Profile Photo Section */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-12 sm:-mt-16 mb-6 gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-slate-700 p-2 shadow-2xl ring-4 ring-slate-800 overflow-hidden">
                  {photoURL ?  (
                    <img
                      src={photoURL}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold">
                      {userDetails?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <label
                  htmlFor="photo-upload"
                  className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 sm:p-2. 5 rounded-full cursor-pointer hover:bg-indigo-700 hover:scale-110 transition-all shadow-lg border-2 border-slate-800"
                  title="Upload photo"
                >
                  {uploading ? (
                    <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                  <input
                    ref={fileInputRef}
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>

              {/* User Info */}
              <div className="text-center sm:text-left flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">{userDetails?.name || 'Student'}</h1>
                <p className="text-sm sm:text-base text-slate-400 mt-1">{userDetails?.batch || 'Basic'} Batch Student</p>
                <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                  <span className="px-3 py-1 bg-indigo-900/50 text-indigo-300 rounded-full text-xs sm:text-sm font-medium border border-indigo-700/50">
                    Student
                  </span>
                  <span className="px-3 py-1 bg-emerald-900/50 text-emerald-300 rounded-full text-xs sm:text-sm font-medium border border-emerald-700/50">
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 mt-6 sm:mt-8">
              <InfoCard icon={<Hash className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />} label="Moodle ID" value={userDetails?.moodleId || 'N/A'} />
              <InfoCard icon={<User className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />} label="Roll Number" value={userDetails?.rollNo || 'N/A'} />
              <InfoCard icon={<Phone className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />} label="Mobile Number" value={userDetails?.mobile || 'N/A'} />
              <InfoCard icon={<Mail className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />} label="Email" value={`${userDetails?.moodleId || 'student'}@apsit.edu. in`} />
              <InfoCard icon={<Award className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />} label="Batch" value={userDetails?.batch || 'N/A'} />
              <InfoCard icon={<Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />} label="Registered On" value={joinedDate} />
            </div>

            {/* Stats Section */}
            <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-lg border border-slate-600/50">
              <h2 className="text-base sm:text-lg font-bold text-white mb-4">Your Progress</h2>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="text-center p-3 sm:p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                  <p className="text-2xl sm: text-3xl font-bold text-indigo-400">{attendance}%</p>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">Attendance</p>
                </div>
                <div className="text-center p-3 sm: p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                  <p className="text-2xl sm:text-3xl font-bold text-purple-400">0</p>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">Quizzes</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                  <p className="text-2xl sm:text-3xl font-bold text-pink-400">0</p>
                  <p className="text-xs sm: text-sm text-slate-400 mt-1">Avg. Score</p>
                </div>
              </div>
            </div>

            {/* Help Text */}
            <div className="mt-6 p-3 sm:p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-300">
                <strong>Note: </strong> To update your personal information, contact admin via support section.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CROP MODAL */}
      {showCropModal && imageSrc && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-700 sticky top-0 bg-slate-800 rounded-t-2xl">
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <ZoomIn className="w-4 h-4 sm:w-5 sm: h-5" />
                <span className="hidden sm:inline">Crop Profile Photo</span>
                <span className="sm:hidden">Crop Photo</span>
              </h3>
              <button
                onClick={() => {
                  setShowCropModal(false);
                  setImageSrc(null);
                }}
                className="text-slate-400 hover:text-white transition p-1"
                disabled={uploading}
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Cropper Container */}
            <div className="flex-1 relative bg-slate-900 min-h-[250px] sm:min-h-[400px] flex items-center justify-center overflow-hidden">
              {imageSrc && (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1 / 1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  restrictPosition={false}
                />
              )}
            </div>

            {/* Zoom Slider */}
            <div className="p-4 sm:p-6 border-t border-slate-700 bg-slate-800 space-y-4">
              <div>
                <label className="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2 mb-2">
                  <ZoomIn className="w-4 h-4" />
                  Zoom:  {Math.round(zoom * 100)}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2 sm:pt-4">
                <button
                  onClick={() => {
                    setShowCropModal(false);
                    setImageSrc(null);
                  }}
                  disabled={uploading}
                  className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition font-medium disabled:opacity-50 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadClick}
                  disabled={uploading || !croppedAreaPixels}
                  className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {uploading ? (
                    <>
                      <Loader className="w-4 h-4 sm:w-5 sm: h-5 animate-spin" />
                      <span className="hidden sm:inline">Uploading...</span>
                      <span className="sm:hidden">Upload</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Upload Photo</span>
                      <span className="sm:hidden">Upload</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for cropping */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

// Info Card Component
function InfoCard({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:border-slate-500/50 transition">
      <div className="p-2 rounded-lg flex-shrink-0 border border-slate-600/50">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm text-slate-400 font-medium">{label}</p>
        <p className="text-sm sm:text-base text-white font-semibold mt-1 truncate">{value}</p>
      </div>
    </div>
  );
}

export default StudentProfile;