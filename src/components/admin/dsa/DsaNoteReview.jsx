import React, { useState, useEffect } from 'react';
import {
  FileText, Loader2, CheckCircle, XCircle, ExternalLink, MessageSquare, Search, Eye
} from 'lucide-react';
import dsaService from '../../../services/dsaService';

const DsaNoteReview = ({ onAction }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null); // note id being processed
  const [statusFilter, setStatusFilter] = useState('pending');
  const [reviewModal, setReviewModal] = useState(null); // { note, show: true }
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    fetchNotes();
  }, [statusFilter]);

  const fetchNotes = async () => {
    setLoading(true);
    const params = {};
    if (statusFilter !== 'all') params.status = statusFilter;
    const res = await dsaService.getNotes(params);
    if (res.success) setNotes(res.notes);
    setLoading(false);
  };

  const handleReview = async (id, status) => {
    setProcessing(id);
    const res = await dsaService.reviewNote(id, status, status === 'rejected' ? remarks : null);
    setProcessing(null);
    if (res.success) {
      setReviewModal(null);
      setRemarks('');
      fetchNotes();
      if (onAction) onAction();
    }
  };

  const openReview = (note) => {
    setReviewModal(note);
    setRemarks(note.remarks || '');
  };

  const previewFile = (url) => window.open(url, '_blank');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Notes Review
          </h2>
          <p className="text-sm text-gray-500">{notes.length} note{notes.length !== 1 ? 's' : ''} found</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-100 pb-3">
        {[
          { key: 'pending', label: 'Pending Review', color: 'amber' },
          { key: 'approved', label: 'Approved', color: 'green' },
          { key: 'rejected', label: 'Rejected', color: 'red' },
          { key: 'all', label: 'All Notes', color: 'gray' }
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === f.key
                ? `bg-${f.color}-100 text-${f.color}-700 ring-1 ring-${f.color}-300`
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No notes to review</p>
          <p className="text-sm">All notes have been reviewed or no notes have been uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <div key={note.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <h3 className="font-semibold text-gray-900 truncate">{note.title}</h3>
                    {note.status === 'pending' && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Pending</span>}
                    {note.status === 'approved' && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Approved</span>}
                    {note.status === 'rejected' && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">Rejected</span>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                    <span>By: {note.trainerName}</span>
                    <span>Topic: {note.lectureTopic}</span>
                    <span>
                      {new Date(note.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {note.remarks && (
                      <span className="flex items-center gap-1 text-gray-400">
                        <MessageSquare className="w-3 h-3" /> {note.remarks}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => previewFile(note.fileUrl)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Preview file"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {note.status === 'pending' && (
                    <button
                      onClick={() => openReview(note)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-all active:scale-95"
                    >
                      Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Review Notes</h3>

            <div className="mb-4 p-4 bg-gray-50 rounded-xl">
              <p className="font-medium text-gray-900">{reviewModal.title}</p>
              <p className="text-sm text-gray-500 mt-1">
                by {reviewModal.trainerName} — {new Date(reviewModal.createdAt).toLocaleDateString('en-IN')}
              </p>
              {reviewModal.description && (
                <p className="text-sm text-gray-600 mt-2">{reviewModal.description}</p>
              )}
              <button
                onClick={() => previewFile(reviewModal.fileUrl)}
                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 mt-2 font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Preview file
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Review Remarks</label>
              <textarea
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
                rows={3}
                placeholder="Add review comments (required for rejection)..."
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => { setReviewModal(null); setRemarks(''); }}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReview(reviewModal.id, 'rejected')}
                disabled={processing === reviewModal.id || !remarks.trim()}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1"
              >
                {processing === reviewModal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Reject
              </button>
              <button
                onClick={() => handleReview(reviewModal.id, 'approved')}
                disabled={processing === reviewModal.id}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1"
              >
                {processing === reviewModal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DsaNoteReview;
