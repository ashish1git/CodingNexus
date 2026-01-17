import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Search, Calendar, Filter, Eye, AlertCircle } from 'lucide-react';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const NotesViewer = () => {
  const { userDetails } = useAuth();
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('latest');
  const [error, setError] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  
  const fetchCalledRef = useRef(false);
  const batchRef = useRef('');

  useEffect(() => {
    const studentBatch = userDetails?.studentProfile?.batch || userDetails?.batch;
    if (studentBatch && studentBatch !== batchRef.current) {
      batchRef.current = studentBatch;
      fetchNotes();
    } else if (userDetails && !studentBatch) {
      setError('Your account does not have a batch assigned. Please contact admin.');
      setLoading(false);
    }
  }, [userDetails]);

  useEffect(() => {
    filterAndSortNotes();
  }, [notes, searchTerm, sortBy]);

  const fetchNotes = async () => {
    if (isFetching || fetchCalledRef.current) {
      return;
    }
    
    setIsFetching(true);
    fetchCalledRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const response = await studentService.getNotes();
      
      if (response.success) {
        const notesList = response.data.map(note => ({
          ...note,
          createdAt: note.createdAt ? new Date(note.createdAt) : new Date()
        }));
        
        setNotes(notesList);
        
        const studentBatch = userDetails?.studentProfile?.batch || userDetails?.batch;
        if (notesList.length === 0) {
          toast(`No notes available for ${studentBatch} batch yet`);
        } else {
          toast.success(`Loaded ${notesList.length} notes`);
        }
      } else {
        throw new Error(response.error || 'Failed to fetch notes');
      }
      
    } catch (error) {
      console.error('Error fetching notes:', error);
      setError(error.message);
      toast.error(`Failed to load notes: ${error.message}`);
    } finally {
      setLoading(false);
      setIsFetching(false);
      setTimeout(() => {
        fetchCalledRef.current = false;
      }, 1000);
    }
  };

  const filterAndSortNotes = () => {
    let filtered = [...notes];

    if (searchTerm) {
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortBy === 'latest') {
      filtered.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => a.createdAt - b.createdAt);
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    const uniqueNotes = [];
    const noteIds = new Set();
    
    filtered.forEach(note => {
      if (!noteIds.has(note.id)) {
        noteIds.add(note.id);
        uniqueNotes.push(note);
      }
    });
    
    setFilteredNotes(uniqueNotes);
  };

  const handleDownload = (note) => {
    const fileUrl = note.fileUrl || note.fileURL;
    if (fileUrl) {
      // Add fl_attachment for PDFs to force download
      let downloadUrl = fileUrl;
      if (fileUrl.includes('cloudinary.com') && fileUrl.includes('/image/upload/')) {
        const parts = fileUrl.split('/upload/');
        if (parts.length === 2) {
          downloadUrl = `${parts[0]}/upload/fl_attachment/${parts[1]}`;
        }
      }
      window.open(downloadUrl, '_blank');
      toast.success('Download started!');
    } else {
      toast.error('File not available');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const refreshNotes = () => {
    fetchCalledRef.current = false;
    batchRef.current = '';
    fetchNotes();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <nav className="bg-slate-800 shadow-lg border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              to="/student/dashboard"
              className="inline-flex items-center gap-2 text-slate-300 hover:text-indigo-400 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline text-sm">Back to Dashboard</span>
            </Link>
            <h1 className="text-lg sm:text-xl font-bold text-white">Study Materials</h1>
            <button
              onClick={refreshNotes}
              disabled={loading}
              className="text-xs px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              Refresh
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-900/30 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-4 sm:p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-600 bg-slate-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition placeholder-slate-400"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-slate-600 bg-slate-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm"
              >
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-indigo-400">{filteredNotes.length}</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Total Notes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-blue-400">{userDetails?.studentProfile?.batch || userDetails?.batch || 'N/A'}</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Your Batch</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-green-400">
                {notes.filter(n => n.batch === (userDetails?.studentProfile?.batch || userDetails?.batch)).length}
              </p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Batch Specific</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-purple-400">
                {notes.filter(n => n.batch === 'All').length}
              </p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Common Notes</p>
            </div>
          </div>
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-300">Loading notes...</p>
            <p className="text-sm text-slate-400 mt-2">Checking for notes in batch: {userDetails?.batch}</p>
          </div>
        ) : filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 hover:border-slate-600 hover:shadow-xl transition overflow-hidden flex flex-col h-full"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 sm:p-6">
                  <div className="flex items-start justify-between">
                    <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                      note.batch === 'All' 
                        ? 'bg-white text-indigo-600'
                        : 'bg-indigo-900/50 text-indigo-200'
                    }`}>
                      {note.batch === 'All' ? 'Common' : note.batch}
                    </span>
                  </div>
                </div>

                {/* Content - Improved padding and spacing */}
                <div className="p-4 sm:p-6 flex-1 flex flex-col">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-2 line-clamp-2 min-h-[3.5rem]">
                    {note.title}
                  </h3>
                  
                  {note.description && (
                    <p className="text-xs sm:text-sm text-slate-400 mb-4 line-clamp-3 flex-1">
                      {note.description}
                    </p>
                  )}

                  {/* Meta Info - Better spacing */}
                  <div className="flex flex-col sm:flex-row gap-2 text-xs text-slate-500 mb-4 pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{note.createdAt?.toLocaleDateString()}</span>
                    </div>
                    {note.fileSize && (
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{formatFileSize(note.fileSize)}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions - Better mobile layout */}
                  <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                    <button
                      onClick={() => handleDownload(note)}
                      className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-xs sm:text-sm font-medium whitespace-nowrap"
                    >
                      <Download className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>Download</span>
                    </button>
                    
                    {(note.fileUrl || note.fileURL) && (
                      <button
                        onClick={() => window.open(note.fileUrl || note.fileURL, '_blank')}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition text-xs sm:text-sm font-medium"
                        title="Preview"
                      >
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Preview</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer */}
                {(note.uploadedBy || note.uploadedByName) && (
                  <div className="px-4 sm:px-6 py-2 sm:py-3 bg-slate-700/50 border-t border-slate-700">
                    <p className="text-xs text-slate-400 truncate">
                      Uploaded by <span className="font-medium text-slate-300">{note.uploadedByName || note.uploadedBy || 'Unknown'}</span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-800 rounded-xl shadow-lg border border-slate-700">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Notes Found</h3>
            <p className="text-slate-400 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : `No study materials available for ${userDetails?.batch || 'your'} batch yet`}
            </p>
            <div className="space-y-2 text-sm text-slate-500 max-w-md mx-auto">
              <p>Possible reasons:</p>
              <ul className="list-disc list-inside text-left">
                <li>No notes have been uploaded by admin yet</li>
                <li>Notes are marked for a different batch</li>
                <li>There might be a connection issue</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesViewer;