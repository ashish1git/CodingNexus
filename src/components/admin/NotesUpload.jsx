// src/components/admin/NotesUpload.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, Trash2, Download, Search, Filter, ExternalLink, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import { 
  uploadToCloudinary, 
  deleteFromCloudinary, 
  getDownloadUrl, 
  getPreviewUrl,
  getDownloadFileName,
  downloadRawFile,
  validateFile,
  formatFileSize 
} from '../../services/cloudinaryUpload';

import toast from 'react-hot-toast';

const NotesUpload = () => {
  const { userDetails } = useAuth();
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBatch, setFilterBatch] = useState('All');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    batch: 'All',
    file: null
  });

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    filterNotes();
  }, [notes, searchTerm, filterBatch]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const response = await adminService.getAllNotes();
      if (response.success && response.notes) {
        const notesList = response.notes.map(note => ({
          ...note,
          createdAt: new Date(note.createdAt)
        }));
        setNotes(notesList);
      } else {
        toast.error(response.error || 'Failed to load notes');
        setNotes([]);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load notes');
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const filterNotes = () => {
    let filtered = notes ? [...notes] : [];

    if (filterBatch !== 'All') {
      filtered = filtered.filter(n => n.batch === filterBatch || n.batch === 'All');
    }

    if (searchTerm) {
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredNotes(filtered);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validation = validateFile(file);
      
      if (!validation.valid) {
        toast.error(validation.error);
        e.target.value = '';
        return;
      }

      setFormData({ ...formData, file });
      toast.success(`File selected: ${file.name}`);
    }
  };

const handleUpload = async (e) => {
  e.preventDefault();

  if (!formData.file) {
    toast.error('Please select a file');
    return;
  }

  if (!formData.title.trim()) {
    toast.error('Please enter a title');
    return;
  }

  setUploading(true);

  try {
    toast.loading('Uploading to Cloudinary...', { id: 'upload' });

    // Upload file to Cloudinary with custom filename based on title
    const cloudinaryResult = await uploadToCloudinary(
      formData.file, 
      'codingnexus/notes',
      formData.title // Pass title as custom filename
    );
    
    toast.success('File uploaded successfully!', { id: 'upload' });
    toast.loading('Saving to database...', { id: 'save' });

    // Save metadata via adminService
    const noteData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      batch: formData.batch,
      fileUrl: cloudinaryResult.url,
      publicId: cloudinaryResult.publicId,
      fileName: formData.file.name,
      displayName: cloudinaryResult.displayName,
      fileSize: cloudinaryResult.bytes,
      fileFormat: cloudinaryResult.format,
      resourceType: cloudinaryResult.resourceType
    };

    const response = await adminService.uploadNote(noteData);
    
    if (response.success) {
      toast.success('Note saved successfully!', { id: 'save' });
      
      // Reset form
      setFormData({ 
        title: '', 
        description: '', 
        batch: 'All', 
        file: null 
      });
      
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';
      
      // Refresh notes list
      fetchNotes();
    } else {
      toast.error(response.error || 'Failed to save note', { id: 'save' });
    }
    
  } catch (error) {
    console.error('Error uploading:', error);
    toast.error(error.message || 'Upload failed', { id: 'upload' });
    toast.dismiss('save');
  } finally {
    setUploading(false);
  }
};

  const handleDelete = async (note) => {
    if (!window.confirm(`Are you sure you want to delete "${note.title}"?`)) {
      return;
    }

    try {
      toast.loading('Deleting...', { id: 'delete' });

      // Delete from Cloudinary (if configured)
      if (note.publicId) {
        await deleteFromCloudinary(note.publicId, note.resourceType);
      }

      // Delete from database via adminService
      const response = await adminService.deleteNote(note.id);
      
      if (response.success) {
        toast.success('Note deleted successfully!', { id: 'delete' });
        fetchNotes();
      } else {
        toast.error(response.error || 'Failed to delete note', { id: 'delete' });
      }
      
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete note', { id: 'delete' });
    }
  };

  const handleDownload = async (note) => {
  console.log('📥 Download button clicked');
  console.log('File URL:', note.fileUrl);
  
  const downloadFileName = getDownloadFileName(note.title, note.fileFormat);
  
  try {
    toast.loading('Preparing download...', { id: 'download' });
    
    // For Cloudinary files (PDFs uploaded as images)
    if (note.fileUrl.includes('cloudinary.com')) {
      const downloadUrl = getDownloadUrl(note.fileUrl);
      console.log('Download URL:', downloadUrl);
      await downloadRawFile(downloadUrl, downloadFileName);
    } else {
      await downloadRawFile(note.fileUrl, downloadFileName);
    }
    
    toast.success('Download complete!', { id: 'download' });
  } catch (error) {
    console.error('Download error:', error);
    toast.error('Download failed. Please try again.', { id: 'download' });
  }
};

  const handlePreview = (note) => {
    const previewUrl = getPreviewUrl(note.fileUrl);
    window.open(previewUrl, '_blank');
  };

  const getFileIcon = (fileName) => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    
    const iconConfig = {
      pdf: { bg: 'bg-red-100', text: 'text-red-600', label: 'PDF' },
      doc: { bg: 'bg-blue-100', text: 'text-blue-600', label: 'DOC' },
      docx: { bg: 'bg-blue-100', text: 'text-blue-600', label: 'DOC' },
      ppt: { bg: 'bg-orange-100', text: 'text-orange-600', label: 'PPT' },
      pptx: { bg: 'bg-orange-100', text: 'text-orange-600', label: 'PPT' },
      xls: { bg: 'bg-green-100', text: 'text-green-600', label: 'XLS' },
      xlsx: { bg: 'bg-green-100', text: 'text-green-600', label: 'XLS' },
      txt: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'TXT' },
      csv: { bg: 'bg-teal-100', text: 'text-teal-600', label: 'CSV' }
    };
    
    const config = iconConfig[extension] || { bg: 'bg-indigo-100', text: 'text-indigo-600', label: 'FILE' };
    
    return (
      <div className={`w-12 h-12 ${config.bg} rounded-lg flex items-center justify-center`}>
        <span className={`${config.text} font-bold text-xs`}>{config.label}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Notes Management</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Upload New Notes</h2>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Python Basics Notes"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Brief description..."
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Batch *
                  </label>
                  <select
                    value={formData.batch}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="All">All Batches</option>
                    <option value="Basic">Basic Batch</option>
                    <option value="Advanced">Advanced Batch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File (PDF, DOC, PPT, XLS, TXT, CSV , PNG ,JPG ) *
                  </label>
                  <input
                   id="file-input"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.gif"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      required
                          />
                  {formData.file && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-800">
                        📄 {formData.file.name}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Size: {formatFileSize(formData.file.size)}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {uploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload Notes
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 text-sm mb-2">
                  📝 Upload Guidelines
                </h3>
                <ul className="text-xs text-blue-700 space-y-1.5">
                  <li>• Max file size: 25MB</li>
                  <li>• Supported: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, CSV</li>
                  <li>• Files stored securely in Cloudinary</li>
                  <li>• Fast CDN delivery worldwide</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Notes List */}
          <div className="lg:col-span-2">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={filterBatch}
                    onChange={(e) => setFilterBatch(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="All">All Batches</option>
                    <option value="Basic">Basic</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notes Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600">Loading notes...</p>
              </div>
            ) : filteredNotes.length > 0 ? (
              <div className="space-y-4">
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition hover:border-indigo-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {getFileIcon(note.fileName)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                              {note.title}
                            </h3>
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                note.batch === 'All' 
                                  ? 'bg-gray-100 text-gray-700'
                                  : note.batch === 'Basic'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-purple-100 text-purple-700'
                              }`}>
                                {note.batch}
                              </span>
                              <span className="text-xs text-gray-500">
                                {note.fileFormat?.toUpperCase()} • {formatFileSize(note.fileSize)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {note.description && (
                          <p className="text-sm text-gray-600 mb-4">{note.description}</p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-4">
                          <span>📎 {note.fileName}</span>
                          <span>👤 {note.uploadedByName || note.uploadedBy || 'Unknown'}</span>
                          <span>📅 {note.createdAt?.toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleDownload(note)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition text-sm font-medium shadow-sm"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                          
                          <button
                            onClick={() => handlePreview(note)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm font-medium border border-blue-200"
                          >
                            <Eye className="w-4 h-4" />
                            Preview
                          </button>
                          
                          {userDetails?.role === 'superadmin' && (
                            <button
                              onClick={() => handleDelete(note)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-sm font-medium border border-red-200"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                  <FileText className="w-10 h-10 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Notes Found</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  {searchTerm 
                    ? 'No notes match your search criteria.'
                    : 'Upload your first note to get started!'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesUpload;