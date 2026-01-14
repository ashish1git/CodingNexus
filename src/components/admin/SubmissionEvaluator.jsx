import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Code, User, CheckCircle, XCircle, Clock, Save, ChevronLeft, ChevronRight, History, Activity, Eye, List, Users, Edit, Loader } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import toast from 'react-hot-toast';
import Loading from '../shared/Loading';

const SubmissionEvaluator = () => {
  const { competitionId } = useParams();
  const [competition, setCompetition] = useState(null);
  const [problems, setProblems] = useState([]);
  const [selectedProblemId, setSelectedProblemId] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [savingEvaluation, setSavingEvaluation] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [evaluations, setEvaluations] = useState({});
  const [marks, setMarks] = useState('');
  const [comments, setComments] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [evaluationHistory, setEvaluationHistory] = useState([]);
  const [showActivity, setShowActivity] = useState(false);
  const [evaluatorActivity, setEvaluatorActivity] = useState([]);
  const [viewMode, setViewMode] = useState('by-question'); // 'by-question' or 'by-student'
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [students, setStudents] = useState([]);
  const [evaluatorNames, setEvaluatorNames] = useState({}); // Cache evaluator names

  useEffect(() => {
    fetchCompetitionData();
  }, [competitionId]);

  useEffect(() => {
    // Filter submissions based on search term
    if (searchTerm.trim() === '') {
      setFilteredSubmissions(submissions);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = submissions.filter(sub => {
        const name = sub.user?.studentProfile?.name?.toLowerCase() || '';
        const rollNo = sub.user?.studentProfile?.rollNo?.toLowerCase() || '';
        const email = sub.user?.email?.toLowerCase() || '';
        const moodleId = sub.user?.moodleId?.toLowerCase() || '';
        return name.includes(term) || rollNo.includes(term) || email.includes(term) || moodleId.includes(term);
      });
      setFilteredSubmissions(filtered);
      setCurrentIndex(0); // Reset to first filtered result
    }
  }, [searchTerm, submissions]);

  useEffect(() => {
    if (viewMode === 'by-question' && selectedProblemId) {
      fetchSubmissionsForProblem();
      setSearchTerm(''); // Reset search when changing problems
    } else if (viewMode === 'by-student' && selectedStudentId) {
      fetchSubmissionsByStudent(selectedStudentId);
      setSearchTerm('');
    }
  }, [selectedProblemId, selectedStudentId, viewMode]);

  useEffect(() => {
    // Load saved evaluation for current submission
    const current = filteredSubmissions[currentIndex];
    if (current) {
      const key = `${current.userId}_${current.problemId}`;
      const saved = evaluations[key];
      if (saved) {
        setMarks(saved.marks);
        setComments(saved.comments);
      } else {
        // Check if submission has existing manual evaluation from DB
        if (current.manualMarks !== null && current.manualMarks !== undefined) {
          setMarks(current.manualMarks);
          setComments(current.evaluatorComments || '');
        } else {
          setMarks('');
          setComments('');
        }
      }
      // Reset history view when changing submissions
      setShowHistory(false);
    }
  }, [currentIndex, filteredSubmissions]);

  const fetchCompetitionData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch competition details
      const compRes = await fetch(`http://localhost:5000/api/admin/competitions/${competitionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const compData = await compRes.json();
      setCompetition(compData);

      // Fetch problems
      const problemsRes = await fetch(`http://localhost:5000/api/competitions/${competitionId}/problems`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const problemsData = await problemsRes.json();
      setProblems(problemsData);
      
      if (problemsData.length > 0) {
        setSelectedProblemId(problemsData[0].id);
      }

      // Fetch students for by-student view
      await fetchStudentsWithSubmissions();

      setLoading(false);
    } catch (error) {
      console.error('Error fetching competition:', error);
      toast.error('Failed to load competition data');
      setLoading(false);
    }
  };

  const fetchSubmissionsForProblem = async () => {
    try {
      setSubmissionsLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:5000/api/competitions/${competitionId}/problems/${selectedProblemId}/submissions`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      setSubmissions(data);
      setFilteredSubmissions(data);
      setCurrentIndex(0);
      setSearchTerm('');
      
      // Batch fetch all unique evaluator names upfront
      const uniqueEvaluatorIds = [...new Set(data.map(s => s.evaluatedBy).filter(Boolean))];
      if (uniqueEvaluatorIds.length > 0) {
        fetchMultipleEvaluatorNames(uniqueEvaluatorIds);
      }
      setSubmissionsLoading(false);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load submissions');
      setSubmissionsLoading(false);
    }
  };

  const fetchEvaluationHistory = async (submissionId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:5000/api/competitions/${competitionId}/problems/${selectedProblemId}/submissions/${submissionId}/history`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      setEvaluationHistory(data);
      setShowHistory(true);
    } catch (error) {
      console.error('Error fetching evaluation history:', error);
      toast.error('Failed to load evaluation history');
    }
  };

  const fetchEvaluatorActivity = async () => {
    try {
      setActivityLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:5000/api/competitions/${competitionId}/evaluator-activity`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      
      // Handle error responses
      if (!res.ok || !Array.isArray(data)) {
        console.error('Evaluator activity error:', data);
        toast.error(data.error || 'Failed to load evaluator activity');
        setEvaluatorActivity([]);
        setActivityLoading(false);
        setShowActivity(false);
        return;
      }
      
      setEvaluatorActivity(data);
      setShowActivity(true);
      setActivityLoading(false);
    } catch (error) {
      console.error('Error fetching evaluator activity:', error);
      toast.error('Failed to load evaluator activity');
      setEvaluatorActivity([]);
      setShowActivity(false);
      setActivityLoading(false);
    }
  };

  const fetchStudentsWithSubmissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:5000/api/competitions/${competitionId}/submissions`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      
      // Group by student
      const studentsMap = new Map();
      data.forEach(submission => {
        const userId = submission.userId;
        if (!studentsMap.has(userId)) {
          studentsMap.set(userId, {
            userId,
            userName: submission.userName,
            rollNo: submission.rollNo,
            batch: submission.batch,
            submissions: []
          });
        }
        studentsMap.get(userId).submissions.push(...submission.problemSubmissions);
      });
      
      setStudents(Array.from(studentsMap.values()));
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    }
  };

  const fetchSubmissionsByStudent = async (studentId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:5000/api/competitions/${competitionId}/submissions`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      
      // Find student's submissions
      const studentData = data.find(s => s.userId === studentId);
      if (studentData && studentData.problemSubmissions) {
        setSubmissions(studentData.problemSubmissions);
        setFilteredSubmissions(studentData.problemSubmissions);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Error fetching student submissions:', error);
      toast.error('Failed to load student submissions');
    }
  };

  const fetchEvaluatorName = async (userId) => {
    if (!userId || evaluatorNames[userId]) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:5000/api/admin/users/${userId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      
      if (data.adminProfile) {
        setEvaluatorNames(prev => ({
          ...prev,
          [userId]: data.adminProfile.name
        }));
      }
    } catch (error) {
      console.error('Error fetching evaluator name:', error);
    }
  };

  // Batch fetch multiple evaluator names at once
  const fetchMultipleEvaluatorNames = async (userIds) => {
    const token = localStorage.getItem('token');
    const uncachedIds = userIds.filter(id => !evaluatorNames[id]);
    
    if (uncachedIds.length === 0) return;
    
    try {
      // Fetch all in parallel
      const promises = uncachedIds.map(userId => 
        fetch(`http://localhost:5000/api/admin/users/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json())
      );
      
      const results = await Promise.all(promises);
      
      const newNames = {};
      results.forEach((data, index) => {
        if (data.adminProfile) {
          newNames[uncachedIds[index]] = data.adminProfile.name;
        }
      });
      
      setEvaluatorNames(prev => ({ ...prev, ...newNames }));
    } catch (error) {
      console.error('Error batch fetching evaluator names:', error);
    }
  };

  const saveEvaluation = async () => {
    const current = filteredSubmissions[currentIndex];
    if (!current) return;

    if (!marks || marks === '') {
      toast.error('Please enter marks');
      return;
    }

    const marksNum = parseFloat(marks);
    if (isNaN(marksNum) || marksNum < 0 || marksNum > 100) {
      toast.error('Marks must be between 0 and 100');
      return;
    }

    try {
      // Save to database
      setSavingEvaluation(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/competitions/${competitionId}/problems/${selectedProblemId}/submissions/${current.id}/evaluate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            marks: marksNum,
            comments: comments
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save evaluation');
      }

      const responseData = await response.json();

      const key = `${current.userId}_${current.problemId}`;
      const newEvaluation = {
        marks: marksNum,
        comments: comments,
        timestamp: new Date().toISOString(),
        studentName: current.user?.studentProfile?.name || 'N/A',
        rollNo: current.user?.studentProfile?.rollNo || 'N/A',
        email: current.user?.email,
        problemTitle: problems.find(p => p.id === selectedProblemId)?.title
      };

      setEvaluations(prev => ({
        ...prev,
        [key]: newEvaluation
      }));

      // Update the current submission in the list with new evaluation data
      const updatedSubmissions = [...filteredSubmissions];
      updatedSubmissions[currentIndex] = {
        ...updatedSubmissions[currentIndex],
        manualMarks: marksNum,
        evaluatorComments: comments,
        isEvaluated: true,
        evaluatedBy: responseData.submission?.evaluatedBy || current.evaluatedBy,
        evaluatedAt: new Date().toISOString()
      };
      setFilteredSubmissions(updatedSubmissions);
      
      // Also update the main submissions array
      const mainSubmissionsUpdated = submissions.map(sub => 
        sub.id === current.id 
          ? { ...sub, manualMarks: marksNum, evaluatorComments: comments, isEvaluated: true, evaluatedBy: responseData.submission?.evaluatedBy || sub.evaluatedBy, evaluatedAt: new Date().toISOString() }
          : sub
      );
      setSubmissions(mainSubmissionsUpdated);

      // Save to localStorage as backup
      const allEvals = { ...evaluations, [key]: newEvaluation };
      localStorage.setItem(`evaluations_${competitionId}`, JSON.stringify(allEvals));

      toast.success(responseData.message || 'Evaluation saved successfully!');

      // Move to next submission
      if (currentIndex < filteredSubmissions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (filteredSubmissions.length > 0) {
        // Wrap to first submission
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Error saving evaluation:', error);
      toast.error('Failed to save evaluation to database');
    } finally {
      setSavingEvaluation(false);
    }
  };

  const exportEvaluations = () => {
    const data = Object.values(evaluations);
    if (data.length === 0) {
      toast.error('No evaluations to export');
      return;
    }

    const csv = [
      'Student Name,Roll Number,Email,Problem,Marks,Comments,Timestamp',
      ...data.map(e => 
        `"${e.studentName}","${e.rollNo}","${e.email}","${e.problemTitle}","${e.marks}","${e.comments}","${e.timestamp}"`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluations_${competition?.title || 'competition'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success('Evaluations exported!');
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (filteredSubmissions.length > 0) {
      // Wrap to last submission
      setCurrentIndex(filteredSubmissions.length - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < filteredSubmissions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (filteredSubmissions.length > 0) {
      // Wrap to first submission
      setCurrentIndex(0);
    }
  };

  if (loading) return <Loading />;

  const currentSubmission = filteredSubmissions[currentIndex];
  const currentProblem = problems.find(p => p.id === selectedProblemId);
  
  // Count evaluations: both saved in session and already evaluated in DB (avoid double counting)
  const evaluatedCount = Object.keys(evaluations).filter(key => 
    key.includes(selectedProblemId)
  ).length + submissions.filter(sub => 
    sub.isEvaluated && !Object.keys(evaluations).includes(`${sub.userId}_${sub.problemId}`)
  ).length;

  // Calculate total evaluations across all problems (avoid double counting)
  const evaluationKeys = new Set();
  
  // Add all submissions that are marked as evaluated
  submissions.forEach(sub => {
    if (sub.isEvaluated) {
      evaluationKeys.add(`${sub.userId}_${sub.problemId}`);
    }
  });
  
  // Add all evaluations from current session
  Object.keys(evaluations).forEach(key => {
    evaluationKeys.add(key);
  });
  
  const totalEvaluatedCount = evaluationKeys.size;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/admin/competitions" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {competition?.title}
                </h1>
                <p className="text-sm text-gray-500 mt-1">Submission Evaluation</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => {
                    setViewMode('by-question');
                    setSelectedStudentId(null);
                    if (problems.length > 0 && !selectedProblemId) {
                      setSelectedProblemId(problems[0].id);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors ${
                    viewMode === 'by-question' 
                      ? 'bg-white text-indigo-600 shadow-sm font-medium' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4" />
                  By Question
                </button>
                <button
                  onClick={() => {
                    setViewMode('by-student');
                    setSelectedProblemId(null);
                    if (students.length > 0 && !selectedStudentId) {
                      setSelectedStudentId(students[0].userId);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors ${
                    viewMode === 'by-student' 
                      ? 'bg-white text-indigo-600 shadow-sm font-medium' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  By Student
                </button>
              </div>
              <button
                onClick={fetchEvaluatorActivity}
                disabled={activityLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {activityLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4" />
                    Evaluator Activity
                  </>
                )}
              </button>
              <button
                onClick={exportEvaluations}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Export Results
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Evaluator Activity Modal */}
      {showActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-6 h-6 text-blue-600" />
                Evaluator Activity Summary
              </h2>
              <button
                onClick={() => setShowActivity(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
              {activityLoading ? (
                <div className="p-12 text-center">
                  <div className="flex justify-center mb-4">
                    <Loader className="w-12 h-12 text-blue-600 animate-spin" />
                  </div>
                  <p className="text-gray-600">Loading evaluator activity...</p>
                </div>
              ) : evaluatorActivity.length === 0 ? (
                <div className="p-12 text-center">
                  <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No evaluation activity yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {evaluatorActivity.map((activity, idx) => (
                    <div key={idx} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="font-semibold text-gray-900 text-lg">
                              {activity.evaluatorName}
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              {activity.evaluatorRole}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-4 mt-3">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Total Evaluations</div>
                              <div className="text-2xl font-bold text-indigo-600">
                                {activity.totalEvaluations}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">New</div>
                              <div className="text-xl font-semibold text-green-600">
                                {activity.creates}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Updates</div>
                              <div className="text-xl font-semibold text-orange-600">
                                {activity.updates}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Reviews</div>
                              <div className="text-xl font-semibold text-blue-600">
                                {activity.reviews}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="text-xs text-gray-500 mb-1">Problems Evaluated</div>
                            <div className="flex flex-wrap gap-2">
                              {activity.problemsEvaluated.map((problem, pIdx) => (
                                <span key={pIdx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  {problem}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Last activity: {new Date(activity.lastActivity).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Problems or Students List */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">
                  {viewMode === 'by-question' ? 'Problems' : 'Students'}
                </h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-[calc(100vh-300px)] overflow-y-auto">
                {viewMode === 'by-question' ? (
                  // Problems List
                  problems.map((problem, idx) => {
                    const problemEvals = Object.keys(evaluations).filter(k => k.includes(problem.id)).length;
                    const problemSubs = submissions.filter(s => s.problemId === problem.id).length;
                    
                    return (
                      <button
                        key={problem.id}
                        onClick={() => setSelectedProblemId(problem.id)}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                          selectedProblemId === problem.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {idx + 1}. {problem.title}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              {problem.points} points
                            </div>
                          </div>
                        </div>
                        {problemEvals > 0 && (
                          <div className="mt-2 text-xs text-green-600 font-medium">
                            ✓ {problemEvals} evaluated
                          </div>
                        )}
                      </button>
                    );
                  })
                ) : (
                  // Students List
                  students.map((student, idx) => {
                    const evaluatedCount = student.submissions.filter(s => s.isEvaluated).length;
                    const totalCount = student.submissions.length;
                    
                    return (
                      <button
                        key={student.userId}
                        onClick={() => setSelectedStudentId(student.userId)}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                          selectedStudentId === student.userId ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {student.userName}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              Roll: {student.rollNo || 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs">
                          <span className={evaluatedCount === totalCount ? 'text-green-600' : 'text-orange-600'}>
                            {evaluatedCount}/{totalCount} evaluated
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Progress Card */}
            <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Overall Progress</h3>
              <div className="text-3xl font-bold text-indigo-600 mb-2">
                {totalEvaluatedCount}
              </div>
              <div className="text-sm text-gray-500">Total Evaluations</div>
              <div className="text-xs text-gray-400 mt-2">
                Total Submissions: {submissions.length}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, roll number, email, or Moodle ID..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
                  />
                </div>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Clear
                  </button>
                )}
                <div className="text-sm font-medium text-gray-700">
                  {filteredSubmissions.length} of {submissions.length} submissions
                </div>
              </div>
            </div>

            {submissionsLoading ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <div className="flex justify-center mb-4">
                  <Loader className="w-12 h-12 text-indigo-600 animate-spin" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Loading submissions...
                </h3>
                <p className="text-gray-500">
                  Please wait while we fetch the data
                </p>
              </div>
            ) : !currentSubmission ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Code className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No submissions yet
                </h3>
                <p className="text-gray-500">
                  No submissions found for this problem
                </p>
              </div>
            ) : (
              <>
                {/* Submission Navigation */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={goToPrevious}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 font-medium transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>
                      <span className="text-sm font-medium text-gray-700">
                        Submission {currentIndex + 1} of {filteredSubmissions.length}
                      </span>
                      <button
                        onClick={goToNext}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium transition-colors"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-sm text-gray-500">
                      {evaluatedCount} / {submissions.length} evaluated for this problem
                    </div>
                  </div>
                </div>

                {/* Student Info Card */}
                <div className={`rounded-lg shadow-sm border p-6 mb-4 ${
                  currentSubmission.isEvaluated 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {currentProblem?.title}
                    </h3>
                    {currentSubmission.isEvaluated && (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Evaluated
                        </span>
                        <button
                          onClick={() => fetchEvaluationHistory(currentSubmission.id)}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 text-xs font-medium flex items-center gap-1"
                        >
                          <History className="w-3 h-3" />
                          View History
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Student Name</div>
                      <div className="font-medium text-gray-900">
                        {currentSubmission?.user?.studentProfile?.name || currentSubmission?.user?.email || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Roll Number</div>
                      <div className="font-medium text-gray-900">
                        {currentSubmission?.user?.studentProfile?.rollNo || currentSubmission?.user?.moodleId || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Language</div>
                      <div className="font-medium text-gray-900 uppercase">
                        {currentSubmission?.language}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Status</div>
                      <div className="flex items-center space-x-2">
                        {currentSubmission?.status === 'accepted' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Accepted
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            {currentSubmission?.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Tests Passed</div>
                      <div className="font-medium text-gray-900">
                        {currentSubmission?.testsPassed} / {currentSubmission?.totalTests}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Marks Scored</div>
                      <div className="font-medium text-gray-900">
                        {currentSubmission?.score} / {currentSubmission?.maxScore}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Execution Time</div>
                      <div className="font-medium text-gray-900">
                        {currentSubmission?.executionTime}ms
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Submitted</div>
                      <div className="font-medium text-gray-900">
                        {currentSubmission?.submittedAt 
                          ? new Date(currentSubmission.submittedAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                  {currentSubmission.isEvaluated && (
                    <div className="mt-4 pt-4 border-t border-gray-200 bg-green-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <h4 className="font-semibold text-gray-900">Manual Evaluation</h4>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Manual Marks</div>
                          <div className="text-2xl font-bold text-indigo-600">
                            {currentSubmission.manualMarks} / 100
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Evaluated By</div>
                          <div className="font-semibold text-gray-900 flex items-center gap-2">
                            <User className="w-4 h-4 text-indigo-600" />
                            {currentSubmission.evaluatedBy 
                              ? (evaluatorNames[currentSubmission.evaluatedBy] || 'Loading...') 
                              : 'N/A'}
                          </div>
                          {currentSubmission.evaluatedBy && !evaluatorNames[currentSubmission.evaluatedBy] && (
                            <div className="text-xs text-gray-400 mt-1">Fetching name...</div>
                          )}
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Evaluated At</div>
                          <div className="font-medium text-gray-900">
                            {currentSubmission.evaluatedAt ? new Date(currentSubmission.evaluatedAt).toLocaleString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                      {currentSubmission.evaluatorComments && (
                        <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                          <div className="text-xs text-gray-500 mb-1">Evaluator Comments</div>
                          <div className="text-sm text-gray-700">{currentSubmission.evaluatorComments}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Evaluation History Modal */}
                {showHistory && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
                      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          <History className="w-6 h-6 text-indigo-600" />
                          Evaluation History
                        </h2>
                        <button
                          onClick={() => setShowHistory(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <XCircle className="w-6 h-6" />
                        </button>
                      </div>
                      <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
                        {evaluationHistory.length === 0 ? (
                          <div className="p-12 text-center">
                            <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No evaluation history found</p>
                          </div>
                        ) : (
                          <div className="p-6 space-y-4">
                            {evaluationHistory.map((hist, idx) => (
                              <div key={hist.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                      <User className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                      <div className="font-semibold text-gray-900">{hist.evaluatorName}</div>
                                      <div className="text-xs text-gray-500">{hist.evaluatorRole}</div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      hist.action === 'create' ? 'bg-green-100 text-green-800' :
                                      hist.action === 'update' ? 'bg-orange-100 text-orange-800' :
                                      'bg-blue-100 text-blue-800'
                                    }`}>
                                      {hist.action.toUpperCase()}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {new Date(hist.createdAt).toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-3">
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">Marks Given</div>
                                    <div className="text-2xl font-bold text-indigo-600">
                                      {hist.marks} / 100
                                    </div>
                                  </div>
                                  {hist.previousMarks !== null && hist.previousMarks !== undefined && (
                                    <div>
                                      <div className="text-xs text-gray-500 mb-1">Previous Marks</div>
                                      <div className="text-2xl font-bold text-gray-400">
                                        {hist.previousMarks} / 100
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {hist.comments && (
                                  <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                                    <div className="text-xs text-gray-500 mb-1">Comments</div>
                                    <div className="text-sm text-gray-700">{hist.comments}</div>
                                  </div>
                                )}
                                {hist.previousComments && hist.action === 'update' && (
                                  <div className="mt-2 p-3 bg-gray-100 rounded border border-gray-300">
                                    <div className="text-xs text-gray-500 mb-1">Previous Comments</div>
                                    <div className="text-sm text-gray-600 italic">{hist.previousComments}</div>
                                  </div>
                                )}
                                {hist.ipAddress && (
                                  <div className="mt-2 text-xs text-gray-400">
                                    IP: {hist.ipAddress}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Code Display */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <Code className="w-5 h-5 mr-2" />
                      Code Submission
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <SyntaxHighlighter
                      language={currentSubmission.language}
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        borderRadius: 0,
                        fontSize: '14px',
                        lineHeight: '1.6'
                      }}
                      showLineNumbers
                    >
                      {currentSubmission.code}
                    </SyntaxHighlighter>
                  </div>
                </div>

                {/* Evaluation Form */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Evaluation</h3>
                    {currentSubmission.isEvaluated && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1">
                        <Edit className="w-3 h-3" />
                        Updating Previous Evaluation
                      </span>
                    )}
                  </div>
                  {currentSubmission.isEvaluated && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Previous marks:</strong> {currentSubmission.manualMarks}/100
                        {currentSubmission.evaluatedBy && evaluatorNames[currentSubmission.evaluatedBy] && (
                          <span className="ml-2">
                            by <strong>{evaluatorNames[currentSubmission.evaluatedBy]}</strong>
                          </span>
                        )}
                      </p>
                      {currentSubmission.evaluatorComments && (
                        <p className="text-sm text-blue-700 mt-1">
                          <strong>Previous comments:</strong> {currentSubmission.evaluatorComments}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Marks (out of 100)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={marks}
                        onChange={(e) => setMarks(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                        placeholder="Enter marks (0-100)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comments & Feedback
                      </label>
                      <textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                        placeholder="Logic analysis, code quality, improvements, etc..."
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={goToPrevious}
                        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center gap-2"
                      >
                        <ChevronLeft className="w-5 h-5" />
                        Back
                      </button>
                      <button
                        onClick={saveEvaluation}
                        disabled={savingEvaluation}
                        className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingEvaluation ? (
                          <>
                            <Loader className="w-5 h-5 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5 mr-2" />
                            Save & Continue
                          </>
                        )}
                      </button>
                      <button
                        onClick={goToNext}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                      >
                        Skip
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionEvaluator;
