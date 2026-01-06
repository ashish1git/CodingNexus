import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, AlertCircle, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { studentService } from "../../services/studentService";

const QuizAttempt = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userDetails } = useAuth();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [endTime, setEndTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  useEffect(() => {
    if (!quizId || !userDetails) return;
    fetchQuiz();
    checkAttempt();
  }, [quizId, userDetails]);

  useEffect(() => {
    if (timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
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
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatEndTime = (date) => {
    if (!date) return "N/A";
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const fetchQuiz = async () => {
    try {
      const response = await studentService.getQuizById(quizId);

      if (!response.success) {
        toast.error("Quiz not found");
        navigate("/student/dashboard");
        return;
      }

      const quizData = response.data;
      const now = new Date();
      const start = new Date(quizData.startTime);
      const end = new Date(quizData.endTime);

      if (now < start || now > end) {
        toast.error("Quiz is not active");
        navigate("/student/dashboard");
        return;
      }

      const windowRemainingSeconds = Math.floor((end - now) / 1000);
      const adminDurationSeconds = (quizData.duration || 60) * 60;
      const finalDuration = Math.min(windowRemainingSeconds, adminDurationSeconds);

      setTimeRemaining(finalDuration);
      setEndTime(end);
      setQuiz(quizData);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      toast.error("Failed to load quiz");
      navigate("/student/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const checkAttempt = async () => {
    try {
      const response = await studentService.getQuizAttempt(quizId);
      if (response.success && response.data) {
        toast.error("You have already attempted this quiz");
        navigate("/student/dashboard");
      }
    } catch (error) {
      console.error("Error checking attempt:", error);
    }
  };

  const handleAnswerChange = (index, option) => {
    setAnswers({ ...answers, [index]: option });
  };

  const calculateScore = () => {
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) correct++;
    });
    return {
      score: correct,
      total: quiz.questions.length,
      percentage: Math.round((correct / quiz.questions.length) * 100),
    };
  };

  const handleSubmit = async () => {
    if (submitting || !quiz) return;
    setSubmitting(true);

    try {
      const result = calculateScore();
      const attemptData = {
        quizId,
        studentId: currentUser.uid,
        studentName: userDetails.name,
        studentRollNo: userDetails.rollNo,
        answers,
        score: result.score,
        totalQuestions: result.total,
        percentage: result.percentage,
      };

      await studentService.submitQuiz(attemptData);
      toast.success(`Submitted! Score: ${result.score}/${result.total}`);
      navigate("/student/dashboard");
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Submission failed");
    } finally {
      setSubmitting(false);
      setShowConfirmSubmit(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  const question = quiz.questions[currentQuestion];
  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(answers).filter((key) => answers[key] !== undefined).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3 sm:p-6">
      {/* Header */}
      <div className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700 mb-6 sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{quiz.title}</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Question {currentQuestion + 1} of {totalQuestions}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Time Remaining */}
            <div
              className={`flex items-center gap-3 px-4 py-2 rounded-lg border font-mono text-lg font-bold flex-shrink-0 ${
                timeRemaining < 300
                  ? "bg-red-900/30 text-red-400 border-red-700/50"
                  : "bg-indigo-900/30 text-indigo-400 border-indigo-700/50"
              }`}
            >
              <Clock className="w-5 h-5" />
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-normal">Time Left</span>
                <span className="text-sm sm:text-lg">{formatTime(timeRemaining)}</span>
              </div>
            </div>

            {/* End Time */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-slate-600 bg-slate-700/50 flex-shrink-0">
              <Clock className="w-5 h-5 text-slate-400" />
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-normal">Ends At</span>
                <span className="text-sm sm:text-lg font-mono text-slate-200">{formatEndTime(endTime)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Progress</span>
            <span className="text-xs text-slate-400">
              {answeredCount}/{totalQuestions} answered
            </span>
          </div>
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
              style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Question Card */}
        <div className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700 mb-6">
          <h2 className="font-semibold text-white text-base sm:text-lg mb-4">
            Q{currentQuestion + 1}. {question.question}
          </h2>

          {question.codeSnippet && (
            <div className="bg-slate-900 p-3 sm:p-4 rounded-lg mb-6 overflow-x-auto">
              <pre className="text-slate-300 text-xs sm:text-sm font-mono">
                <code>{question.codeSnippet}</code>
              </pre>
            </div>
          )}

          <div className="space-y-3">
            {["A", "B", "C", "D"].map((opt) => (
              <button
                key={opt}
                onClick={() => handleAnswerChange(currentQuestion, opt)}
                className={`w-full text-left p-3 sm:p-4 border rounded-lg transition ${
                  answers[currentQuestion] === opt
                    ? "border-indigo-500 bg-indigo-900/30 text-white"
                    : "border-slate-600 bg-slate-700/50 text-slate-300 hover:border-indigo-500/50 hover:bg-slate-600/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="font-bold flex-shrink-0 text-sm">{opt}.</span>
                  <span className="text-sm break-words">
                    {question.options?.[opt]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <button
            disabled={currentQuestion === 0}
            onClick={() => setCurrentQuestion((p) => p - 1)}
            className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-600 rounded-lg text-slate-300 hover:border-indigo-500/50 hover:text-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Previous</span>
          </button>

          {currentQuestion < totalQuestions - 1 ? (
            <button
              onClick={() => setCurrentQuestion((p) => p + 1)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
            >
              <span>Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setShowConfirmSubmit(true)}
              disabled={submitting}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{submitting ? "Submitting..." : "Submit Quiz"}</span>
            </button>
          )}
        </div>

        {/* Question Navigator */}
        <div className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700 mb-6">
          <h3 className="text-white font-semibold mb-4 text-sm">All Questions</h3>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-2">
            {Array.from({ length: totalQuestions }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg font-semibold text-xs sm:text-sm transition flex items-center justify-center ${
                  idx === currentQuestion
                    ? "bg-indigo-600 text-white border border-indigo-500"
                    : answers[idx] !== undefined
                    ? "bg-green-600/30 text-green-400 border border-green-600/50"
                    : "bg-slate-700 text-slate-400 border border-slate-600 hover:bg-slate-600"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Time Warning */}
        {timeRemaining < 300 && timeRemaining > 0 && (
          <div className="bg-red-900/30 border-l-4 border-red-500 p-4 rounded-lg mb-6 flex gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0 w-5 h-5 mt-0.5" />
            <p className="text-red-300 text-sm">
              Less than {Math.floor(timeRemaining / 60)} minute
              {Math.floor(timeRemaining / 60) !== 1 ? "s" : ""} remaining!
            </p>
          </div>
        )}
      </div>

      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4">Confirm Submission</h3>
            <p className="text-slate-300 mb-2">
              You have answered{" "}
              <span className="font-bold text-indigo-400">{answeredCount}</span> out
              of <span className="font-bold text-indigo-400">{totalQuestions}</span>{" "}
              questions.
            </p>
            <p className="text-slate-400 text-sm mb-6">
              Are you sure you want to submit? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition font-medium"
              >
                Continue Quiz
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              >
                {submitting ? "Submitting..." : "Submit Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizAttempt;