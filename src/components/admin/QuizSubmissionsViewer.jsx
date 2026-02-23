import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, Users, Award, CheckCircle, XCircle, AlertCircle, Loader2, 
  TrendingUp, Clock, Eye, EyeOff, ChevronDown, ChevronUp, Filter 
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { useAuth } from "../../context/AuthContext";

const QuizSubmissionsViewer = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { userDetails } = useAuth();

  const [quizData, setQuizData] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [expandedSubmission, setExpandedSubmission] = useState(null);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState({});
  const [batchFilter, setBatchFilter] = useState('all');

  const notify = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const response = await adminService.getQuizSubmissions(id);
        
        if (response.success) {
          setQuizData(response.quiz);
          setSubmissions(response.submissions || []);
        } else {
          notify("Failed to load submissions", "error");
        }
      } catch (error) {
        console.error("Error fetching submissions:", error);
        notify("Failed to load submissions: " + error.message, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [id]);

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleSubmissionDetails = (submissionId) => {
    setExpandedSubmission(expandedSubmission === submissionId ? null : submissionId);
  };

  const toggleCorrectAnswers = (submissionId) => {
    setShowCorrectAnswers(prev => ({
      ...prev,
      [submissionId]: !prev[submissionId]
    }));
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-100 border-green-300';
    if (percentage >= 60) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  };

  // ALL HOOKS MUST BE BEFORE ANY EARLY RETURNS
  // Get unique batches from submissions
  const availableBatches = useMemo(() => {
    const batches = new Set();
    submissions.forEach(sub => {
      // Extract batch from student info if available
      if (sub.studentBatch) {
        batches.add(sub.studentBatch);
      }
    });
    return Array.from(batches).sort();
  }, [submissions]);

  // Filter submissions by batch
  const filteredSubmissions = useMemo(() => {
    if (batchFilter === 'all') {
      return submissions;
    }
    return submissions.filter(sub => sub.studentBatch === batchFilter);
  }, [submissions, batchFilter]);

  const questions = Array.isArray(quizData?.questions) ? quizData.questions : [];
  const averageScore = filteredSubmissions.length > 0 
    ? (filteredSubmissions.reduce((sum, sub) => sum + parseFloat(sub.percentage), 0) / filteredSubmissions.length).toFixed(2)
    : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading submissions...</p>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-200">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Quiz Not Found</h2>
          <p className="text-gray-500 mb-6">The quiz you're looking for doesn't exist.</p>
          <button 
            onClick={() => navigate('/admin/quiz')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg border animate-in slide-in-from-top-4 duration-300 ${
          notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/quiz')}
              className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Quiz Submissions</h2>
          </div>
        </div>

        {/* Quiz Info Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">{quizData.title}</h3>
            
            {/* Batch Filter */}
            {availableBatches.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={batchFilter}
                  onChange={(e) => setBatchFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-900"
                >
                  <option value="all">All Batches</option>
                  {availableBatches.map(batch => (
                    <option key={batch} value={batch}>{batch}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900">{filteredSubmissions.length}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">{averageScore}%</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Questions</p>
                <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Duration</p>
                <p className="text-2xl font-bold text-gray-900">{quizData.duration}m</p>
              </div>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        {filteredSubmissions.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Submissions Yet</h3>
            <p className="text-gray-600">Students haven't submitted any attempts for this quiz.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => {
              const isExpanded = expandedSubmission === submission.id;
              const showAnswers = showCorrectAnswers[submission.id] || false;
              const studentAnswers = submission.answers || {};

              return (
                <div key={submission.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Submission Header */}
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {submission.studentName}
                          </h4>
                          <span className="text-sm text-gray-500">
                            ({submission.studentRollNo})
                          </span>
                          {submission.studentBatch && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {submission.studentBatch}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{submission.studentEmail}</p>
                        
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Submitted:</span>{' '}
                            {formatDateTime(submission.submittedAt)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`px-4 py-3 rounded-lg border-2 ${getScoreBgColor(parseFloat(submission.percentage))}`}>
                          <div className="text-center">
                            <p className={`text-2xl font-bold ${getScoreColor(parseFloat(submission.percentage))}`}>
                              {submission.percentage}%
                            </p>
                            <p className="text-xs text-gray-600">
                              {submission.score} / {submission.maxScore}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => toggleSubmissionDetails(submission.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            View Details
                          </>
                        )}
                      </button>

                      {isExpanded && (
                        <button
                          onClick={() => toggleCorrectAnswers(submission.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition text-sm font-medium"
                        >
                          {showAnswers ? (
                            <>
                              <EyeOff className="w-4 h-4" />
                              Hide Correct Answers
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              Show Correct Answers
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50 p-6">
                      <h5 className="font-semibold text-gray-800 mb-4">Student's Answers</h5>
                      <div className="space-y-4">
                        {questions.map((question, qIndex) => {
                          const studentAnswer = studentAnswers[qIndex];
                          const isCorrect = studentAnswer === question.correctAnswer;

                          return (
                            <div key={qIndex} className="bg-white p-4 rounded-lg border border-gray-200">
                              <div className="flex items-start gap-3">
                                <span className="bg-gray-100 text-gray-700 text-sm px-2 py-1 rounded font-semibold">
                                  Q{qIndex + 1}
                                </span>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900 mb-2">
                                    {question.question}
                                  </p>

                                  {question.type === 'mcq' && (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">Student's answer:</span>
                                        <span className={`px-3 py-1 rounded-lg font-semibold ${
                                          isCorrect 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                          {studentAnswer ? `Option ${studentAnswer}` : 'Not answered'}
                                        </span>
                                        {isCorrect ? (
                                          <CheckCircle className="w-5 h-5 text-green-600" />
                                        ) : (
                                          <XCircle className="w-5 h-5 text-red-600" />
                                        )}
                                      </div>

                                      {showAnswers && !isCorrect && (
                                        <div className="flex items-center gap-2 mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                          <CheckCircle className="w-5 h-5 text-green-600" />
                                          <span className="text-sm font-semibold text-green-800">
                                            Correct Answer: Option {question.correctAnswer} - {question.options[question.correctAnswer]}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizSubmissionsViewer;
