import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Clock, Trophy, CheckCircle, AlertCircle, Award, Maximize
} from 'lucide-react';
import competitionService from '../../../services/competitionService';
import toast from 'react-hot-toast';
import Loading from '../../shared/Loading';
import { SubmissionStatusUI } from '../AsyncSubmissionHandler';
import { getDifficultyColor } from './utils/starterCode';
import { formatToIST } from './utils/timeUtils';
import { getStorageKey, clearViolationStorage } from './utils/violationUtils';

import useCompetitionFetch from './hooks/useCompetitionFetch';
import useTimer from './hooks/useTimer';
import useCompetitionProtection from './hooks/useCompetitionProtection';
import useCodeEditor from './hooks/useCodeEditor';

import ProblemList from './components/ProblemList';
import ProblemDescription from './components/ProblemDescription';
import CodeEditorPanel from './components/CodeEditorPanel';
import Overlays from './components/Overlays';

const CompetitionProblems = () => {
  const { competitionId } = useParams();
  const navigate = useNavigate();

  // ── Shared refs (cross-cutting between hooks) ───────────────────────
  const submittedRef = useRef(false);

  // ── Data fetching ───────────────────────────────────────────────────
  const {
    competition, loading,
    selectedProblem, setSelectedProblem,
    problemSolutions, setProblemSolutions,
    submitted, setSubmitted
  } = useCompetitionFetch(competitionId);

  // ── Refs synced with fetch state (needed before useCodeEditor) ──────
  const problemSolutionsRef = useRef({});
  const selectedProblemRef = useRef(null);
  useEffect(() => { problemSolutionsRef.current = problemSolutions; }, [problemSolutions]);
  useEffect(() => { selectedProblemRef.current = selectedProblem; }, [selectedProblem]);
  useEffect(() => { submittedRef.current = submitted; }, [submitted]);

  // ── Code editor (MUST be before callbacks that reference code/language) ──
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
    // violationLogRef and serverTimeOffsetRef not available yet — useCodeEditor
    // only uses them inside effects with fallbacks, so undefined is safe
  );

  // ── Timer ───────────────────────────────────────────────────────────
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
        const key = getStorageKey(competitionId, 'violations');
        clearViolationStorage(key);
        toast.success('⏰ Solutions auto-submitted - time expired');
      } catch (e) {
        toast.error(e.response?.data?.error || 'Auto-submit failed, redirecting...');
      }
    }
    setTimeout(() => navigate(`/student/competition/${competitionId}/results`), 500);
  }, [competitionId, navigate, code, language]);

  const {
    timeRemaining, showTimeWarning, setShowTimeWarning,
    getTimeRemainingDisplay, getCompetitionStatus: competitionStatus,
    getTimeUntilStart: timeUntilStart, serverTimeOffsetRef
  } = useTimer(competition, { submittedRef, onExpiry: autoSubmitOnTimeout });

  // ── Protection ──────────────────────────────────────────────────────
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
    violationLogRef, tabSwitchCountRef, clearViolationLog: clearSessionLog
  } = useCompetitionProtection(competition, {
    submittedRef, serverTimeOffsetRef, onKick: handleKick
  });

  // ── Local UI state ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('description');
  const [showProblemList, setShowProblemList] = useState(true);

  // ── Handlers ────────────────────────────────────────────────────────
  const switchProblem = (newProblem) => {
    if (selectedProblem && code?.trim()) {
      competitionService.saveDraft(competitionId, selectedProblem.id, code, language)
        .catch(e => console.warn('Failed to save draft on switch:', e.message));
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
      toast.error('You have not written any code yet. Please write at least one solution before submitting.');
      return;
    }

    if (!isAutoSubmit && solvedCount < totalProblems) {
      const unsolvedProblems = competition.problems.filter(
        p => !latestSolutions[p.id]?.saved && !latestSolutions[p.id]?.code?.trim()
      );
      if (!window.confirm(
        `Warning: You have only attempted ${solvedCount}/${totalProblems} problems.\n\n` +
        `Unattempted problems:\n${unsolvedProblems.map(p => `• ${p.title}`).join('\n')}\n\n` +
        'Are you sure you want to submit? You can only submit once and this action cannot be undone.'
      )) {
        submittedRef.current = false;
        setSubmitted(false);
        return;
      }
    } else if (!isAutoSubmit) {
      if (!window.confirm(
        `You have attempted all ${totalProblems} problems! Are you sure you want to submit? ` +
        'You can only submit once and this action cannot be undone.'
      )) {
        submittedRef.current = false;
        setSubmitted(false);
        return;
      }
    }

    setSubmitted(true);
    setSubmitting(true);
    toast.loading(isAutoSubmit ? 'Auto-submitting solutions...' : 'Submitting all solutions...');

    try {
      const solutions = Object.entries(latestSolutions)
        .filter(([, s]) => s?.saved || s?.code?.trim())
        .map(([problemId, s]) => ({ problemId, code: s.code, language: s.language }));

      await competitionService.submitSolutions(competitionId, solutions, [...violationLogRef.current]);
      competitionService.clearDrafts(competitionId).catch(e => console.warn('Failed to clear drafts:', e.message));
      const key = getStorageKey(competitionId, 'violations');
      clearViolationStorage(key);

      setSubmitted(true);
      setSubmitting(false);
      toast.dismiss();
      toast.success(`Submitted ${solvedCount}/${totalProblems} solutions successfully! 🎉`);

      setTimeout(() => {
        if (document.fullscreenElement) document.exitFullscreen();
        navigate(`/student/competition/${competitionId}/results`);
      }, 2000);
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.error || 'Failed to submit solutions');
      submittedRef.current = false;
      setSubmitted(false);
      setSubmitting(false);
    }
  };

  // ── Guard: loading ──────────────────────────────────────────────────
  if (loading || !competition) return <Loading />;

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">

      {/* Overlays */}
      <Overlays
        showWarningOverlay={showWarningOverlay}
        tabSwitchCount={tabSwitchCount}
        onDismissWarning={() => {
          document.documentElement.requestFullscreen?.().then(() => {
            setIsFullscreen(true);
            setShowFullscreenPrompt(false);
          }).catch(() => {});
          setShowWarningOverlay(false);
          window.focus();
        }}
        showTimeWarning={showTimeWarning}
        onDismissTimeWarning={() => setShowTimeWarning(false)}
        showFullscreenPrompt={showFullscreenPrompt}
        onEnterFullscreen={enterFullscreen}
        competitionStatus={competitionStatus}
      />

      {/* Custom Scrollbar Styles */}
      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width: 8px; height: 8px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #3e3e3e; border-radius: 4px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #4e4e4e; }
      `}</style>

      {/* Header */}
      <div className="bg-[#282828] border-b border-[#3e3e3e] sticky top-0 z-10 shadow-lg">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h1 className="text-base font-semibold text-white">{competition.title}</h1>
                {competition.difficulty && (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(competition.difficulty)}`}>
                    {competition.difficulty.charAt(0).toUpperCase() + competition.difficulty.slice(1)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border ${
                timeRemaining.expired
                  ? 'bg-red-600/20 border-red-600/50 text-red-400'
                  : timeRemaining.hours === 0 && timeRemaining.minutes < 10
                    ? 'bg-orange-600/20 border-orange-600/50 text-orange-400 animate-pulse'
                    : timeRemaining.hours === 0 && timeRemaining.minutes < 30
                      ? 'bg-yellow-600/20 border-yellow-600/50 text-yellow-400'
                      : 'bg-[#1e1e1e] border-[#3e3e3e]'
              }`}>
                <Clock className={`w-4 h-4 ${
                  timeRemaining.expired ? 'text-red-400' :
                  timeRemaining.hours === 0 && timeRemaining.minutes < 10 ? 'text-orange-400' :
                  timeRemaining.hours === 0 && timeRemaining.minutes < 30 ? 'text-yellow-400' :
                  'text-blue-400'
                }`} />
                <span className={`font-mono font-bold ${
                  timeRemaining.expired ? 'text-red-400' :
                  timeRemaining.hours === 0 && timeRemaining.minutes < 10 ? 'text-orange-400' :
                  'text-gray-300'
                }`}>{getTimeRemainingDisplay()}</span>
              </div>
              <div className="text-sm px-3 py-1.5 bg-[#1e1e1e] rounded-lg border border-[#3e3e3e]">
                <span className="text-gray-400">Solved: </span>
                <span className="text-yellow-400 font-bold">
                  {Object.keys(problemSolutions).filter(id => problemSolutions[id]?.saved).length}/{competition.problems.length}
                </span>
              </div>
              {tabSwitchCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-xs font-bold">Violations: {tabSwitchCount}</span>
                </div>
              )}
              <button
                onClick={enterFullscreen}
                className="p-2 text-gray-400 hover:text-white transition-colors hover:bg-[#3e3e3e] rounded-lg"
                title="Enter Fullscreen"
              >
                <Maximize className="w-5 h-5" />
              </button>
              {!submitted && (
                <button
                  onClick={handleSubmitAll}
                  disabled={submitting}
                  className="px-5 py-2 bg-linear-to-r from-green-600 to-green-500 text-white text-sm rounded-lg hover:from-green-700 hover:to-green-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-green-500/30 hover:shadow-green-500/50"
                >
                  <Trophy className="w-4 h-4" />
                  Submit All Solutions
                </button>
              )}
              {submitted && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 text-sm rounded-lg border border-green-600/30 font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    Submitted
                  </div>
                  <Link
                    to={`/student/competition/${competitionId}/results`}
                    className="px-4 py-2 bg-linear-to-r from-blue-600 to-blue-500 text-white text-sm rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
                  >
                    <Award className="w-4 h-4" />
                    View Results
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Competition Status Banner */}
      {competitionStatus === 'not-started' && (
        <div className="bg-blue-600/20 border-b border-blue-600/50 px-4 py-3">
          <div className="flex items-center justify-center gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400" />
            <p className="text-blue-300 font-semibold">
              Competition hasn't started yet. {timeUntilStart}
            </p>
            <span className="text-blue-400 text-sm">
              Start Time: {formatToIST(competition.startTime)}
            </span>
          </div>
        </div>
      )}
      {competitionStatus === 'ended' && (
        <div className="bg-red-600/20 border-b border-red-600/50 px-4 py-3">
          <div className="flex items-center justify-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-300 font-semibold">Competition has ended</p>
            <Link
              to={`/student/competition/${competitionId}/results`}
              className="ml-4 px-4 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
            >
              View Results
            </Link>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-57px)]">
        <ProblemList
          problems={competition.problems}
          selectedProblem={selectedProblem}
          problemSolutions={problemSolutions}
          onSwitchProblem={switchProblem}
          showProblemList={showProblemList}
          onToggle={() => setShowProblemList(p => !p)}
        />

        <div className="flex-1 flex h-full">
          <ProblemDescription
            selectedProblem={selectedProblem}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            competitionStatus={competitionStatus}
          />

          <CodeEditorPanel
            code={code}
            setCode={setCode}
            language={language}
            setLanguage={setLanguage}
            selectedProblem={selectedProblem}
            submitted={submitted}
            submitting={submitting}
            isSaved={problemSolutions[selectedProblem?.id]?.saved}
            handleEditorDidMount={handleEditorDidMount}
            handleRunCode={handleRunCode}
            handleSaveSolution={handleSaveSolution}
            testResults={testResults}
            showTestCases={showTestCases}
            setShowTestCases={setShowTestCases}
          />
        </div>
      </div>

      {/* Async Submission Status Modal */}
      {['submitted', 'processing', 'completed', 'error', 'timeout'].includes(asyncStatus) && (
        <SubmissionStatusUI status={asyncStatus} result={asyncResult} pollCount={pollCount} />
      )}
    </div>
  );
};

export default CompetitionProblems;
