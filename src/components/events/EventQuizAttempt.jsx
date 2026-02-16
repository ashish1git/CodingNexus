import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { eventService } from '../../services/eventService';
import toast from 'react-hot-toast';

export default function EventQuizAttempt() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [endTime, setEndTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  useEffect(() => {
    if (!quizId) return;
    fetchQuiz();
    checkAttempt();
  }, [quizId]);

  useEffect(() => {
    if (timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining]);

  const formatTime = (seconds) => {
    if (seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const fetchQuiz = async () => {
    try {
      const response = await eventService.getQuizById(quizId);
      if (!response.success) {
        toast.error('Quiz not found');
        navigate('/event-dashboard/quizzes');
        return;
      }

      const quizData = response.data;
      const now = new Date();
      const start = new Date(quizData.startTime);
      const end = new Date(quizData.endTime);

      if (now < start || now > end) {
        toast.error('Quiz is not active right now');
        navigate('/event-dashboard/quizzes');
        return;
      }

      const windowRemainingSeconds = Math.floor((end - now) / 1000);
      const adminDurationSeconds = (quizData.duration || 60) * 60;
      const finalDuration = Math.min(windowRemainingSeconds, adminDurationSeconds);

      setTimeRemaining(finalDuration);
      setEndTime(end);
      setQuiz(quizData);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast.error('Failed to load quiz');
      navigate('/event-dashboard/quizzes');
    } finally {
      setLoading(false);
    }
  };

  const checkAttempt = async () => {
    try {
      const response = await eventService.checkQuizAttempt(quizId);
      if (response.success && response.data) {
        toast.error('You have already attempted this quiz');
        navigate('/event-dashboard/quizzes');
      }
    } catch (error) {
      console.error('Error checking attempt:', error);
    }
  };

  const handleAnswerChange = (index, option) => {
    setAnswers({ ...answers, [index]: option });
  };

  const handleSubmit = useCallback(async () => {
    if (submitting || !quiz) return;
    setSubmitting(true);

    try {
      const attemptData = {
        answers,
        score: 0,
        maxScore: quiz.questions.length
      };

      const response = await eventService.submitQuizAttempt(quizId, attemptData);
      if (response.success) {
        toast.success(response.message || 'Quiz submitted!');
        navigate(`/event-dashboard/quiz/${quizId}/results`);
      } else {
        toast.error(response.error || 'Failed to submit quiz');
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Submission failed');
    } finally {
      setSubmitting(false);
      setShowConfirmSubmit(false);
    }
  }, [submitting, quiz, answers, quizId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  const question = quiz.questions[currentQuestion];
  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(answers).filter(key => answers[key] !== undefined).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black p-3 sm:p-6">
      {/* Header */}
      <div className="bg-gray-800 p-4 sm:p-5 rounded-xl shadow-lg border border-gray-700 mb-4 sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-white truncate">{quiz.title}</h1>
            <p className="text-xs text-gray-400 mt-1">
              Question {currentQuestion + 1} of {totalQuestions} • {quiz.eventTitle}
            </p>
          </div>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-mono text-lg font-bold flex-shrink-0 ${
            timeRemaining < 300
              ? 'bg-red-900/30 text-red-400 border-red-700/50 animate-pulse'
              : 'bg-purple-900/30 text-purple-400 border-purple-700/50'
          }`}>
            <Clock className="w-5 h-5" />
            <span className="text-sm sm:text-lg">{formatTime(timeRemaining)}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">Progress</span>
            <span className="text-xs text-gray-400">{answeredCount}/{totalQuestions} answered</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Question Card */}
        <div className="bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg border border-gray-700 mb-4">
          <h2 className="font-semibold text-white text-base sm:text-lg mb-4">
            Q{currentQuestion + 1}. {question.question}
          </h2>

          {question.codeSnippet && (
            <div className="bg-gray-900 p-3 sm:p-4 rounded-lg mb-5 overflow-x-auto">
              <pre className="text-gray-300 text-xs sm:text-sm font-mono">
                <code>{question.codeSnippet}</code>
              </pre>
            </div>
          )}

          <div className="space-y-3">
            {['A', 'B', 'C', 'D'].map(opt => (
              <button
                key={opt}
                onClick={() => handleAnswerChange(currentQuestion, opt)}
                className={`w-full text-left p-3 sm:p-4 border rounded-lg transition ${
                  answers[currentQuestion] === opt
                    ? 'border-purple-500 bg-purple-900/30 text-white'
                    : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-purple-500/50 hover:bg-gray-600/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="font-bold flex-shrink-0 text-sm">{opt}.</span>
                  <span className="text-sm break-words">{question.options?.[opt]}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
          <button
            disabled={currentQuestion === 0}
            onClick={() => setCurrentQuestion(prev => prev - 1)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition disabled:opacity-50 disabled:hover:bg-gray-700"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          {currentQuestion === totalQuestions - 1 ? (
            <button
              onClick={() => setShowConfirmSubmit(true)}
              disabled={submitting}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(prev => prev + 1)}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Question Navigator */}
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <p className="text-sm text-gray-400 mb-3">Jump to Question</p>
          <div className="flex flex-wrap gap-2">
            {quiz.questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQuestion(i)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                  currentQuestion === i
                    ? 'bg-purple-600 text-white'
                    : answers[i] !== undefined
                    ? 'bg-green-700/50 text-green-300 border border-green-600/30'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full border border-gray-700">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Submit Quiz?</h3>
              <p className="text-gray-400 mb-2">
                You've answered {answeredCount} of {totalQuestions} questions.
              </p>
              {answeredCount < totalQuestions && (
                <p className="text-amber-400 text-sm mb-4">
                  {totalQuestions - answeredCount} questions unanswered!
                </p>
              )}
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 px-4 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Go Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
