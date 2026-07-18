import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, BookOpen, LayoutList, Bookmark, Trophy, TrendingUp,
  Target, RotateCcw, ChevronRight, ChevronDown, CheckCircle2, X,
  RefreshCw, Star, Clock, Divide,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { dsaSheetService } from '../../../services/dsaSheetService';
import ProblemRow from './ProblemRow';
import problems from '../../../data/dsaProblems.json';
import { classNames } from '../../../utils/helpers';

const DIFFICULTY_ORDER = ['Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'];

function DsaSheet() {
  const navigate = useNavigate();
  const { currentUser, userDetails } = useAuth();

  const [viewMode, setViewMode] = useState('study-plan');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterTopic, setFilterTopic] = useState('all');
  const [completedIds, setCompletedIds] = useState(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [completedDates, setCompletedDates] = useState({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [unlockCode, setUnlockCode] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  // Study plan: selected day / accordion state
  const [selectedDay, setSelectedDay] = useState(null);
  const [expandedTopics, setExpandedTopics] = useState(new Set());
  const [expandedSubtopics, setExpandedSubtopics] = useState(new Set());

  // Browse: accordion
  const [topicExpanded, setTopicExpanded] = useState(new Set());

  // ─── Data fetch ───
  useEffect(() => {
    if (!currentUser) { setLoading(false); return; }
    (async () => {
      try {
        const [progressRes, statsRes] = await Promise.all([
          dsaSheetService.getProgress(),
          dsaSheetService.getStats(),
        ]);
        if (progressRes.success) {
          setCompletedIds(new Set(progressRes.data.completed));
          setBookmarkedIds(new Set(progressRes.data.bookmarked));
          setCompletedDates(progressRes.data.completedDates || {});
        }
        if (statsRes.success) setStats(statsRes.data);
      } catch (e) {
        toast.error('Failed to load progress');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Find current day (first incomplete day, or last day if all done)
  const studyDay = useMemo(() => {
    if (selectedDay !== null) return selectedDay;
    const days = new Set(problems.map(p => p.studyDay));
    const sorted = [...days].sort((a, b) => a - b);
    for (const d of sorted) {
      const dayProbs = problems.filter(p => p.studyDay === d);
      if (!dayProbs.every(p => completedIds.has(String(p.id)))) return d;
    }
    return sorted[sorted.length - 1] || 1;
  }, [completedIds, selectedDay]);

  // ─── Toggle handlers ───
  const handleToggleComplete = useCallback(async (problemId) => {
    const id = String(problemId);
    const wasCompleted = completedIds.has(id);
    setCompletedIds(prev => {
      const next = new Set(prev);
      if (wasCompleted) next.delete(id); else next.add(id);
      return next;
    });
    if (!wasCompleted) {
      setCompletedDates(prev => ({ ...prev, [id]: new Date().toISOString() }));
    } else {
      setCompletedDates(prev => { const n = { ...prev }; delete n[id]; return n; });
    }
    const res = await dsaSheetService.toggleComplete(id);
    if (!res.success) {
      setCompletedIds(prev => {
        const next = new Set(prev);
        if (wasCompleted) next.add(id); else next.delete(id);
        return next;
      });
    }
  }, [completedIds]);

  const handleToggleBookmark = useCallback(async (problemId) => {
    const id = String(problemId);
    const wasBookmarked = bookmarkedIds.has(id);
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (wasBookmarked) next.delete(id); else next.add(id);
      return next;
    });
    const res = await dsaSheetService.toggleBookmark(id);
    if (!res.success) {
      setBookmarkedIds(prev => {
        const next = new Set(prev);
        if (wasBookmarked) next.add(id); else next.delete(id);
        return next;
      });
    }
  }, [bookmarkedIds]);

  // ─── Filtered problems ───
  const filteredProblems = useMemo(() => {
    return problems.filter(p => {
      if (searchTerm && !p.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filterDifficulty !== 'all' && p.difficulty !== filterDifficulty) return false;
      if (filterTopic !== 'all' && p.topic !== filterTopic) return false;
      return true;
    });
  }, [searchTerm, filterDifficulty, filterTopic]);

  // ─── Study plan data ───
  const allDays = useMemo(() =>
    [...new Set(problems.map(p => p.studyDay))].sort((a, b) => a - b),
  []);

  const dayProblems = useMemo(() => {
    const groups = {};
    for (const p of filteredProblems) {
      if (!groups[p.studyDay]) groups[p.studyDay] = [];
      groups[p.studyDay].push(p);
    }
    return groups;
  }, [filteredProblems]);

  const dayStats = useMemo(() => {
    const stats = {};
    for (const day of allDays) {
      const probs = problems.filter(p => p.studyDay === day);
      const done = probs.filter(p => completedIds.has(String(p.id))).length;
      stats[day] = { total: probs.length, done, pct: probs.length ? Math.round((done / probs.length) * 100) : 0 };
    }
    return stats;
  }, [completedIds, allDays]);

  // ─── Browse data ───
  const topicsForBrowse = useMemo(() => {
    const map = new Map();
    for (const p of filteredProblems) {
      if (!map.has(p.topic)) map.set(p.topic, new Map());
      const subs = map.get(p.topic);
      if (!subs.has(p.subtopic)) subs.set(p.subtopic, []);
      subs.get(p.subtopic).push(p);
    }
    return map;
  }, [filteredProblems]);

  const topicStats = useMemo(() => {
    const stats = {};
    for (const p of problems) {
      if (!stats[p.topic]) stats[p.topic] = { total: 0, done: 0 };
      stats[p.topic].total++;
      if (completedIds.has(String(p.id))) stats[p.topic].done++;
    }
    return stats;
  }, [completedIds]);

  // ─── Filters ───
  const allTopics = useMemo(() => [...new Set(problems.map(p => p.topic))].sort(), []);

  // ─── Auth guard ───
  if (!currentUser || !userDetails) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Divide className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-white text-xl mb-2">Not Logged In</h2>
          <button onClick={() => navigate('/login')} className="text-indigo-400 hover:text-indigo-300">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // DSA access gate
  if (!userDetails?.dsaAccess) {
    const handleUnlock = async () => {
      if (!unlockCode.trim()) return toast.error('Enter your access code');
      setUnlocking(true);
      const res = await dsaSheetService.unlock(unlockCode.trim());
      setUnlocking(false);
      if (res.success) {
        toast.success('Access granted!');
        window.location.reload();
      } else {
        toast.error(res.error || 'Invalid code');
      }
    };
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-sm w-full px-6">
          <Divide className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-white text-xl mb-2">DSA Sheet — Early Access</h2>
          <p className="text-slate-400 text-sm mb-6">Enter your access code to unlock the DSA problem sheet.</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter access code"
              value={unlockCode}
              onChange={e => setUnlockCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUnlock()}
              className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <button
              onClick={handleUnlock}
              disabled={unlocking}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-colors"
            >
              {unlocking ? '...' : 'Unlock'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Overall stats ───
  const totalCompleted = completedIds.size;
  const totalProblems = problems.length;
  const overallPct = Math.round((totalCompleted / totalProblems) * 100);
  const recentlySolved = stats?.recentlySolved || [];
  const todaySolved = recentlySolved.length;

  // ─── Main render ───
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-sm shadow-lg border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/student/dashboard')} className="text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-white">DSA Sheet</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.location.reload()}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Target className="w-3.5 h-3.5" /> Overall Progress
            </div>
            <div className="text-2xl font-bold text-white">{overallPct}%</div>
            <div className="text-xs text-slate-500">{totalCompleted}/{totalProblems} solved</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Star className="w-3.5 h-3.5" /> Today
            </div>
            <div className="text-2xl font-bold text-amber-400">{todaySolved}</div>
            <div className="text-xs text-slate-500">solved this week</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Bookmark className="w-3.5 h-3.5" /> Bookmarked
            </div>
            <div className="text-2xl font-bold text-white">{bookmarkedIds.size}</div>
            <div className="text-xs text-slate-500">saved problems</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <TrendingUp className="w-3.5 h-3.5" /> Current Day
            </div>
            <div className="text-2xl font-bold text-indigo-400">Day {studyDay}</div>
            <div className="text-xs text-slate-500">
              {dayStats[studyDay] ? `${dayStats[studyDay].done}/${dayStats[studyDay].total} done` : '—'}
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1 mb-6 max-w-xs">
          <button
            onClick={() => setViewMode('study-plan')}
            className={classNames(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              viewMode === 'study-plan'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <BookOpen className="w-4 h-4" /> Study Plan
          </button>
          <button
            onClick={() => setViewMode('browse')}
            className={classNames(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              viewMode === 'browse'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <LayoutList className="w-4 h-4" /> Browse
          </button>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search problems..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select
            value={filterDifficulty}
            onChange={e => setFilterDifficulty(e.target.value)}
            className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="all">All Difficulties</option>
            {DIFFICULTY_ORDER.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={filterTopic}
            onChange={e => setFilterTopic(e.target.value)}
            className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="all">All Topics</option>
            {allTopics.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* ─── STUDY PLAN VIEW ─── */}
        {viewMode === 'study-plan' && (
          <div>
            {/* Day Picker */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {allDays.map(day => {
                const ds = dayStats[day] || { total: 0, done: 0, pct: 0 };
                const isActive = day === studyDay;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={classNames(
                      'flex-shrink-0 w-20 sm:w-24 py-3 rounded-xl border text-center transition-all',
                      isActive
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    )}
                  >
                    <div className="text-lg font-bold">{day}</div>
                    <div className="text-[10px] mt-0.5">{ds.pct}%</div>
                    <div className="text-[10px] text-slate-500">{ds.done}/{ds.total}</div>
                  </button>
                );
              })}
            </div>

            {/* Problems for selected day */}
            {dayProblems[studyDay] && dayProblems[studyDay].length > 0 ? (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-700">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    Day {studyDay}
                    <span className="text-sm font-normal text-slate-400">
                      ({dayStats[studyDay]?.done || 0}/{dayStats[studyDay]?.total || 0} completed)
                    </span>
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700 bg-slate-800/60">
                        <th className="text-left py-2.5 pl-3 text-xs font-medium text-slate-400 w-10">✓</th>
                        <th className="text-left py-2.5 pr-3 text-xs font-medium text-slate-400">Problem</th>
                        <th className="text-left py-2.5 text-xs font-medium text-slate-400">Difficulty</th>
                        <th className="text-left py-2.5 text-xs font-medium text-slate-400">Time</th>
                        <th className="text-left py-2.5 text-xs font-medium text-slate-400">Practice</th>
                        <th className="text-center py-2.5 text-xs font-medium text-slate-400">👥</th>
                        <th className="text-left py-2.5 pr-3 text-xs font-medium text-slate-400">☆</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dayProblems[studyDay].map(p => (
                        <ProblemRow
                          key={p.id}
                          problem={p}
                          isCompleted={completedIds.has(String(p.id))}
                          isBookmarked={bookmarkedIds.has(String(p.id))}
                          onToggleComplete={handleToggleComplete}
                          onToggleBookmark={handleToggleBookmark}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-slate-800/30 border border-dashed border-slate-700 rounded-xl">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-white text-lg font-medium">All problems completed!</h3>
                <p className="text-slate-400 text-sm mt-1">Great work! Keep practicing.</p>
              </div>
            )}

            {/* Resume Learning button */}
            {dayStats[studyDay] && dayStats[studyDay].done < dayStats[studyDay].total && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    const firstIncomplete = dayProblems[studyDay]?.find(p => !completedIds.has(String(p.id)));
                    if (firstIncomplete) {
                      document.querySelector('#dsa-table-container')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> Resume Learning
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── BROWSE VIEW ─── */}
        {viewMode === 'browse' && (
          <div>
            {topicsForBrowse.size === 0 ? (
              <div className="text-center py-16 bg-slate-800/30 border border-dashed border-slate-700 rounded-xl">
                <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-white text-lg">No problems match your filters</h3>
                <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...topicsForBrowse.entries()].map(([topic, subtopics]) => {
                  const isOpen = topicExpanded.has(topic);
                  const ts = topicStats[topic] || { total: 0, done: 0 };
                  const tpct = ts.total ? Math.round((ts.done / ts.total) * 100) : 0;
                  return (
                    <div key={topic} className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                      <button
                        onClick={() => {
                          setTopicExpanded(prev => {
                            const next = new Set(prev);
                            isOpen ? next.delete(topic) : next.add(topic);
                            return next;
                          });
                        }}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isOpen
                            ? <ChevronDown className="w-5 h-5 text-slate-400" />
                            : <ChevronRight className="w-5 h-5 text-slate-400" />
                          }
                          <span className="text-white font-semibold">{topic}</span>
                          <span className="text-xs text-slate-500">
                            {subtopics.size} subtopics · {[...subtopics.values()].flat().length} problems
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${tpct}%` }} />
                          </div>
                          <span className="text-xs text-slate-400 w-10 text-right">{tpct}%</span>
                        </div>
                      </button>
                      {isOpen && (
                        <div className="border-t border-slate-700">
                          {[...subtopics.entries()].map(([subtopic, probs]) => (
                            <div key={subtopic} className="border-b border-slate-700/50 last:border-0">
                              <div className="px-6 py-2.5 bg-slate-800/40 text-sm text-slate-300 font-medium">
                                {subtopic} <span className="text-slate-500 font-normal">({probs.length} problems)</span>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b border-slate-700 bg-slate-800/60">
                                      <th className="text-left py-2 pl-3 text-[10px] font-medium text-slate-400 w-10">✓</th>
                                      <th className="text-left py-2 pr-3 text-[10px] font-medium text-slate-400">Problem</th>
                                      <th className="text-left py-2 text-[10px] font-medium text-slate-400">Difficulty</th>
                                      <th className="text-left py-2 text-[10px] font-medium text-slate-400">Time</th>
                                      <th className="text-left py-2 text-[10px] font-medium text-slate-400">Practice</th>
                                      <th className="text-center py-2 text-[10px] font-medium text-slate-400">👥</th>
                                      <th className="text-left py-2 pr-3 text-[10px] font-medium text-slate-400">☆</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {probs.map(p => (
                                      <ProblemRow
                                        key={p.id}
                                        problem={p}
                                        isCompleted={completedIds.has(String(p.id))}
                                        isBookmarked={bookmarkedIds.has(String(p.id))}
                                        onToggleComplete={handleToggleComplete}
                                        onToggleBookmark={handleToggleBookmark}
                                      />
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default DsaSheet;
