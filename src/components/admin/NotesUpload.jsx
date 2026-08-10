// src/components/admin/NotesUpload.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, Trash2, Download, Search, Filter, ExternalLink, Eye, ShieldAlert, BookOpen, GraduationCap, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import { hasPermission, getPermissionDeniedMessage } from '../../utils/permissions';
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

const CLASS_YEARS = ['FE', 'SE', 'TE', 'BE'];
const DIVISIONS = ['A', 'B', 'C'];
const PAGE_SIZE = 12;

const NotesUpload = () => {
  const { userDetails } = useAuth();
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBatch, setFilterBatch] = useState('All');
  const [filterClassYear, setFilterClassYear] = useState('All');
  const [filterDivision, setFilterDivision] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    batch: '',
    classYear: '',
    division: '',
    file: null
  });

  const canManageNotes = hasPermission(userDetails, 'manageNotes');

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    filterNotes();
  }, [notes, searchTerm, filterBatch, filterClassYear, filterDivision]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterBatch, filterClassYear, filterDivision]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const response = await adminService.getAllNotes();
      if (response.success && response.notes) {
        const notesList = response.notes.map(note => ({
          ...note,
          createdAt: note.uploadedAt ? new Date(note.uploadedAt) : (note.createdAt ? new Date(note.createdAt) : null)
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
      filtered = filtered.filter(n => n.batch === filterBatch.toLowerCase() || n.batch === 'all');
    }

    if (filterClassYear !== 'All') {
      filtered = filtered.filter(n => n.classYear === filterClassYear || !n.classYear);
    }

    if (filterDivision !== 'All') {
      filtered = filtered.filter(n => n.division === filterDivision || !n.division);
    }

    if (searchTerm) {
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.description?.toLowerCase().includes(searchTerm.toLowerCase())
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

    if (!canManageNotes) {
      toast.error(getPermissionDeniedMessage('manageNotes'));
      return;
    }

    if (!formData.file) {
      toast.error('Please select a file');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!formData.classYear) {
      toast.error('Please select a class year');
      return;
    }

    setUploading(true);

    try {
      toast.loading('Uploading to Cloudinary...', { id: 'upload' });

      const cloudinaryResult = await uploadToCloudinary(
        formData.file, 
        'codingnexus/notes',
        formData.title,
        'notes'
      );
      
      toast.success('File uploaded successfully!', { id: 'upload' });
      toast.loading('Saving to database...', { id: 'save' });

      const noteData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        batch: formData.batch || 'all',
        classYear: formData.classYear,
        division: formData.division || null,
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
        
        setFormData({ 
          title: '', 
          description: '', 
          batch: '', 
          classYear: '',
          division: '',
          file: null 
        });
        
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
        
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
    if (!canManageNotes) {
      toast.error(getPermissionDeniedMessage('manageNotes'));
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${note.title}"?`)) {
      return;
    }

    try {
      toast.loading('Deleting...', { id: 'delete' });

      if (note.publicId) {
        await deleteFromCloudinary(note.publicId, note.resourceType);
      }

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
    const downloadFileName = getDownloadFileName(note.title, note.fileFormat);
    
    try {
      toast.loading('Preparing download...', { id: 'download' });
      
      if (note.fileUrl.includes('cloudinary.com')) {
        const downloadUrl = getDownloadUrl(note.fileUrl);
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

  // Group notes by classYear for organized display
  const groupOrder = ['FE', 'SE', 'TE', 'BE', 'Common'];

  // Paginate: flatten filteredNotes, paginate, then re-group
  const totalPages = Math.ceil(filteredNotes.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedNotes = filteredNotes.slice(startIndex, startIndex + PAGE_SIZE);

  const groupedNotes = {};
  paginatedNotes.forEach(note => {
    const key = note.classYear || 'Common';
    if (!groupedNotes[key]) groupedNotes[key] = [];
    groupedNotes[key].push(note);
  });

  const sortedGroups = groupOrder.filter(g => groupedNotes[g]);

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
        {!canManageNotes ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldAlert className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Access Denied</h2>
              <p className="text-gray-600 mb-6">
                You don't have permission to manage notes. Contact your administrator to request access.
              </p>
              <Link
                to="/admin/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Upload className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Upload New Notes</h2>
              </div>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                    placeholder="e.g., Data Structures - Unit 1"
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
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                    placeholder="Brief description..."
                  ></textarea>
                </div>

                {/* Class Year - Required */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <GraduationCap className="w-4 h-4 inline mr-1" />
                    Class Year *
                  </label>
                  <select
                    value={formData.classYear}
                    onChange={(e) => setFormData({ ...formData, classYear: e.target.value, division: '' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                    required
                  >
                    <option value="">Select Class Year</option>
                    {CLASS_YEARS.map(cy => (
                      <option key={cy} value={cy}>{cy} - {cy === 'FE' ? 'First Year' : cy === 'SE' ? 'Second Year' : cy === 'TE' ? 'Third Year' : 'Final Year'}</option>
                    ))}
                  </select>
                </div>

                {/* Division - Optional */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Division (optional)
                  </label>
                  <select
                    value={formData.division}
                    onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                    disabled={!formData.classYear}
                  >
                    <option value="">All Divisions</option>
                    {DIVISIONS.map(d => (
                      <option key={d} value={d}>Division {d}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Leave empty for notes common to all divisions</p>
                </div>

                {/* Batch (Training Level) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <BookOpen className="w-4 h-4 inline mr-1" />
                    Training Batch
                  </label>
                  <select
                    value={formData.batch}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  >
                    <option value="">All Batches</option>
                    <option value="basic">Basic Batch</option>
                    <option value="advanced">Advanced Batch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File (PDF, DOC, PPT, XLS, TXT, CSV, PNG, JPG) *
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
                  disabled={uploading || !canManageNotes}
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
                  <li>• Select Class Year, Division, and Batch</li>
                  <li>• Max file size: 25MB</li>
                  <li>• Supported: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, CSV, Images</li>
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
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  <select
                    value={filterClassYear}
                    onChange={(e) => setFilterClassYear(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 text-sm"
                  >
                    <option value="All">All Years</option>
                    {CLASS_YEARS.map(cy => (
                      <option key={cy} value={cy}>{cy}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <select
                    value={filterDivision}
                    onChange={(e) => setFilterDivision(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 text-sm"
                  >
                    <option value="All">All Divisions</option>
                    {DIVISIONS.map(d => (
                      <option key={d} value={d}>Div {d}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  <select
                    value={filterBatch}
                    onChange={(e) => setFilterBatch(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 text-sm"
                  >
                    <option value="All">All Batches</option>
                    <option value="Basic">Basic</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Stats Bar */}
            {!loading && filteredNotes.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span className="font-semibold text-gray-800">{filteredNotes.length} notes</span>
                  {sortedGroups.map(group => (
                    <span key={group} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                      {group === 'Common' ? 'All Years' : group}: {groupedNotes[group].length}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Grid - Grouped by Class Year */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600">Loading notes...</p>
              </div>
            ) : filteredNotes.length > 0 ? (
              <>
              <div className="space-y-8">
                {sortedGroups.map(group => (
                  <div key={group}>
                    {/* Group Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg ${
                        group === 'FE' ? 'bg-green-100 text-green-700' :
                        group === 'SE' ? 'bg-blue-100 text-blue-700' :
                        group === 'TE' ? 'bg-purple-100 text-purple-700' :
                        group === 'BE' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800">
                        {group === 'Common' ? 'Common Notes (All Years)' : `${group} Notes`}
                      </h3>
                      <span className="text-sm text-gray-500">({groupedNotes[group].length})</span>
                    </div>

                    <div className="space-y-3">
                      {groupedNotes[group].map((note) => (
                        <div
                          key={note.id}
                          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition hover:border-indigo-200"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              {getFileIcon(note.fileName)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="text-base font-semibold text-gray-800">
                                    {note.title}
                                  </h4>
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                {/* Class Year Badge */}
                                {note.classYear && (
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    note.classYear === 'FE' ? 'bg-green-100 text-green-700' :
                                    note.classYear === 'SE' ? 'bg-blue-100 text-blue-700' :
                                    note.classYear === 'TE' ? 'bg-purple-100 text-purple-700' :
                                    'bg-orange-100 text-orange-700'
                                  }`}>
                                    {note.classYear}
                                  </span>
                                )}
                                {/* Division Badge */}
                                {note.division && (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-700">
                                    Div {note.division}
                                  </span>
                                )}
                                {/* Batch Badge */}
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  !note.batch || note.batch === 'all'
                                    ? 'bg-gray-100 text-gray-600'
                                    : note.batch === 'basic'
                                    ? 'bg-sky-100 text-sky-700'
                                    : 'bg-violet-100 text-violet-700'
                                }`}>
                                  {!note.batch || note.batch === 'all' ? 'All Batches' : note.batch.charAt(0).toUpperCase() + note.batch.slice(1)}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {note.fileFormat?.toUpperCase()} • {formatFileSize(note.fileSize)}
                                </span>
                              </div>
                              
                              {note.description && (
                                <p className="text-sm text-gray-600 mb-3">{note.description}</p>
                              )}
                              
                              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-3">
                                <span>📎 {note.fileName}</span>
                                <span>👤 {note.uploadedByName || note.uploadedBy || 'Unknown'}</span>
                                <span>📅 {note.createdAt && !isNaN(note.createdAt.getTime()) ? note.createdAt.toLocaleDateString() : 'Unknown'}</span>
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
                                
                                {canManageNotes && (
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
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Showing {startIndex + 1}-{Math.min(startIndex + PAGE_SIZE, filteredNotes.length)} of {filteredNotes.length} notes
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium ${
                            currentPage === pageNum
                              ? 'bg-indigo-600 text-white'
                              : 'border border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              </>
            ) : (
              <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                  <FileText className="w-10 h-10 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Notes Found</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  {searchTerm || filterClassYear !== 'All' || filterDivision !== 'All'
                    ? 'No notes match your filter criteria.'
                    : 'Upload your first note to get started!'}
                </p>
              </div>
            )}
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NotesUpload;
