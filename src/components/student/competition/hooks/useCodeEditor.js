import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../../../services/apiClient';
import competitionService from '../../../../services/competitionService';
import toast from 'react-hot-toast';
import { getServerNow, getCompetitionStatus } from '../utils/timeUtils';
import { generateStarterCode, getMonacoLanguage } from '../utils/starterCode';

const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Code editor state, auto-save (local + server), run/save handlers.
 *
 * @param {Object} selectedProblem - Currently selected problem
 * @param {string} competitionId - Competition ID for server saves
 * @param {boolean} submitted - Whether competition has been submitted
 * @param {Object} competition - Competition data for ongoing checks
 * @param {Object} opts
 * @param {Object} opts.problemSolutions
 * @param {Function} opts.setProblemSolutions
 * @param {Object} opts.problemSolutionsRef
 * @param {Object} opts.selectedProblemRef
 * @param {Object} opts.submittedRef
 * @param {Object} opts.violationLogRef
 * @param {Object} opts.serverTimeOffsetRef - From useTimer, for server-adjusted time
 */
export default function useCodeEditor(
  selectedProblem,
  competitionId,
  submitted,
  competition,
  {
    problemSolutions,
    setProblemSolutions,
    problemSolutionsRef,
    selectedProblemRef,
    submittedRef,
    violationLogRef,
    serverTimeOffsetRef
  } = {}
) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('java');
  const [testResults, setTestResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showTestCases, setShowTestCases] = useState(false);
  const [lastRunTime, setLastRunTime] = useState(0);
  const [asyncStatus, setAsyncStatus] = useState('idle');
  const [asyncResult, setAsyncResult] = useState(null);
  const [pollCount, setPollCount] = useState(0);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const serverSaveTimerRef = useRef(null);
  const editorGuardsCleanupRef = useRef(null);
  const lastClipboardToastAtRef = useRef(0);
  const competitionOngoingRef = useRef(false);

  // Keep competitionOngoingRef in sync for Monaco clipboard guards
  const timeOffsetRef = useRef({ current: 0 });
  useEffect(() => {
    const ref = serverTimeOffsetRef || timeOffsetRef.current;
    if (!competition) { competitionOngoingRef.current = false; return; }
    const now = getServerNow(ref);
    competitionOngoingRef.current = getCompetitionStatus(competition, now) === 'ongoing';
  }, [competition]);

  // Load code when switching problems
  useEffect(() => {
    if (selectedProblem && problemSolutions?.[selectedProblem.id]) {
      setCode(problemSolutions[selectedProblem.id].code || '');
      setLanguage(problemSolutions[selectedProblem.id].language || 'java');
    } else if (selectedProblem) {
      const starterCode = selectedProblem.starterCode?.[language.toLowerCase()] ||
        generateStarterCode(selectedProblem, language.toLowerCase());
      setCode(starterCode);
    } else {
      setCode('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProblem]);

  // Update code when language changes (only if not saved)
  useEffect(() => {
    if (selectedProblem && !problemSolutions?.[selectedProblem.id]?.saved) {
      const starterCode = selectedProblem.starterCode?.[language.toLowerCase()] ||
        generateStarterCode(selectedProblem, language.toLowerCase());
      if (starterCode) setCode(starterCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Local auto-save (debounced 500ms)
  useEffect(() => {
    if (!selectedProblemRef?.current || !code) return;
    const problemId = selectedProblemRef.current.id;
    const timer = setTimeout(() => {
      setProblemSolutions?.(prev => ({
        ...prev,
        [problemId]: { ...prev[problemId], code, language }
      }));
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, language]);

  // Server auto-save (every 3s of inactivity)
  useEffect(() => {
    if (!selectedProblemRef?.current || !code?.trim() || submittedRef?.current) return;

    if (serverSaveTimerRef.current) clearTimeout(serverSaveTimerRef.current);

    serverSaveTimerRef.current = setTimeout(async () => {
      try {
        await competitionService.saveDraft(
          competitionId,
          selectedProblemRef.current.id,
          code,
          language
        );
      } catch (e) {
        console.warn('Auto-save to server failed:', e.message);
      }
    }, 3000);

    return () => {
      if (serverSaveTimerRef.current) clearTimeout(serverSaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, language]);

  // Monaco clipboard guards — re-install when competition/submitted change (editor may not be ready yet on first pass)
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    if (editorGuardsCleanupRef.current) {
      editorGuardsCleanupRef.current();
      editorGuardsCleanupRef.current = null;
    }

    const shouldBlock = () => competitionOngoingRef.current && !submittedRef?.current;
    const notifyBlocked = () => {
      const now = Date.now();
      if (now - lastClipboardToastAtRef.current > 800) {
        lastClipboardToastAtRef.current = now;
        toast.error('Copy/Paste/Cut is disabled during competition');
      }
    };

    const domNode = editor.getDomNode();
    if (!domNode) return;

    const blockDomEvent = (e) => { if (shouldBlock()) { e.preventDefault(); e.stopPropagation(); notifyBlocked(); } };
    const keydownCapture = (e) => {
      if (!shouldBlock()) return;
      const key = (e.key || '').toLowerCase();
      const ctrlOrMeta = e.ctrlKey || e.metaKey;
      if (
        (ctrlOrMeta && (key === 'c' || key === 'v' || key === 'x' || key === 'insert')) ||
        (e.shiftKey && key === 'insert') ||
        (e.shiftKey && key === 'delete')
      ) {
        e.preventDefault();
        e.stopPropagation();
        notifyBlocked();
      }
    };

    domNode.addEventListener('copy', blockDomEvent, true);
    domNode.addEventListener('cut', blockDomEvent, true);
    domNode.addEventListener('paste', blockDomEvent, true);
    domNode.addEventListener('drop', blockDomEvent, true);
    domNode.addEventListener('contextmenu', blockDomEvent, true);
    domNode.addEventListener('keydown', keydownCapture, true);

    const blockAction = () => { if (shouldBlock()) { notifyBlocked(); return null; } };
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, blockAction, '!editorReadonly');
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, blockAction, '!editorReadonly');
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX, blockAction, '!editorReadonly');
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Insert, blockAction, '!editorReadonly');
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Insert, blockAction, '!editorReadonly');
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Delete, blockAction, '!editorReadonly');

    const pasteDisposable = editor.onDidPaste(() => {
      if (!shouldBlock()) return;
      editor.trigger('competition-guard', 'undo', null);
      notifyBlocked();
    });

    editorGuardsCleanupRef.current = () => {
      pasteDisposable.dispose();
      domNode.removeEventListener('copy', blockDomEvent, true);
      domNode.removeEventListener('cut', blockDomEvent, true);
      domNode.removeEventListener('paste', blockDomEvent, true);
      domNode.removeEventListener('drop', blockDomEvent, true);
      domNode.removeEventListener('contextmenu', blockDomEvent, true);
      domNode.removeEventListener('keydown', keydownCapture, true);
    };

    return () => {
      if (editorGuardsCleanupRef.current) {
        editorGuardsCleanupRef.current();
        editorGuardsCleanupRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competition, submitted]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.updateOptions({
      fontSize: 14,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      lineNumbers: 'on',
      renderWhitespace: 'selection',
      automaticLayout: true,
      wordWrap: 'on',
      tabSize: 4,
      folding: true,
      glyphMargin: false,
      autoClosingBrackets: 'always',
      autoClosingQuotes: 'always',
      formatOnPaste: false,
      formatOnType: true,
      selectionClipboard: false,
      contextmenu: false,
      dragAndDrop: false
    });
  };

  const handleRunCode = async () => {
    const now = Date.now();
    const cooldownPeriod = 3000;
    if (now - lastRunTime < cooldownPeriod) {
      toast.error(`Please wait ${Math.ceil((cooldownPeriod - (now - lastRunTime)) / 1000)}s before running again`);
      return;
    }

    setLastRunTime(now);
    setSubmitting(true);
    setTestResults(null);

    try {
      const token = apiClient.getToken();
      if (!token) throw new Error('No authentication token found. Please login again.');

      const response = await fetch(`${API_URL}/submissions/${selectedProblem.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ code, language })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to run code');

      const formattedResults = {
        accepted: result.summary.allPassed,
        passed: result.summary.passed,
        total: result.summary.total,
        cases: result.results.map((r, idx) => ({
          id: r.testCase || idx + 1,
          passed: r.passed,
          time: r.time || 'N/A',
          input: r.input || 'N/A',
          expected: r.expectedOutput || 'N/A',
          actual: r.actualOutput || 'No output',
          error: r.error || null,
          hidden: false
        }))
      };

      setTestResults(formattedResults);
      setShowTestCases(true);

      if (result.summary.allPassed) {
        toast.success(`All ${result.summary.total} test cases passed! 🎉`);
      } else if (result.summary.compilationError) {
        toast.error('Compilation Error');
      } else {
        toast(`${result.summary.passed}/${result.summary.total} test cases passed`);
      }
    } catch (error) {
      toast.error('Failed to run code: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSolution = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }

    setProblemSolutions?.(prev => ({
      ...prev,
      [selectedProblem.id]: {
        code, language, saved: true, timestamp: new Date().toISOString()
      }
    }));

    try {
      await competitionService.saveDraft(competitionId, selectedProblem.id, code, language);
      toast.success('Solution saved!');
    } catch (error) {
      toast.error('Saved locally, but server save failed — try again');
    }
  };

  const checkSubmissionStatus = async (submissionId) => {
    const token = apiClient.getToken();
    const response = await fetch(`${API_URL}/submissions/${submissionId}/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to check status');
    return response.json();
  };

  const startSmartPolling = (submissionId) => {
    let currentPollCount = 0;
    const maxPolls = 50;
    let isPolling = true;

    const poll = () => {
      if (currentPollCount >= maxPolls) {
        setAsyncStatus('timeout');
        setAsyncResult({ error: 'Results check timed out. Try refreshing.' });
        setSubmitting(false);
        isPolling = false;
        return;
      }

      checkSubmissionStatus(submissionId).then(data => {
        setPollCount(currentPollCount + 1);
        if (data.status === 'completed' || data.status === 'error') {
          setAsyncStatus('completed');
          setTestResults({
            passed: data.passed,
            total: data.total,
            cases: data.testResults || [],
            accepted: data.passed === data.total,
            efficiencyMultiplier: data.efficiencyMultiplier ?? 1.0,
            optimizationFeedback: data.optimizationFeedback ?? null
          });
          setSubmitting(false);
          isPolling = false;
          toast.dismiss();
          toast(data.passed === data.total
            ? `All ${data.total} test cases passed! 🎉`
            : `${data.passed}/${data.total} test cases passed`
          );
        } else {
          setAsyncStatus('processing');
          currentPollCount++;
          if (isPolling) setTimeout(poll, Math.min(3000 + currentPollCount * 1000, 10000));
        }
      }).catch(() => {
        currentPollCount++;
        if (isPolling && currentPollCount < maxPolls) setTimeout(poll, 5000);
      });
    };

    setTimeout(poll, 2000);
  };

  return {
    code,
    setCode,
    language,
    setLanguage,
    editorRef,
    monacoRef,
    handleEditorDidMount,
    handleRunCode,
    handleSaveSolution,
    handleSubmitAsync: startSmartPolling,
    testResults,
    setTestResults,
    submitting,
    setSubmitting,
    showTestCases,
    setShowTestCases,
    lastRunTime,
    asyncStatus,
    asyncResult,
    pollCount
  };
}
