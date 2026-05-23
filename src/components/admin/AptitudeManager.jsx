import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain, Plus, Edit2, Trash2, Eye, Search, ChevronLeft,
  CheckCircle, XCircle, Users, Clock, BarChart2, AlertTriangle, X, Save, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import aptitudeService from '../../services/aptitudeService';

const CATEGORIES = ['general', 'quantitative', 'logical', 'verbal', 'technical'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const diffStyle = (d) => {
  if (d === 'easy') return { color: '#34d399', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' };
  if (d === 'hard') return { color: '#f87171', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' };
  return { color: '#fde047', background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.3)' };
};

function getStatus(test) {
  if (!test.startTime || !test.endTime) return { label: 'No Schedule', color: '#64748b', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.25)' };
  const now = new Date();
  if (now < new Date(test.startTime)) return { label: 'Upcoming', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)' };
  if (now > new Date(test.endTime)) return { label: 'Ended', color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' };
  return { label: 'Live', color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' };
}

// Convert a Date (or ISO string) to the value format required by datetime-local inputs
function toLocalInput(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  // Adjust to local timezone offset so the input shows the correct local time
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d - offset).toISOString().slice(0, 16);
}

const emptyQuestion = () => ({
  _key: Math.random().toString(36).slice(2),
  question: '',
  options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
  correctOption: 'A',
  explanation: ''
});

const emptyForm = () => ({
  title: '', description: '', category: 'general', difficulty: 'medium', duration: 30,
  startTime: '', endTime: '',
  questions: [emptyQuestion()]
});

export default function AptitudeManager() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('list'); // 'list' | 'create' | 'edit' | 'submissions'
  const [selectedTest, setSelectedTest] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  useEffect(() => { fetchTests(); }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const data = await aptitudeService.adminGetAllTests();
      setTests(Array.isArray(data.tests) ? data.tests : []);
    } catch {
      toast.error('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setFormData(emptyForm()); setSelectedTest(null); setView('create'); };
  const openEdit = async (test) => {
    try {
      const data = await aptitudeService.adminGetTest(test.id);
      const t = data.test;
      setFormData({
        title: t.title, description: t.description || '', category: t.category,
        difficulty: t.difficulty, duration: t.duration, isActive: t.isActive,
        startTime: toLocalInput(t.startTime),
        endTime: toLocalInput(t.endTime),
        questions: t.questions.map(q => ({
          _key: q.id, id: q.id, question: q.question,
          options: Array.isArray(q.options) ? q.options : [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
          correctOption: q.correctOption, explanation: q.explanation || ''
        }))
      });
      setSelectedTest(t);
      setView('edit');
    } catch { toast.error('Failed to load test details'); }
  };

  const openSubmissions = async (test) => {
    setSelectedTest(test);
    setView('submissions');
    setLoadingSubmissions(true);
    try {
      const data = await aptitudeService.adminGetSubmissions(test.id);
      setSubmissions(data.submissions || []);
    } catch { toast.error('Failed to load submissions'); }
    finally { setLoadingSubmissions(false); }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) return toast.error('Title is required');
    if (!formData.duration || formData.duration < 1) return toast.error('Duration must be at least 1 minute');
    if (!formData.startTime) return toast.error('Start time is required');
    if (!formData.endTime) return toast.error('End time is required');
    if (new Date(formData.endTime) <= new Date(formData.startTime)) return toast.error('End time must be after start time');
    const qs = formData.questions;
    if (!qs.length) return toast.error('Add at least one question');
    for (let i = 0; i < qs.length; i++) {
      if (!qs[i].question.trim()) return toast.error(`Question ${i + 1} text is required`);
      if (qs[i].options.some(o => !o.text.trim())) return toast.error(`All options for Question ${i + 1} must be filled`);
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        duration: Number(formData.duration),
        questions: qs.map(q => ({
          question: q.question,
          options: q.options,
          correctOption: q.correctOption,
          explanation: q.explanation
        }))
      };

      if (view === 'edit' && selectedTest) {
        await aptitudeService.adminUpdateTest(selectedTest.id, payload);
        toast.success('Test updated!');
      } else {
        await aptitudeService.adminCreateTest(payload);
        toast.success('Test created!');
      }
      await fetchTests();
      setView('list');
    } catch (e) {
      toast.error(e.message || 'Failed to save test');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (testId) => {
    try {
      await aptitudeService.adminDeleteTest(testId);
      toast.success('Test deleted');
      setDeleteConfirm(null);
      fetchTests();
    } catch { toast.error('Failed to delete test'); }
  };

  const toggleActive = async (test) => {
    try {
      await aptitudeService.adminUpdateTest(test.id, { isActive: !test.isActive });
      toast.success(`Test ${!test.isActive ? 'activated' : 'deactivated'}`);
      fetchTests();
    } catch { toast.error('Failed to update'); }
  };

  // Question helpers
  const addQuestion = () => setFormData(p => ({ ...p, questions: [...p.questions, emptyQuestion()] }));
  const removeQuestion = (key) => setFormData(p => ({ ...p, questions: p.questions.filter(q => q._key !== key) }));
  const updateQuestion = (key, field, value) => setFormData(p => ({ ...p, questions: p.questions.map(q => q._key === key ? { ...q, [field]: value } : q) }));
  const updateOption = (key, optIdx, value) => setFormData(p => ({ ...p, questions: p.questions.map(q => q._key === key ? { ...q, options: q.options.map((o, i) => i === optIdx ? { ...o, text: value } : o) } : q) }));

  const filtered = tests.filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()));

  /* ── List View ── */
  if (view === 'list') return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Header icon={<Brain size={22} color="#fff" />} title="Aptitude Manager" subtitle="Create and manage placement aptitude tests">
          <button onClick={openCreate} style={btnPrimary}><Plus size={16} /> New Test</button>
        </Header>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tests..." style={inputStyle({ paddingLeft: 36 })} />
          </div>
        </div>

        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <Empty icon={<Brain size={40} />} text="No aptitude tests yet" action={<button onClick={openCreate} style={btnPrimary}><Plus size={15} /> Create First Test</button>} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map(test => {
              const status = getStatus(test);
              return (
                <div key={test.id} style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        {/* Status badge */}
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: 50, color: status.color, background: status.bg, border: `1px solid ${status.border}`, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {status.label === 'Live' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />}
                          {status.label}
                        </span>
                        <span style={{ ...diffStyle(test.difficulty), fontSize: '0.72rem', fontWeight: 600, padding: '2px 10px', borderRadius: 50 }}>
                          {test.difficulty}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.2)', padding: '2px 10px', borderRadius: 50, textTransform: 'capitalize' }}>
                          {test.category}
                        </span>
                        {!test.isActive && <span style={{ fontSize: '0.72rem', color: '#64748b', background: 'rgba(100,116,139,0.15)', border: '1px solid rgba(100,116,139,0.25)', padding: '2px 10px', borderRadius: 50 }}>Inactive</span>}
                      </div>
                      <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>{test.title}</h3>
                      {test.description && <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{test.description}</p>}
                      <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
                        <Stat icon={<BarChart2 size={12} />} val={`${test._count?.questions ?? test.questionCount ?? '?'} Q`} />
                        <Stat icon={<Clock size={12} />} val={`${test.duration} min`} />
                        <Stat icon={<Users size={12} />} val={`${test._count?.attempts ?? 0} attempts`} />
                        {test.startTime && <Stat icon={<Calendar size={12} />} val={new Date(test.startTime).toLocaleString()} />}
                        {test.endTime && <Stat icon={<Calendar size={12} />} val={`→ ${new Date(test.endTime).toLocaleString()}`} />}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <IconBtn onClick={() => openSubmissions(test)} title="View submissions"><Eye size={15} /></IconBtn>
                      <IconBtn onClick={() => openEdit(test)} title="Edit"><Edit2 size={15} /></IconBtn>
                      <IconBtn onClick={() => toggleActive(test)} title={test.isActive ? 'Deactivate' : 'Activate'}
                        style={{ color: test.isActive ? '#34d399' : '#64748b' }}>
                        <CheckCircle size={15} />
                      </IconBtn>
                      <IconBtn onClick={() => setDeleteConfirm(test.id)} title="Delete" style={{ color: '#f87171' }}><Trash2 size={15} /></IconBtn>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {deleteConfirm && (
        <Modal onClose={() => setDeleteConfirm(null)}>
          <AlertTriangle size={36} color="#f59e0b" style={{ margin: '0 auto 12px', display: 'block' }} />
          <h2 style={{ textAlign: 'center', color: '#f1f5f9', margin: '0 0 8px', fontSize: '1.1rem' }}>Delete Test?</h2>
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', marginBottom: 20 }}>This will permanently delete the test and all student attempts.</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setDeleteConfirm(null)} style={btnGhost}>Cancel</button>
            <button onClick={() => handleDelete(deleteConfirm)} style={{ ...btnPrimary, background: 'linear-gradient(135deg,#dc2626,#ef4444)', flex: 1 }}>Delete</button>
          </div>
        </Modal>
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );

  /* ── Submissions View ── */
  if (view === 'submissions') return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <button onClick={() => setView('list')} style={backBtn}><ChevronLeft size={16} /> Back</button>
        <Header icon={<Users size={20} color="#fff" />} title={`Submissions — ${selectedTest?.title}`} subtitle="Student attempt results" />
        {loadingSubmissions ? <LoadingSpinner /> : submissions.length === 0 ? (
          <Empty icon={<Users size={36} />} text="No submissions yet" />
        ) : (
          <div style={{ background: 'rgba(15,10,40,0.6)', border: '1px solid rgba(139,92,246,0.22)', borderRadius: 16, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(15,10,40,0.4)' }}>
                  {['Rank','Name','Batch','Roll No','Score','%','Time','Submitted At'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.map((s, i) => (
                  <tr key={s.attemptId} style={{ borderTop: '1px solid rgba(139,92,246,0.1)', background: i % 2 ? 'rgba(15,10,40,0.2)' : 'transparent' }}>
                    <td style={{ padding: '10px 14px', color: i < 3 ? ['#f59e0b','#94a3b8','#cd7c2f'][i] : '#64748b', fontWeight: 700 }}>#{s.rank}</td>
                    <td style={{ padding: '10px 14px', color: '#e2e8f0', fontSize: '0.87rem' }}>{s.name}</td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '0.82rem', textTransform: 'capitalize' }}>{s.batch}</td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '0.82rem' }}>{s.rollNo}</td>
                    <td style={{ padding: '10px 14px', color: '#c4b5fd', fontWeight: 600 }}>{s.score}/{s.maxScore}</td>
                    <td style={{ padding: '10px 14px', color: s.percentage >= 70 ? '#10b981' : '#94a3b8' }}>{s.percentage}%</td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '0.82rem' }}>{Math.floor(s.timeTaken/60)}m{s.timeTaken%60}s</td>
                    <td style={{ padding: '10px 14px', color: '#475569', fontSize: '0.78rem' }}>{s.submittedAt ? new Date(s.submittedAt).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  /* ── Create / Edit Form ── */
  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <button onClick={() => setView('list')} style={backBtn}><ChevronLeft size={16} /> Back</button>
        <Header
          icon={view === 'edit' ? <Edit2 size={20} color="#fff" /> : <Plus size={20} color="#fff" />}
          title={view === 'edit' ? 'Edit Aptitude Test' : 'Create Aptitude Test'}
          subtitle="Fill in test details and add questions below"
        />

        {/* Test metadata */}
        <div style={cardStyle}>
          <h3 style={sectionTitle}>Test Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <Label>Title *</Label>
              <input value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Quantitative Aptitude — Basic" style={inputStyle()} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <Label>Description</Label>
              <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Brief description..." rows={2} style={{ ...inputStyle(), resize: 'vertical' }} />
            </div>
            <div>
              <Label>Category</Label>
              <select value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} style={inputStyle()}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <Label>Difficulty</Label>
              <select value={formData.difficulty} onChange={e => setFormData(p => ({ ...p, difficulty: e.target.value }))} style={inputStyle()}>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <Label>Duration (minutes) *</Label>
              <input type="number" min={1} value={formData.duration} onChange={e => setFormData(p => ({ ...p, duration: e.target.value }))} style={inputStyle()} />
            </div>
            {view === 'edit' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Label style={{ marginBottom: 0 }}>Active</Label>
                <button
                  onClick={() => setFormData(p => ({ ...p, isActive: !p.isActive }))}
                  style={{ width: 42, height: 24, borderRadius: 50, background: formData.isActive ? '#7c3aed' : '#374151', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}
                >
                  <span style={{ position: 'absolute', top: 3, left: formData.isActive ? 20 : 4, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </button>
              </div>
            )}
            <div>
              <Label>Start Time *</Label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={e => setFormData(p => ({ ...p, startTime: e.target.value }))}
                style={inputStyle()}
              />
            </div>
            <div>
              <Label>End Time *</Label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={e => setFormData(p => ({ ...p, endTime: e.target.value }))}
                style={inputStyle()}
              />
            </div>
          </div>
        </div>

        {/* Questions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '24px 0 14px' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#c4b5fd' }}>Questions ({formData.questions.length})</h3>
          <button onClick={addQuestion} style={{ ...btnPrimary, fontSize: '0.8rem', padding: '7px 14px' }}><Plus size={14} /> Add Question</button>
        </div>

        {formData.questions.map((q, qi) => (
          <div key={q._key} style={{ ...cardStyle, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7c3aed', background: 'rgba(124,58,237,0.15)', padding: '3px 10px', borderRadius: 50 }}>Q{qi + 1}</span>
              {formData.questions.length > 1 && (
                <button onClick={() => removeQuestion(q._key)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}><Trash2 size={14} /></button>
              )}
            </div>
            <textarea
              value={q.question}
              onChange={e => updateQuestion(q._key, 'question', e.target.value)}
              placeholder="Enter question text..."
              rows={2}
              style={{ ...inputStyle(), resize: 'vertical', marginBottom: 12 }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {q.options.map((opt, oi) => (
                <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => updateQuestion(q._key, 'correctOption', OPTION_LABELS[oi])}
                    title="Mark as correct answer"
                    style={{ width: 28, height: 28, borderRadius: '50%', border: q.correctOption === OPTION_LABELS[oi] ? '2px solid #10b981' : '1px solid rgba(139,92,246,0.3)', background: q.correctOption === OPTION_LABELS[oi] ? '#10b98133' : 'transparent', color: q.correctOption === OPTION_LABELS[oi] ? '#10b981' : '#64748b', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}
                  >
                    {OPTION_LABELS[oi]}
                  </button>
                  <input
                    value={opt.text}
                    onChange={e => updateOption(q._key, oi, e.target.value)}
                    placeholder={`Option ${OPTION_LABELS[oi]}`}
                    style={{ ...inputStyle(), flex: 1 }}
                  />
                </div>
              ))}
            </div>
            <div>
              <Label>Explanation (optional)</Label>
              <input value={q.explanation} onChange={e => updateQuestion(q._key, 'explanation', e.target.value)} placeholder="Explain why the answer is correct..." style={inputStyle()} />
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <button onClick={() => setView('list')} style={btnGhost}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
            <Save size={15} /> {saving ? 'Saving...' : view === 'edit' ? 'Update Test' : 'Create Test'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Shared helpers ── */
const pageStyle = { minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif', padding: '28px 20px' };
const cardStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 22, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' };
const sectionTitle = { margin: '0 0 16px', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' };
const btnPrimary = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'linear-gradient(135deg,#7c3aed,#6366f1)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' };
const btnGhost = { padding: '9px 18px', background: 'transparent', border: '1px solid #e2e8f0', borderRadius: 10, color: '#64748b', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' };
const backBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem', marginBottom: 20, fontFamily: 'inherit' };
const inputStyle = (extra = {}) => ({ width: '100%', padding: '9px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 9, color: '#1e293b', fontSize: '0.87rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', ...extra });

function Header({ icon, title, subtitle, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 42, height: 42, background: 'linear-gradient(135deg,#7c3aed,#6366f1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#1e293b' }}>{title}</h1>
          {subtitle && <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>{subtitle}</p>}
        </div>
      </div>
      {children && <div>{children}</div>}
    </div>
  );
}

function Label({ children, style }) { return <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: 5, ...style }}>{children}</label>; }
function Stat({ icon, val }) { return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.76rem', color: '#64748b' }}>{icon} {val}</span>; }
function IconBtn({ children, style, ...props }) { return <button {...props} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 5, borderRadius: 7, display: 'flex', alignItems: 'center', ...style }}>{children}</button>; }
function LoadingSpinner() { return <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}><div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>Loading...</div>; }
function Empty({ icon, text, action }) { return <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}><div style={{ opacity: 0.3, margin: '0 auto 10px' }}>{icon}</div><p style={{ margin: '0 0 14px' }}>{text}</p>{action}</div>; }
function Modal({ children, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#13102b', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 18, padding: 28, width: 360, maxWidth: '90%' }}>
        <button onClick={onClose} style={{ float: 'right', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={18} /></button>
        {children}
      </div>
    </div>
  );
}
