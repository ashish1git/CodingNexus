import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check, CheckCircle2, ChevronLeft, ChevronRight,
  Users, Loader2, Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { recruitmentService } from '../../services/recruitmentService';

const STEPS = ['Choose Role', 'Your Details', 'Role Questions', 'Review & Submit'];

export default function RecruitmentForm() {
  const navigate = useNavigate();

  // ── State ──
  const [openRoles, setOpenRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState(null);
  const [common, setCommon] = useState({
    fullName: '', moodleId: '', whatsappNo: '', email: '', branch: 'CSE AIML', year: '',
  });
  const [roleAnswers, setRoleAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  // ── Fetch open roles ──
  useEffect(() => {
    (async () => {
      try {
        const res = await recruitmentService.getOpenRoles();
        if (res.success) setOpenRoles(res.roles || []);
      } catch {
        toast.error('Failed to load recruitment info');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Helpers ──
  const handleCommonChange = (e) => {
    const { name, value } = e.target;
    setCommon((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleRoleAnswer = (questionId, value) => {
    setRoleAnswers((prev) => ({ ...prev, [questionId]: value }));
    setErrors((prev) => ({ ...prev, [questionId]: '' }));
  };

  const getQuestions = () => {
    if (!selectedRole) return [];
    const role = openRoles.find((r) => r.role === selectedRole);
    return role?.questions || [];
  };

  // ── Validation ──
  const validateStep = (s) => {
    const newErrors = {};
    if (s === 0 && !selectedRole) {
      toast.error('Please select a role to apply for');
      return false;
    }
    if (s === 1) {
      const fields = [
        { key: 'fullName', label: 'Full Name' },
        { key: 'moodleId', label: 'Moodle ID' },
        { key: 'whatsappNo', label: 'WhatsApp Number' },
        { key: 'email', label: 'Email Address' },
        { key: 'branch', label: 'Branch' },
        { key: 'year', label: 'Year' },
      ];
      let valid = true;
      for (const f of fields) {
        if (!common[f.key]?.trim()) {
          newErrors[f.key] = `${f.label} is required`;
          valid = false;
        }
      }
      if (common.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(common.email)) {
        newErrors.email = 'Invalid email format';
        valid = false;
      }
      if (common.whatsappNo && common.whatsappNo.trim().length < 8) {
        newErrors.whatsappNo = 'Must be at least 8 characters';
        valid = false;
      }
      setErrors(newErrors);
      if (!valid) toast.error('Please fill in all required fields');
      return valid;
    }
    if (s === 2) {
      const questions = getQuestions();
      let valid = true;
      for (const q of questions) {
        if (q.required) {
          const answer = roleAnswers[q.id];
          if (
            answer === undefined || answer === null ||
            (typeof answer === 'string' && !answer.trim()) ||
            (Array.isArray(answer) && answer.length === 0)
          ) {
            newErrors[q.id] = 'This field is required';
            valid = false;
          }
        }
      }
      setErrors(newErrors);
      if (!valid) toast.error('Please answer all required questions');
      return valid;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    setSubmitting(true);
    try {
      const payload = {
        role: selectedRole,
        ...common,
        roleAnswers,
      };
      const res = await recruitmentService.submitApplication(payload);
      if (res.success) {
        setShowSuccess(true);
      } else {
        toast.error(res.error || 'Failed to submit');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render helpers ──
  const renderCommonField = (field) => {
    const val = common[field.id] || '';
    const err = errors[field.id];
    const base = `w-full px-4 py-3 rounded-xl border transition-colors outline-none ${
      err ? 'border-red-400 focus:ring-2 focus:ring-red-500' : 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
    }`;

    return (
      <div key={field.id}>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        {field.type === 'select' ? (
          <select name={field.id} value={val} onChange={handleCommonChange} className={base}>
            <option value="">Select {field.label}</option>
            {(field.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input
            type={field.type}
            name={field.id}
            value={val}
            onChange={handleCommonChange}
            placeholder={field.placeholder}
            className={base}
          />
        )}
        {err && <p className="text-red-500 text-xs mt-1">{err}</p>}
      </div>
    );
  };

  const renderRoleQuestion = (q) => {
    const val = roleAnswers[q.id];
    const err = errors[q.id];
    const base = `w-full px-4 py-3 rounded-xl border transition-colors outline-none ${
      err ? 'border-red-400 focus:ring-2 focus:ring-red-500' : 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
    }`;

    return (
      <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-5">
        <label className="block text-sm font-semibold text-gray-800 mb-3">
          {q.label} {q.required && <span className="text-red-500">*</span>}
        </label>

        {q.type === 'text' && (
          <input
            type="text"
            value={typeof val === 'string' ? val : ''}
            onChange={(e) => handleRoleAnswer(q.id, e.target.value)}
            placeholder={q.placeholder}
            className={base}
          />
        )}

        {q.type === 'textarea' && (
          <textarea
            value={typeof val === 'string' ? val : ''}
            onChange={(e) => handleRoleAnswer(q.id, e.target.value)}
            placeholder={q.placeholder}
            rows={4}
            className={`${base} resize-y min-h-[100px]`}
          />
        )}

        {q.type === 'select' && (
          <select
            value={typeof val === 'string' ? val : ''}
            onChange={(e) => handleRoleAnswer(q.id, e.target.value)}
            className={base}
          >
            <option value="">Select...</option>
            {(q.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        )}

        {q.type === 'checkbox' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {(q.options || []).map((opt) => {
              const checked = Array.isArray(val) && val.includes(opt);
              return (
                <label
                  key={opt}
                  className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${
                    checked ? 'bg-indigo-50 border-indigo-400' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const arr = Array.isArray(val) ? [...val] : [];
                      const idx = arr.indexOf(opt);
                      if (idx > -1) arr.splice(idx, 1);
                      else arr.push(opt);
                      handleRoleAnswer(q.id, arr);
                    }}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span className="text-sm font-medium text-gray-700">{opt}</span>
                </label>
              );
            })}
          </div>
        )}

        {q.type === 'range' && (
          <div className="space-y-2">
            <input
              type="range"
              min={q.min || 1}
              max={q.max || 10}
              value={typeof val === 'number' ? val : Math.floor(((q.min || 1) + (q.max || 10)) / 2)}
              onChange={(e) => handleRoleAnswer(q.id, parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{q.min || 1}</span>
              <span className="text-lg font-bold text-indigo-600">{typeof val === 'number' ? val : Math.floor(((q.min || 1) + (q.max || 10)) / 2)}</span>
              <span>{q.max || 10}</span>
            </div>
          </div>
        )}

        {err && <p className="text-red-500 text-xs mt-1">{err}</p>}
      </div>
    );
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
          <p className="text-gray-500 mt-3">Loading recruitment info...</p>
        </div>
      </div>
    );
  }

  // ── Success Modal ──
  if (showSuccess) {
    const roleLabel = openRoles.find((r) => r.role === selectedRole)?.label || selectedRole;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 sm:p-10 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce shadow-lg">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Application Submitted!</h2>
          <p className="text-gray-600 mb-2">
            Thank you for applying to <span className="font-semibold text-indigo-600">{roleLabel}</span>.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-gray-700">
              ✅ <span className="font-semibold">Your response has been received.</span>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              The Coding Nexus team will review your application and reach out via email or WhatsApp.
            </p>
          </div>
          <div className="space-y-1.5 text-sm text-gray-500 mb-6">
            <p>📧 Check your email for a confirmation message</p>
            <p>📱 Keep your WhatsApp accessible</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-cyan-700 transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── No open roles ──
  if (!loading && openRoles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 sm:p-10 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Open Positions</h2>
          <p className="text-gray-500 mb-6">
            We're not currently accepting applications. Check back later for recruitment updates.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── Main Form ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-cyan-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Back button */}
        <button
          onClick={() => (step > 0 ? handleBack() : navigate('/'))}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-indigo-600 transition-colors mb-6 font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          {step > 0 ? 'Back' : 'Home'}
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Join Coding Nexus</h1>
          <p className="text-gray-500 mt-2">Fill out this form to apply for a role in our team.</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    i < step ? 'bg-indigo-600 text-white' :
                    i === step ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {i < step ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`hidden sm:block text-xs font-medium ${
                    i <= step ? 'text-indigo-700' : 'text-gray-400'
                  }`}>{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 sm:w-16 h-0.5 mx-2 ${
                    i < step ? 'bg-indigo-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8">
          {/* Step 0: Role Selection - Dropdown */}
          {step === 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Choose a role</h2>
              <p className="text-sm text-gray-500 mb-6">Select the position you'd like to apply for.</p>
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Available Roles <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedRole || ''}
                  onChange={(e) => { setSelectedRole(e.target.value || null); setRoleAnswers({}); setErrors({}); }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-800 bg-white"
                >
                  <option value="">— Select a role —</option>
                  {openRoles.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.label}{r.expiresAt ? ` (Closes ${new Date(r.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })})` : ''}
                    </option>
                  ))}
                </select>
                {selectedRole && (
                  <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                    <p className="text-sm text-gray-600">{openRoles.find((r) => r.role === selectedRole)?.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 1: Common Fields */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Your Details</h2>
              <p className="text-sm text-gray-500 mb-6">Fill in your basic information.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { id: 'fullName', type: 'text', label: 'Full Name', required: true, placeholder: 'Enter your full name' },
                  { id: 'moodleId', type: 'text', label: 'Moodle ID', required: true, placeholder: 'e.g., 12345' },
                  { id: 'whatsappNo', type: 'tel', label: 'WhatsApp Number', required: true, placeholder: '+91 98765 43210' },
                  { id: 'email', type: 'email', label: 'Email Address', required: true, placeholder: 'you@example.com' },
                ].map(renderCommonField)}
                {/* Branch - fixed */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Branch <span className="text-red-500">*</span>
                  </label>
                  <div className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-100 text-gray-700 font-medium">
                    CSE AIML
                  </div>
                </div>
                {/* Year - SE & TE only */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="year"
                    value={common.year}
                    onChange={handleCommonChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-800 bg-white"
                  >
                    <option value="">Select Year</option>
                    <option value="SE">SE</option>
                    <option value="TE">TE</option>
                  </select>
                  {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Role Questions */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {openRoles.find((r) => r.role === selectedRole)?.label || 'Role'} Questions
              </h2>
              <p className="text-sm text-gray-500 mb-6">Answer these questions so we can get to know you better.</p>
              <div className="space-y-4">
                {getQuestions().map(renderRoleQuestion)}
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Review & Submit</h2>
              <p className="text-sm text-gray-500 mb-6">Please review your answers before submitting.</p>

              {/* Selected Role */}
              <div className="bg-indigo-50 rounded-xl p-4 mb-6 border border-indigo-200">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Applying for</p>
                <p className="font-bold text-indigo-700 text-lg">
                  {openRoles.find((r) => r.role === selectedRole)?.label || selectedRole}
                </p>
              </div>

              {/* Common Fields */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">Your Details</h3>
                <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200">
                  {Object.entries(common).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-sm font-semibold text-gray-800">{val || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Role Answers */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">
                  {openRoles.find((r) => r.role === selectedRole)?.label || 'Role'} Answers
                </h3>
                <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200">
                  {getQuestions().map((q) => {
                    const answer = roleAnswers[q.id];
                    const displayVal = Array.isArray(answer) ? answer.join(', ') : (answer ?? '—');
                    return (
                      <div key={q.id} className="px-4 py-3">
                        <p className="text-xs text-gray-500 mb-1">{q.label}</p>
                        <p className="text-sm font-semibold text-gray-800">{displayVal}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            {step > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-semibold transition shadow-sm"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold hover:from-indigo-700 hover:to-cyan-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                ) : (
                  <><Send className="w-4 h-4" /> Submit Application</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
