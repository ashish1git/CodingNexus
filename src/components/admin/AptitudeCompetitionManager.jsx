import React, { useState, useEffect } from 'react';
import {
  Trophy, Plus, Edit2, Trash2, Eye, Search, ChevronLeft,
  Users, Clock, Calendar, BarChart2, X, Save, AlertTriangle, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import aptitudeService from '../../services/aptitudeService';

const CATEGORIES = ['general', 'quantitative', 'logical', 'verbal', 'technical'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

function toLocalInput(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(d.getTime() + istOffset).toISOString().slice(0, 16);
}

function convertISTtoUTC(istDateTimeLocal) {
  if (!istDateTimeLocal) return '';
  const [datePart, timePart] = istDateTimeLocal.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
  utcDate.setMinutes(utcDate.getMinutes() - 330);
  return utcDate.toISOString();
}

const diffStyle = (d) => {
  if (d === 'easy') return { color: '#34d399', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' };
  if (d === 'hard') return { color: '#f87171', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' };
  return { color: '#fde047', background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.3)' };
};

const statusStyle = (s) => {
  if (s === 'live')     return { color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', label: '🔴 Live' };
  if (s === 'upcoming') return { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)', label: 'Upcoming' };
  return { color: '#94a3b8', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.25)', label: 'Ended' };
};

const emptyForm = () => ({
  title: '', description: '', category: 'general', difficulty: 'medium',
  duration: 60, startTime: '', endTime: '',
  maxParticipants: '', showLeaderboard: true, allowLateJoin: false,
  questionIds: [],
});

export default function AptitudeCompetitionManager() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView]    = useState('list'); // 'list' | 'create' | 'edit' | 'submissions'
  const [selected, setSelected] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Question bank picker state
  const [allQuestions, setAllQuestions] = useState([]);
  const [qSearch, setQSearch] = useState('');
  const [loadingQ, setLoadingQ] = useState(false);

  useEffect(() => { fetchCompetitions(); }, []);

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const res = await aptitudeService.adminListCompetitions();
      setCompetitions(Array.isArray(res.data) ? res.data : []);
    } catch { toast.error('Failed to load competitions'); }
    finally { setLoading(false); }
  };

  const loadQuestionBank = async () => {
    if (allQuestions.length) return;
    try {
      setLoadingQ(true);
      const res = await aptitudeService.adminGetAllTests
        ? null : null; // we use the questions endpoint below
      // Use the questions list API
      const r = await fetch('/api/aptitude/questions?limit=200', {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await r.json();
      setAllQuestions(Array.isArray(data.questions) ? data.questions : []);
    } catch { toast.error('Failed to load question bank'); }
    finally { setLoadingQ(false); }
  };

  const openCreate = async () => {
    setFormData(emptyForm());
    setSelected(null);
    setView('create');
    loadQuestionBank();
  };

  const openEdit = async (comp) => {
    try {
      const res = await aptitudeService.adminGetCompetition(comp.id);
      const c = res.data;
      setFormData({
        title: c.title || '',
        description: c.description || '',
        category: c.category || 'general',
        difficulty: c.difficulty || 'medium',
        duration: c.duration || 60,
        startTime: toLocalInput(c.startTime),
        endTime: toLocalInput(c.endTime),
        maxParticipants: c.maxParticipants || '',
        showLeaderboard: c.showLeaderboard !== false,
        allowLateJoin: c.allowLateJoin === true,
        questionIds: (c.questions || []).map(q => q.questionId),
      });
      setSelected(c);
      setView('edit');
      loadQuestionBank();
    } catch { toast.error('Failed to load competition'); }
  };

  const openSubmissions = async (comp) => {
    setSelected(comp);
    setView('submissions');
    setLoadingSubmissions(true);
    try {
      const res = await aptitudeService.adminGetCompetitionSubmissions(comp.id);
      setSubmissions(Array.isArray(res.data) ? res.data : []);
    } catch { toast.error('Failed to load submissions'); }
    finally { setLoadingSubmissions(false); }
  };

  const handleSave = async () => {
    if (!formData.title.trim())      return toast.error('Title is required');
    if (!formData.startTime)         return toast.error('Start time is required');
    if (!formData.endTime)           return toast.error('End time is required');
    if (!formData.questionIds.length) return toast.error('Select at least one question');

    try {
      setSaving(true);
      const payload = {
        ...formData,
        duration: Number(formData.duration),
        maxParticipants: formData.maxParticipants ? Number(formData.maxParticipants) : null,
        startTime: convertISTtoUTC(formData.startTime),
        endTime: convertISTtoUTC(formData.endTime),
      };
      if (view === 'edit' && selected) {
        await aptitudeService.adminUpdateCompetition(selected.id, payload);
        toast.success('Competition updated');
      } else {
        await aptitudeService.adminCreateCompetition(payload);
        toast.success('Competition created');
      }
      fetchCompetitions();
      setView('list');
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await aptitudeService.adminDeleteCompetition(id);
      toast.success('Competition deleted');
      setDeleteConfirm(null);
      fetchCompetitions();
      if (view !== 'list') setView('list');
    } catch { toast.error('Delete failed'); }
  };

  const toggleQuestion = (qId) => {
    setFormData(f => ({
      ...f,
      questionIds: f.questionIds.includes(qId)
        ? f.questionIds.filter(id => id !== qId)
        : [...f.questionIds, qId],
    }));
  };

  const filteredQ = allQuestions.filter(q =>
    !qSearch || q.question?.toLowerCase().includes(qSearch.toLowerCase())
  );

  const filtered = competitions.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Styles ──────────────────────────────────────────────────────────────

  const s = {
    wrap: { minHeight: '100vh', background: '#0f172a', padding: '24px', fontFamily: 'system-ui, sans-serif' },
    card: { background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24, marginBottom: 16 },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    title: { fontSize: 22, fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8 },
    btn: (variant = 'primary') => ({
      padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
      background: variant === 'primary' ? '#6366f1' : variant === 'danger' ? '#ef4444' : 'rgba(255,255,255,0.08)',
      color: '#fff', display: 'flex', alignItems: 'center', gap: 6,
    }),
    input: { width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box' },
    label: { fontSize: 13, color: '#94a3b8', marginBottom: 6, display: 'block' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
    compCard: { background: '#0f172a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 16, marginBottom: 12 },
    badge: (color, bg, border) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, color, background: bg, border: `1px solid ${border}` }),
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (view === 'submissions' && selected) {
    return (
      <div style={s.wrap}>
        <div style={s.card}>
          <div style={s.header}>
            <div style={s.title}><BarChart2 size={20} />{selected.title} — Submissions</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={s.btn('secondary')} onClick={() => setView('list')}><ChevronLeft size={16} />Back</button>
            </div>
          </div>
          {loadingSubmissions ? <p style={{ color: '#94a3b8' }}>Loading…</p> : (
            submissions.length === 0 ? <p style={{ color: '#64748b' }}>No submissions yet.</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#1e293b', color: '#94a3b8' }}>
                      {['Rank', 'Name', 'Batch', 'Roll No', 'Score', '%', 'Time (s)', 'Submitted'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((s2, i) => (
                      <tr key={s2.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: i === 0 ? '#fde047' : '#e2e8f0' }}>
                        <td style={{ padding: '8px 12px' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : s2.rank || i + 1}</td>
                        <td style={{ padding: '8px 12px' }}>{s2.studentName || s2.userId}</td>
                        <td style={{ padding: '8px 12px' }}>{s2.batch || '—'}</td>
                        <td style={{ padding: '8px 12px' }}>{s2.rollNo || '—'}</td>
                        <td style={{ padding: '8px 12px' }}>{s2.score}/{s2.maxScore}</td>
                        <td style={{ padding: '8px 12px' }}>{s2.percentage?.toFixed(1)}%</td>
                        <td style={{ padding: '8px 12px' }}>{s2.timeTaken}</td>
                        <td style={{ padding: '8px 12px' }}>{s2.submittedAt ? new Date(s2.submittedAt).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  if (view === 'create' || view === 'edit') {
    return (
      <div style={s.wrap}>
        <div style={s.card}>
          <div style={s.header}>
            <div style={s.title}><Trophy size={20} />{view === 'edit' ? 'Edit Competition' : 'Create Competition'}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {view === 'edit' && <button style={s.btn('danger')} onClick={() => setDeleteConfirm(selected.id)}><Trash2 size={14} />Delete</button>}
              <button style={s.btn('secondary')} onClick={() => setView('list')}><ChevronLeft size={16} />Back</button>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 20 }}>
            {/* Title + Description */}
            <div style={s.grid2}>
              <div>
                <label style={s.label}>Title *</label>
                <input style={s.input} value={formData.title} onChange={e => setFormData(f => ({ ...f, title: e.target.value }))} placeholder="Competition title" />
              </div>
              <div>
                <label style={s.label}>Description</label>
                <input style={s.input} value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
              </div>
            </div>

            {/* Category + Difficulty + Duration */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={s.label}>Category</label>
                <select style={s.input} value={formData.category} onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Difficulty</label>
                <select style={s.input} value={formData.difficulty} onChange={e => setFormData(f => ({ ...f, difficulty: e.target.value }))}>
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Duration (minutes) *</label>
                <input type="number" style={s.input} min={5} max={300} value={formData.duration} onChange={e => setFormData(f => ({ ...f, duration: e.target.value }))} />
              </div>
            </div>

            {/* Schedule */}
            <div style={s.grid2}>
              <div>
                <label style={s.label}>Start Time (IST) *</label>
                <input type="datetime-local" style={s.input} value={formData.startTime} onChange={e => setFormData(f => ({ ...f, startTime: e.target.value }))} />
              </div>
              <div>
                <label style={s.label}>End Time (IST) *</label>
                <input type="datetime-local" style={s.input} value={formData.endTime} onChange={e => setFormData(f => ({ ...f, endTime: e.target.value }))} />
              </div>
            </div>

            {/* Options */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={s.label}>Max Participants (blank = unlimited)</label>
                <input type="number" style={s.input} min={1} value={formData.maxParticipants} onChange={e => setFormData(f => ({ ...f, maxParticipants: e.target.value }))} placeholder="Unlimited" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <label style={{ ...s.label, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.showLeaderboard} onChange={e => setFormData(f => ({ ...f, showLeaderboard: e.target.checked }))} />
                  Show leaderboard during competition
                </label>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <label style={{ ...s.label, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.allowLateJoin} onChange={e => setFormData(f => ({ ...f, allowLateJoin: e.target.checked }))} />
                  Allow late join after start
                </label>
              </div>
            </div>

            {/* Question Picker */}
            <div>
              <label style={s.label}>Questions ({formData.questionIds.length} selected) *</label>
              <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 12 }}>
                <input
                  style={{ ...s.input, marginBottom: 10 }}
                  placeholder="Search questions…"
                  value={qSearch}
                  onChange={e => setQSearch(e.target.value)}
                />
                {loadingQ ? <p style={{ color: '#94a3b8', fontSize: 13 }}>Loading questions…</p> : (
                  <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {filteredQ.length === 0 && <p style={{ color: '#64748b', fontSize: 13 }}>No questions found. Add questions to the bank first.</p>}
                    {filteredQ.map(q => {
                      const selected2 = formData.questionIds.includes(q.id);
                      return (
                        <div
                          key={q.id}
                          onClick={() => toggleQuestion(q.id)}
                          style={{
                            padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
                            background: selected2 ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${selected2 ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'}`,
                            color: '#e2e8f0', fontSize: 13, display: 'flex', alignItems: 'flex-start', gap: 8,
                          }}
                        >
                          <span style={{ color: selected2 ? '#6366f1' : '#64748b', flexShrink: 0, marginTop: 2 }}>
                            {selected2 ? <CheckCircle size={14} /> : <div style={{ width: 14, height: 14, border: '1px solid #64748b', borderRadius: 3 }} />}
                          </span>
                          <span style={{ flex: 1, lineHeight: 1.4 }}>{q.question}</span>
                          <span style={diffStyle(q.difficulty)}>{q.difficulty}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button style={s.btn('secondary')} onClick={() => setView('list')}>Cancel</button>
              <button style={s.btn()} onClick={handleSave} disabled={saving}>
                <Save size={14} />{saving ? 'Saving…' : 'Save Competition'}
              </button>
            </div>
          </div>
        </div>

        {/* Delete confirm */}
        {deleteConfirm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div style={{ background: '#1e293b', borderRadius: 12, padding: 28, maxWidth: 400, width: '90%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, color: '#f87171' }}>
                <AlertTriangle size={20} /><span style={{ fontWeight: 700, fontSize: 16 }}>Delete Competition?</span>
              </div>
              <p style={{ color: '#94a3b8', marginBottom: 20, fontSize: 14 }}>This will delete all registrations and attempts. This cannot be undone.</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button style={s.btn('secondary')} onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button style={s.btn('danger')} onClick={() => handleDelete(deleteConfirm)}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── List View ────────────────────────────────────────────────────────────
  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.header}>
          <div style={s.title}><Trophy size={22} />Aptitude Competitions</div>
          <button style={s.btn()} onClick={openCreate}><Plus size={16} />Create Competition</button>
        </div>

        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input style={{ ...s.input, paddingLeft: 30 }} placeholder="Search competitions…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? <p style={{ color: '#94a3b8' }}>Loading…</p> : filtered.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '40px 0' }}>No competitions yet. Create one!</p>
        ) : filtered.map(c => {
          const st = statusStyle(c.status);
          return (
            <div key={c.id} style={s.compCard}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 15 }}>{c.title}</span>
                    <span style={{ ...s.badge(st.color, st.bg, st.border) }}>{st.label}</span>
                    <span style={{ ...s.badge(...Object.values(diffStyle(c.difficulty))) }}>{c.difficulty}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b', flexWrap: 'wrap' }}>
                    <span><Calendar size={11} style={{ display: 'inline', marginRight: 3 }} />{new Date(c.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} → {new Date(c.endTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span><Clock size={11} style={{ display: 'inline', marginRight: 3 }} />{c.duration} min</span>
                    <span><Users size={11} style={{ display: 'inline', marginRight: 3 }} />{c._count?.registrations ?? 0} registered / {c._count?.attempts ?? 0} submitted</span>
                    <span>{c._count?.questions ?? 0} questions</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={s.btn('secondary')} title="View Submissions" onClick={() => openSubmissions(c)}><BarChart2 size={14} /></button>
                  <button style={s.btn('secondary')} title="Edit" onClick={() => openEdit(c)}><Edit2 size={14} /></button>
                  <button style={s.btn('danger')} title="Delete" onClick={() => setDeleteConfirm(c.id)}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 28, maxWidth: 400, width: '90%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, color: '#f87171' }}>
              <AlertTriangle size={20} /><span style={{ fontWeight: 700, fontSize: 16 }}>Delete Competition?</span>
            </div>
            <p style={{ color: '#94a3b8', marginBottom: 20, fontSize: 14 }}>All registrations and attempts will be permanently deleted.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={s.btn('secondary')} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button style={s.btn('danger')} onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
