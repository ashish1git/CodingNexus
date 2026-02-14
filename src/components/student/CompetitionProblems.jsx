import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Code, CheckCircle, XCircle, Clock, Trophy,
  Play, Send, AlertCircle, Target, Award, ChevronDown,
  ChevronUp, List, FileText, TestTube, Terminal, Maximize
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import competitionService from '../../services/competitionService';
import toast from 'react-hot-toast';
import Loading from '../shared/Loading';

const CompetitionProblems = () => {
  const { competitionId } = useParams();
  const navigate = useNavigate();
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
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

  useEffect(() => {
    // Load saved code when switching problems
    if (selectedProblem && problemSolutions[selectedProblem.id]) {
      setCode(problemSolutions[selectedProblem.id].code || '');
      setLanguage(problemSolutions[selectedProblem.id].language || 'python');
    } else if (selectedProblem) {
      // Set starter code from problem if available
      const starterCode = selectedProblem.starterCode?.[language.toLowerCase()] || '';
      setCode(starterCode);
    } else {
      setCode('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProblem]);

  useEffect(() => {
    // Update code when language changes (only if not saved)
    if (selectedProblem && !problemSolutions[selectedProblem.id]?.saved) {
      const starterCode = selectedProblem.starterCode?.[language.toLowerCase()] || '';
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
    toast.loading('Running test cases...');
    
    try {
      // Get only visible (non-hidden) test cases
      const visibleTestCases = selectedProblem.testCases.filter(tc => !tc.hidden);
      
      // Map language names to Judge0 language IDs
      const judge0LanguageMap = {
        'c': 50,
        'cpp': 54,
        'java': 62,
        'python': 71,
        'javascript': 63
      };
      
      const languageId = judge0LanguageMap[language];
      const JUDGE0_URL = import.meta.env.VITE_JUDGE0_URL || 'http://64.227.149.20:2358';
      
      // Run code against each visible test case using Judge0
      const results = await Promise.all(
        visibleTestCases.map(async (tc, idx) => {
          try {
            const response = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                source_code: code,
                language_id: languageId,
                stdin: tc.input || ''
              })
            });
            
            const result = await response.json();
            
            // Check if execution was successful (status 3 = Accepted)
            if (result.status?.id === 3 || result.stdout) {
              const actualOutput = (result.stdout || '').trim();
              const expectedOutput = (tc.output || '').trim();
              const passed = actualOutput === expectedOutput;
              
              return {
                id: idx + 1,
                passed,
                input: tc.input,
                expected: expectedOutput,
                actual: result.stdout || '(no output)',
                time: `${Math.round((parseFloat(result.time) || 0) * 1000)}ms`,
                error: null
              };
            } else {
              // Compilation or runtime error
              const errorMsg = result.compile_output || result.stderr || result.status?.description || 'Unknown error';
              return {
                id: idx + 1,
                passed: false,
                input: tc.input,
                expected: tc.output,
                actual: errorMsg,
                time: '0ms',
                error: errorMsg
              };
            }
          } catch (error) {
            return {
              id: idx + 1,
              passed: false,
              input: tc.input,
              expected: tc.output,
              actual: `Error: ${error.message}`,
              time: '0ms',
              error: error.message
            };
          }
        })
      );
      
      const passedCount = results.filter(r => r.passed).length;
      const totalCount = results.length;
      
      setTestResults({
        passed: passedCount,
        total: totalCount,
        cases: results,
        accepted: passedCount === totalCount
      });
      
      toast.dismiss();
      if (passedCount === totalCount) {
        toast.success(`All ${totalCount} test cases passed! 🎉`);
      } else {
        toast.error(`${passedCount}/${totalCount} test cases passed`);
      }
      
    } catch (error) {
      console.error('Error running code:', error);
      toast.dismiss();
      toast.error('Failed to run code. Please try again.');
    } finally {
      setSubmitting(false);
    }
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

  const getTimeRemaining = () => {
    const end = new Date(competition.endTime);
    const now = new Date();
    const diff = end - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  if (loading || !competition) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      {/* Header */}
      <div className="bg-[#282828] border-b border-[#3e3e3e] sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/student/competitions"
                className="text-gray-400 hover:text-white transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <h1 className="text-base font-medium text-white">{competition.title}</h1>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor(competition.difficulty)}`}>
                  {competition.difficulty.charAt(0).toUpperCase() + competition.difficulty.slice(1)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{getTimeRemaining()}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Solved: </span>
                <span className="text-yellow-400 font-semibold">
                  {Object.keys(problemSolutions).filter(id => problemSolutions[id]?.saved).length}/{competition.problems.length}
                </span>
              </div>
              <button
                onClick={enterFullscreen}
                className="p-2 text-gray-400 hover:text-white transition"
                title="Enter Fullscreen"
              >
                <Maximize className="w-4 h-4" />
              </button>
              {!submitted && (
                <button
                  onClick={handleSubmitAll}
                  disabled={submitting}
                  className="px-4 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Trophy className="w-4 h-4" />
                  Submit All
                </button>
              )}
              {submitted && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-600/20 text-green-400 text-sm rounded border border-green-600/30">
                    <CheckCircle className="w-4 h-4" />
                    Submitted
                  </div>
                  <Link
                    to={`/student/competition/${competitionId}/results`}
                    className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium flex items-center gap-2"
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
          <div className="w-60 bg-[#262626] border-r border-[#3e3e3e] overflow-y-auto flex-shrink-0">
            <div className="p-3">
              <div className="flex items-center justify-between mb-3 px-2">
                <div className="text-xs font-medium text-gray-400">
                  PROBLEMS ({Object.keys(problemSolutions).filter(id => problemSolutions[id]?.saved).length}/{competition.problems.length})
                </div>
                <button
                  onClick={() => setShowProblemList(false)}
                  className="text-gray-400 hover:text-white transition"
                  title="Hide problem list"
                >
                  <ChevronUp className="w-4 h-4 rotate-90" />
                </button>
              </div>
            <div className="space-y-1">
              {competition.problems.map((problem) => (
                <button
                  key={problem.id}
                  onClick={() => setSelectedProblem(problem)}
                  className={`w-full text-left px-3 py-2 rounded transition group ${
                    selectedProblem?.id === problem.id
                      ? 'bg-[#3e3e3e] text-white'
                      : 'text-gray-300 hover:bg-[#2e2e2e]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {problemSolutions[problem.id]?.saved ? (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-600 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium truncate">
                      {problem.id}. {problem.title}
                    </span>
                  </div>
                  <div className="flex items-center justify-between ml-6">
                    <span className={`text-xs ${
                      problem.difficulty === 'easy' ? 'text-green-400' :
                      problem.difficulty === 'medium' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                    </span>
                    <span className="text-xs text-gray-500">{problem.points}pts</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        )}

        {/* Toggle Button when minimized */}
        {!showProblemList && (
          <div className="bg-[#262626] border-r border-[#3e3e3e] flex-shrink-0">
            <button
              onClick={() => setShowProblemList(true)}
              className="p-3 text-gray-400 hover:text-white hover:bg-[#2e2e2e] transition"
              title="Show problem list"
            >
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex h-full">
          {/* Problem Description */}
          <div className="w-1/2 h-full overflow-y-auto bg-[#1a1a1a]">
            {selectedProblem && (
              <div className="p-5">
                {/* Problem Header */}
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-white mb-3">
                    {selectedProblem.id}. {selectedProblem.title}
                  </h2>
                  
                  {/* Tabs */}
                  <div className="flex gap-4 border-b border-[#3e3e3e]">
                    <button
                      onClick={() => setActiveTab('description')}
                      className={`pb-2 px-1 text-sm font-medium transition ${
                        activeTab === 'description'
                          ? 'text-white border-b-2 border-white'
                          : 'text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      Description
                    </button>
                    <button
                      onClick={() => setActiveTab('submissions')}
                      className={`pb-2 px-1 text-sm font-medium transition ${
                        activeTab === 'submissions'
                          ? 'text-white border-b-2 border-white'
                          : 'text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      Submissions
                    </button>
                  </div>
                </div>

                {activeTab === 'description' && (
                  <div className="space-y-4">
                    {/* Difficulty and Stats */}
                    <div className="flex items-center gap-3 text-sm">
                      <span className={`px-2 py-1 rounded ${
                        selectedProblem.difficulty === 'easy' ? 'bg-green-500/10 text-green-400' :
                        selectedProblem.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {selectedProblem.difficulty.charAt(0).toUpperCase() + selectedProblem.difficulty.slice(1)}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-400">Accepted: {selectedProblem.submissions}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-400">Acceptance Rate: {selectedProblem.acceptanceRate}%</span>
                    </div>

                    {/* Description */}
                    <div className="text-gray-300 leading-relaxed whitespace-pre-line text-sm">
                      {selectedProblem.description}
                    </div>

                    {/* Examples */}
                    <div className="space-y-3">
                      {selectedProblem.examples.map((example, idx) => (
                        <div key={idx} className="bg-[#262626] rounded-lg p-4 border border-[#3e3e3e]">
                          <p className="text-xs font-semibold text-white mb-2">Example {idx + 1}:</p>
                          <div className="space-y-1 text-sm">
                            <div>
                              <span className="text-gray-400">Input:</span>
                              <pre className="text-white font-mono mt-1">{example.input}</pre>
                            </div>
                            <div>
                              <span className="text-gray-400">Output:</span>
                              <pre className="text-white font-mono mt-1">{example.output}</pre>
                            </div>
                            {example.explanation && (
                              <div className="pt-2">
                                <span className="text-gray-400">Explanation:</span>
                                <p className="text-gray-300 mt-1">{example.explanation}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Constraints */}
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-2">Constraints:</h3>
                      <ul className="space-y-1 text-sm text-gray-300">
                        {selectedProblem.constraints.map((constraint, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-gray-500 mt-0.5">•</span>
                            <code className="font-mono text-xs bg-[#262626] px-2 py-0.5 rounded">{constraint}</code>
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
            <div className="px-4 py-2 bg-[#262626] border-b border-[#3e3e3e] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-[#1e1e1e] text-gray-300 text-sm px-3 py-1.5 rounded border border-[#3e3e3e] focus:outline-none focus:border-gray-500"
                >
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="c">C</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunCode}
                  disabled={submitting || submitted}
                  className="px-3 py-1.5 bg-[#3e3e3e] text-white text-sm rounded hover:bg-[#4e4e4e] transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4" />
                  Run
                </button>
                <button
                  onClick={handleSaveSolution}
                  disabled={submitting || submitted || !code.trim()}
                  className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <Send className="w-4 h-4" />
                  {problemSolutions[selectedProblem?.id]?.saved ? 'Update' : 'Save Solution'}
                </button>
              </div>
            </div>

            {/* Code Editor Area */}
            <div className="flex-1 overflow-auto relative min-h-0 bg-[#1e1e1e]">
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
                <>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="// Write your code here..."
                    className="w-full h-full bg-[#1e1e1e] p-4 font-mono text-sm resize-none focus:outline-none focus:ring-0 border-0 outline-none"
                    style={{ 
                      color: 'white',
                      backgroundColor: '#1e1e1e',
                      tabSize: 4,
                      lineHeight: '1.6',
                      minHeight: '300px',
                      fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
                      caretColor: '#0ea5e9',
                      WebkitTextFillColor: 'white'
                    }}
                    spellCheck="false"
                    disabled={submitted}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                  />
                  <style>{`
                    textarea::placeholder {
                      color: #6b7280 !important;
                      opacity: 1 !important;
                    }
                  `}</style>
                </>
              )}
            </div>

            {/* Test Results Panel */}
            {testResults && (
              <div className="border-t border-[#3e3e3e] bg-[#262626]">
                <button
                  onClick={() => setShowTestCases(!showTestCases)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#2e2e2e] transition"
                >
                  <div className="flex items-center gap-3">
                    <Terminal className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-sm text-white">
                      Testcase
                    </span>
                    {testResults.accepted ? (
                      <span className="text-green-400 text-sm flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Accepted
                      </span>
                    ) : (
                      <span className="text-red-400 text-sm">
                        {testResults.passed}/{testResults.total} testcases passed
                      </span>
                    )}
                  </div>
                  {showTestCases ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                
                {showTestCases && (
                  <div className="max-h-64 overflow-y-auto border-t border-[#3e3e3e]">
                    <div className="p-4 space-y-3">
                      {testResults.cases.map((testCase) => (
                        <div
                          key={testCase.id}
                          className={`p-3 rounded border ${
                            testCase.passed
                              ? 'bg-green-500/5 border-green-500/20'
                              : 'bg-red-500/5 border-red-500/20'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {testCase.passed ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-400" />
                              )}
                              <span className="text-sm font-medium text-white">
                                Case {testCase.id}
                                {testCase.hidden && <span className="text-gray-500 ml-2">(Hidden)</span>}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">{testCase.time}</span>
                          </div>
                          {!testCase.hidden && (
                            <div className="space-y-2 text-xs font-mono mt-2">
                              <div>
                                <span className="text-gray-400">Input:</span>
                                <pre className="text-gray-300 mt-1 bg-[#1e1e1e] p-2 rounded overflow-x-auto">{testCase.input}</pre>
                              </div>
                              <div>
                                <span className="text-gray-400">Expected:</span>
                                <pre className="text-gray-300 mt-1 bg-[#1e1e1e] p-2 rounded overflow-x-auto">{testCase.expected}</pre>
                              </div>
                              <div>
                                <span className="text-gray-400">Output:</span>
                                <pre className={`mt-1 p-2 rounded overflow-x-auto ${testCase.passed ? 'text-green-400' : 'text-red-400'} bg-[#1e1e1e]`}>
                                  {testCase.actual}
                                </pre>
                              </div>
                              {testCase.error && (
                                <div>
                                  <span className="text-red-400">Error:</span>
                                  <pre className="text-red-400 mt-1 bg-[#1e1e1e] p-2 rounded overflow-x-auto text-xs">
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
    </div>
  );
};

export default CompetitionProblems;
