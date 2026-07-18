import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Send, CheckCircle } from 'lucide-react';
import { studentService } from '../../services/studentService';
import toast from 'react-hot-toast';

const StudentFormSubmit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [textAnswers, setTextAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [mySubmission, setMySubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchForm(); }, [id]);

  const fetchForm = async () => {
    try {
      const res = await studentService.getFormById(id);
      if (res.success) {
        setForm(res.form);
        if (res.form.mySubmission) { setMySubmission(res.form.mySubmission); setSubmitted(true); setAnswers(res.form.mySubmission.answers || {}); }
      } else toast.error('Form not found');
    } catch (e) { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  const handleMcq = (qi, val) => setAnswers(prev => ({ ...prev, [qi]: val }));
  const handleText = (qi, val) => setTextAnswers(prev => ({ ...prev, [qi]: val }));
  const handleRating = (qi, val) => setAnswers(prev => ({ ...prev, [qi]: val }));

  const handleSubmit = async () => {
    const qs = form?.questions || [];
    for (let i = 0; i < qs.length; i++) {
      if (qs[i].required !== false) {
        const a = qs[i].type === 'text' ? textAnswers[i] : answers[i];
        if (!a || (typeof a === 'string' && !a.trim())) { toast.error(`Question ${i+1} is required`); return; }
      }
    }
    const merged = { ...answers };
    Object.entries(textAnswers).forEach(([k, v]) => { if (v?.trim()) merged[k] = v; });
    setSubmitting(true);
    try {
      const res = await studentService.submitForm(id, merged);
      if (res.success) { toast.success('Submitted!'); setSubmitted(true); setMySubmission(res.submission); }
      else toast.error(res.error || 'Failed');
    } catch (e) { toast.error('Error'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#0b0b1a] flex items-center justify-center"><div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"/></div>;
  if (!form) return <div className="min-h-screen bg-[#0b0b1a] text-white flex items-center justify-center">Form not found</div>;

  const qs = form.questions || [];

  return (
    <div className="min-h-screen bg-[#0b0b1a] text-[#e2e8f0]">
      <div className="sticky top-0 z-50 bg-[#0f0a23]/80 backdrop-blur-xl border-b border-indigo-500/20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/student/forms" className="flex items-center gap-2 text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5"/>Back</Link>
          <h1 className="text-lg font-bold">{form.title}</h1>
          <div className="w-16"/>
        </div>
      </div>

      {submitted ? (
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <div className="bg-white/[0.04] border border-green-500/30 rounded-2xl p-10">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4"/>
            <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
            <p className="text-slate-400 mb-2">Your response has been recorded.</p>
            <p className="text-xs text-slate-600">{new Date(mySubmission?.submittedAt).toLocaleString('en-IN')}</p>
            <button onClick={() => navigate('/student/forms')} className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Back to Forms</button>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {form.description && <p className="text-slate-400 text-sm bg-white/[0.03] rounded-lg p-4 border border-indigo-500/10">{form.description}</p>}

          {qs.map((q, qi) => (
            <div key={qi} className="bg-white/[0.04] border border-indigo-500/10 rounded-xl p-5">
              <p className="font-semibold mb-3">{q.required !== false && <span className="text-red-400 mr-1">*</span>}Q{qi+1}. {q.question}</p>
              {q.type === 'mcq' && (
                <div className="space-y-2">
                  {Object.entries(q.options || {}).map(([k, v]) => (
                    <label key={k} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${answers[qi]===k?'bg-indigo-500/15 border border-indigo-500/30':'hover:bg-white/[0.05]'}`}>
                      <input type="radio" name={`q${qi}`} value={k} checked={answers[qi]===k} onChange={() => handleMcq(qi, k)} className="accent-indigo-500"/>
                      <span className="text-sm">{k}. {v}</span>
                    </label>
                  ))}
                </div>
              )}
              {q.type === 'text' && (
                <textarea value={textAnswers[qi]||''} onChange={e => handleText(qi, e.target.value)} rows="3" placeholder="Type your answer..." className="w-full px-3 py-2 bg-white/5 border border-indigo-500/20 rounded-lg text-white placeholder-slate-500"/>
              )}
              {q.type === 'rating' && (
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => handleRating(qi, n)} className={`w-10 h-10 rounded-full text-sm font-bold transition ${answers[qi]===n?'bg-indigo-600 text-white':'bg-white/5 hover:bg-white/10 text-slate-400'}`}>{n}</button>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-end pt-4 pb-8">
            <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50">
              <Send className="w-4 h-4"/>{submitting?'Submitting...':'Submit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentFormSubmit;
