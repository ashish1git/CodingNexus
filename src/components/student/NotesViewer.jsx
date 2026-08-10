import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Search, Calendar, Filter, Eye, AlertCircle, GraduationCap, Users, BookOpen, RefreshCw } from 'lucide-react';
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

  const studentClassYear = userDetails?.studentProfile?.classYear || userDetails?.classYear;
  const studentDivision = userDetails?.studentProfile?.division || userDetails?.division;
  const studentBatch = userDetails?.studentProfile?.batch || userDetails?.batch;

  useEffect(() => {
    if (userDetails && studentBatch) {
      batchRef.current = studentBatch;
      fetchNotes();
    } else if (userDetails && !studentBatch) {
      setError('Your account does not have a batch assigned. Please contact admin.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    filterAndSortNotes();
  }, [notes, searchTerm, sortBy]);

  const fetchNotes = async () => {
    if (isFetching || fetchCalledRef.current) return;
    
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
      setTimeout(() => { fetchCalledRef.current = false; }, 1000);
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
    if (sortBy === 'latest') filtered.sort((a, b) => b.createdAt - a.createdAt);
    else if (sortBy === 'oldest') filtered.sort((a, b) => a.createdAt - b.createdAt);
    else if (sortBy === 'name') filtered.sort((a, b) => a.title.localeCompare(b.title));

    const uniqueNotes = [];
    const noteIds = new Set();
    filtered.forEach(note => { if (!noteIds.has(note.id)) { noteIds.add(note.id); uniqueNotes.push(note); } });
    setFilteredNotes(uniqueNotes);
  };

  const handleDownload = (note) => {
    const fileUrl = note.fileUrl || note.fileURL;
    if (fileUrl) {
      let downloadUrl = fileUrl;
      if (fileUrl.includes('cloudinary.com') && fileUrl.includes('/image/upload/')) {
        const parts = fileUrl.split('/upload/');
        if (parts.length === 2) downloadUrl = `${parts[0]}/upload/fl_attachment/${parts[1]}`;
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

  const yearNotes = filteredNotes.filter(n => n.classYear === studentClassYear);
  const commonNotes = filteredNotes.filter(n => !n.classYear);
  const divisionNotes = filteredNotes.filter(n => n.classYear === studentClassYear && n.division === studentDivision);
  const yearCommonNotes = filteredNotes.filter(n => n.classYear === studentClassYear && !n.division);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="bg-slate-800 shadow-lg border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/student/dashboard" className="inline-flex items-center gap-2 text-slate-300 hover:text-indigo-400 transition">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline text-sm">Back to Dashboard</span>
            </Link>
            <h1 className="text-lg sm:text-xl font-bold text-white">Study Materials</h1>
            <button onClick={refreshNotes} disabled={loading} className="inline-flex items-center gap-1.5 text-xs px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {error && (
          <div className="mb-6 bg-red-900/30 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Student Info */}
        <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-4 sm:p-5 mb-6">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/30 rounded-lg">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-semibold text-white">{studentClassYear || 'N/A'}</span>
            </div>
            {studentDivision && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600/20 border border-cyan-500/30 rounded-lg">
                <Users className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-white">Division {studentDivision}</span>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-600/20 border border-violet-500/30 rounded-lg">
              <BookOpen className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-semibold text-white">{studentBatch || 'N/A'} Batch</span>
            </div>
          </div>
        </div>

        {/* Filters + Stats */}
        <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-4 sm:p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input type="text" placeholder="Search notes..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-600 bg-slate-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none placeholder-slate-400" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-slate-600 bg-slate-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm">
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700">
            <div className="text-center"><p className="text-2xl sm:text-3xl font-bold text-indigo-400">{filteredNotes.length}</p><p className="text-xs text-slate-400 mt-1">Total</p></div>
            <div className="text-center"><p className="text-2xl sm:text-3xl font-bold text-green-400">{yearNotes.length}</p><p className="text-xs text-slate-400 mt-1">{studentClassYear || 'Year'} Notes</p></div>
            <div className="text-center"><p className="text-2xl sm:text-3xl font-bold text-cyan-400">{divisionNotes.length}</p><p className="text-xs text-slate-400 mt-1">Division Specific</p></div>
            <div className="text-center"><p className="text-2xl sm:text-3xl font-bold text-purple-400">{commonNotes.length}</p><p className="text-xs text-slate-400 mt-1">Common</p></div>
          </div>
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-300">Loading notes...</p>
          </div>
        ) : filteredNotes.length > 0 ? (
          <div className="space-y-8">
            {studentDivision && divisionNotes.length > 0 && (
              <Section icon={<Users className="w-5 h-5 text-cyan-400" />} iconBg="bg-cyan-600/20"
                title={`${studentClassYear} - Division ${studentDivision} Notes`} count={divisionNotes.length}>
                <NotesGrid notes={divisionNotes} handleDownload={handleDownload} formatFileSize={formatFileSize} />
              </Section>
            )}
            {yearCommonNotes.length > 0 && (
              <Section icon={<GraduationCap className="w-5 h-5 text-green-400" />} iconBg="bg-green-600/20"
                title={`${studentClassYear} Common Notes`} count={yearCommonNotes.length}>
                <NotesGrid notes={yearCommonNotes} handleDownload={handleDownload} formatFileSize={formatFileSize} />
              </Section>
            )}
            {commonNotes.length > 0 && (
              <Section icon={<FileText className="w-5 h-5 text-purple-400" />} iconBg="bg-purple-600/20"
                title="Common Study Materials" count={commonNotes.length}>
                <NotesGrid notes={commonNotes} handleDownload={handleDownload} formatFileSize={formatFileSize} />
              </Section>
            )}
            {!studentDivision && divisionNotes.length === 0 && commonNotes.length === 0 && yearCommonNotes.length === 0 && (
              <NotesGrid notes={filteredNotes} handleDownload={handleDownload} formatFileSize={formatFileSize} />
            )}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-800 rounded-xl shadow-lg border border-slate-700">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Notes Found</h3>
            <p className="text-slate-400 mb-6">
              {searchTerm ? 'Try adjusting your search' : `No materials available for ${studentClassYear || 'your class'} yet`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Reusable section header
const Section = ({ icon, iconBg, title, count, children }) => (
  <div>
    <div className="flex items-center gap-3 mb-4">
      <div className={`p-2 ${iconBg} rounded-lg`}>{icon}</div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <span className="text-sm text-slate-400">({count})</span>
    </div>
    {children}
  </div>
);

// Notes Grid
const NotesGrid = ({ notes, handleDownload, formatFileSize }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
    {notes.map((note) => (
      <div key={note.id} className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 hover:border-slate-600 hover:shadow-xl transition overflow-hidden flex flex-col h-full">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 sm:p-5">
          <div className="flex items-start justify-between">
            <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            <div className="flex flex-col gap-1 items-end">
              {note.classYear && (
                <span className={`px-2 sm:px-3 py-0.5 rounded-full text-xs font-semibold ${
                  note.classYear === 'FE' ? 'bg-green-400/20 text-green-200' : note.classYear === 'SE' ? 'bg-blue-400/20 text-blue-200' :
                  note.classYear === 'TE' ? 'bg-purple-400/20 text-purple-200' : 'bg-orange-400/20 text-orange-200'
                }`}>{note.classYear}</span>
              )}
              {note.division && <span className="px-2 sm:px-3 py-0.5 rounded-full text-xs font-semibold bg-cyan-400/20 text-cyan-200">Div {note.division}</span>}
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-5 flex-1 flex flex-col">
          <h3 className="text-base sm:text-lg font-bold text-white mb-2 line-clamp-2 min-h-[3rem]">{note.title}</h3>
          {note.description && <p className="text-xs sm:text-sm text-slate-400 mb-4 line-clamp-2 flex-1">{note.description}</p>}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              !note.batch || note.batch === 'all' ? 'bg-slate-700 text-slate-400' : note.batch === 'basic' ? 'bg-sky-900/40 text-sky-300' : 'bg-violet-900/40 text-violet-300'
            }`}>{!note.batch || note.batch === 'all' ? 'All Batches' : note.batch.charAt(0).toUpperCase() + note.batch.slice(1)}</span>
            {note.fileFormat && <span className="text-xs text-slate-500">{note.fileFormat.toUpperCase()}</span>}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 text-xs text-slate-500 mb-4 pt-4 border-t border-slate-700">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{note.createdAt?.toLocaleDateString()}</span>
            {note.fileSize && <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{formatFileSize(note.fileSize)}</span>}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-auto">
            <button onClick={() => handleDownload(note)} className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-xs sm:text-sm font-medium">
              <Download className="w-3 h-3 sm:w-4 sm:h-4" /><span>Download</span>
            </button>
            {(note.fileUrl || note.fileURL) && (
              <button onClick={() => window.open(note.fileUrl || note.fileURL, '_blank')} className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition text-xs sm:text-sm font-medium">
                <Eye className="w-3 h-3 sm:w-4 sm:h-4" /><span>Preview</span>
              </button>
            )}
          </div>
        </div>
        {(note.uploadedBy || note.uploadedByName) && (
          <div className="px-4 sm:px-5 py-2 sm:py-3 bg-slate-700/50 border-t border-slate-700">
            <p className="text-xs text-slate-400 truncate">Uploaded by <span className="font-medium text-slate-300">{note.uploadedByName || note.uploadedBy || 'Unknown'}</span></p>
          </div>
        )}
      </div>
    ))}
  </div>
);

export default NotesViewer;
