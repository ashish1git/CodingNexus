import React from 'react';
import {
  Brain, Clock, ChevronLeft, ChevronRight, SkipForward,
  CheckCircle, XCircle, Lightbulb, Cpu, Database,
  Square, LayoutGrid
} from 'lucide-react';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

// ── Small sub-components ──────────────────────────────────────────────────────

function Timer({ timeLeft, urgent }) {
  if (timeLeft <= 0) return null;
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-bold transition-all ${
      urgent
        ? 'bg-red-900/40 border-red-700/60 text-red-300 animate-pulse'
        : 'bg-slate-700 border-slate-600 text-white'
    }`}>
      <Clock className="w-4 h-4" />
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </div>
  );
}

function OptionButton({ label, text, state, onClick, disabled }) {
  // state: 'default' | 'selected' | 'correct' | 'wrong' | 'missed'
  const styles = {
    default:  'bg-slate-700/40 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500',
    selected: 'bg-violet-600/20 border-violet-500 text-white',
    correct:  'bg-green-900/30 border-green-500 text-green-200',
    wrong:    'bg-red-900/30 border-red-500 text-red-200',
    missed:   'bg-green-900/20 border-green-600/50 text-green-300',
  };
  const circleStyles = {
    default:  'bg-slate-600 border-slate-500 text-slate-300',
    selected: 'bg-violet-600 border-violet-500 text-white',
    correct:  'bg-green-600 border-green-500 text-white',
    wrong:    'bg-red-600 border-red-500 text-white',
    missed:   'bg-green-700/50 border-green-600 text-green-300',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-150 ${styles[state]} ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
    >
      <span className={`w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold border ${circleStyles[state]}`}>
        {label}
      </span>
      <span className="leading-relaxed pt-0.5">{text}</span>
      {state === 'correct' && <CheckCircle className="w-4 h-4 ml-auto flex-shrink-0 mt-0.5 text-green-400" />}
      {state === 'wrong'   && <XCircle    className="w-4 h-4 ml-auto flex-shrink-0 mt-0.5 text-red-400"   />}
    </button>
  );
}

function FeedbackBanner({ fb, submitting }) {
  if (submitting) {
    return (
      <div className="flex items-center gap-2 p-3 bg-slate-700/40 border border-slate-600 rounded-xl text-slate-300 text-sm">
        <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
        Validating answer…
      </div>
    );
  }
  if (!fb) return null;
  if (fb.skipped) {
    return (
      <div className="p-3 bg-slate-700/30 border border-slate-600 rounded-xl text-slate-400 text-sm">
        Skipped — correct answer was <strong className="text-green-400">{fb.correctOption}</strong>
      </div>
    );
  }
  return (
    <div className={`p-3 rounded-xl border text-sm space-y-1.5 ${
      fb.isCorrect
        ? 'bg-green-900/20 border-green-700/50'
        : 'bg-red-900/20 border-red-700/50'
    }`}>
      <div className={`flex items-center gap-2 font-semibold ${fb.isCorrect ? 'text-green-300' : 'text-red-300'}`}>
        {fb.isCorrect
          ? <><CheckCircle className="w-4 h-4" /> Correct!</>
          : <><XCircle className="w-4 h-4" /> Incorrect — answer: <strong>{fb.correctOption}</strong></>
        }
      </div>
      {fb.explanation && <ExplanationBlock text={fb.explanation} />}
    </div>
  );
}

function ExplanationBlock({ text }) {
  if (!text) return null;

  // Parse the text into structured blocks: Steps, [TRICK], and plain text
  const blocks = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('[TRICK]:') || trimmed.startsWith('[TRICK]')) {
      blocks.push({ type: 'trick', content: trimmed.replace(/^\[TRICK\]:?\s*/i, '') });
    } else if (/^Step\s+\d+/i.test(trimmed)) {
      blocks.push({ type: 'step', content: trimmed });
    } else if (/^\d+\.\s/.test(trimmed)) {
      blocks.push({ type: 'step', content: trimmed });
    } else {
      blocks.push({ type: 'text', content: trimmed });
    }
  }

  if (blocks.length === 0) {
    blocks.push({ type: 'text', content: text.trim() });
  }

  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center gap-1.5 text-yellow-400 text-xs font-semibold uppercase tracking-wider">
        <Lightbulb className="w-3.5 h-3.5" /> Explanation
      </div>
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3 space-y-1.5">
        {blocks.map((b, i) => {
          if (b.type === 'trick') {
            return (
              <div key={i} className="flex items-start gap-2 bg-violet-900/20 border border-violet-700/30 rounded-lg p-2 text-violet-200 text-xs">
                <span className="text-violet-400 mt-0.5">⚡</span>
                <span><strong className="text-violet-300">Quick Trick:</strong> {b.content}</span>
              </div>
            );
          }
          if (b.type === 'step') {
            return (
              <div key={i} className="flex items-start gap-2 text-slate-300 text-xs leading-relaxed">
                <span className="text-indigo-400 font-bold min-w-[1.5em] mt-px">{i + 1}.</span>
                <span>{b.content}</span>
              </div>
            );
          }
          return (
            <p key={i} className="text-slate-300 text-xs leading-relaxed">{b.content}</p>
          );
        })}
      </div>
    </div>
  );
}

function QuestionPalette({ questions, currentIdx, answers, feedback, onGoto }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sticky top-20">
      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <LayoutGrid className="w-3.5 h-3.5" /> Questions
      </p>
      <div className="grid grid-cols-5 gap-1.5 mb-4">
        {questions.map((q, i) => {
          const fb      = feedback[q.id];
          const active  = i === currentIdx;
          const correct = fb?.isCorrect;
          const wrong   = fb && !fb.isCorrect && !fb.skipped;
          const skipped = fb?.skipped;

          return (
            <button
              key={q.id}
              onClick={() => onGoto(i)}
              className={`w-9 h-9 rounded-lg text-xs font-bold transition ${
                active   ? 'bg-violet-600 text-white' :
                correct  ? 'bg-green-700/50 border border-green-600/60 text-green-300' :
                wrong    ? 'bg-red-700/50 border border-red-600/60 text-red-300' :
                skipped  ? 'bg-slate-600 border border-slate-500 text-slate-400' :
                           'bg-slate-700 border border-slate-600 text-slate-400 hover:bg-slate-600'
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      {/* Legend */}
      <div className="space-y-1 text-xs text-slate-500">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-green-700/50 border border-green-600/60" /> Correct</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-red-700/50 border border-red-600/60"   /> Wrong</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-slate-700 border border-slate-600"      /> Unanswered</div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PracticeSession({ engine }) {
  const {
    questions, current, currentIdx, total, answered, allAnswered,
    answers, feedback, submitting, mode,
    timeLeft,
    submitAnswer, skipQuestion, goNext, goPrev, goTo, finishSession,
  } = engine;

  if (!current) return null;

  const fb         = feedback[current.id];
  const hasAnswered = !!fb;
  const isUrgent   = timeLeft > 0 && timeLeft < 60;
  const progress   = total > 0 ? Math.round((answered / total) * 100) : 0;

  // Determine option display state post-feedback
  const getOptionState = (label) => {
    if (!fb) return answers[current.id] === label ? 'selected' : 'default';
    if (label === fb.correctOption) return fb.skipped ? 'missed' : 'correct';
    if (label === answers[current.id] && !fb.isCorrect) return 'wrong';
    return 'default';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sticky top bar */}
      <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-4">
            <div className="flex items-center gap-2 min-w-0">
              {mode === 'ai'
                ? <Cpu      className="w-5 h-5 text-violet-400 flex-shrink-0" />
                : <Database className="w-5 h-5 text-violet-400 flex-shrink-0" />
              }
              <span className="font-semibold text-white text-sm truncate">
                Practice · {mode === 'ai' ? 'AI Mode' : 'Question Bank'}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-slate-400 text-xs hidden sm:block">{answered}/{total} answered</span>
              <Timer timeLeft={timeLeft} urgent={isUrgent} />
              <button
                onClick={finishSession}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-600 text-xs font-semibold transition"
              >
                <Square className="w-3.5 h-3.5" /> Finish
              </button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-slate-700">
            <div className="h-1 bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6 items-start">
          {/* Main question panel */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Question card */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <span className="bg-violet-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  Question {currentIdx + 1} of {total}
                </span>
                {current.concept && (
                  <span className="text-xs text-slate-500 bg-slate-700/50 border border-slate-600/50 rounded-full px-2.5 py-1">
                    {current.concept}
                  </span>
                )}
                {current.isAI && (
                  <span className="text-xs text-violet-400 bg-violet-900/30 border border-violet-700/50 rounded-full px-2.5 py-1 flex items-center gap-1">
                    <Cpu className="w-3 h-3" /> AI generated
                  </span>
                )}
              </div>

              <p className="text-white text-base sm:text-lg font-medium leading-relaxed mb-6">
                {current.question}
              </p>

              {/* Options */}
              <div className="flex flex-col gap-3">
                {(current.options || []).map((opt, i) => {
                  const label   = typeof opt === 'object' ? opt.label : OPTION_LABELS[i];
                  const text    = typeof opt === 'object' ? opt.text  : opt;
                  const state   = getOptionState(label);
                  return (
                    <OptionButton
                      key={label}
                      label={label}
                      text={text}
                      state={state}
                      disabled={hasAnswered || submitting}
                      onClick={() => submitAnswer(label)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Feedback banner */}
            <FeedbackBanner fb={fb} submitting={submitting} />

            {/* Nav row */}
            <div className="flex items-center justify-between">
              <button
                onClick={goPrev}
                disabled={currentIdx === 0}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm font-medium"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <div className="flex items-center gap-2">
                {!hasAnswered && !submitting && (
                  <button
                    onClick={skipQuestion}
                    className="flex items-center gap-1.5 px-3 py-2 border border-slate-600 rounded-lg text-slate-400 hover:border-slate-500 hover:text-slate-300 transition text-sm"
                  >
                    <SkipForward className="w-4 h-4" /> Skip
                  </button>
                )}

                {currentIdx < total - 1 ? (
                  <button
                    onClick={goNext}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600/20 border border-violet-500/50 rounded-lg text-violet-300 hover:bg-violet-600/30 transition text-sm font-medium"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={finishSession}
                    className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-semibold text-sm transition"
                  >
                    <Brain className="w-4 h-4" /> Finish Practice
                  </button>
                )}
              </div>
            </div>

            {/* Mobile finish */}
            {allAnswered && (
              <div className="md:hidden">
                <button
                  onClick={finishSession}
                  className="w-full py-3 bg-violet-600 hover:bg-violet-700 rounded-xl text-white font-bold transition"
                >
                  View Results
                </button>
              </div>
            )}
          </div>

          {/* Sidebar palette */}
          <div className="w-56 flex-shrink-0 hidden md:block">
            <QuestionPalette
              questions={questions}
              currentIdx={currentIdx}
              answers={answers}
              feedback={feedback}
              onGoto={goTo}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
