import { useState, useEffect, useRef, useCallback } from 'react';
import aptitudeService from '../services/aptitudeService';
import toast from 'react-hot-toast';

// Per-question time limit in seconds (0 = no per-question limit, only global)
const PER_QUESTION_SECS = 0;

/**
 * usePracticeEngine
 *
 * Centralises all practice session state and logic.
 * Components only need to call the returned handlers — no raw API calls.
 *
 * Lifecycle:
 *   idle → loading → active → reviewing → finished
 *
 * Supports:
 *   - Static mode  (questions from DB question bank)
 *   - AI mode      (Gemini-generated questions, falls back to static on error)
 *   - Per-answer immediate feedback with explanation
 *   - Global countdown timer (optional — pass timeLimitSecs=0 to disable)
 *   - Question navigation
 *   - Auto-finish when all questions answered
 */
export function usePracticeEngine() {
  // ── Session state ─────────────────────────────────────────────────────────
  const [phase, setPhase]             = useState('idle');       // idle | loading | active | reviewing | finished
  const [sessionId, setSessionId]     = useState(null);
  const [questions, setQuestions]     = useState([]);
  const [mode, setMode]               = useState('static');     // static | ai
  const [config, setConfig]           = useState({});           // { category, difficulty, count }

  // ── Per-question answer state ─────────────────────────────────────────────
  const [currentIdx, setCurrentIdx]   = useState(0);
  const [answers, setAnswers]         = useState({});           // { questionId: selected }
  const [feedback, setFeedback]       = useState({});           // { questionId: { isCorrect, correctOption, explanation } }
  const [submitting, setSubmitting]   = useState(false);

  // ── Timer ─────────────────────────────────────────────────────────────────
  const [timeLeft, setTimeLeft]       = useState(0);            // seconds remaining (global)
  const [questionTime, setQTime]      = useState(0);            // seconds on current question
  const timerRef                      = useRef(null);
  const qTimerRef                     = useRef(null);
  const startTimeRef                  = useRef(null);
  const qStartRef                     = useRef(null);

  // ── Summary (after finish) ────────────────────────────────────────────────
  const [summary, setSummary]         = useState(null);

  // ── Derived ──────────────────────────────────────────────────────────────
  const total        = questions.length;
  const current      = questions[currentIdx] || null;
  const answered     = Object.keys(answers).length;
  const allAnswered  = answered >= total && total > 0;

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearInterval(qTimerRef.current);
    };
  }, []);

  // ── Reset per-question timer on navigation ────────────────────────────────
  useEffect(() => {
    if (phase !== 'active') return;
    clearInterval(qTimerRef.current);
    setQTime(0);
    qStartRef.current = Date.now();
    if (PER_QUESTION_SECS > 0) {
      qTimerRef.current = setInterval(() => setQTime(p => p + 1), 1000);
    }
    return () => clearInterval(qTimerRef.current);
  }, [currentIdx, phase]);

  // ── Start a new practice session ─────────────────────────────────────────
  const startSession = useCallback(async ({
    category,
    topicId,
    difficulty,
    count        = 10,
    mode: m      = 'static',
    timeLimitMins = 0,         // 0 = no time limit
  }) => {
    setPhase('loading');
    setAnswers({});
    setFeedback({});
    setSummary(null);
    setCurrentIdx(0);

    try {
      const data = await aptitudeService.startPractice({ category, topicId, difficulty, count, mode: m });

      if (!data.success || !data.questions?.length) {
        toast.error(data.error || 'No questions found for your selection.');
        setPhase('idle');
        return;
      }

      setSessionId(data.sessionId);
      setQuestions(data.questions);
      setMode(data.mode || m);
      setConfig({ category, topicId, difficulty, count });

      // Start global timer if configured
      const secs = timeLimitMins > 0 ? timeLimitMins * 60 : 0;
      setTimeLeft(secs);
      startTimeRef.current = Date.now();

      if (secs > 0) {
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              // Auto-finish when global timer expires
              finishSession();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }

      setPhase('active');
    } catch (err) {
      toast.error(err.message || 'Failed to start practice session');
      setPhase('idle');
    }
  }, []);

  // ── Submit a single answer ────────────────────────────────────────────────
  const submitAnswer = useCallback(async (selected) => {
    if (!current || submitting || feedback[current.id]) return;

    setSubmitting(true);
    const timeTaken = qStartRef.current ? Math.floor((Date.now() - qStartRef.current) / 1000) : questionTime;

    // Optimistic local update so UI responds instantly
    setAnswers(prev => ({ ...prev, [current.id]: selected }));

    try {
      const data = await aptitudeService.submitPracticeAnswer(sessionId, {
        answerSlotId: current.answerSlotId,
        selected,
        timeTaken,
      });

      // Record server-validated feedback
      setFeedback(prev => ({
        ...prev,
        [current.id]: {
          isCorrect:     data.isCorrect,
          correctOption: data.correctOption,
          explanation:   data.explanation,
        }
      }));

      if (data.isCorrect) {
        toast.success('Correct!', { duration: 1000, icon: '✅' });
      } else {
        toast.error(`Wrong — correct answer: ${data.correctOption}`, { duration: 2000, icon: '❌' });
      }
    } catch (err) {
      // Revert optimistic update on failure
      setAnswers(prev => { const n = { ...prev }; delete n[current.id]; return n; });
      toast.error('Failed to submit answer. Try again.');
    } finally {
      setSubmitting(false);
    }
  }, [current, sessionId, submitting, feedback, questionTime]);

  // ── Skip current question (no answer submitted) ───────────────────────────
  const skipQuestion = useCallback(() => {
    if (!current || feedback[current.id]) return;
    setAnswers(prev => ({ ...prev, [current.id]: null }));
    setFeedback(prev => ({
      ...prev,
      [current.id]: { isCorrect: false, correctOption: null, explanation: null, skipped: true }
    }));
    goNext();
  }, [current, feedback]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    setCurrentIdx(p => Math.min(p + 1, total - 1));
  }, [total]);

  const goPrev = useCallback(() => {
    setCurrentIdx(p => Math.max(p - 1, 0));
  }, []);

  const goTo = useCallback((idx) => {
    if (idx >= 0 && idx < total) setCurrentIdx(idx);
  }, [total]);

  // ── Finish session ────────────────────────────────────────────────────────
  const finishSession = useCallback(async () => {
    if (phase === 'finished' || phase === 'reviewing') return;
    clearInterval(timerRef.current);
    clearInterval(qTimerRef.current);
    setPhase('reviewing');

    try {
      const data = await aptitudeService.finishPractice(sessionId);
      setSummary(data.summary);
      setPhase('finished');
    } catch (err) {
      // Build a local summary from what we know if the API call fails
      const correct = Object.values(feedback).filter(f => f.isCorrect).length;
      setSummary({
        sessionId,
        total,
        answered,
        correct,
        wrong:   answered - correct,
        skipped: total - answered,
        percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
      });
      setPhase('finished');
    }
  }, [phase, sessionId, total, answered, feedback]);

  // ── Reset back to idle (for "Practice Again") ─────────────────────────────
  const reset = useCallback(() => {
    clearInterval(timerRef.current);
    clearInterval(qTimerRef.current);
    setPhase('idle');
    setSessionId(null);
    setQuestions([]);
    setAnswers({});
    setFeedback({});
    setSummary(null);
    setCurrentIdx(0);
    setTimeLeft(0);
    setQTime(0);
  }, []);

  return {
    // State
    phase,
    sessionId,
    questions,
    mode,
    config,
    current,
    currentIdx,
    answers,
    feedback,
    submitting,
    summary,
    total,
    answered,
    allAnswered,

    // Timer
    timeLeft,
    questionTime,

    // Actions
    startSession,
    submitAnswer,
    skipQuestion,
    goNext,
    goPrev,
    goTo,
    finishSession,
    reset,
  };
}
