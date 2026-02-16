import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Edit2, Eye, Clock, Award, Users, ChevronDown, ChevronUp, X, RefreshCw, AlertCircle } from 'lucide-react';
import { eventService } from '../../services/eventService';
import toast from 'react-hot-toast';

export default function EventQuizManager() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsQuiz, setSubmissionsQuiz] = useState(null);

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    duration: 30,
    questions: [{ type: 'mcq', question: '', options: { A: '', B: '', C: '', D: '' }, correctAnswer: 'A', codeSnippet: '' }]
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) fetchQuizzes();
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/events/admin/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await eventService.adminGetEventQuizzes(selectedEventId);
      if (response.success) setQuizzes(response.quizzes || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch quizzes');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      duration: 30,
      questions: [{ type: 'mcq', question: '', options: { A: '', B: '', C: '', D: '' }, correctAnswer: 'A', codeSnippet: '' }]
    });
    setEditingQuiz(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (quiz) => {
    const formatDT = (iso) => {
      const d = new Date(iso);
      const pad = (n) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setForm({
      title: quiz.title,
      description: quiz.description || '',
      startTime: formatDT(quiz.startTime),
      endTime: formatDT(quiz.endTime),
      duration: quiz.duration,
      questions: Array.isArray(quiz.questions) ? quiz.questions : []
    });
    setEditingQuiz(quiz);
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.startTime || !form.endTime || form.questions.length === 0) {
      toast.error('Please fill in all required fields and add at least one question');
      return;
    }

    // Validate questions
    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      if (!q.question) {
        toast.error(`Question ${i + 1} text is empty`);
        return;
      }
      if (!q.options.A || !q.options.B || !q.options.C || !q.options.D) {
        toast.error(`Question ${i + 1}: All 4 options are required`);
        return;
      }
    }

    try {
      const payload = {
        ...form,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        duration: parseInt(form.duration)
      };

      if (editingQuiz) {
        await eventService.adminUpdateEventQuiz(editingQuiz.id, payload);
        toast.success('Quiz updated!');
      } else {
        await eventService.adminCreateEventQuiz(selectedEventId, payload);
        toast.success('Quiz created!');
      }

      setShowCreateModal(false);
      resetForm();
      fetchQuizzes();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save quiz');
    }
  };

  const handleDelete = async (quizId) => {
    if (!confirm('Delete this quiz? This cannot be undone.')) return;
    try {
      await eventService.adminDeleteEventQuiz(quizId);
      toast.success('Quiz deleted');
      fetchQuizzes();
    } catch (error) {
      toast.error('Failed to delete quiz');
    }
  };

  const viewSubmissions = async (quiz) => {
    try {
      setSubmissionsQuiz(quiz);
      const response = await eventService.adminGetQuizSubmissions(quiz.id);
      if (response.success) setSubmissions(response.submissions || []);
      setShowSubmissionsModal(true);
    } catch (error) {
      toast.error('Failed to fetch submissions');
    }
  };

  // Question helpers
  const addQuestion = () => {
    setForm(prev => ({
      ...prev,
      questions: [...prev.questions, { type: 'mcq', question: '', options: { A: '', B: '', C: '', D: '' }, correctAnswer: 'A', codeSnippet: '' }]
    }));
  };

  const updateQuestion = (index, field, value) => {
    setForm(prev => {
      const updated = [...prev.questions];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, questions: updated };
    });
  };

  const updateOption = (qIndex, key, value) => {
    setForm(prev => {
      const updated = [...prev.questions];
      updated[qIndex] = { ...updated[qIndex], options: { ...updated[qIndex].options, [key]: value } };
      return { ...prev, questions: updated };
    });
  };

  const removeQuestion = (index) => {
    if (form.questions.length <= 1) return;
    setForm(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== index) }));
  };

  const getQuizStatus = (quiz) => {
    const now = new Date();
    if (now < new Date(quiz.startTime)) return 'upcoming';
    if (now > new Date(quiz.endTime)) return 'ended';
    return 'active';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/admin/events')} className="flex items-center gap-2 text-slate-300 hover:text-indigo-400 transition">
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline text-sm">Back to Events</span>
          </button>
          <h1 className="text-lg font-bold text-white">Event Quiz Manager</h1>
          <div className="w-20" />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Event Selector */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 mb-6">
          <label className="block text-sm text-slate-400 mb-2">Select Event</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none [&>option]:bg-slate-700 [&>option]:text-white"
          >
            <option value="">-- Choose an Event --</option>
            {events.map(e => (
              <option key={e.id} value={e.id}>{e.title} ({e.status})</option>
            ))}
          </select>
        </div>

        {selectedEventId && (
          <>
            {/* Action Bar */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                Quizzes ({quizzes.length})
              </h2>
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
              >
                <Plus className="w-4 h-4" /> Create Quiz
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
                <p className="text-slate-400">Loading quizzes...</p>
              </div>
            ) : quizzes.length === 0 ? (
              <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
                <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">No Quizzes Yet</h3>
                <p className="text-slate-400 mb-4">Create the first quiz for this event.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {quizzes.map(quiz => {
                  const status = getQuizStatus(quiz);
                  const statusColors = {
                    active: 'bg-green-900/40 text-green-300 border-green-600/30',
                    upcoming: 'bg-blue-900/40 text-blue-300 border-blue-600/30',
                    ended: 'bg-gray-700/40 text-gray-400 border-gray-600/30'
                  };

                  return (
                    <div key={quiz.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-lg font-bold text-white">{quiz.title}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[status]}`}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(quiz.startTime).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                              {' → '}
                              {new Date(quiz.endTime).toLocaleString('en-IN', { timeStyle: 'short' })}
                            </span>
                            <span>{quiz.duration} min</span>
                            <span>{quiz.questionCount} questions</span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {quiz.attemptCount} attempts
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => viewSubmissions(quiz)} className="p-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition" title="View Submissions">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEditModal(quiz)} className="p-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition" title="Edit Quiz">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(quiz.id)} className="p-2 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 transition" title="Delete Quiz">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Quiz Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-xl w-full max-w-3xl my-8 border border-slate-700">
            <div className="p-5 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800 rounded-t-xl z-10">
              <h2 className="text-xl font-bold text-white">{editingQuiz ? 'Edit Quiz' : 'Create Quiz'}</h2>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm text-slate-400 mb-1">Quiz Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. Python Basics Quiz"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-slate-400 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none"
                    rows={2}
                    placeholder="Optional description..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Start Time *</label>
                  <input
                    type="datetime-local"
                    value={form.startTime}
                    onChange={(e) => setForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">End Time *</label>
                  <input
                    type="datetime-local"
                    value={form.endTime}
                    onChange={(e) => setForm(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Duration (minutes) *</label>
                  <input
                    type="number"
                    value={form.duration}
                    onChange={(e) => setForm(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none"
                    min={1}
                  />
                </div>
              </div>

              {/* Questions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">Questions ({form.questions.length})</h3>
                  <button onClick={addQuestion} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm">
                    <Plus className="w-4 h-4" /> Add Question
                  </button>
                </div>

                <div className="space-y-4">
                  {form.questions.map((q, qi) => (
                    <div key={qi} className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-300">Question {qi + 1}</span>
                        {form.questions.length > 1 && (
                          <button onClick={() => removeQuestion(qi)} className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <textarea
                        value={q.question}
                        onChange={(e) => updateQuestion(qi, 'question', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none text-sm mb-3"
                        rows={2}
                        placeholder="Enter question text..."
                      />

                      <div className="mb-3">
                        <label className="block text-xs text-slate-500 mb-1">Code Snippet (optional)</label>
                        <textarea
                          value={q.codeSnippet}
                          onChange={(e) => updateQuestion(qi, 'codeSnippet', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none text-xs font-mono"
                          rows={2}
                          placeholder="// Optional code snippet..."
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                        {['A', 'B', 'C', 'D'].map(opt => (
                          <div key={opt} className="flex items-center gap-2">
                            <span className={`text-xs font-bold w-5 ${q.correctAnswer === opt ? 'text-green-400' : 'text-slate-500'}`}>{opt}.</span>
                            <input
                              type="text"
                              value={q.options[opt]}
                              onChange={(e) => updateOption(qi, opt, e.target.value)}
                              className="flex-1 px-3 py-1.5 bg-slate-700 text-white rounded border border-slate-600 focus:border-indigo-500 focus:outline-none text-sm"
                              placeholder={`Option ${opt}`}
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Correct Answer</label>
                        <div className="flex gap-2">
                          {['A', 'B', 'C', 'D'].map(opt => (
                            <button
                              key={opt}
                              onClick={() => updateQuestion(qi, 'correctAnswer', opt)}
                              className={`px-4 py-1.5 rounded text-sm font-medium transition ${
                                q.correctAnswer === opt
                                  ? 'bg-green-600 text-white'
                                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="px-5 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                <Save className="w-4 h-4" />
                {editingQuiz ? 'Update Quiz' : 'Create Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {showSubmissionsModal && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-xl w-full max-w-4xl my-8 border border-slate-700">
            <div className="p-5 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Submissions</h2>
                {submissionsQuiz && <p className="text-sm text-slate-400">{submissionsQuiz.title}</p>}
              </div>
              <button onClick={() => setShowSubmissionsModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto">
              {submissions.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No submissions yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-3 text-slate-400 font-medium">#</th>
                        <th className="text-left py-3 px-3 text-slate-400 font-medium">Name</th>
                        <th className="text-left py-3 px-3 text-slate-400 font-medium">Email</th>
                        <th className="text-left py-3 px-3 text-slate-400 font-medium">Branch</th>
                        <th className="text-center py-3 px-3 text-slate-400 font-medium">Score</th>
                        <th className="text-center py-3 px-3 text-slate-400 font-medium">%</th>
                        <th className="text-left py-3 px-3 text-slate-400 font-medium">Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub, i) => {
                        const pct = sub.maxScore > 0 ? Math.round((sub.score / sub.maxScore) * 100) : 0;
                        return (
                          <tr key={sub.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                            <td className="py-3 px-3 text-slate-400">{i + 1}</td>
                            <td className="py-3 px-3 text-white font-medium">{sub.participant.name}</td>
                            <td className="py-3 px-3 text-slate-300">{sub.participant.email}</td>
                            <td className="py-3 px-3 text-slate-300">{sub.participant.branch || '-'}</td>
                            <td className="py-3 px-3 text-center text-white font-mono">{sub.score}/{sub.maxScore}</td>
                            <td className={`py-3 px-3 text-center font-bold ${pct >= 80 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{pct}%</td>
                            <td className="py-3 px-3 text-slate-400">{sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
