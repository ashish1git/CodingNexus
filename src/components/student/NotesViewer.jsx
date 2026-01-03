// src/components/student/NotesViewer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Search, Calendar, Filter, Eye, AlertCircle } from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
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
  
  // Use ref to prevent duplicate calls
  const fetchCalledRef = useRef(false);
  const batchRef = useRef('');

  useEffect(() => {
    console.log('User details changed:', userDetails);
    
    // Only fetch if userDetails exists AND has batch AND batch changed
    if (userDetails?.batch && userDetails.batch !== batchRef.current) {
      batchRef.current = userDetails.batch;
      fetchNotes();
    } else if (userDetails && !userDetails.batch) {
      console.error('User has no batch field:', userDetails);
      setError('Your account does not have a batch assigned. Please contact admin.');
      setLoading(false);
    }

    
  }, [userDetails]);

  useEffect(() => {
    filterAndSortNotes();
  }, [notes, searchTerm, sortBy]);

  const fetchNotes = async () => {
    // Prevent multiple simultaneous fetches
    if (isFetching || fetchCalledRef.current) {
      console.log('Fetch already in progress or already called');
      return;
    }
    
    setIsFetching(true);
    fetchCalledRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching notes for batch:', userDetails.batch);
      
      // First, let's check what's in the notes collection without filters
      const allNotesQuery = query(collection(db, 'notes'), orderBy('createdAt', 'desc'));
      const allSnapshot = await getDocs(allNotesQuery);
      console.log(`Total notes in database: ${allSnapshot.docs.length}`);
      
      // Now try the filtered query
      const notesQuery = query(
        collection(db, 'notes'),
        where('batch', 'in', [userDetails.batch, 'All']),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(notesQuery);
      console.log(`Found ${snapshot.docs.length} notes for batch ${userDetails.batch}`);
      
      const notesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      
      console.log('Unique notes list:', notesList);
      setNotes(notesList);
      
      if (notesList.length === 0) {
        toast(`No notes available for ${userDetails.batch} batch yet`);
      } else {
        toast.success(`Loaded ${notesList.length} notes`);
      }
      
    } catch (error) {
      console.error('Error fetching notes:', error);
      setError(error.message);
      
      if (error.code === 'failed-precondition') {
        toast.error('Firestore index required. Creating index...');
      } else if (error.code === 'permission-denied') {
        toast.error('Permission denied. Please make sure you are logged in as a student.');
      } else {
        toast.error(`Failed to load notes: ${error.message}`);
      }
    } finally {
      setLoading(false);
      setIsFetching(false);
      // Reset fetchCalledRef after a delay to allow re-fetch if needed
      setTimeout(() => {
        fetchCalledRef.current = false;
      }, 1000);
    }
  };

  const filterAndSortNotes = () => {
    let filtered = [...notes];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    if (sortBy === 'latest') {
      filtered.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => a.createdAt - b.createdAt);
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    // Remove duplicates by ID
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
    if (note.fileURL) {
      window.open(note.fileURL, '_blank');
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

  // Refresh function
  const refreshNotes = () => {
    fetchCalledRef.current = false;
    batchRef.current = '';
    fetchNotes();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/student/dashboard"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Study Materials</h1>
            <button
              onClick={refreshNotes}
              disabled={loading}
              className="text-xs px-3 py-1 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search notes by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">{filteredNotes.length}</p>
              <p className="text-sm text-gray-600">Total Notes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{userDetails?.batch || 'N/A'}</p>
              <p className="text-sm text-gray-600">Your Batch</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {notes.filter(n => n.batch === userDetails?.batch).length}
              </p>
              <p className="text-sm text-gray-600">Batch Specific</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {notes.filter(n => n.batch === 'All').length}
              </p>
              <p className="text-sm text-gray-600">Common Notes</p>
            </div>
          </div>
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Loading notes...</p>
            <p className="text-sm text-gray-500 mt-2">Checking for notes in batch: {userDetails?.batch}</p>
          </div>
        ) : filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6">
                  <div className="flex items-start justify-between">
                    <FileText className="w-10 h-10 text-white" />
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      note.batch === 'All' 
                        ? 'bg-white text-indigo-600'
                        : note.batch === 'Basic'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {note.batch === 'All' ? 'Common' : note.batch}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                    {note.title}
                  </h3>
                  {note.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {note.description}
                    </p>
                  )}

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {note.createdAt?.toLocaleDateString()}
                    </div>
                    {note.fileSize && (
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {formatFileSize(note.fileSize)}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(note)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    {note.fileURL && (
                      <a
                        href={note.fileURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Footer */}
                {note.uploadedBy && (
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Uploaded by <span className="font-medium text-gray-700">{note.uploadedBy}</span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Notes Found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : `No study materials available for ${userDetails?.batch || 'your'} batch yet`}
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>Possible reasons:</p>
              <ul className="list-disc list-inside max-w-md mx-auto text-left">
                <li>No notes have been uploaded by admin yet</li>
                <li>Notes are marked for a different batch</li>
                <li>There might be a connection issue</li>
                <li>Your batch field might not be set correctly</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesViewer;