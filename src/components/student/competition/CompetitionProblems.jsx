import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Clock, Trophy, CheckCircle, AlertCircle, Award, Maximize, Minimize
} from 'lucide-react';
import competitionService from '../../../services/competitionService';
import toast from 'react-hot-toast';
import Loading from '../../shared/Loading';
import { SubmissionStatusUI } from '../AsyncSubmissionHandler';
import { getDifficultyColor, seededShuffle } from './utils/starterCode';
import { formatToIST } from './utils/timeUtils';
import { useAuth } from '../../../context/AuthContext';
import { getStorageKey, clearViolationStorage } from './utils/violationUtils';

import useCompetitionFetch from './hooks/useCompetitionFetch';
import useTimer from './hooks/useTimer';
import useCompetitionProtection from './hooks/useCompetitionProtection';
import useCodeEditor from './hooks/useCodeEditor';

import ProblemList from './components/ProblemList';
import ProblemDescription from './components/ProblemDescription';
import CodeEditorPanel from './components/CodeEditorPanel';
import Overlays from './components/Overlays';

const LEFT_MIN = 160;
const LEFT_MAX = 850;
const LEFT_DEFAULT = 420;
const STORAGE_KEY = 'comp_split_width';

const CompetitionProblems = () => {
  const { currentUser } = useAuth();
  const { competitionId } = useParams();
  const navigate = useNavigate();

  const submittedRef = useRef(false);
  const containerRef = useRef(null);
  const leftWidthRef = useRef(LEFT_DEFAULT);
  const rafRef = useRef(null);
  const editorRef = useRef(null);

  // ── Data fetching ────────────────────────────────────────────────────
  const {
    competition, loading,
    selectedProblem, setSelectedProblem,
    problemSolutions, setProblemSolutions,
    submitted, setSubmitted
  } = useCompetitionFetch(competitionId);

  const problemSolutionsRef = useRef({});
  const selectedProblemRef = useRef(null);
  useEffect(() => { problemSolutionsRef.current = problemSolutions; }, [problemSolutions]);
  useEffect(() => { selectedProblemRef.current = selectedProblem; }, [selectedProblem]);
  useEffect(() => { submittedRef.current = submitted; }, [submitted]);

  // ── Code editor ──────────────────────────────────────────────────────
  const {
    code, setCode, language, setLanguage,
    handleEditorDidMount,
    handleRunCode, handleSaveSolution,
    testResults, setTestResults, submitting, setSubmitting,
    showTestCases, setShowTestCases,
    asyncStatus, asyncResult, pollCount
  } = useCodeEditor(
    selectedProblem, competitionId, submitted, competition,
    { problemSolutions, setProblemSolutions, problemSolutionsRef, selectedProblemRef, submittedRef }
  );

  // Capture editor ref
  const onEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    handleEditorDidMount(editor, monaco);
  }, [handleEditorDidMount]);

  // ── Timer ────────────────────────────────────────────────────────────
  const autoSubmitOnTimeout = useCallback(async () => {
    submittedRef.current = true;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    const latestSolutions = { ...problemSolutionsRef.current };
    if (selectedProblemRef.current && code?.trim()) {
      latestSolutions[selectedProblemRef.current.id] = {
        ...latestSolutions[selectedProblemRef.current.id], code, language
      };
    }
    const solutions = Object.entries(latestSolutions)
      .filter(([, s]) => s?.saved || s?.code?.trim())
      .map(([problemId, s]) => ({ problemId, code: s.code, language: s.language }));
    if (solutions.length > 0) {
      try {
        await competitionService.submitSolutions(competitionId, solutions, [...violationLogRef.current]);
        competitionService.clearDrafts(competitionId).catch(() => {});
        clearViolationStorage(getStorageKey(competitionId, 'violations'));
        toast.success('⏰ Solutions auto-submitted - time expired');
      } catch (e) {
        toast.error(e.response?.data?.error || 'Auto-submit failed');
      }
    }
    setTimeout(() => navigate(`/student/competition/${competitionId}/results`), 500);
  }, [competitionId, navigate, code, language]);

  const {
    timeRemaining, showTimeWarning, setShowTimeWarning,
    getTimeRemainingDisplay, getCompetitionStatus: competitionStatus,
    getTimeUntilStart: timeUntilStart, serverTimeOffsetRef
  } = useTimer(competition, { submittedRef, onExpiry: autoSubmitOnTimeout });

  // ── Protection ───────────────────────────────────────────────────────
  const handleKick = useCallback(async (count, violationLog) => {
    submittedRef.current = true;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    const solutions = Object.entries(problemSolutionsRef.current)
      .filter(([, s]) => s?.saved || s?.code?.trim())
      .map(([problemId, s]) => ({ problemId, code: s.code, language: s.language }));
    if (solutions.length > 0) {
      try {
        await competitionService.submitSolutions(competitionId, solutions, violationLog);
        competitionService.clearDrafts(competitionId).catch(() => {});
        toast.success('⚠️ Solutions auto-submitted due to violations');
      } catch (e) { console.error('Auto-submit failed:', e); }
    }
  }, [competitionId]);

  const {
    tabSwitchCount, showWarningOverlay, setShowWarningOverlay,
    showFullscreenPrompt, setShowFullscreenPrompt,
    isFullscreen, setIsFullscreen, enterFullscreen,
    fullscreenFailed, fullscreenDiag,
    violationLogRef, tabSwitchCountRef
  } = useCompetitionProtection(competition, {
    submittedRef, serverTimeOffsetRef, onKick: handleKick
  });

  // ── Per-student deterministic problem shuffle ─────────────────────────
  // Seed = userId + competitionId  →  same student always sees same order,
  // different students see different orderings. Stable across page reloads.
  const shuffledProblems = useMemo(() => {
    const seed = (currentUser?.id || currentUser?.uid || 'anon') + String(competitionId);
    return seededShuffle(competition?.problems ?? [], seed);
  }, [competition?.problems, currentUser?.id, currentUser?.uid, competitionId]);

  // ── Layout state ─────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('description');
  const [showProblemList, setShowProblemList] = useState(true);
  const [showDescription, setShowDescription] = useState(true);
  const [leftWidth, setLeftWidth] = useState(LEFT_DEFAULT);
  const [isDragging, setIsDragging] = useState(false);
  const [editorFullscreen, setEditorFullscreen] = useState(false);
  const leftPanelRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const v = parseInt(saved, 10);
        if (v >= LEFT_MIN && v <= LEFT_MAX) {
          setLeftWidth(v);
          leftWidthRef.current = v;
        }
      }
    } catch (e) {}
  }, []);

  const updateLeftWidth = useCallback((newWidth) => {
    const container = containerRef.current;
    const rect = container ? container.getBoundingClientRect() : null;
    const maxW = rect ? Math.min(LEFT_MAX, rect.width - 200) : LEFT_MAX;
    const clamped = Math.max(LEFT_MIN, Math.min(maxW, newWidth));
    setLeftWidth(clamped);
    leftWidthRef.current = clamped;
    if (leftPanelRef.current) {
      leftPanelRef.current.style.width = clamped + 'px';
    }
    try {
      localStorage.setItem(STORAGE_KEY, String(clamped));
    } catch (e) {}
    if (editorRef.current) {
      editorRef.current.layout();
    }
  }, []);

  // ── Drag-to-resize (DOM-level, zero React overhead) ──────────────────
  useEffect(() => {
    if (!isDragging) return;

    const leftEl = leftPanelRef.current;
    const editorEl = editorRef.current;
    if (!leftEl) return;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    const container = containerRef.current;

    const onMove = (e) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const maxW = Math.min(LEFT_MAX, rect.width - 200);
      const w = Math.max(LEFT_MIN, Math.min(maxW, e.clientX - rect.left));
      // Direct DOM write — instant, no React re-render
      leftEl.style.width = w + 'px';
      leftWidthRef.current = w;
      // Force Monaco to re-layout with new container size
      if (editorEl) editorEl.layout();
    };

    const onUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      const finalW = leftWidthRef.current;
      setLeftWidth(finalW);
      try { localStorage.setItem(STORAGE_KEY, String(finalW)); } catch (e) {}
      if (editorEl) editorEl.layout();
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (submitted || submitting) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunCode().catch(() => {});
      }
      if (e.key === 'F11' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F')) {
        e.preventDefault();
        setEditorFullscreen(f => !f);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [submitted, submitting, handleRunCode]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const switchProblem = (newProblem) => {
    if (selectedProblem && code?.trim()) {
      competitionService.saveDraft(competitionId, selectedProblem.id, code, language)
        .catch(e => console.warn('Draft save failed:', e.message));
      setProblemSolutions(prev => ({
        ...prev,
        [selectedProblem.id]: { ...prev[selectedProblem.id], code, language }
      }));
    }
    setTestResults(null);
    setShowTestCases(false);
    setSelectedProblem(newProblem);
  };

  const handleSubmitAll = async (isAutoSubmit = false) => {
    if (submitted || submitting) return;
    submittedRef.current = true;

    const latestSolutions = { ...problemSolutions };
    if (selectedProblem && code?.trim()) {
      latestSolutions[selectedProblem.id] = { ...latestSolutions[selectedProblem.id], code, language };
    }

    const solvedCount = Object.keys(latestSolutions).filter(
      id => latestSolutions[id]?.saved || latestSolutions[id]?.code?.trim()
    ).length;
    const totalProblems = competition.problems.length;

    if (solvedCount === 0) {
      submittedRef.current = false;
      setSubmitted(false);
      toast.error('Please write at least one solution before submitting.');
      return;
    }

    if (!isAutoSubmit && solvedCount < totalProblems) {
      const unsolved = competition.problems.filter(
        p => !latestSolutions[p.id]?.saved && !latestSolutions[p.id]?.code?.trim()
      );
      if (!window.confirm(
        `Only ${solvedCount}/${totalProblems} attempted.\n\nUnattempted:\n${unsolved.map(p => `• ${p.title}`).join('\n')}\n\nSubmit anyway?`
      )) { submittedRef.current = false; setSubmitted(false); return; }
    } else if (!isAutoSubmit) {
      if (!window.confirm(`All ${totalProblems} attempted! Submit now?`)) {
        submittedRef.current = false; setSubmitted(false); return;
      }
    }

    setSubmitted(true);
    setSubmitting(true);
    toast.loading('Submitting...');

    try {
      const solutions = Object.entries(latestSolutions)
        .filter(([, s]) => s?.saved || s?.code?.trim())
        .map(([problemId, s]) => ({ problemId, code: s.code, language: s.language }));
      await competitionService.submitSolutions(competitionId, solutions, [...violationLogRef.current]);
      competitionService.clearDrafts(competitionId).catch(() => {});
      clearViolationStorage(getStorageKey(competitionId, 'violations'));
      setSubmitted(true);
      setSubmitting(false);
      toast.dismiss();
      toast.success(`Submitted ${solvedCount}/${totalProblems}! 🎉`);
      setTimeout(() => {
        if (document.fullscreenElement) document.exitFullscreen();
        navigate(`/student/competition/${competitionId}/results`);
      }, 1500);
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.error || 'Submit failed');
      submittedRef.current = false;
      setSubmitted(false);
      setSubmitting(false);
    }
  };

  if (loading || !competition) return <Loading />;

  return (
    <div className={`min-h-screen bg-[#0d1117] text-white ${editorFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <Overlays
        showWarningOverlay={showWarningOverlay}
        tabSwitchCount={tabSwitchCount}
        onDismissWarning={() => {
          document.documentElement.requestFullscreen?.().then(() => {
            setIsFullscreen(true); setShowFullscreenPrompt(false);
          }).catch(() => {});
          setShowWarningOverlay(false);
          window.focus();
        }}
        showTimeWarning={showTimeWarning}
        onDismissTimeWarning={() => setShowTimeWarning(false)}
        showFullscreenPrompt={showFullscreenPrompt}
        onEnterFullscreen={enterFullscreen}
        competitionStatus={competitionStatus}
        fullscreenFailed={fullscreenFailed}
        fullscreenDiag={fullscreenDiag}
        onDismissFullscreenFailed={() => { setShowFullscreenPrompt(false); setIsFullscreen(true); }}
      />

      <style>{`
        .comp-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .comp-scroll::-webkit-scrollbar-track { background: transparent; }
        .comp-scroll::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
        .comp-scroll::-webkit-scrollbar-thumb:hover { background: #484f58; }
        .split-handle:hover .handle-line { opacity: 1; }
      `}</style>

      {/* Top bar */}
      <div className="bg-[#161b22] border-b border-[#30363d] px-4 h-12 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />
          <h1 className="text-sm font-semibold text-white truncate">{competition.title}</h1>
          {competition.difficulty && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${getDifficultyColor(competition.difficulty)}`}>
              {competition.difficulty.charAt(0).toUpperCase() + competition.difficulty.slice(1)}
            </span>
          )}
          {competitionStatus === 'ongoing' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/15 text-green-400 border border-green-500/25">Live</span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {competitionStatus === 'ongoing' && (
            <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border font-mono ${
              timeRemaining.expired ? 'bg-red-500/10 border-red-500/30 text-red-400' :
              timeRemaining.hours === 0 && timeRemaining.minutes < 10 ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 animate-pulse' :
              'bg-[#21262d] border-[#30363d] text-gray-300'
            }`}>
              <Clock className="w-3.5 h-3.5" />{getTimeRemainingDisplay()}
            </div>
          )}
          <span className="text-xs text-gray-500 tabular-nums">
            {Object.keys(problemSolutions).filter(id => problemSolutions[id]?.saved).length}/{competition.problems.length} solved
          </span>
          {tabSwitchCount > 0 && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">{tabSwitchCount} violations</span>
          )}
          <button onClick={() => setEditorFullscreen(f => !f)}
            className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-[#21262d] transition-colors"
            title={editorFullscreen ? 'Exit fullscreen (F11)' : 'Fullscreen (F11)'}>
            {editorFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
          {!submitted && (
            <button onClick={handleSubmitAll} disabled={submitting}
              className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-md shadow-green-600/20">
              <Trophy className="w-3.5 h-3.5" />Submit All
            </button>
          )}
          {submitted && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 text-green-400 text-xs rounded border border-green-500/25 font-medium">
                <CheckCircle className="w-3.5 h-3.5" /> Submitted
              </span>
              <Link to={`/student/competition/${competitionId}/results`}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition font-medium flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />Results
              </Link>
            </div>
          )}
        </div>
      </div>

      {competitionStatus === 'not-started' && (
        <div className="bg-blue-600/10 border-b border-blue-600/25 px-4 py-1.5 text-center">
          <p className="text-blue-300 text-xs">Starts {timeUntilStart} · {formatToIST(competition.startTime)}</p>
        </div>
      )}
      {competitionStatus === 'ended' && (
        <div className="bg-red-600/10 border-b border-red-600/25 px-4 py-1.5 flex items-center justify-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <p className="text-red-300 text-xs font-medium">Competition ended</p>
          <Link to={`/student/competition/${competitionId}/results`}
            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition">View Results</Link>
        </div>
      )}

      {/* ─── MAIN LAYOUT ─── */}
      <div className="flex overflow-hidden" style={{ height: editorFullscreen ? 'calc(100vh - 48px)' : 'calc(100vh - 105px)' }}>
        {/* Problem list sidebar (fixed width) */}
        <ProblemList
          problems={shuffledProblems}
          selectedProblem={selectedProblem}
          problemSolutions={problemSolutions}
          onSwitchProblem={switchProblem}
          showProblemList={showProblemList}
          onToggle={() => setShowProblemList(p => !p)}
        />

        {/* ── Split pane: Left (description) | Handle | Right (editor) ── */}
        <div className="flex-1 flex min-w-0 overflow-hidden" ref={containerRef}>
          {showDescription && !editorFullscreen && (
            <div
              ref={leftPanelRef}
              style={{ width: leftWidth, minWidth: LEFT_MIN, maxWidth: LEFT_MAX }}
              className="shrink-0 overflow-hidden border-r border-[#30363d] flex flex-col"
            >
              <ProblemDescription
                selectedProblem={selectedProblem}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                competitionStatus={competitionStatus}
                onToggleDescription={() => setShowDescription(false)}
              />
            </div>
          )}

          {/* Resize handle between Problem Description and Code Editor */}
          {showDescription && !editorFullscreen && (
            <div
              className={`shrink-0 w-2.5 bg-[#161b22] hover:bg-blue-600/50 cursor-col-resize transition-all split-handle flex flex-col items-center justify-center select-none group relative border-x border-[#30363d]/60 ${
                isDragging ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/20' : ''
              }`}
              onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDoubleClick={() => {
                const target = leftWidth <= 220 ? LEFT_DEFAULT : 180;
                updateLeftWidth(target);
              }}
              title="Drag to resize Problem/Editor split • Double-click to toggle compact problem view"
            >
              <div className="w-1 h-8 rounded-full bg-[#484f58] group-hover:bg-white transition-colors flex flex-col justify-center items-center gap-0.5 py-1">
                <div className="w-0.5 h-0.5 bg-gray-300 group-hover:bg-blue-900 rounded-full" />
                <div className="w-0.5 h-0.5 bg-gray-300 group-hover:bg-blue-900 rounded-full" />
                <div className="w-0.5 h-0.5 bg-gray-300 group-hover:bg-blue-900 rounded-full" />
              </div>
            </div>
          )}

          {/* Right panel: code editor — takes remaining space */}
          <div className="flex-1 flex flex-col min-w-[200px] overflow-hidden">
            {!showDescription && !editorFullscreen && (
              <button onClick={() => setShowDescription(true)}
                className="shrink-0 px-3 py-1.5 bg-[#161b22] border-b border-[#30363d] flex items-center text-xs text-gray-400 hover:text-white hover:bg-[#21262d] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 mr-1.5 opacity-50" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm12 0H5v8h10V5z" clipRule="evenodd" />
                </svg>
                Show Problem Description
              </button>
            )}
            <CodeEditorPanel
              code={code} setCode={setCode}
              language={language} setLanguage={setLanguage}
              selectedProblem={selectedProblem}
              submitted={submitted} submitting={submitting}
              isSaved={problemSolutions[selectedProblem?.id]?.saved}
              handleEditorDidMount={onEditorMount}
              handleRunCode={handleRunCode}
              handleSaveSolution={handleSaveSolution}
              testResults={testResults}
              showTestCases={showTestCases}
              setShowTestCases={setShowTestCases}
              isFullscreen={editorFullscreen}
              showDescription={showDescription}
              onToggleDescription={() => setShowDescription(p => !p)}
              leftWidth={leftWidth}
              onSetLeftWidth={updateLeftWidth}
            />
          </div>
        </div>
      </div>

      {['submitted', 'processing', 'completed', 'error', 'timeout'].includes(asyncStatus) && (
        <SubmissionStatusUI status={asyncStatus} result={asyncResult} pollCount={pollCount} />
      )}
    </div>
  );
};

export default CompetitionProblems;
