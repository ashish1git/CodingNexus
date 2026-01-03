import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, AlertCircle, CheckCircle, Code as CodeIcon } from "lucide-react";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const QuizAttempt = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userDetails } = useAuth();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  /* ---------------- FETCH QUIZ ---------------- */
  useEffect(() => {
    if (!quizId || !userDetails) return;
    fetchQuiz();
    checkAttempt();
    // eslint-disable-next-line
  }, [quizId, userDetails]);

  /* ---------------- TIMER ---------------- */
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
    // eslint-disable-next-line
  }, [timeRemaining]);

  const fetchQuiz = async () => {
    try {
      const quizRef = doc(db, "quizzes", quizId);
      const quizSnap = await getDoc(quizRef);

      if (!quizSnap.exists()) {
        toast.error("Quiz not found");
        navigate("/student/dashboard");
        return;
      }

      const quizData = { id: quizSnap.id, ...quizSnap.data() };

      // ✅ Batch check
      if (quizData.batch !== userDetails.batch) {
        toast.error("You are not allowed to access this quiz");
        navigate("/student/dashboard");
        return;
      }

      // ✅ Time window check
      const now = new Date();
      const start = quizData.startTime.toDate();
      const end = quizData.endTime.toDate();

      if (now < start || now > end) {
        toast.error("Quiz is not active");
        navigate("/student/dashboard");
        return;
      }

      // ✅ Calculate duration from timestamps
      const durationSeconds = Math.floor((end - now) / 1000);
      setTimeRemaining(durationSeconds);

      setQuiz(quizData);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      toast.error("Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- CHECK PREVIOUS ATTEMPT ---------------- */
  const checkAttempt = async () => {
    try {
      const q = query(
        collection(db, "quiz_attempts"),
        where("quizId", "==", quizId),
        where("studentId", "==", currentUser.uid)
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        toast.error("You have already attempted this quiz");
        navigate("/student/dashboard");
      }
    } catch (error) {
      console.error("Error checking attempt:", error);
    }
  };

  /* ---------------- ANSWERS ---------------- */
  const handleAnswerChange = (index, option) => {
    setAnswers({ ...answers, [index]: option });
  };

  /* ---------------- SCORE ---------------- */
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

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async () => {
    if (submitting || !quiz) return;

    setSubmitting(true);

    try {
      const result = calculateScore();

      await addDoc(collection(db, "quiz_attempts"), {
        quizId,
        studentId: currentUser.uid,
        studentName: userDetails.name,
        studentRollNo: userDetails.rollNo,
        answers,
        score: result.score,
        totalQuestions: result.total,
        percentage: result.percentage,
        submittedAt: Timestamp.now(),
      });

      toast.success(
        `Submitted! Score: ${result.score}/${result.total} (${result.percentage}%)`
      );
      navigate("/student/dashboard");
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  };

  /* ---------------- UI ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!quiz) return null;

  const question = quiz.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex justify-between items-center">
        <h1 className="text-xl font-bold">{quiz.title}</h1>
        <div className="flex items-center gap-2 text-indigo-700">
          <Clock />
          <span className="font-mono text-lg">
            {formatTime(timeRemaining)}
          </span>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="font-semibold mb-4">
          Q{currentQuestion + 1}. {question.question}
        </h2>

        {question.codeSnippet && (
          <pre className="bg-gray-900 text-gray-100 p-4 rounded mb-4">
            <code>{question.codeSnippet}</code>
          </pre>
        )}

        <div className="space-y-3">
          {["A", "B", "C", "D"].map((opt) => (
            <button
              key={opt}
              onClick={() => handleAnswerChange(currentQuestion, opt)}
              className={`w-full text-left p-3 border rounded ${
                answers[currentQuestion] === opt
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-300"
              }`}
            >
              <strong>{opt}.</strong>{" "}
              {question.options?.[opt]}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          disabled={currentQuestion === 0}
          onClick={() => setCurrentQuestion((p) => p - 1)}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Previous
        </button>

        {currentQuestion < quiz.questions.length - 1 ? (
          <button
            onClick={() => setCurrentQuestion((p) => p + 1)}
            className="px-4 py-2 bg-indigo-600 text-white rounded"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>
        )}
      </div>

      {timeRemaining < 300 && (
        <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 flex gap-3">
          <AlertCircle className="text-red-600" />
          <p className="text-red-700">
            Less than 5 minutes remaining!
          </p>
        </div>
      )}
    </div>
  );
};

export default QuizAttempt;
