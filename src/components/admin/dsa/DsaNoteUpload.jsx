import React, { useState, useEffect } from 'react';
import { Upload, Loader2, FileText, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import dsaService from '../../../services/dsaService';

const DsaNoteUpload = ({ onSuccess }) => {
  const { userDetails } = useAuth();
  const [trainer, setTrainer] = useState(null);
  const [upcomingLectures, setUpcomingLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ lectureId: '', title: '', description: '' });
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const dashRes = await dsaService.getTrainerDashboard();
    if (dashRes.success) {
      setTrainer(dashRes.dashboard);
      setUpcomingLectures(dashRes.dashboard.upcomingLectures || []);
      // Also fetch all lectures if no upcoming
      if (!dashRes.dashboard.upcomingLectures?.length) {
        const lecRes = await dsaService.getLectures();
        if (lecRes.success) setUpcomingLectures(lecRes.lectures);
      }
    }
    setLoading(false);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 15 * 1024 * 1024) {
        alert('File too large. Maximum size is 15MB.');
        return;
      }
      setFile(selected);
      setForm(prev => ({ ...prev, title: prev.title || selected.name.replace(/\.[^/.]+$/, '') }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.lectureId || !form.title) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('lectureId', form.lectureId);
    formData.append('title', form.title);
    formData.append('description', form.description);
    if (file) formData.append('file', file);

    const res = await dsaService.uploadNote(formData);
    setUploading(false);
    if (res.success) {
      setForm({ lectureId: '', title: '', description: '' });
      setFile(null);
      fetchData();
      if (onSuccess) onSuccess();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Upload className="w-5 h-5 text-indigo-600" />
          Upload Lecture Notes
        </h2>
        <p className="text-sm text-gray-500">Upload notes for review and approval</p>
      </div>

      {/* Stats cards */}
      {trainer && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Pending', value: trainer.stats.pending, color: 'text-amber-600 bg-amber-50 border-amber-100' },
            { label: 'Approved', value: trainer.stats.approved, color: 'text-green-600 bg-green-50 border-green-100' },
            { label: 'Rejected', value: trainer.stats.rejected, color: 'text-red-600 bg-red-50 border-red-100' },
            { label: 'Missing', value: trainer.stats.missing, color: 'text-gray-600 bg-gray-100 border-gray-200' }
          ].map(s => (
            <div key={s.label} className={`p-3 rounded-xl border ${s.color} text-center`}>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs font-medium mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Upload form */}
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lecture</label>
            <select
              required
              value={form.lectureId}
              onChange={e => {
                const lec = upcomingLectures.find(l => l.id === e.target.value);
                setForm({ ...form, lectureId: e.target.value, title: lec ? `Notes - ${lec.topic}` : form.title });
              }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            >
              <option value="">Select a lecture...</option>
              {upcomingLectures.map(l => (
                <option key={l.id} value={l.id}>
                  {l.topic} — {new Date(l.lectureDate).toLocaleDateString('en-IN')}
                  {l.hasNotes ? ' (📄 uploaded)' : ' (⚠️ missing)'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              placeholder="e.g. Arrays & Hashing Notes"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
              rows={2}
              placeholder="Brief description of the notes..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File (PDF, max 15MB)</label>
            <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${file ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
              {file ? (
                <div>
                  <FileText className="w-8 h-8 mx-auto text-indigo-500 mb-2" />
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-xs text-red-500 hover:text-red-700 mt-2"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Drop a file or <span className="text-indigo-600 font-medium cursor-pointer">browse</span></p>
                  <p className="text-xs text-gray-400 mt-1">PDF, DOC, PPT up to 15MB</p>
                </div>
              )}
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.rar"
                onChange={handleFileChange}
                className="hidden"
                id="note-file-input"
              />
              <label htmlFor="note-file-input" className="cursor-pointer block mt-0" />
            </div>
            <button
              type="button"
              onClick={() => document.getElementById('note-file-input').click()}
              className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {file ? 'Change file' : 'Select file'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={uploading || !form.lectureId}
          className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-all shadow-sm active:scale-95"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Uploading...' : 'Submit for Review'}
        </button>
      </form>
    </div>
  );
};

export default DsaNoteUpload;
