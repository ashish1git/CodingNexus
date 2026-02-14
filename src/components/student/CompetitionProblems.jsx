import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Code, CheckCircle, XCircle, Clock, Trophy,
  Play, Send, AlertCircle, Target, Award, ChevronDown,
  ChevronUp, List, FileText, TestTube, Terminal, Maximize
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/apiClient';
import competitionService from '../../services/competitionService';
import toast from 'react-hot-toast';
import Loading from '../shared/Loading';
import AsyncSubmissionHandler, { SubmissionStatusUI } from './AsyncSubmissionHandler';
import Editor from '@monaco-editor/react';

const CompetitionProblems = () => {
  const { competitionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const editorRef = useRef(null);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('java'); // Default to Java
  const [testResults, setTestResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastRunTime, setLastRunTime] = useState(0);
  const [showTestCases, setShowTestCases] = useState(false);
  const [activeTab, setActiveTab] = useState('description'); // description, submissions, editorial
  const [showProblemList, setShowProblemList] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [problemSolutions, setProblemSolutions] = useState({});
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [asyncStatus, setAsyncStatus] = useState('idle');
  const [asyncResult, setAsyncResult] = useState(null);
  const [pollCount, setPollCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false });

  // Generate default starter code template when none exists
  const generateStarterCode = (problem, lang) => {
    if (!problem) return '';
    
    const functionName = problem.functionName || 'solution';
    const returnType = problem.returnType || 'int';
    const parameters = problem.parameters || [{ name: 'nums', type: 'int[]' }];

    // Type mappings for each language
    const typeMap = {
      java: {
        'int': 'int', 'int[]': 'int[]', 'int[][]': 'int[][]',
        'string': 'String', 'String': 'String', 'string[]': 'String[]',
        'boolean': 'boolean', 'bool': 'boolean', 'double': 'double',
        'long': 'long', 'List<Integer>': 'List<Integer>', 'List<String>': 'List<String>'
      },
      cpp: {
        'int': 'int', 'int[]': 'vector<int>', 'int[][]': 'vector<vector<int>>',
        'string': 'string', 'String': 'string', 'string[]': 'vector<string>',
        'boolean': 'bool', 'bool': 'bool', 'double': 'double',
        'long': 'long long', 'List<Integer>': 'vector<int>', 'List<String>': 'vector<string>'
      },
      python: {
        'int': 'int', 'int[]': 'List[int]', 'int[][]': 'List[List[int]]',
        'string': 'str', 'String': 'str', 'string[]': 'List[str]',
        'boolean': 'bool', 'bool': 'bool', 'double': 'float',
        'long': 'int', 'List<Integer>': 'List[int]', 'List<String>': 'List[str]'
      }
    };

    const getType = (type, lang) => typeMap[lang]?.[type] || type;

    if (lang === 'java') {
      const params = parameters.map(p => `${getType(p.type, 'java')} ${p.name}`).join(', ');
      return `class Solution {
    public ${getType(returnType, 'java')} ${functionName}(${params}) {
        // Write your solution here
        
    }
}`;
    } else if (lang === 'cpp') {
      const params = parameters.map(p => `${getType(p.type, 'cpp')}& ${p.name}`).join(', ');
      return `class Solution {
public:
    ${getType(returnType, 'cpp')} ${functionName}(${params}) {
        // Write your solution here
        
    }
};`;
    } else if (lang === 'python') {
      const params = parameters.map(p => `${p.name}: ${getType(p.type, 'python')}`).join(', ');
      return `class Solution:
    def ${functionName}(self, ${params}) -> ${getType(returnType, 'python')}:
        # Write your solution here
        pass`;
    }
    
    return '';
  };

  // Map language to Monaco editor language ID
  const getMonacoLanguage = (lang) => {
    const languageMap = {
      'cpp': 'cpp',
      'java': 'java',
      'python': 'python',
      'javascript': 'javascript',
      'c': 'c'
    };
    return languageMap[lang] || 'java';
  };

  // Handle Monaco Editor mount
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Configure editor options
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
      formatOnPaste: true,
      formatOnType: true
    });
  };

  useEffect(() => {
    fetchCompetition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competitionId]);

  const fetchCompetition = async () => {
    try {
      setLoading(true);
      const data = await competitionService.getCompetition(competitionId);
      setCompetition(data);
      if (data.problems && data.problems.length > 0) {
        setSelectedProblem(data.problems[0]);
      }
      if (data.hasSubmitted) {
        setSubmitted(true);
      }
      
      // Auto-register if not already registered
      if (!data.isRegistered && !data.hasSubmitted) {
        try {
          await competitionService.registerForCompetition(competitionId);
          console.log('Auto-registered for competition');
        } catch (regError) {
          // Ignore registration errors (might already be registered)
          console.log('Registration skipped:', regError.message);
        }
      }
    } catch (error) {
      console.error('Error fetching competition:', error);
      toast.error('Failed to load competition');
      navigate('/student/competitions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (competition && competition.problems && competition.problems.length > 0 && !selectedProblem) {
      setSelectedProblem(competition.problems[0]);
    }
    
    // Exit fullscreen on component unmount
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live countdown timer effect
  useEffect(() => {
    if (!competition?.endTime) return;

    const updateTimer = () => {
      const end = new Date(competition.endTime);
      const now = new Date();
      const diff = end - now;

      if (diff <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ hours, minutes, seconds, expired: false });
    };

    // Update immediately
    updateTimer();
    
    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [competition?.endTime]);

  useEffect(() => {
    // Load saved code when switching problems
    if (selectedProblem && problemSolutions[selectedProblem.id]) {
      setCode(problemSolutions[selectedProblem.id].code || '');
      setLanguage(problemSolutions[selectedProblem.id].language || 'java');
    } else if (selectedProblem) {
      // Set starter code from problem if available, or generate one
      const starterCode = selectedProblem.starterCode?.[language.toLowerCase()] || 
                         generateStarterCode(selectedProblem, language.toLowerCase());
      setCode(starterCode);
    } else {
      setCode('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProblem]);

  useEffect(() => {
    // Update code when language changes (only if not saved)
    if (selectedProblem && !problemSolutions[selectedProblem.id]?.saved) {
      // Try to get starter code from problem, or generate one
      const starterCode = selectedProblem.starterCode?.[language.toLowerCase()] || 
                         generateStarterCode(selectedProblem, language.toLowerCase());
      if (starterCode) {
        setCode(starterCode);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => {
        console.log('Error attempting to enable fullscreen:', err);
      });
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  };

  const handleRunCode = async () => {
    // Rate limiting: Allow only 1 run per 3 seconds
    const now = Date.now();
    const timeSinceLastRun = now - lastRunTime;
    const cooldownPeriod = 3000; // 3 seconds
    
    if (timeSinceLastRun < cooldownPeriod) {
      const remainingTime = Math.ceil((cooldownPeriod - timeSinceLastRun) / 1000);
      toast.error(`Please wait ${remainingTime}s before running again`);
      return;
    }
    
    setLastRunTime(now);
    setSubmitting(true);
    setTestResults(null);
    // Don't set asyncStatus for 'run' - we want inline results, not modal
    
    try {
      console.log('🏃 Running code against sample test cases...');

      const token = apiClient.getToken();
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      // Use /run endpoint for quick testing (not /submit-async)
      const response = await fetch(`/api/submissions/${selectedProblem.id}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code,
          language
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to run code');
      }

      console.log('✅ Run complete:', result);

      // Format test results for UI (expected format: accepted, passed, total, cases[])
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
      setShowTestCases(true); // Auto-expand test results

      if (result.summary.allPassed) {
        toast.success(`All ${result.summary.total} test cases passed! 🎉`);
      } else if (result.summary.compilationError) {
        toast.error('Compilation Error');
      } else {
        toast(`${result.summary.passed}/${result.summary.total} test cases passed`);
      }

    } catch (error) {
      console.error('Run error:', error);
      toast.error('Failed to run code: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Smart polling with exponential backoff
   * Checks status every 3-10 seconds and stops when results ready
   */
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
          // ✅ Results ready!
          setAsyncStatus('completed');
          
          // Convert API response to testResults format
          setTestResults({
            passed: data.passed,
            total: data.total,
            cases: data.testResults || [],
            accepted: data.passed === data.total
          });

          setSubmitting(false);
          isPolling = false;

          toast.dismiss();
          if (data.passed === data.total) {
            toast.success(`All ${data.total} test cases passed! 🎉`);
          } else {
            toast.error(`${data.passed}/${data.total} test cases passed`);
          }

          console.log('✅ Polling stopped - results ready');
        } else {
          // Continue polling with exponential backoff
          setAsyncStatus('processing');
          const nextDelay = Math.min(3000 + (currentPollCount * 1000), 10000);
          currentPollCount++;
          
          console.log(`⏱️  Next poll in ${nextDelay}ms (poll #${currentPollCount})`);
          
          if (isPolling) {
            setTimeout(poll, nextDelay);
          }
        }
      }).catch(error => {
        console.error('Poll error:', error);
        // Retry even if there's an error
        const nextDelay = 5000;
        currentPollCount++;
        
        if (isPolling && currentPollCount < maxPolls) {
          setTimeout(poll, nextDelay);
        }
      });
    };

    // Start first poll after 2 seconds
    setTimeout(poll, 2000);
  };

  /**
   * Check submission status from backend
   */
  const checkSubmissionStatus = async (submissionId) => {
    const token = apiClient.getToken();
    const response = await fetch(`/api/submissions/${submissionId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to check status');
    }

    return response.json();
  };

  const handleSaveSolution = () => {
    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }

    setProblemSolutions({
      ...problemSolutions,
      [selectedProblem.id]: {
        code,
        language,
        saved: true,
        timestamp: new Date().toISOString()
      }
    });
    
    toast.success('Solution saved!');
  };

  const handleSubmitAll = async () => {
    const solvedCount = Object.keys(problemSolutions).filter(id => problemSolutions[id]?.saved).length;
    const totalProblems = competition.problems.length;

    if (solvedCount === 0) {
      toast.error('You have not saved any solutions yet. Please save at least one solution before submitting.');
      return;
    }

    if (solvedCount < totalProblems) {
      const unsolvedProblems = competition.problems.filter(
        problem => !problemSolutions[problem.id]?.saved
      );
      const confirmMessage = `Warning: You have only solved ${solvedCount}/${totalProblems} problems.\n\nUnsolved problems:\n${unsolvedProblems.map(p => `• ${p.title}`).join('\n')}\n\nAre you sure you want to submit? You can only submit once and this action cannot be undone.`;
      
      if (!window.confirm(confirmMessage)) {
        return;
      }
    } else {
      if (!window.confirm(`You have completed all ${totalProblems} problems! Are you sure you want to submit? You can only submit once and this action cannot be undone.`)) {
        return;
      }
    }

    setSubmitting(true);
    toast.loading('Submitting all solutions...');
    
    try {
      // Prepare solutions array
      const solutions = Object.entries(problemSolutions)
        .filter(([, solution]) => solution?.saved)
        .map(([problemId, solution]) => ({
          problemId,
          code: solution.code,
          language: solution.language
        }));

      await competitionService.submitSolutions(competitionId, solutions);
      
      setSubmitted(true);
      toast.dismiss();
      toast.success(`Submitted ${solvedCount}/${totalProblems} solutions successfully! 🎉`);
      
      // Show option to view results or go back
      setTimeout(() => {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
      }, 1000);
    } catch (error) {
      console.error('Error submitting solutions:', error);
      toast.dismiss();
      toast.error(error.response?.data?.error || 'Failed to submit solutions');
      setSubmitting(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/10 text-green-400';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400';
      case 'hard': return 'bg-red-500/10 text-red-400';
      default: return 'bg-gray-500/10 text-gray-400';
    }
  };

  // Format time remaining with live countdown
  const getTimeRemainingDisplay = () => {
    if (timeRemaining.expired) {
      return '⏰ Time\'s up!';
    }
    const { hours, minutes, seconds } = timeRemaining;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)} remaining`;
  };

  // Old function for backward compatibility
  const getTimeRemaining = () => getTimeRemainingDisplay();

  if (loading || !competition) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      {/* Custom Scrollbar Styles */}
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #3e3e3e;
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #4e4e4e;
        }
      `}</style>

      {/* Header */}
      <div className="bg-[#282828] border-b border-[#3e3e3e] sticky top-0 z-10 shadow-lg">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/student/competitions"
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#3e3e3e] rounded-lg"
                title="Back to competitions"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h1 className="text-base font-semibold text-white">{competition.title}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(competition.difficulty)}`}>
                  {competition.difficulty.charAt(0).toUpperCase() + competition.difficulty.slice(1)}
                </span>
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
                }`}>{getTimeRemaining()}</span>
              </div>
              <div className="text-sm px-3 py-1.5 bg-[#1e1e1e] rounded-lg border border-[#3e3e3e]">
                <span className="text-gray-400">Solved: </span>
                <span className="text-yellow-400 font-bold">
                  {Object.keys(problemSolutions).filter(id => problemSolutions[id]?.saved).length}/{competition.problems.length}
                </span>
              </div>
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

      <div className="flex h-[calc(100vh-57px)]">
        {/* Left Sidebar - Problem List */}
        {showProblemList && (
          <div className="w-64 bg-[#262626] border-r border-[#3e3e3e] overflow-y-auto shrink-0 scrollbar-thin scrollbar-thumb-[#3e3e3e] scrollbar-track-transparent">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="text-xs font-semibold text-gray-400 tracking-wider uppercase">
                  Problems {Object.keys(problemSolutions).filter(id => problemSolutions[id]?.saved).length}/{competition.problems.length}
                </div>
                <button
                  onClick={() => setShowProblemList(false)}
                  className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-[#2e2e2e]"
                  title="Hide problem list"
                >
                  <ChevronUp className="w-4 h-4 rotate-90" />
                </button>
              </div>
            <div className="space-y-2">
              {competition.problems.map((problem, index) => (
                <button
                  key={problem.id}
                  onClick={() => setSelectedProblem(problem)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all group ${
                    selectedProblem?.id === problem.id
                      ? 'bg-[#3e3e3e] text-white shadow-md border border-[#4e4e4e]'
                      : 'text-gray-300 hover:bg-[#2e2e2e] hover:border hover:border-[#3e3e3e]'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {problemSolutions[problem.id]?.saved ? (
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-600 shrink-0 group-hover:border-gray-500 transition-colors" />
                    )}
                    <span className="text-sm font-semibold truncate">
                      {index + 1}. {problem.title}
                    </span>
                  </div>
                  <div className="flex items-center justify-between ml-8">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      problem.difficulty === 'easy' ? 'bg-green-500/10 text-green-400' :
                      problem.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">{problem.points} pts</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        )}

        {/* Toggle Button when minimized */}
        {!showProblemList && (
          <div className="bg-[#262626] border-r border-[#3e3e3e] shrink-0">
            <button
              onClick={() => setShowProblemList(true)}
              className="p-3 text-gray-400 hover:text-white hover:bg-[#2e2e2e] transition-colors rounded-lg m-2"
              title="Show problem list"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex h-full">
          {/* Problem Description */}
          <div className="w-1/2 h-full overflow-y-auto bg-[#1a1a1a] scrollbar-thin scrollbar-thumb-[#3e3e3e] scrollbar-track-transparent">
            {selectedProblem && (
              <div className="p-6">
                {/* Problem Header */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="text-blue-400">{selectedProblem.id}.</span>
                    {selectedProblem.title}
                  </h2>
                  
                  {/* Tabs */}
                  <div className="flex gap-6 border-b border-[#3e3e3e]">
                    <button
                      onClick={() => setActiveTab('description')}
                      className={`pb-3 px-1 text-sm font-semibold transition-all ${
                        activeTab === 'description'
                          ? 'text-white border-b-2 border-blue-500'
                          : 'text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      Description
                    </button>
                    <button
                      onClick={() => setActiveTab('submissions')}
                      className={`pb-3 px-1 text-sm font-semibold transition-all ${
                        activeTab === 'submissions'
                          ? 'text-white border-b-2 border-blue-500'
                          : 'text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      Submissions
                    </button>
                  </div>
                </div>

                {activeTab === 'description' && (
                  <div className="space-y-6">
                    {/* Difficulty and Stats */}
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`px-3 py-1.5 rounded-lg font-semibold ${
                        selectedProblem.difficulty === 'easy' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                        selectedProblem.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {selectedProblem.difficulty.charAt(0).toUpperCase() + selectedProblem.difficulty.slice(1)}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-400 font-medium">Accepted: <span className="text-white">{selectedProblem.submissions}</span></span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-400 font-medium">Acceptance: <span className="text-white">{selectedProblem.acceptanceRate}%</span></span>
                    </div>

                    {/* Description */}
                    <div className="bg-[#262626] border border-[#3e3e3e] rounded-lg p-5">
                      <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Problem Statement</h3>
                      <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                        {selectedProblem.description}
                      </div>
                    </div>

                    {/* Examples */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Examples</h3>
                      {selectedProblem.examples.map((example, idx) => (
                        <div key={idx} className="bg-[#262626] rounded-lg p-5 border border-[#3e3e3e] hover:border-[#4e4e4e] transition-colors">
                          <p className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">{idx + 1}</span>
                            Example {idx + 1}
                          </p>
                          <div className="space-y-3 text-sm">
                            <div>
                              <div className="text-gray-400 mb-2 font-semibold">Input:</div>
                              <pre className="text-white font-mono bg-[#1e1e1e] p-3 rounded-lg border border-[#3e3e3e]">{example.input}</pre>
                            </div>
                            <div>
                              <div className="text-gray-400 mb-2 font-semibold">Output:</div>
                              <pre className="text-white font-mono bg-[#1e1e1e] p-3 rounded-lg border border-[#3e3e3e]">{example.output}</pre>
                            </div>
                            {example.explanation && (
                              <div className="pt-2">
                                <div className="text-gray-400 mb-2 font-semibold">Explanation:</div>
                                <p className="text-gray-300 leading-relaxed">{example.explanation}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Constraints */}
                    <div className="bg-[#262626] border border-[#3e3e3e] rounded-lg p-5">
                      <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">Constraints</h3>
                      <ul className="space-y-2 text-sm text-gray-300">
                        {selectedProblem.constraints.map((constraint, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="text-blue-400 mt-1 text-xs">▸</span>
                            <code className="font-mono text-sm bg-[#1e1e1e] px-3 py-1.5 rounded border border-[#3e3e3e]">{constraint}</code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === 'submissions' && (
                  <div className="text-center py-20">
                    <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No submissions yet</p>
                    <p className="text-sm text-gray-500 mt-2">Submit your solution to see results here</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Code Editor */}
          <div className="w-1/2 h-full flex flex-col bg-[#1e1e1e] border-l border-[#3e3e3e]">
            {/* Editor Header */}
            <div className="px-4 py-2.5 bg-[#262626] border-b border-[#3e3e3e] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="appearance-none bg-[#1e1e1e] text-white text-sm px-4 py-2 pr-10 rounded-lg border border-[#3e3e3e] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer hover:bg-[#252525] hover:border-[#4e4e4e] font-medium"
                    style={{
                      backgroundImage: 'none',
                      minWidth: '140px'
                    }}
                  >
                    <option value="java" className="bg-[#1e1e1e] text-white">☕ Java</option>
                    <option value="cpp" className="bg-[#1e1e1e] text-white">⚡ C++</option>
                    <option value="python" className="bg-[#1e1e1e] text-white">🐍 Python</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunCode}
                  disabled={submitting || submitted}
                  className="px-4 py-2 bg-linear-to-r from-green-600 to-green-500 text-white text-sm rounded-lg hover:from-green-700 hover:to-green-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-green-500/20 hover:shadow-green-500/40"
                >
                  <Play className="w-4 h-4" />
                  Run Code
                </button>
                <button
                  onClick={handleSaveSolution}
                  disabled={submitting || submitted || !code.trim()}
                  className="px-4 py-2 bg-linear-to-r from-blue-600 to-blue-500 text-white text-sm rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
                >
                  <Send className="w-4 h-4" />
                  {problemSolutions[selectedProblem?.id]?.saved ? 'Update' : 'Save Solution'}
                </button>
              </div>
            </div>

            {/* Code Editor Area */}
            <div className="flex-1 overflow-hidden relative bg-[#1e1e1e]">
              {submitted ? (
                <div className="w-full h-full flex items-center justify-center bg-[#1e1e1e]">
                  <div className="text-center">
                    <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Competition Submitted!</h3>
                    <p className="text-gray-400">Your solutions have been submitted successfully.</p>
                    <p className="text-sm text-gray-500 mt-2">Redirecting to competitions page...</p>
                  </div>
                </div>
              ) : (
                <Editor
                  height="100%"
                  language={getMonacoLanguage(language)}
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  onMount={handleEditorDidMount}
                  theme="vs-dark"
                  options={{
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
                    formatOnPaste: true,
                    formatOnType: true,
                    padding: { top: 16, bottom: 16 },
                    lineDecorationsWidth: 0,
                    lineNumbersMinChars: 3,
                    renderLineHighlight: 'all',
                    scrollbar: {
                      vertical: 'visible',
                      horizontal: 'visible',
                      useShadows: false,
                      verticalScrollbarSize: 10,
                      horizontalScrollbarSize: 10
                    },
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: true,
                    snippetSuggestions: 'inline',
                    fontFamily: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
                    fontLigatures: true
                  }}
                  loading={
                    <div className="w-full h-full flex items-center justify-center bg-[#1e1e1e]">
                      <div className="text-gray-400 text-sm">Loading editor...</div>
                    </div>
                  }
                />
              )}
            </div>

            {/* Test Results Panel */}
            {testResults && (
              <div className="border-t border-[#3e3e3e] bg-[#262626] shadow-lg">
                <button
                  onClick={() => setShowTestCases(!showTestCases)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#2e2e2e] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Terminal className="w-5 h-5 text-gray-400" />
                    <span className="font-semibold text-sm text-white">
                      Test Results
                    </span>
                    {testResults.accepted ? (
                      <span className="text-green-400 text-sm flex items-center gap-2 font-medium px-3 py-1 bg-green-500/10 rounded-full">
                        <CheckCircle className="w-4 h-4" />
                        Accepted ({testResults.total}/{testResults.total})
                      </span>
                    ) : (
                      <span className="text-red-400 text-sm font-medium px-3 py-1 bg-red-500/10 rounded-full">
                        {testResults.passed}/{testResults.total} Passed
                      </span>
                    )}
                  </div>
                  {showTestCases ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                
                {showTestCases && (
                  <div className="max-h-80 overflow-y-auto border-t border-[#3e3e3e]">
                    <div className="p-4 space-y-3">
                      {testResults.cases.map((testCase) => (
                        <div
                          key={testCase.id}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            testCase.passed
                              ? 'bg-green-500/5 border-green-500/30 hover:bg-green-500/10'
                              : 'bg-red-500/5 border-red-500/30 hover:bg-red-500/10'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {testCase.passed ? (
                                <CheckCircle className="w-5 h-5 text-green-400" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-400" />
                              )}
                              <span className="text-sm font-semibold text-white">
                                Test Case {testCase.id}
                                {testCase.hidden && <span className="text-gray-500 ml-2 text-xs">(Hidden)</span>}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400 font-medium px-2 py-1 bg-[#1e1e1e] rounded">
                              {testCase.time}
                            </span>
                          </div>
                          {!testCase.hidden && (
                            <div className="space-y-3 text-xs font-mono mt-3">
                              <div>
                                <div className="text-gray-400 mb-1.5 font-semibold flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                  Input:
                                </div>
                                <pre className="text-gray-200 bg-[#1e1e1e] p-3 rounded-lg overflow-x-auto border border-[#3e3e3e]">{testCase.input}</pre>
                              </div>
                              <div>
                                <div className="text-gray-400 mb-1.5 font-semibold flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                  Expected:
                                </div>
                                <pre className="text-gray-200 bg-[#1e1e1e] p-3 rounded-lg overflow-x-auto border border-[#3e3e3e]">{testCase.expected}</pre>
                              </div>
                              <div>
                                <div className={`mb-1.5 font-semibold flex items-center gap-2 ${testCase.passed ? 'text-green-400' : 'text-red-400'}`}>
                                  <span className={`w-2 h-2 rounded-full ${testCase.passed ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                  Your Output:
                                </div>
                                <pre className={`p-3 rounded-lg overflow-x-auto border ${
                                  testCase.passed 
                                    ? 'text-green-400 bg-green-500/5 border-green-500/20' 
                                    : 'text-red-400 bg-red-500/5 border-red-500/20'
                                }`}>
                                  {testCase.actual}
                                </pre>
                              </div>
                              {testCase.error && (
                                <div>
                                  <div className="text-red-400 mb-1.5 font-semibold flex items-center gap-2">
                                    <AlertCircle className="w-3 h-3" />
                                    Error:
                                  </div>
                                  <pre className="text-red-400 bg-red-500/5 p-3 rounded-lg overflow-x-auto text-xs border border-red-500/20">
                                    {testCase.error}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Async Submission Status Modal */}
      {['submitted', 'processing', 'completed', 'error', 'timeout'].includes(asyncStatus) && (
        <SubmissionStatusUI 
          status={asyncStatus} 
          result={asyncResult} 
          pollCount={pollCount}
        />
      )}
    </div>
  );
};

export default CompetitionProblems;
