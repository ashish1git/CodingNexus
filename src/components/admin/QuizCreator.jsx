import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Plus, Trash2, Save, Clock, BookOpen, Code, CheckCircle, AlertCircle, Loader2, Shield 
} from "lucide-react";
// Import the service and auth
import { adminService } from "../../services/adminService";
import { useAuth } from "../../context/AuthContext";

const QuizCreator = () => {
  const navigate = useNavigate();
  const { userDetails } = useAuth();

  // State for form
  const [title, setTitle] = useState("");
  const [batch, setBatch] = useState("Basic");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [duration, setDuration] = useState(60);
  
  // State for logic
  const [loading, setLoading] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [notification, setNotification] = useState(null);

  const [questions, setQuestions] = useState([
    {
      type: "mcq",
      question: "",
      options: { A: "", B: "", C: "", D: "" },
      correctAnswer: "A",
      codeSnippet: "",
    },
  ]);

  // --- Utility: Notification ---
  const notify = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- Utility: Convert local datetime to ISO string (preserves local time as UTC equivalent) ---
  const convertLocalToISO = (localDatetimeString) => {
    if (!localDatetimeString) return null;
    // localDatetimeString format: "2026-01-26T14:30"
    // Parse it as local time and convert to ISO string
    const date = new Date(localDatetimeString);
    // This creates a date assuming local timezone, we'll send it as-is to backend
    return date.toISOString();
  };

  // --- 1. CHECK PERMISSIONS ON LOAD ---
  useEffect(() => {
    const checkPermission = async () => {
      setCheckingAccess(true);
      
      if (userDetails) {
        // Check if they have the specific 'createQuizzes' permission
        if (userDetails.permissions && userDetails.permissions.createQuizzes) {
          setHasPermission(true);
        } else if (userDetails.role === 'superadmin') {
          // Super admins have all permissions
          setHasPermission(true);
        } else {
          setHasPermission(false);
          notify("You do not have permission to create quizzes.", "error");
        }
      } else {
        setHasPermission(false);
      }
      
      setCheckingAccess(false);
    };

    checkPermission();
  }, [userDetails?.id, userDetails?.role]); // Only check when user ID changes

  /* ---------------- ADD QUESTION ---------------- */
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        type: "mcq",
        question: "",
        options: { A: "", B: "", C: "", D: "" },
        correctAnswer: "A",
        codeSnippet: "",
      },
    ]);
  };

  /* ---------------- UPDATE QUESTION ---------------- */
  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const updateOption = (qIndex, optionKey, value) => {
    const updated = [...questions];
    updated[qIndex].options[optionKey] = value;
    setQuestions(updated);
  };

  /* ---------------- REMOVE QUESTION ---------------- */
  const removeQuestion = (index) => {
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
  };

  /* ---------------- SUBMIT QUIZ ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hasPermission) {
      notify("Permission Denied", "error");
      return;
    }

    if (!title || !startTime || !endTime || !duration) {
      notify("Please fill all required fields", "error");
      return;
    }

    if (duration <= 0) {
      notify("Duration must be greater than 0", "error");
      return;
    }

    setLoading(true);

    try {
      // Use AdminService to create the quiz
      const result = await adminService.createQuiz({
        title,
        batch,
        startTime: convertLocalToISO(startTime),
        endTime: convertLocalToISO(endTime),
        duration: parseInt(duration),
        questions,
      });

      if (result.success) {
        notify("Quiz Created Successfully!");
        setTimeout(() => navigate('/admin/quiz'), 1500);
      } else {
        notify("Failed to create quiz: " + result.error, "error");
      }
    } catch (error) {
      console.error("Error creating quiz:", error);
      if (error.message === 'Invalid token' || error.message === 'No token provided') {
        notify("Session expired. Please log in again.", "error");
        setTimeout(() => navigate('/admin/login'), 2000);
      } else {
        notify("Failed to create quiz: " + error.message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- ACCESS DENIED VIEW ---
  if (!checkingAccess && !hasPermission) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-6">You do not have permission to create quizzes.</p>
          <button 
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            Go Back
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

      <div className="max-w-4xl mx-auto">
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
            <h2 className="text-2xl font-bold text-gray-900">Create New Quiz</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quiz Details Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              Quiz Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Title</label>
                <input
                  type="text"
                  placeholder="e.g., React JS Fundamentals"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Batch</label>
                <select
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                >
                  <option value="Basic">Basic</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="60"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />
              </div>

              <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Clock className="w-4 h-4" /> Start Time
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Clock className="w-4 h-4" /> End Time
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Questions Section */}
          <div className="space-y-4">
            {questions.map((q, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 transition-all hover:shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">#{index + 1}</span>
                    Question
                  </h3>
                  <button
                    type="button"
                    onClick={() => removeQuestion(index)}
                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-1/4">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                      <select
                        value={q.type}
                        onChange={(e) => updateQuestion(index, "type", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="mcq">Multiple Choice</option>
                        <option value="coding">Coding Challenge</option>
                      </select>
                    </div>
                    <div className="w-3/4">
                       <label className="block text-xs font-medium text-gray-500 mb-1">Question Text</label>
                       <input
                        type="text"
                        placeholder="Enter the question here..."
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                        value={q.question}
                        onChange={(e) => updateQuestion(index, "question", e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                      <Code className="w-3 h-3" /> Code Snippet (Optional)
                    </label>
                    <textarea
                      placeholder="// const example = 'code';"
                      className="w-full p-2 border border-gray-300 rounded-lg font-mono text-sm bg-gray-50"
                      rows="2"
                      value={q.codeSnippet}
                      onChange={(e) => updateQuestion(index, "codeSnippet", e.target.value)}
                    />
                  </div>

                  {/* MCQ Options */}
                  {q.type === "mcq" && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Options</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {["A", "B", "C", "D"].map((opt) => (
                          <div key={opt} className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">{opt}</span>
                            <input
                              type="text"
                              placeholder={`Option ${opt}`}
                              className="w-full pl-8 p-2 border border-gray-300 rounded-lg text-sm"
                              value={q.options[opt]}
                              onChange={(e) => updateOption(index, opt, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-sm font-medium text-gray-700">Correct Answer:</span>
                        <select
                          className="p-2 border border-gray-300 rounded-lg text-sm bg-white"
                          value={q.correctAnswer}
                          onChange={(e) => updateQuestion(index, "correctAnswer", e.target.value)}
                        >
                          <option value="A">Option A</option>
                          <option value="B">Option B</option>
                          <option value="C">Option C</option>
                          <option value="D">Option D</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-4 pt-4">
            <button
              type="button"
              onClick={addQuestion}
              className="flex-1 py-3 bg-white border border-dashed border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition flex items-center justify-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Another Question
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Publishing...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Publish Quiz
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuizCreator;