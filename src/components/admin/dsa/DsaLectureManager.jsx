import React, { useState, useEffect } from 'react';
import {
  Plus, Loader2, Calendar, Clock, Trash2, Edit, BookOpen, Users, CheckCircle, AlertCircle, XCircle
} from 'lucide-react';
import dsaService from '../../../services/dsaService';

const DsaLectureManager = () => {
  const [lectures, setLectures] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({
    trainerId: '', topic: '', description: '', batch: '',
    lectureDate: '', startTime: '', endTime: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [lecturesRes, trainersRes] = await Promise.all([
      dsaService.getLectures(),
      dsaService.getTrainers()
    ]);
    if (lecturesRes.success) setLectures(lecturesRes.lectures);
    if (trainersRes.success) setTrainers(trainersRes.trainers.filter(t => t.isActive));
    setLoading(false);
  };

  const resetForm = () => setForm({ trainerId: '', topic: '', description: '', batch: '', lectureDate: '', startTime: '', endTime: '' });

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setShowForm(true);
  };

  const openEdit = (lecture) => {
    setEditing(lecture);
    setForm({
      trainerId: lecture.trainerId,
      topic: lecture.topic,
      description: lecture.description || '',
      batch: lecture.batch || '',
      lectureDate: lecture.lectureDate?.split('T')[0] || '',
      startTime: lecture.startTime || '',
      endTime: lecture.endTime || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      const res = await dsaService.updateLecture(editing.id, form);
      if (res.success) { setShowForm(false); setEditing(null); fetchData(); }
    } else {
      const res = await dsaService.createLecture(form);
      if (res.success) { setShowForm(false); fetchData(); }
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this lecture?')) return;
    const res = await dsaService.deleteLecture(id);
    if (res.success) fetchData();
  };

  const getStatusIcon = (status) => {
    if (status === 'approved') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === 'pending') return <AlertCircle className="w-4 h-4 text-amber-500" />;
    if (status === 'rejected') return <XCircle className="w-4 h-4 text-red-500" />;
    return <AlertCircle className="w-4 h-4 text-gray-300" />;
  };

  const getStatusBadge = (status) => {
    const styles = {
      scheduled: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-gray-100 text-gray-500'
    };
    return `px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.scheduled}`;
  };

  const filteredLectures = filter === 'all' ? lectures : lectures.filter(l => l.notesStatus === filter);

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
            <Calendar className="w-5 h-5 text-indigo-600" />
            Lecture Schedule
          </h2>
          <p className="text-sm text-gray-500">{lectures.length} lectures scheduled</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Schedule Lecture
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['all', 'missing', 'pending', 'approved', 'rejected'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
              filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filteredLectures.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No lectures found</p>
          <p className="text-sm">Schedule a lecture to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLectures.map(lecture => (
            <div key={lecture.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">{lecture.topic}</h3>
                    <span className={getStatusBadge(lecture.status)}>{lecture.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {lecture.trainerName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(lecture.lectureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {lecture.startTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {lecture.startTime}{lecture.endTime ? ` - ${lecture.endTime}` : ''}
                      </span>
                    )}
                    {lecture.batch && <span className="px-2 py-0.5 bg-gray-200 rounded text-gray-600">{lecture.batch}</span>}
                  </div>
                  {lecture.description && (
                    <p className="text-xs text-gray-400 mt-1">{lecture.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <div className="flex items-center gap-1" title={`Notes: ${lecture.notesStatus}`}>
                    {getStatusIcon(lecture.notesStatus)}
                    <span className="text-xs text-gray-500">{lecture.noteCount}</span>
                  </div>
                  <button onClick={() => openEdit(lecture)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(lecture.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editing ? 'Edit Lecture' : 'Schedule Lecture'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trainer</label>
                <select
                  required
                  value={form.trainerId}
                  onChange={e => setForm({ ...form, trainerId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                >
                  <option value="">Select trainer...</option>
                  {trainers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                <input
                  required
                  value={form.topic}
                  onChange={e => setForm({ ...form, topic: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="e.g. Arrays & Hashing"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
                  rows={2}
                  placeholder="Lecture description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={form.lectureDate}
                    onChange={e => setForm({ ...form, lectureDate: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch (optional)</label>
                  <select
                    value={form.batch}
                    onChange={e => setForm({ ...form, batch: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  >
                    <option value="">All batches</option>
                    <option value="Basic">Basic</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={e => setForm({ ...form, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={e => setForm({ ...form, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditing(null); }}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm shadow-sm active:scale-95"
                >
                  {editing ? 'Update' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DsaLectureManager;
