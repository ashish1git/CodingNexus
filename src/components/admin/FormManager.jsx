import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, ClipboardList, Edit, Trash2, Search, ShieldAlert, Mail, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';
import { hasPermission, getPermissionDeniedMessage } from '../../utils/permissions';

const DIVISIONS = ['FE-A','FE-B','FE-C','SE-A','SE-B','SE-C','TE-A','TE-B','TE-C','BE-A','BE-B','BE-C'];
const BATCHES = ['All','Basic','Advanced'];
const FORM_TYPES = [
  { value: 'survey', label: 'Survey' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'quiz_form', label: 'Quiz Form' }
];

const emptyQuestion = () => ({
  type: 'mcq',
  question: '',
  options: { A: '', B: '', C: '', D: '' },
  correctAnswer: '',
  required: true
});

const FormManager = () => {
  const { userDetails } = useAuth();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', batch: 'All', division: '', formType: 'survey', notifyEmail: false, isActive: true });
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSubmissions, setShowSubmissions] = useState(null);
  const [submissionData, setSubmissionData] = useState(null);

  const canManage = hasPermission(userDetails, 'manageAnnouncements') || userDetails?.role === 'superadmin';

  useEffect(() => { fetchForms(); }, []);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllForms();
      if (res.success) setForms(res.forms || []);
      else toast.error(res.error || 'Failed');
    } catch (e) { toast.error('Failed to load forms'); } finally { setLoading(false); }
  };

  const filtered = forms.filter(f =>
    !searchTerm || f.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || questions.length === 0) { toast.error('Title and at least one question required'); return; }
    const payload = { ...formData, batch: formData.batch, questions };
    try {
      let res;
      if (editMode && selectedForm) { res = await adminService.updateForm(selectedForm.id, payload); }
      else { res = await adminService.createForm(payload); }
      if (res.success) { toast.success(editMode ? 'Updated' : 'Created'); resetForm(); setShowModal(false); fetchForms(); }
      else toast.error(res.error || 'Failed');
    } catch (e) { toast.error('Error saving'); }
  };

  const handleEdit = (form) => {
    setSelectedForm(form); setEditMode(true);
    setFormData({ title: form.title || '', description: form.description || '', batch: form.batch === 'all' ? 'All' : form.batch || 'All', division: form.division || '', formType: form.formType || 'survey', notifyEmail: form.notifyEmail || false, isActive: form.isActive !== false });
    setQuestions(form.questions?.length ? form.questions : [emptyQuestion()]);
    setShowModal(true);
  };

  const handleDelete = async (id) => { if (!confirm('Delete?')) return; const r = await adminService.deleteForm(id); r.success ? (toast.success('Deleted'), fetchForms()) : toast.error(r.error); };

  const viewSubmissions = async (form) => {
    setShowSubmissions(form);
    try {
      const res = await adminService.getFormById(form.id);
      setSubmissionData(res.form || null);
    } catch (e) { toast.error('Failed'); }
  };

  const resetForm = () => { setFormData({ title: '', description: '', batch: 'All', division: '', formType: 'survey', notifyEmail: false, isActive: true }); setQuestions([emptyQuestion()]); setEditMode(false); setSelectedForm(null); };

  const addQuestion = () => setQuestions([...questions, emptyQuestion()]);
  const removeQuestion = (i) => setQuestions(questions.filter((_, idx) => idx !== i));
  const updateQuestion = (i, field, value) => { const qs = [...questions]; qs[i] = { ...qs[i], [field]: value }; setQuestions(qs); };
  const updateOption = (qi, key, value) => { const qs = [...questions]; qs[qi] = { ...qs[qi], options: { ...qs[qi].options, [key]: value } }; setQuestions(qs); };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-800"><ArrowLeft className="w-5 h-5"/>Dashboard</Link>
          <h1 className="text-2xl font-bold text-gray-800">Forms & Surveys</h1>
          {canManage && <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><Plus className="w-5 h-5"/>New Form</button>}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {!canManage ? (<div className="text-center py-20"><ShieldAlert className="w-12 h-12 mx-auto text-red-400"/>Access Denied</div>) : <>
          <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"/><input type="text" placeholder="Search forms..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg text-gray-900"/></div>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatBox num={forms.length} label="Total" color="indigo"/>
            <StatBox num={forms.filter(f=>f.formType==='survey').length} label="Surveys" color="blue"/>
            <StatBox num={forms.filter(f=>f.formType==='feedback').length} label="Feedback" color="green"/>
            <StatBox num={forms.filter(f=>f.formType==='quiz_form').length} label="Quiz Forms" color="purple"/>
          </div>
          {loading ? <div className="text-center py-10"><div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"/></div> :
          filtered.length === 0 ? <div className="text-center py-20 text-gray-400"><ClipboardList className="w-12 h-12 mx-auto mb-3"/>No forms</div> :
          <div className="space-y-3">
            {filtered.map(f => (
              <div key={f.id} className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <ClipboardList className="w-5 h-5 text-indigo-500"/>
                      <h3 className="font-semibold text-gray-800">{f.title}</h3>
                      <span className="px-2 py-0.5 text-[0.65rem] font-semibold rounded-full bg-gray-100">{f.formType}</span>
                      <span className="px-2 py-0.5 text-[0.65rem] font-semibold rounded-full bg-blue-100 text-blue-700">{f.batch}</span>
                      {f.division && <span className="px-2 py-0.5 text-[0.65rem] font-semibold rounded-full bg-orange-100 text-orange-700">{f.division}</span>}
                      {!f.isActive && <span className="px-2 py-0.5 text-[0.65rem] font-semibold rounded-full bg-red-100 text-red-600">Inactive</span>}
                    </div>
                    <p className="text-sm text-gray-500">{f.description}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => viewSubmissions(f)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><Users className="w-5 h-5"/></button>
                    <button onClick={() => handleEdit(f)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit className="w-5 h-5"/></button>
                    {userDetails?.role==='superadmin' && <button onClick={() => handleDelete(f.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5"/></button>}
                  </div>
                </div>
              </div>
            ))}
          </div>}
        </>}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 my-8 max-h-[95vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{editMode ? 'Edit' : 'Create'} Form</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Title *</label>
                  <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-gray-900" required/>
                </div>
                <div>
                  <label className="block text-sm font-medium">Type</label>
                  <select value={formData.formType} onChange={e => setFormData({...formData, formType: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-gray-900">
                    {FORM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Batch</label>
                  <select value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value, division: e.target.value==='All'?'':formData.division})} className="w-full px-3 py-2 border rounded-lg text-gray-900">
                    {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${formData.batch==='All'?'text-gray-400':''}`}>Division {formData.batch==='All'&&'(auto)'}</label>
                  <select value={formData.division} onChange={e => setFormData({...formData, division: e.target.value})} disabled={formData.batch==='All'} className="w-full px-3 py-2 border rounded-lg text-gray-900 disabled:bg-gray-100">
                    <option value="">All Divisions</option>
                    {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows="2" className="w-full px-3 py-2 border rounded-lg text-gray-900"/>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})}/><span className="text-sm">Active</span></label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.notifyEmail} onChange={e => setFormData({...formData, notifyEmail: e.target.checked})}/><Mail className="w-4 h-4"/><span className="text-sm">Notify by email</span></label>
              </div>

              {/* Questions */}
              <div>
                <div className="flex items-center justify-between mb-2"><h3 className="font-semibold">Questions</h3><button type="button" onClick={addQuestion} className="text-sm text-indigo-600 font-medium">+ Add Question</button></div>
                {questions.map((q, qi) => (
                  <div key={qi} className="bg-gray-50 rounded-lg p-4 mb-3 border">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-bold text-gray-500">Q{qi+1}</span>
                      <select value={q.type} onChange={e => updateQuestion(qi, 'type', e.target.value)} className="px-2 py-1 border rounded text-sm text-gray-900">
                        <option value="mcq">MCQ (Options)</option>
                        <option value="text">Text (free response)</option>
                        <option value="rating">Rating (1-5)</option>
                      </select>
                      <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={q.required!==false} onChange={e => updateQuestion(qi, 'required', e.target.checked)}/>Required</label>
                      {questions.length > 1 && <button type="button" onClick={() => removeQuestion(qi)} className="ml-auto text-red-500 text-sm">Remove</button>}
                    </div>
                    <input value={q.question} onChange={e => updateQuestion(qi, 'question', e.target.value)} placeholder="Question text" className="w-full px-3 py-2 border rounded-lg text-gray-900 mb-2" required/>
                    {q.type === 'mcq' && (
                      <div className="grid grid-cols-2 gap-2">
                        {['A','B','C','D'].map(k => (
                          <div key={k} className="flex items-center gap-2">
                            <span className="text-xs font-bold w-4">{k}</span>
                            <input value={q.options?.[k]||''} onChange={e => updateOption(qi, k, e.target.value)} placeholder={`Option ${k}`} className="flex-1 px-2 py-1 border rounded text-sm text-gray-900"/>
                          </div>
                        ))}
                        {formData.formType !== 'feedback' && (
                          <div className="col-span-2">
                            <label className="text-xs font-medium">Correct Answer:</label>
                            <select value={q.correctAnswer || ''} onChange={e => updateQuestion(qi, 'correctAnswer', e.target.value)} className="ml-2 px-2 py-1 border rounded text-sm text-gray-900">
                              <option value="">--</option>
                              {['A','B','C','D'].map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700">{editMode?'Update':'Create'} Form</button>
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 bg-gray-200 py-3 rounded-lg font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {showSubmissions && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{showSubmissions.title} — Submissions</h2>
              <button onClick={() => { setShowSubmissions(null); setSubmissionData(null); }} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
            </div>
            {submissionData?.submissions?.length > 0 ? (
              <div className="space-y-3">
                {submissionData.submissions.map(sub => (
                  <div key={sub.id} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{sub.user?.studentProfile?.name || sub.user?.email}</span>
                      <span className="text-xs text-gray-500">{new Date(sub.submittedAt).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-sm text-gray-700 space-y-1">
                      {Object.entries(sub.answers || {}).map(([qi, ans]) => {
                        const q = submissionData.questions?.[qi];
                        return <div key={qi}><span className="font-medium">Q{+qi+1}:</span> {typeof ans === 'object' ? JSON.stringify(ans) : ans || <span className="italic text-gray-400">no answer</span>}</div>;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-500 text-center py-8">No submissions yet</p>}
          </div>
        </div>
      )}
    </div>
  );
};

const StatBox = ({ num, label, color }) => {
  const c = { indigo:'text-indigo-600', blue:'text-blue-600', green:'text-green-600', purple:'text-purple-600' };
  return <div className="bg-white rounded-xl shadow-sm border p-4 text-center"><p className={`text-2xl font-bold ${c[color]}`}>{num}</p><p className="text-xs text-gray-600">{label}</p></div>;
};

export default FormManager;
