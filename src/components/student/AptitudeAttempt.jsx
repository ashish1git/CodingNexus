import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Brain, Clock, ChevronLeft, ChevronRight, Send, AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import aptitudeService from '../../services/aptitudeService';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function AptitudeAttempt() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef(null);

  useEffect(() => {
    loadTest();
    return () => clearInterval(timerRef.current);
  }, [testId]);

  const loadTest = async () => {
    try {
      setLoading(true);
      const data = await aptitudeService.getTest(testId);
      if (!data.test) { toast.error('Test not found'); navigate('/student/aptitude'); return; }
      const t = data.test;

      // Cap the countdown: use the lesser of (duration) and (seconds until endTime)
      let effectiveSecs = t.duration * 60;
      if (t.endTime) {
        const secsUntilEnd = Math.floor((new Date(t.endTime).getTime() - Date.now()) / 1000);
        effectiveSecs = Math.min(effectiveSecs, Math.max(0, secsUntilEnd));
      }

      setTest(t);
      setTimeLeft(effectiveSecs);
      startTimeRef.current = Date.now();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to load test';
      toast.error(msg);
      navigate('/student/aptitude');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = useCallback(async (auto = false) => {
    if (submitting) return;
    clearInterval(timerRef.current);
    setSubmitting(true);
    if (auto) toast('Time up! Submitting...', { icon: '⏰' });
    try {
      const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const result = await aptitudeService.submitAttempt(testId, answers, timeTaken);
      if (result.success) {
        toast.success('Submitted successfully!');
        navigate(`/student/aptitude/${testId}/results`, { state: { attempt: result.attempt } });
      } else {
        toast.error(result.error || 'Submission failed');
        setSubmitting(false);
      }
    } catch {
      toast.error('Submission failed');
      setSubmitting(false);
    }
  }, [answers, testId, navigate, submitting]);

  useEffect(() => {
    if (!test) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [test, handleSubmit]);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-slate-400">
        <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        Loading test...
      </div>
    </div>
  );

  if (!test) return null;

  const questions = test.questions || [];
  const current = questions[currentIdx];
  const answered = Object.keys(answers).length;
  const total = questions.length;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isUrgent = timeLeft < 60;
  const progress = Math.round((answered / total) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Top bar */}
      <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <Brain className="w-5 h-5 text-violet-400 flex-shrink-0" />
              <span className="font-semibold text-white text-sm truncate">{test.title}</span>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-slate-400 text-xs hidden sm:block">
                {answered}/{total} answered
              </span>
              {/* Timer */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-bold ${
                isUrgent
                  ? 'bg-red-900/40 border-red-700/60 text-red-300 animate-pulse'
                  : 'bg-slate-700 border-slate-600 text-white'
              }`}>
                <Clock className="w-4 h-4" />
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-slate-700">
            <div
              className="h-1 bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6 items-start">
          {/* Question panel */}
          <div className="flex-1 min-w-0">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-4">
              {/* Q counter */}
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-violet-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  Question {currentIdx + 1} of {total}
                </span>
              </div>

              {/* Question text */}
              <p className="text-white text-base sm:text-lg font-medium leading-relaxed mb-6">
                {current.question}
              </p>

              {/* Options */}
              <div className="flex flex-col gap-3">
                {(current.options || []).map((opt, i) => {
                  const label = OPTION_LABELS[i];
                  const selected = answers[current.id] === label;
                  const optText = typeof opt === 'object' ? opt.text : opt;

                  return (
                    <button
                      key={label}
                      onClick={() => setAnswers(prev => ({ ...prev, [current.id]: label }))}
                      className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-150 ${
                        selected
                          ? 'bg-violet-600/20 border-violet-500 text-white'
                          : 'bg-slate-700/40 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <span className={`w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold border ${
                        selected
                          ? 'bg-violet-600 border-violet-500 text-white'
                          : 'bg-slate-600 border-slate-500 text-slate-300'
                      }`}>
                        {label}
                      </span>
                      <span className="leading-relaxed pt-0.5">{optText}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentIdx(p => Math.max(0, p - 1))}
                disabled={currentIdx === 0}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm font-medium"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              {currentIdx < total - 1 ? (
                <button
                  onClick={() => setCurrentIdx(p => p + 1)}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600/20 border border-violet-500/50 rounded-lg text-violet-300 hover:bg-violet-600/30 transition text-sm font-medium"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-semibold text-sm transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" /> Submit Test
                </button>
              )}
            </div>
          </div>

          {/* Question palette sidebar */}
          <div className="w-56 flex-shrink-0 hidden md:block">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sticky top-20">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">
                Questions
              </p>

              <div className="grid grid-cols-5 gap-1.5 mb-4">
                {questions.map((q, i) => {
                  const done = !!answers[q.id];
                  const active = i === currentIdx;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIdx(i)}
                      className={`w-9 h-9 rounded-lg text-xs font-bold transition ${
                        active
                          ? 'bg-violet-600 text-white'
                          : done
                          ? 'bg-green-700/50 border border-green-600/60 text-green-300'
                          : 'bg-slate-700 border border-slate-600 text-slate-400 hover:bg-slate-600'
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-green-700/50 border border-green-600/60 flex-shrink-0" />
                  Answered ({answered})
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-slate-700 border border-slate-600 flex-shrink-0" />
                  Not answered ({total - answered})
                </div>
              </div>

              <button
                onClick={() => setShowConfirm(true)}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-semibold text-sm transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" /> Submit
              </button>
            </div>
          </div>
        </div>

        {/* Mobile submit button */}
        <div className="md:hidden mt-4">
          <button
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 rounded-xl text-white font-semibold transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> Submit Test ({answered}/{total} answered)
          </button>
        </div>
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
              <button onClick={() => setShowConfirm(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <h2 className="text-white font-bold text-lg mb-2">Submit Test?</h2>
            <p className="text-slate-300 text-sm mb-1">
              You've answered <span className="text-violet-300 font-semibold">{answered}</span> out of{' '}
              <span className="text-violet-300 font-semibold">{total}</span> questions.
            </p>
            {answered < total && (
              <p className="text-yellow-400 text-sm mb-4">
                {total - answered} question(s) will be left unanswered.
              </p>
            )}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-slate-300 hover:bg-slate-600 transition font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowConfirm(false); handleSubmit(); }}
                className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 rounded-xl text-white font-semibold text-sm transition"
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
