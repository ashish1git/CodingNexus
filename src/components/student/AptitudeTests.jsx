import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Brain, Clock, BarChart2, ChevronRight, Search,
  ArrowLeft, CheckCircle, Target, BookOpen, Zap, Calendar, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import aptitudeService from '../../services/aptitudeService';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'general', label: 'General' },
  { value: 'quantitative', label: 'Quantitative' },
  { value: 'logical', label: 'Logical Reasoning' },
  { value: 'verbal', label: 'Verbal' },
  { value: 'technical', label: 'Technical' },
];

const DIFFICULTIES = [
  { value: 'all', label: 'All Levels' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const getDifficultyColor = (d) => {
  if (d === 'easy') return 'text-green-400 bg-green-900/30 border-green-700/50';
  if (d === 'hard') return 'text-red-400 bg-red-900/30 border-red-700/50';
  return 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50';
};

const getCategoryColor = (c) => {
  const map = {
    quantitative: 'text-blue-300 bg-blue-900/30 border-blue-700/50',
    logical: 'text-purple-300 bg-purple-900/30 border-purple-700/50',
    verbal: 'text-pink-300 bg-pink-900/30 border-pink-700/50',
    technical: 'text-cyan-300 bg-cyan-900/30 border-cyan-700/50',
    general: 'text-slate-300 bg-slate-800/50 border-slate-600/50',
  };
  return map[c] || map.general;
};

const getCategoryIcon = (c) => {
  if (c === 'quantitative') return <BarChart2 className="w-4 h-4" />;
  if (c === 'logical') return <Brain className="w-4 h-4" />;
  if (c === 'verbal') return <BookOpen className="w-4 h-4" />;
  if (c === 'technical') return <Zap className="w-4 h-4" />;
  return <Target className="w-4 h-4" />;
};

// Format countdown like "2h 15m" or "45m 30s"
function formatCountdown(ms) {
  if (ms <= 0) return '0s';
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function AptitudeTests() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    fetchTests();
  }, [category, difficulty]);

  // Tick every second so countdown / status updates live
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const data = await aptitudeService.getAllTests({ category, difficulty });
      setTests(Array.isArray(data.tests) ? data.tests : []);
    } catch {
      toast.error('Failed to load aptitude tests');
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (test) => {
    if (!test.startTime || !test.endTime) return 'ongoing';
    if (now < new Date(test.startTime).getTime()) return 'upcoming';
    if (now > new Date(test.endTime).getTime()) return 'ended';
    return 'ongoing';
  };

  const filtered = tests.filter(t =>
    !search ||
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const ongoingCount = filtered.filter(t => getStatus(t) === 'ongoing').length;
  const completedCount = tests.filter(t => t.myBestAttempt).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800 shadow-lg border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/student/dashboard"
              className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-violet-400" />
              <h1 className="text-xl sm:text-2xl font-bold text-white">Aptitude Tests</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero banner */}
        <div className="bg-gradient-to-r from-violet-900/50 to-indigo-900/50 rounded-xl p-6 mb-6 border border-violet-700/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Sharpen Your Placement Skills</h2>
              <p className="text-slate-300 text-sm">Practice with professional aptitude questions — Quantitative, Logical, Verbal & Technical</p>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-violet-300">{tests.length}</p>
                <p className="text-xs text-slate-400">Tests Available</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{ongoingCount}</p>
                <p className="text-xs text-slate-400">Live Now</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-300">{completedCount}</p>
                <p className="text-xs text-slate-400">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800 rounded-xl p-4 mb-6 border border-slate-700">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tests..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
            </div>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 cursor-pointer"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
              className="px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 cursor-pointer"
            >
              {DIFFICULTIES.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>

        {!loading && (
          <p className="text-slate-400 text-sm mb-4">
            {filtered.length} test{filtered.length !== 1 ? 's' : ''} found
          </p>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-4" />
            Loading tests...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Brain className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium text-slate-300">No aptitude tests found</p>
            <p className="text-sm mt-1">Try a different category or difficulty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(test => (
              <TestCard
                key={test.id}
                test={test}
                status={getStatus(test)}
                now={now}
                onClick={() => {
                  const s = getStatus(test);
                  if (s === 'upcoming') return toast('This test has not started yet', { icon: '🕐' });
                  if (s === 'ended') return toast('This test window has ended', { icon: '🔒' });
                  navigate(`/student/aptitude/${test.id}`);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TestCard({ test, status, now, onClick }) {
  const best = test.myBestAttempt;
  const pct = best ? Math.round((best.score / best.maxScore) * 100) : null;
  const label = CATEGORIES.find(c => c.value === test.category)?.label || test.category;
  const isDisabled = status === 'upcoming' || status === 'ended';

  const statusBadge = () => {
    if (status === 'ongoing') return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border bg-green-900/30 border-green-600/50 text-green-300">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        Live
      </span>
    );
    if (status === 'upcoming') {
      const msLeft = new Date(test.startTime).getTime() - now;
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border bg-blue-900/30 border-blue-600/50 text-blue-300">
          <Clock className="w-3 h-3" />
          Starts in {formatCountdown(msLeft)}
        </span>
      );
    }
    if (status === 'ended') return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border bg-slate-800/60 border-slate-600/50 text-slate-400">
        <Lock className="w-3 h-3" />
        Ended
      </span>
    );
    return null;
  };

  return (
    <div
      onClick={onClick}
      className={`bg-slate-800 border rounded-xl p-5 flex flex-col gap-4 transition-all duration-200 ${
        isDisabled
          ? 'border-slate-700 opacity-70 cursor-not-allowed'
          : 'border-slate-700 cursor-pointer hover:border-violet-500/60 hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-900/20'
      }`}
    >
      {/* Status + category/difficulty badges */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${getCategoryColor(test.category)}`}>
          {getCategoryIcon(test.category)}
          {label}
        </span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getDifficultyColor(test.difficulty)}`}>
          {test.difficulty.charAt(0).toUpperCase() + test.difficulty.slice(1)}
        </span>
      </div>

      {/* Status badge row */}
      <div className="flex items-center gap-2 flex-wrap">
        {statusBadge()}
        {test.startTime && status !== 'ongoing' && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <Calendar className="w-3 h-3" />
            {new Date(test.startTime).toLocaleDateString()} {new Date(test.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Title & description */}
      <div>
        <h3 className="font-bold text-white text-base leading-snug mb-1">{test.title}</h3>
        {test.description && (
          <p className="text-slate-400 text-sm line-clamp-2">{test.description}</p>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-slate-400 text-xs">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> {test.duration} min
        </span>
        <span className="flex items-center gap-1.5">
          <BarChart2 className="w-3.5 h-3.5" /> {test.questionCount} questions
        </span>
        <span className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5" /> {test.totalAttempts} attempts
        </span>
      </div>

      {/* CTA / best score */}
      {best ? (
        <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${pct >= 70 ? 'bg-green-900/30 border border-green-700/50' : 'bg-yellow-900/20 border border-yellow-700/40'}`}>
          <CheckCircle className={`w-4 h-4 flex-shrink-0 ${pct >= 70 ? 'text-green-400' : 'text-yellow-400'}`} />
          <span className={`font-semibold ${pct >= 70 ? 'text-green-300' : 'text-yellow-300'}`}>
            Best: {best.score}/{best.maxScore} ({pct}%)
          </span>
          {!isDisabled && <ChevronRight className="w-4 h-4 ml-auto text-slate-500" />}
        </div>
      ) : status === 'ended' ? (
        <div className="flex items-center justify-center gap-2 bg-slate-700/40 border border-slate-600/50 rounded-lg px-3 py-2.5 text-slate-500 text-sm font-semibold">
          <Lock className="w-4 h-4" /> Test Ended
        </div>
      ) : status === 'upcoming' ? (
        <div className="flex items-center justify-center gap-2 bg-blue-900/20 border border-blue-700/40 rounded-lg px-3 py-2.5 text-blue-400 text-sm font-semibold">
          <Clock className="w-4 h-4" /> Not Started Yet
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 rounded-lg px-3 py-2.5 text-violet-300 text-sm font-semibold transition-colors">
          Start Practice <ChevronRight className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
