import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, CheckCircle, XCircle, Clock, Calendar, Home, RefreshCw, AlertCircle } from 'lucide-react';
import { eventService } from '../../services/eventService';
import toast from 'react-hot-toast';

export default function EventQuizResults() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questionsWithAnswers, setQuestionsWithAnswers] = useState([]);

  useEffect(() => {
    if (quizId) fetchResults();
  }, [quizId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await eventService.getQuizResults(quizId);

      if (!response.success) {
        throw new Error('Results not found');
      }

      const { quiz, attempt: attemptData } = response.data;

      const percentage = attemptData.maxScore > 0
        ? Math.round((attemptData.score / attemptData.maxScore) * 100)
        : 0;

      const processedAttempt = {
        ...attemptData,
        totalQuestions: attemptData.maxScore,
        percentage,
        submittedAt: attemptData.submittedAt ? new Date(attemptData.submittedAt) : new Date()
      };

      const qa = quiz.questions?.map((question, index) => ({
        ...question,
        studentAnswer: attemptData.answers?.[index],
        isCorrect: attemptData.answers?.[index] === question.correctAnswer,
        questionNumber: index + 1
      })) || [];

      setQuizData(quiz);
      setAttempt(processedAttempt);
      setQuestionsWithAnswers(qa);
    } catch (error) {
      console.error('Error fetching results:', error);
      setError(error.message || 'Failed to load results');
      toast.error('Failed to load quiz results');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (pct) => {
    if (pct >= 80) return 'text-emerald-400';
    if (pct >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBg = (pct) => {
    if (pct >= 80) return 'bg-emerald-900/30 border-emerald-700/50';
    if (pct >= 60) return 'bg-amber-900/30 border-amber-700/50';
    return 'bg-red-900/30 border-red-700/50';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !quizData || !attempt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full text-center border border-gray-700">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Error Loading Results</h2>
          <p className="text-gray-300 mb-6">{error || 'Results not found'}</p>
          <div className="flex flex-col gap-3">
            <button onClick={fetchResults} className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
            <button onClick={() => navigate('/event-dashboard/quizzes')} className="px-4 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition">
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black">
      {/* Header */}
      <nav className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/event-dashboard/quizzes')}
            className="flex items-center gap-2 text-gray-300 hover:text-purple-400 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline text-sm">Back to Quizzes</span>
          </button>
          <h1 className="text-lg font-bold text-white">Quiz Results</h1>
          <button
            onClick={() => navigate('/event-dashboard')}
            className="flex items-center gap-2 text-gray-300 hover:text-purple-400 transition"
          >
            <Home className="w-5 h-5" />
            <span className="hidden sm:inline text-sm">Dashboard</span>
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Quiz Info + Score */}
        <div className="bg-gray-800 rounded-xl p-5 sm:p-6 mb-6 border border-gray-700">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">{quizData.title}</h1>
          {quizData.eventTitle && (
            <p className="text-gray-500 text-sm mb-3">Event: {quizData.eventTitle}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-5">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Submitted: {attempt.submittedAt.toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {attempt.submittedAt.toLocaleTimeString()}
            </span>
            <span className="flex items-center gap-1">
              <Award className="w-4 h-4" />
              {questionsWithAnswers.length} Questions
            </span>
          </div>

          {/* Score Card */}
          <div className={`p-5 rounded-xl border ${getScoreBg(attempt.percentage)}`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="text-center sm:text-left">
                <p className="text-sm text-gray-400 mb-1">Your Score</p>
                <h2 className={`text-4xl sm:text-5xl font-bold ${getScoreColor(attempt.percentage)} mb-1`}>
                  {attempt.score}/{attempt.totalQuestions}
                </h2>
                <p className={`text-lg font-bold ${getScoreColor(attempt.percentage)}`}>
                  {attempt.percentage}%
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-400">Correct</p>
                  <p className="text-2xl font-bold text-emerald-400">{attempt.score}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">Incorrect</p>
                  <p className="text-2xl font-bold text-red-400">{attempt.totalQuestions - attempt.score}</p>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-400">Performance</p>
                <div className="mt-1">
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

        {/* Question Review */}
        <div className="bg-gray-800 rounded-xl p-5 sm:p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-5">Question Review</h2>

          <div className="space-y-5">
            {questionsWithAnswers.map((q, index) => (
              <div
                key={index}
                className={`p-4 sm:p-5 rounded-xl border ${
                  q.isCorrect
                    ? 'bg-emerald-900/20 border-emerald-700/30'
                    : 'bg-red-900/20 border-red-700/30'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-white text-sm sm:text-base flex-1">
                    Q{q.questionNumber}. {q.question}
                  </h3>
                  {q.isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 ml-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 ml-2" />
                  )}
                </div>

                {q.codeSnippet && (
                  <div className="bg-gray-900 p-3 rounded-lg mb-3 overflow-x-auto">
                    <pre className="text-gray-300 text-xs font-mono"><code>{q.codeSnippet}</code></pre>
                  </div>
                )}

                <div className="space-y-2">
                  {['A', 'B', 'C', 'D'].map(opt => {
                    const isStudentAnswer = q.studentAnswer === opt;
                    const isCorrectAnswer = q.correctAnswer === opt;
                    let style = 'border-gray-600/50 bg-gray-700/30 text-gray-400';

                    if (isCorrectAnswer && isStudentAnswer) {
                      style = 'border-emerald-500 bg-emerald-900/30 text-emerald-300';
                    } else if (isCorrectAnswer) {
                      style = 'border-emerald-500/50 bg-emerald-900/20 text-emerald-400';
                    } else if (isStudentAnswer) {
                      style = 'border-red-500 bg-red-900/30 text-red-300';
                    }

                    return (
                      <div key={opt} className={`p-2.5 border rounded-lg text-sm ${style}`}>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs">{opt}.</span>
                          <span className="break-words">{q.options?.[opt]}</span>
                          {isCorrectAnswer && <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto flex-shrink-0" />}
                          {isStudentAnswer && !isCorrectAnswer && <XCircle className="w-4 h-4 text-red-400 ml-auto flex-shrink-0" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
