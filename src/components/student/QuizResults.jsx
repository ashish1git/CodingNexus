// src/components/student/QuizResults.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Award, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  Home,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const QuizResults = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questionsWithAnswers, setQuestionsWithAnswers] = useState([]);

  useEffect(() => {
    if (quizId && currentUser) {
      console.log('📊 Loading quiz results for:', { quizId, userId: currentUser.id });
      fetchQuizResults();
    } else {
      console.log('⚠️ Missing data:', { hasQuizId: !!quizId, hasUser: !!currentUser });
      setLoading(false);
    }
  }, [quizId, currentUser]);

  const fetchQuizResults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching quiz results for:', quizId);
      
      // Get quiz data and attempt using studentService
      const [quizResponse, attemptResponse] = await Promise.all([
        studentService.getQuizById(quizId),
        studentService.getQuizAttempt(quizId)
      ]);
      
      console.log('📥 Quiz response:', quizResponse);
      console.log('📥 Attempt response:', attemptResponse);
      
      if (!quizResponse.success) {
        throw new Error('Quiz not found');
      }
      
      if (!attemptResponse.success || !attemptResponse.data) {
        throw new Error('No attempt found for this quiz');
      }
      
      const quiz = {
        ...quizResponse.data,
        startTime: new Date(quizResponse.data.startTime),
        endTime: new Date(quizResponse.data.endTime)
      };
      
      const studentAttempt = {
        ...attemptResponse.data,
        submittedAt: attemptResponse.data.submittedAt ? new Date(attemptResponse.data.submittedAt) : new Date(),
        // Calculate derived fields
        totalQuestions: attemptResponse.data.maxScore || 0,
        percentage: attemptResponse.data.maxScore > 0 
          ? Math.round((attemptResponse.data.score / attemptResponse.data.maxScore) * 100) 
          : 0
      };
      
      console.log('✅ Attempt data:', {
        score: studentAttempt.score,
        maxScore: studentAttempt.maxScore,
        answers: studentAttempt.answers
      });
      
      // 3. Prepare questions with answers
      const qa = quiz.questions?.map((question, index) => {
        const studentAnswer = studentAttempt.answers?.[index];
        const isCorrect = studentAnswer === question.correctAnswer;
        
        return {
          ...question,
          studentAnswer: studentAnswer,
          isCorrect: isCorrect,
          questionNumber: index + 1
        };
      }) || [];
      
      setQuizData(quiz);
      setAttempt(studentAttempt);
      setQuestionsWithAnswers(qa);
      
      console.log('✅ Results loaded successfully');
      
    } catch (error) {
      console.error('❌ Error fetching quiz results:', error);
      setError(error.message || 'Failed to load quiz results');
      toast.error(error.message || 'Failed to load quiz results');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToQuizzes = () => {
    navigate('/student/quiz/list');
  };

  const handleGoHome = () => {
    navigate('/student/dashboard');
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-emerald-400';
    if (percentage >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (percentage) => {
    if (percentage >= 80) return 'bg-emerald-900/30 border-emerald-700/50';
    if (percentage >= 60) return 'bg-amber-900/30 border-amber-700/50';
    return 'bg-red-900/30 border-red-700/50';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading quiz results...</p>
          <p className="text-sm text-slate-400 mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  if (error || !quizData || !attempt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-xl p-8 max-w-md w-full text-center border border-slate-700">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Error Loading Results</h2>
          <p className="text-slate-300 mb-4">{error || 'Quiz results not found'}</p>
          <p className="text-sm text-slate-400 mb-6">
            Quiz ID: {quizId}<br/>
            {currentUser?.id && `User ID: ${currentUser.id.substring(0, 8)}...`}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => fetchQuizResults()}
              className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={handleBackToQuizzes}
              className="px-4 py-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition font-medium"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <nav className="bg-slate-800 shadow-lg border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={handleBackToQuizzes}
              className="flex items-center gap-2 text-slate-300 hover:text-indigo-400 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline text-sm">Back to Quizzes</span>
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-white">Quiz Results</h1>
            <button
              onClick={handleGoHome}
              className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-indigo-400 transition"
            >
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline text-sm">Dashboard</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quiz Info Card */}
        <div className="bg-slate-800 rounded-xl p-6 mb-6 shadow-lg border border-slate-700">
          <h1 className="text-2xl font-bold text-white mb-2">{quizData.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Submitted: {attempt.submittedAt.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Submitted at: {attempt.submittedAt.toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>{quizData.questions?.length || 0} Questions</span>
            </div>
          </div>

          {/* Score Card */}
          <div className={`p-6 rounded-xl ${getScoreBgColor(attempt.percentage)} border`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <p className="text-sm text-slate-400 mb-2">Your Score</p>
                <h2 className={`text-4xl sm:text-5xl font-bold ${getScoreColor(attempt.percentage)} mb-2`}>
                  {attempt.score}/{attempt.totalQuestions}
                </h2>
                <p className={`text-lg font-bold ${getScoreColor(attempt.percentage)}`}>
                  {attempt.percentage}%
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-sm text-slate-400">Correct</p>
                  <p className="text-2xl font-bold text-emerald-400">{attempt.score}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-400">Incorrect</p>
                  <p className="text-2xl font-bold text-red-400">{attempt.totalQuestions - attempt.score}</p>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-slate-400">Performance</p>
                <div className="mt-2">
                  {attempt.percentage >= 80 ? (
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle className="w-6 h-6" />
                      <span className="font-bold">Excellent!</span>
                    </div>
                  ) : attempt.percentage >= 60 ? (
                    <div className="flex items-center gap-2 text-amber-400">
                      <CheckCircle className="w-6 h-6" />
                      <span className="font-bold">Good</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-400">
                      <XCircle className="w-6 h-6" />
                      <span className="font-bold">Needs Improvement</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Questions Review */}
        <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-6">Question Review</h2>
          
          <div className="space-y-6">
            {questionsWithAnswers.map((question, index) => (
              <div 
                key={index} 
                className={`p-5 rounded-xl border ${
                  question.isCorrect 
                    ? 'bg-emerald-900/20 border-emerald-700/30' 
                    : 'bg-red-900/20 border-red-700/30'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-white text-lg">
                      Q{index + 1}. {question.question}
                    </h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        question.isCorrect 
                          ? 'bg-emerald-900/50 text-emerald-300' 
                          : 'bg-red-900/50 text-red-300'
                      }`}>
                        {question.isCorrect ? 'Correct ✓' : 'Incorrect ✗'}
                      </span>
                    </div>
                  </div>
                  {question.isCorrect ? (
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-400" />
                  )}
                </div>

                {question.codeSnippet && (
                  <div className="bg-slate-900 p-4 rounded-lg mb-4 overflow-x-auto">
                    <pre className="text-slate-300 text-sm font-mono">
                      <code>{question.codeSnippet}</code>
                    </pre>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {['A', 'B', 'C', 'D'].map((option) => {
                    const isStudentAnswer = question.studentAnswer === option;
                    const isCorrectAnswer = question.correctAnswer === option;
                    
                    let className = "p-3 rounded-lg border text-left ";
                    
                    if (isCorrectAnswer) {
                      className += "bg-emerald-900/30 border-emerald-500 text-emerald-300";
                    } else if (isStudentAnswer && !isCorrectAnswer) {
                      className += "bg-red-900/30 border-red-500 text-red-300";
                    } else {
                      className += "bg-slate-700/50 border-slate-600 text-slate-300";
                    }
                    
                    return (
                      <div key={option} className={className}>
                        <div className="flex items-start gap-2">
                          <span className="font-bold">{option}.</span>
                          <span>{question.options?.[option]}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Your Answer: </span>
                      <span className={`font-bold ${question.isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                        {question.studentAnswer || 'Not answered'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Correct Answer: </span>
                      <span className="font-bold text-emerald-300">
                        {question.correctAnswer}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <button
            onClick={handleBackToQuizzes}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to All Quizzes
          </button>
          <button
            onClick={handleGoHome}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium"
          >
            <Home className="w-5 h-5" />
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;