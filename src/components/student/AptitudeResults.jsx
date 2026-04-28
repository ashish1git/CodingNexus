import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Brain, Trophy, CheckCircle, XCircle, Clock,
  ArrowLeft, RotateCcw, ChevronDown, ChevronUp,
  Target, Minus
} from 'lucide-react';
import toast from 'react-hot-toast';
import aptitudeService from '../../services/aptitudeService';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const getGrade = (pct) => {
  if (pct >= 80) return { label: 'Excellent!', color: 'text-green-400', ring: 'border-green-500', bg: 'bg-green-500/10' };
  if (pct >= 60) return { label: 'Good Job!', color: 'text-indigo-400', ring: 'border-indigo-500', bg: 'bg-indigo-500/10' };
  if (pct >= 40) return { label: 'Average', color: 'text-yellow-400', ring: 'border-yellow-500', bg: 'bg-yellow-500/10' };
  return { label: 'Keep Practicing', color: 'text-red-400', ring: 'border-red-500', bg: 'bg-red-500/10' };
};

export default function AptitudeResults() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [attempt, setAttempt] = useState(location.state?.attempt || null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('review');
  const [loading, setLoading] = useState(!location.state?.attempt);

  useEffect(() => {
    if (!attempt) loadAttempt();
    loadLeaderboard();
  }, [testId]);

  const loadAttempt = async () => {
    try {
      setLoading(true);
      const data = await aptitudeService.getMyAttempts(testId);
      if (data.attempts?.length) setAttempt(data.attempts[0]);
    } catch {
      toast.error('Could not load results');
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const data = await aptitudeService.getLeaderboard(testId);
      setLeaderboard(data.leaderboard || []);
    } catch { /* leaderboard optional */ }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );

  if (!attempt) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center gap-4 text-slate-400">
      <p>No results found.</p>
      <button
        onClick={() => navigate('/student/aptitude')}
        className="px-4 py-2 bg-violet-600/20 border border-violet-500/40 rounded-lg text-violet-300 hover:bg-violet-600/30 transition text-sm"
      >
        Back to Tests
      </button>
    </div>
  );

  const pct = Math.round((attempt.score / attempt.maxScore) * 100);
  const grade = getGrade(pct);
  const mins = attempt.timeTaken ? Math.floor(attempt.timeTaken / 60) : 0;
  const secs = attempt.timeTaken ? attempt.timeTaken % 60 : 0;
  const correct = attempt.results?.filter(r => r.isCorrect).length ?? attempt.score;
  const wrong = attempt.results?.filter(r => !r.isCorrect && r.selected).length ?? 0;
  const skipped = attempt.results?.filter(r => !r.selected).length ?? (attempt.maxScore - attempt.score);

  const tabs = attempt.results
    ? [{ id: 'review', label: 'Answer Review' }, { id: 'leaderboard', label: 'Leaderboard' }]
    : [{ id: 'leaderboard', label: 'Leaderboard' }];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/student/aptitude" className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition group">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              All Tests
            </Link>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-400" />
              <span className="text-white font-semibold text-sm hidden sm:block">Results</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Score card */}
        <div className="bg-gradient-to-r from-violet-900/40 to-indigo-900/40 border border-violet-700/50 rounded-2xl p-6 sm:p-8 mb-6 text-center">
          {/* Circle score */}
          <div className={`w-24 h-24 rounded-full border-4 ${grade.ring} ${grade.bg} flex items-center justify-center mx-auto mb-4`}>
            <span className={`text-3xl font-black ${grade.color}`}>{pct}%</span>
          </div>
          <h1 className={`text-2xl font-black mb-1 ${grade.color}`}>{grade.label}</h1>
          <p className="text-slate-300 text-sm mb-6">
            You scored <span className="text-white font-bold">{attempt.score}</span> out of{' '}
            <span className="text-white font-bold">{attempt.maxScore}</span>
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <StatBox icon={<Trophy className="w-5 h-5 text-yellow-400" />} label="Score" value={`${attempt.score}/${attempt.maxScore}`} />
            <StatBox icon={<Clock className="w-5 h-5 text-indigo-400" />} label="Time" value={`${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`} />
            <StatBox icon={<CheckCircle className="w-5 h-5 text-green-400" />} label="Correct" value={correct} color="text-green-300" />
            <StatBox icon={<XCircle className="w-5 h-5 text-red-400" />} label="Wrong" value={wrong} color="text-red-300" />
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(`/student/aptitude/${testId}`)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-slate-300 hover:bg-slate-600 transition font-medium text-sm"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
            <Link
              to="/student/aptitude"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-violet-600/20 border border-violet-500/50 rounded-xl text-violet-300 hover:bg-violet-600/30 transition font-medium text-sm"
            >
              <Brain className="w-4 h-4" /> More Tests
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-800 border border-slate-700 rounded-xl p-1 mb-5">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'review' && attempt.results && (
          <div className="space-y-3">
            {attempt.results.map((r, i) => (
              <QuestionReview key={r.questionId} result={r} idx={i} />
            ))}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardPanel leaderboard={leaderboard} />
        )}
      </div>
    </div>
  );
}

function StatBox({ icon, label, value, color = 'text-white' }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl py-3 px-2 flex flex-col items-center gap-1.5">
      {icon}
      <span className={`text-xl font-black ${color}`}>{value}</span>
      <span className="text-slate-500 text-xs uppercase tracking-wide">{label}</span>
    </div>
  );
}

function QuestionReview({ result, idx }) {
  const [expanded, setExpanded] = useState(false);
  const correct = result.isCorrect;
  const unanswered = !result.selected;

  return (
    <div
      className={`bg-slate-800 rounded-xl border transition-all ${
        correct ? 'border-green-700/40' : unanswered ? 'border-slate-600/60' : 'border-red-700/40'
      }`}
    >
      {/* Header row — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left"
      >
        <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
          correct ? 'bg-green-500/20' : unanswered ? 'bg-slate-600/40' : 'bg-red-500/20'
        }`}>
          {correct
            ? <CheckCircle className="w-4 h-4 text-green-400" />
            : unanswered
            ? <Minus className="w-4 h-4 text-slate-500" />
            : <XCircle className="w-4 h-4 text-red-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-slate-500 text-xs font-semibold mr-2">Q{idx + 1}</span>
          <span className="text-slate-200 text-sm">{result.question}</span>
          {!expanded && (
            <div className="flex flex-wrap gap-3 mt-1.5">
              {result.selected && (
                <span className={`text-xs ${correct ? 'text-green-400' : 'text-red-400'}`}>
                  Your answer: <strong>{result.selected}</strong>
                </span>
              )}
              {!correct && (
                <span className="text-xs text-green-400">
                  Correct: <strong>{result.correctOption}</strong>
                </span>
              )}
              {unanswered && <span className="text-xs text-slate-500">Skipped</span>}
            </div>
          )}
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" />
          : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" />}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-700/60 pt-3 space-y-2">
          {(result.options || []).map((opt, i) => {
            const lbl = OPTION_LABELS[i];
            const isCorrectOpt = lbl === result.correctOption;
            const isSelected = lbl === result.selected;
            const optText = typeof opt === 'object' ? opt.text : opt;

            return (
              <div
                key={lbl}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-sm ${
                  isCorrectOpt
                    ? 'bg-green-500/10 border-green-600/40 text-green-300'
                    : isSelected && !isCorrectOpt
                    ? 'bg-red-500/10 border-red-600/40 text-red-300'
                    : 'bg-slate-700/30 border-slate-600/30 text-slate-400'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border ${
                  isCorrectOpt
                    ? 'bg-green-600 border-green-500 text-white'
                    : isSelected && !isCorrectOpt
                    ? 'bg-red-600 border-red-500 text-white'
                    : 'bg-slate-600 border-slate-500 text-slate-300'
                }`}>
                  {lbl}
                </span>
                <span className="leading-relaxed">{optText}</span>
              </div>
            );
          })}

          {result.explanation && (
            <div className="mt-2 p-3 bg-indigo-900/20 border border-indigo-700/40 rounded-lg text-indigo-200 text-sm leading-relaxed">
              <span className="font-semibold text-indigo-300">Explanation: </span>
              {result.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LeaderboardPanel({ leaderboard }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-400" /> Top Performers
        </h3>
      </div>
      {leaderboard.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No submissions yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/60">
                {['Rank', 'Name', 'Batch', 'Score', '%', 'Time'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row, i) => (
                <tr key={row.userId} className={`border-b border-slate-700/50 ${i % 2 ? 'bg-slate-800/30' : ''}`}>
                  <td className={`px-4 py-3 font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                    #{row.rank}
                  </td>
                  <td className="px-4 py-3 text-slate-200">{row.name}</td>
                  <td className="px-4 py-3 text-slate-400 capitalize">{row.batch}</td>
                  <td className="px-4 py-3 text-violet-300 font-semibold">{row.score}/{row.maxScore}</td>
                  <td className={`px-4 py-3 font-semibold ${row.percentage >= 70 ? 'text-green-400' : 'text-slate-400'}`}>{row.percentage}%</td>
                  <td className="px-4 py-3 text-slate-500">{Math.floor(row.timeTaken / 60)}m {row.timeTaken % 60}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
