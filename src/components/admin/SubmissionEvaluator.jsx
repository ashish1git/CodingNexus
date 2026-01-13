import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Code, User, CheckCircle, XCircle, Clock, Save, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [evaluations, setEvaluations] = useState({});
  const [marks, setMarks] = useState('');
  const [comments, setComments] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);

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
    if (selectedProblemId) {
      fetchSubmissionsForProblem();
      setSearchTerm(''); // Reset search when changing problems
    }
  }, [selectedProblemId]);

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
        setMarks('');
        setComments('');
      }
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

      setLoading(false);
    } catch (error) {
      console.error('Error fetching competition:', error);
      toast.error('Failed to load competition data');
      setLoading(false);
    }
  };

  const fetchSubmissionsForProblem = async () => {
    try {
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
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load submissions');
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

      // Save to localStorage as backup
      const allEvals = { ...evaluations, [key]: newEvaluation };
      localStorage.setItem(`evaluations_${competitionId}`, JSON.stringify(allEvals));

      toast.success('Evaluation saved to database!');

      // Move to next submission
      if (currentIndex < filteredSubmissions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        toast.success('All submissions for this problem evaluated!');
      }
    } catch (error) {
      console.error('Error saving evaluation:', error);
      toast.error('Failed to save evaluation to database');
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
    }
  };

  const goToNext = () => {
    if (currentIndex < filteredSubmissions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (loading) return <Loading />;

  const currentSubmission = filteredSubmissions[currentIndex];
  const currentProblem = problems.find(p => p.id === selectedProblemId);
  const evaluatedCount = Object.keys(evaluations).filter(key => 
    key.includes(selectedProblemId)
  ).length;

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
            <button
              onClick={exportEvaluations}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Export Results
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Problems List */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Problems</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {problems.map((problem, idx) => {
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
                })}
              </div>
            </div>

            {/* Progress Card */}
            <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Overall Progress</h3>
              <div className="text-3xl font-bold text-indigo-600 mb-2">
                {Object.keys(evaluations).length}
              </div>
              <div className="text-sm text-gray-500">Total Evaluations</div>
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

            {!currentSubmission ? (
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
                        disabled={currentIndex === 0}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>
                      <span className="text-sm font-medium text-gray-700">
                        Submission {currentIndex + 1} of {filteredSubmissions.length}
                      </span>
                      <button
                        onClick={goToNext}
                        disabled={currentIndex === filteredSubmissions.length - 1}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {currentProblem?.title}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Student Name</div>
                      <div className="font-medium text-gray-900">
                        {currentSubmission.user?.studentProfile?.name || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Roll Number</div>
                      <div className="font-medium text-gray-900">
                        {currentSubmission.user?.studentProfile?.rollNo || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Language</div>
                      <div className="font-medium text-gray-900 uppercase">
                        {currentSubmission.language}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Status</div>
                      <div className="flex items-center space-x-2">
                        {currentSubmission.status === 'accepted' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Accepted
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            {currentSubmission.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Tests Passed</div>
                      <div className="font-medium text-gray-900">
                        {currentSubmission.testsPassed} / {currentSubmission.totalTests}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Score</div>
                      <div className="font-medium text-gray-900">
                        {currentSubmission.score} / {currentSubmission.maxScore}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Execution Time</div>
                      <div className="font-medium text-gray-900">
                        {currentSubmission.executionTime}ms
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Submitted</div>
                      <div className="font-medium text-gray-900">
                        {new Date(currentSubmission.submittedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

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
                  <h3 className="font-semibold text-gray-900 mb-4">Evaluation</h3>
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
                        disabled={currentIndex === 0}
                        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <ChevronLeft className="w-5 h-5" />
                        Back
                      </button>
                      <button
                        onClick={saveEvaluation}
                        className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center shadow-md"
                      >
                        <Save className="w-5 h-5 mr-2" />
                        Save & Continue
                      </button>
                      <button
                        onClick={goToNext}
                        disabled={currentIndex === filteredSubmissions.length - 1}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
