import React, { useState } from 'react';
import {
  Brain, Trophy, CheckCircle, XCircle, Lightbulb,
  RotateCcw, ChevronDown, ChevronUp, Minus, Cpu, Database
} from 'lucide-react';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

function getGrade(pct) {
  if (pct >= 80) return { label: 'Excellent!',      color: 'text-green-400',  ring: 'border-green-500',  bg: 'bg-green-500/10'  };
  if (pct >= 60) return { label: 'Good Job!',        color: 'text-indigo-400', ring: 'border-indigo-500', bg: 'bg-indigo-500/10' };
  if (pct >= 40) return { label: 'Keep Going',       color: 'text-yellow-400', ring: 'border-yellow-500', bg: 'bg-yellow-500/10' };
  return           { label: 'More Practice!',        color: 'text-red-400',    ring: 'border-red-500',    bg: 'bg-red-500/10'    };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatBox({ label, value, color = 'text-white', sub }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl py-3 px-2 flex flex-col items-center gap-1">
      <span className={`text-2xl font-black ${color}`}>{value}</span>
      <span className="text-slate-400 text-xs font-semibold">{label}</span>
      {sub && <span className="text-slate-600 text-xs">{sub}</span>}
    </div>
  );
}

function QuestionReview({ item, idx }) {
  const [open, setOpen] = useState(false);
  const { question, options, correctOption, explanation, selected, isCorrect, isAI } = item;
  const unanswered = !selected;

  return (
    <div className={`bg-slate-800 rounded-xl border transition-all ${
      isCorrect  ? 'border-green-700/40' :
      unanswered ? 'border-slate-600/60' :
                   'border-red-700/40'
    }`}>
      {/* Collapsed header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-3 p-4 text-left"
      >
        <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
          isCorrect  ? 'bg-green-500/20' :
          unanswered ? 'bg-slate-600/40' :
                       'bg-red-500/20'
        }`}>
          {isCorrect  ? <CheckCircle className="w-4 h-4 text-green-400" /> :
           unanswered ? <Minus       className="w-4 h-4 text-slate-500" /> :
                        <XCircle    className="w-4 h-4 text-red-400"   />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-slate-500 text-xs font-semibold">Q{idx + 1}</span>
            {isAI && <span className="text-xs text-violet-500 flex items-center gap-0.5"><Cpu className="w-3 h-3" /> AI</span>}
          </div>
          <span className="text-slate-200 text-sm">{question}</span>
          {!open && (
            <div className="flex flex-wrap gap-3 mt-1">
              {selected && (
                <span className={`text-xs ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                  Your answer: <strong>{selected}</strong>
                </span>
              )}
              {!isCorrect && correctOption && (
                <span className="text-xs text-green-400">Correct: <strong>{correctOption}</strong></span>
              )}
              {unanswered && <span className="text-xs text-slate-500">Skipped</span>}
            </div>
          )}
        </div>
        {open
          ? <ChevronUp   className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" />
          : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" />
        }
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="px-4 pb-4 border-t border-slate-700/60 pt-3 space-y-2">
          {(options || []).map((opt, i) => {
            const lbl        = typeof opt === 'object' ? opt.label : OPTION_LABELS[i];
            const text       = typeof opt === 'object' ? opt.text  : opt;
            const isCorrectO = lbl === correctOption;
            const isSelected = lbl === selected;
            return (
              <div
                key={lbl}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-sm ${
                  isCorrectO                         ? 'bg-green-500/10 border-green-600/40 text-green-300' :
                  isSelected && !isCorrectO          ? 'bg-red-500/10 border-red-600/40 text-red-300'      :
                                                       'bg-slate-700/30 border-slate-600/30 text-slate-400'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border ${
                  isCorrectO              ? 'bg-green-600 border-green-500 text-white' :
                  isSelected && !isCorrectO ? 'bg-red-600 border-red-500 text-white'  :
                                             'bg-slate-600 border-slate-500 text-slate-300'
                }`}>
                  {lbl}
                </span>
                <span className="leading-relaxed">{text}</span>
              </div>
            );
          })}
          {explanation && (
            <div className="mt-2 p-3 bg-indigo-900/20 border border-indigo-700/40 rounded-lg text-indigo-200 text-sm leading-relaxed flex gap-2">
              <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0 text-yellow-400" />
              <span><strong className="text-indigo-300">Explanation: </strong>{explanation}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function PracticeResults({ engine }) {
  const { summary, questions, feedback, answers, mode, config, reset } = engine;
  const [tab, setTab] = useState('review');

  if (!summary) return null;

  const { total, correct, wrong, skipped, percentage } = summary;
  const grade = getGrade(percentage);

  // Build enriched result list from questions + feedback (all available client-side)
  const results = questions.map(q => {
    const fb = feedback[q.id] || {};
    return {
      questionId:    q.id,
      question:      q.question,
      options:       q.options,
      correctOption: fb.correctOption,
      explanation:   fb.explanation,
      selected:      answers[q.id] || null,
      isCorrect:     fb.isCorrect  || false,
      isAI:          q.isAI        || false,
    };
  });

  const correctItems  = results.filter(r => r.isCorrect);
  const wrongItems    = results.filter(r => !r.isCorrect && r.selected);
  const skippedItems  = results.filter(r => !r.selected);

  const TABS = [
    { id: 'review',  label: `Review (${total})` },
    { id: 'wrong',   label: `Wrong (${wrongItems.length})`   },
    { id: 'correct', label: `Correct (${correctItems.length})` },
  ];

  const displayItems =
    tab === 'review'  ? results :
    tab === 'wrong'   ? wrongItems :
                        correctItems;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition group"
          >
            <RotateCcw className="w-4 h-4 group-hover:rotate-[-90deg] transition-transform duration-300" />
            <span className="text-sm">Practice Again</span>
          </button>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-400" />
            <span className="text-white font-semibold text-sm">Practice Results</span>
          </div>
          <div className="w-24" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Score card */}
        <div className="bg-gradient-to-r from-violet-900/40 to-indigo-900/40 border border-violet-700/50 rounded-2xl p-6 sm:p-8 text-center">
          <div className={`w-24 h-24 rounded-full border-4 ${grade.ring} ${grade.bg} flex items-center justify-center mx-auto mb-4`}>
            <span className={`text-3xl font-black ${grade.color}`}>{percentage}%</span>
          </div>
          <h1 className={`text-2xl font-black mb-1 ${grade.color}`}>{grade.label}</h1>
          <p className="text-slate-300 text-sm mb-1">
            {correct} correct out of {total} questions
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mb-6">
            {mode === 'ai'
              ? <><Cpu className="w-3.5 h-3.5 text-violet-400" /> AI-Generated</>
              : <><Database className="w-3.5 h-3.5" /> Question Bank</>
            }
            {config.category && <span>· {config.category}</span>}
            {config.difficulty && <span>· {config.difficulty}</span>}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatBox label="Correct" value={correct} color="text-green-400" />
            <StatBox label="Wrong"   value={wrong}   color="text-red-400"   />
            <StatBox label="Skipped" value={skipped} color="text-slate-400" />
          </div>

          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 rounded-xl text-white font-semibold text-sm transition"
          >
            <RotateCcw className="w-4 h-4" /> Practice Again
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-800 border border-slate-700 rounded-xl p-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                tab === t.id ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Question reviews */}
        {displayItems.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Nothing to show here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayItems.map((r, i) => (
              <QuestionReview key={r.questionId + i} item={r} idx={results.indexOf(r)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
