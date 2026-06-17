import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain, Zap, BookOpen, BarChart2, Target, Sparkles,
  Clock, Hash, ChevronRight, ArrowLeft, Cpu, Database,
  AlertCircle
} from 'lucide-react';
import aptitudeService from '../../services/aptitudeService';

// ── Static config ─────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'quantitative', label: 'Quantitative',      icon: BarChart2,  color: 'blue',   topics: ['Time & Work', 'Percentages', 'Profit & Loss', 'Speed & Distance', 'Simple Interest', 'Averages', 'Ratios'] },
  { value: 'logical',      label: 'Logical Reasoning', icon: Brain,      color: 'purple',  topics: ['Syllogisms', 'Blood Relations', 'Direction Sense', 'Coding-Decoding', 'Puzzles', 'Analogies'] },
  { value: 'verbal',       label: 'Verbal',            icon: BookOpen,   color: 'pink',    topics: ['Reading Comprehension', 'Vocabulary', 'Sentence Correction', 'Synonyms & Antonyms', 'Para Jumbles'] },
  { value: 'technical',    label: 'Technical',         icon: Zap,        color: 'cyan',    topics: ['Data Structures', 'Algorithms', 'DBMS', 'OS Concepts', 'Networking Basics', 'OOP'] },
  { value: 'general',      label: 'General',           icon: Target,     color: 'slate',   topics: ['Current Affairs', 'History', 'Science', 'Geography', 'Economics'] },
];

const DIFFICULTIES = [
  { value: 'easy',   label: 'Easy',   desc: 'Foundation level',   color: 'green'  },
  { value: 'medium', label: 'Medium', desc: 'Interview ready',    color: 'yellow' },
  { value: 'hard',   label: 'Hard',   desc: 'Advanced / MAANG',   color: 'red'    },
];

const COUNTS = [5, 10, 15, 20];

const MODES = [
  {
    value: 'static',
    label: 'Question Bank',
    icon:  Database,
    desc:  'Practice from our curated question bank. Instant, reliable.',
  },
  {
    value: 'ai',
    label: 'AI-Generated',
    icon:  Cpu,
    desc:  'AI generates fresh questions on your chosen topic in real time.',
    badge: 'Beta',
  },
];

// ── Color helpers ─────────────────────────────────────────────────────────────

const CAT_COLORS = {
  blue:   { ring: 'border-blue-500',   bg: 'bg-blue-900/30',   text: 'text-blue-300',   icon: 'text-blue-400' },
  purple: { ring: 'border-purple-500', bg: 'bg-purple-900/30', text: 'text-purple-300', icon: 'text-purple-400' },
  pink:   { ring: 'border-pink-500',   bg: 'bg-pink-900/30',   text: 'text-pink-300',   icon: 'text-pink-400' },
  cyan:   { ring: 'border-cyan-500',   bg: 'bg-cyan-900/30',   text: 'text-cyan-300',   icon: 'text-cyan-400' },
  slate:  { ring: 'border-slate-500',  bg: 'bg-slate-700/40',  text: 'text-slate-300',  icon: 'text-slate-400' },
};

const DIFF_COLORS = {
  green:  { ring: 'border-green-500',  bg: 'bg-green-900/30',  text: 'text-green-300'  },
  yellow: { ring: 'border-yellow-500', bg: 'bg-yellow-900/30', text: 'text-yellow-300' },
  red:    { ring: 'border-red-500',    bg: 'bg-red-900/30',    text: 'text-red-300'    },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function PracticeSetup({ onStart, loading = false }) {
  const [category,   setCategory]   = useState('quantitative');
  const [topic,      setTopic]      = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [count,      setCount]      = useState(10);
  const [mode,       setMode]       = useState('static');
  const [aiLimit,    setAiLimit]    = useState(null);

  useEffect(() => {
    aptitudeService.getAILimit()
      .then(data => setAiLimit(data))
      .catch(() => setAiLimit({ usedToday: 0, limit: 3, remaining: 3, quotaExhausted: false }));
  }, []);

  const selectedCat = CATEGORIES.find(c => c.value === category);
  const quotaExhausted = aiLimit?.quotaExhausted || false;
  const aiDisabled = aiLimit !== null && (aiLimit.remaining <= 0 || quotaExhausted);

  const handleStart = () => {
    onStart({
      category,
      topicId:    topic || undefined,
      difficulty,
      count,
      mode,
      timeLimitMins: 0,  // no global timer in practice (per-question feedback mode)
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/student/aptitude" className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Aptitude Tests</span>
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <span className="text-white font-semibold">Practice Mode</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Hero */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 mb-4">
            <Brain className="w-8 h-8 text-violet-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Customise Your Practice</h1>
          <p className="text-slate-400 text-sm">Choose category, topic, difficulty and mode. Get instant per-answer feedback.</p>
        </div>

        {/* ── 1. Category ── */}
        <section>
          <h2 className="text-slate-300 text-sm font-bold uppercase tracking-wider mb-3">Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CATEGORIES.map(cat => {
              const Icon   = cat.icon;
              const colors = CAT_COLORS[cat.color];
              const active = category === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => { setCategory(cat.value); setTopic(''); }}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                    active
                      ? `${colors.ring} ${colors.bg}`
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? colors.icon : 'text-slate-500'}`} />
                  <span className={`font-semibold text-sm ${active ? colors.text : 'text-slate-400'}`}>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── 2. Topic (contextual to category) ── */}
        {selectedCat && (
          <section>
            <h2 className="text-slate-300 text-sm font-bold uppercase tracking-wider mb-3">
              Topic <span className="text-slate-600 font-normal normal-case">(optional)</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTopic('')}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                  !topic
                    ? 'border-violet-500 bg-violet-600/20 text-violet-300'
                    : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500'
                }`}
              >
                All Topics
              </button>
              {selectedCat.topics.map(t => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                    topic === t
                      ? 'border-violet-500 bg-violet-600/20 text-violet-300'
                      : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── 3. Difficulty ── */}
        <section>
          <h2 className="text-slate-300 text-sm font-bold uppercase tracking-wider mb-3">Difficulty</h2>
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTIES.map(d => {
              const colors = DIFF_COLORS[d.color];
              const active = difficulty === d.value;
              return (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={`p-3.5 rounded-xl border-2 text-center transition-all ${
                    active
                      ? `${colors.ring} ${colors.bg}`
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <p className={`font-bold text-sm ${active ? colors.text : 'text-slate-400'}`}>{d.label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{d.desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── 4. Count ── */}
        <section>
          <h2 className="text-slate-300 text-sm font-bold uppercase tracking-wider mb-3">
            <span className="inline-flex items-center gap-1.5"><Hash className="w-4 h-4" /> Number of Questions</span>
          </h2>
          <div className="flex gap-3">
            {COUNTS.map(n => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`w-14 h-12 rounded-xl border-2 font-bold text-sm transition-all ${
                  count === n
                    ? 'border-violet-500 bg-violet-600/20 text-violet-300'
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </section>

        {/* ── 5. Mode ── */}
        <section>
          <h2 className="text-slate-300 text-sm font-bold uppercase tracking-wider mb-3">
            <span className="inline-flex items-center gap-1.5"><Cpu className="w-4 h-4" /> Question Source</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MODES.map(m => {
              const Icon   = m.icon;
              const active = mode === m.value;
              const disabled = m.value === 'ai' && aiDisabled;
              return (
                <button
                  key={m.value}
                  onClick={() => { if (!disabled) setMode(m.value); }}
                  disabled={disabled}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    disabled
                      ? 'border-slate-800 bg-slate-800/30 opacity-50 cursor-not-allowed'
                      : active
                        ? 'border-violet-500 bg-violet-600/10'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${active ? 'text-violet-400' : disabled ? 'text-slate-600' : 'text-slate-500'}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold text-sm ${active ? 'text-violet-300' : disabled ? 'text-slate-500' : 'text-slate-300'}`}>{m.label}</span>
                      {m.badge && (
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-violet-700/50 text-violet-300 border border-violet-600/50">
                          {m.badge}
                        </span>
                      )}
                      {m.value === 'ai' && aiLimit !== null && (
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${
                          quotaExhausted
                            ? 'bg-amber-900/30 text-amber-300 border-amber-700/50'
                            : aiLimit.remaining > 0
                              ? 'bg-green-900/30 text-green-300 border-green-700/50'
                              : 'bg-red-900/30 text-red-300 border-red-700/50'
                        }`}>
                          {quotaExhausted ? 'Quota Exhausted' : `${aiLimit.remaining}/${aiLimit.limit} left today`}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 leading-relaxed ${disabled ? 'text-slate-600' : 'text-slate-500'}`}>{m.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {mode === 'ai' && aiLimit !== null && aiLimit.remaining > 0 && !quotaExhausted && (
            <p className="mt-2 text-xs text-slate-500 flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 mt-0.5 text-violet-500 flex-shrink-0" />
              AI mode takes ~5–10 seconds to generate questions. Falls back to question bank if generation fails.
            </p>
          )}
          {aiDisabled && (
            <p className="mt-2 text-xs text-red-400 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              {quotaExhausted
                ? 'AI service quota has been reached for today — AI generation is temporarily unavailable. Please use the Question Bank or try again later.'
                : `You have used all ${aiLimit?.limit || 3} AI-generated sessions for today. Please use the Question Bank or try again tomorrow.`}
            </p>
          )}
        </section>

        {/* ── Summary + Start ── */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400 mb-5">
            <span><span className="text-white font-semibold">{selectedCat?.label}</span> · {topic || 'All Topics'}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> No time limit</span>
            <span>{count} questions · {difficulty}</span>
            <span className="flex items-center gap-1">
              {mode === 'ai' ? <Cpu className="w-3.5 h-3.5 text-violet-400" /> : <Database className="w-3.5 h-3.5" />}
              {mode === 'ai' ? 'AI mode' : 'Question bank'}
            </span>
          </div>
          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-violet-600 hover:bg-violet-700 rounded-xl text-white font-bold text-base transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {mode === 'ai' ? 'Generating questions…' : 'Loading…'}
              </>
            ) : (
              <>
                Start Practice <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
