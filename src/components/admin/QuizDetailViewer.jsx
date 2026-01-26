import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, BookOpen, Code, CheckCircle, AlertCircle, Loader2, Clock, Users, Award 
} from "lucide-react";
import { adminService } from "../../services/adminService";

const QuizDetailViewer = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const notify = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      try {
        const response = await adminService.getQuizById(id);
        
        if (response.success && response.quiz) {
          setQuiz(response.quiz);
        } else {
          notify("Failed to load quiz", "error");
        }
      } catch (error) {
        console.error("Error fetching quiz:", error);
        notify("Failed to load quiz: " + error.message, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading quiz details...</p>
      </div>
    );
  }

  if (!quiz) {
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

  const questions = Array.isArray(quiz.questions) ? quiz.questions : [];

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
            <h2 className="text-2xl font-bold text-gray-900">Quiz Details</h2>
          </div>
        </div>

        {/* Quiz Info Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">{quiz.title}</h3>
          {quiz.description && (
            <p className="text-gray-600 mb-4">{quiz.description}</p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">Batch</p>
                <p className="font-semibold">{quiz.batch}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-xs text-gray-500">Duration</p>
                <p className="font-semibold">{quiz.duration} minutes</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-gray-600">
              <Award className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-xs text-gray-500">Questions</p>
                <p className="font-semibold">{questions.length}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-gray-600">
              <BookOpen className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="font-semibold">{quiz.isActive ? 'Active' : 'Inactive'}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Start Time:</span> {formatDateTime(quiz.startTime)}
              </div>
              <div>
                <span className="font-medium">End Time:</span> {formatDateTime(quiz.endTime)}
              </div>
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            All Questions ({questions.length})
          </h3>

          {questions.length === 0 ? (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No questions in this quiz</p>
            </div>
          ) : (
            questions.map((question, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-start gap-3 mb-4">
                  <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-semibold">
                    #{index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 text-gray-700 uppercase">
                        {question.type === 'mcq' ? 'Multiple Choice' : 'Coding Challenge'}
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      {question.question || 'No question text'}
                    </h4>

                    {/* Code Snippet */}
                    {question.codeSnippet && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Code className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Code Snippet:</span>
                        </div>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{question.codeSnippet}</code>
                        </pre>
                      </div>
                    )}

                    {/* MCQ Options */}
                    {question.type === 'mcq' && question.options && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700 mb-2">Options:</p>
                        <div className="grid grid-cols-1 gap-2">
                          {Object.entries(question.options).map(([key, value]) => (
                            <div
                              key={key}
                              className={`p-3 rounded-lg border-2 transition ${
                                question.correctAnswer === key
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-700">{key}.</span>
                                <span className="text-gray-900">{value}</span>
                                {question.correctAnswer === key && (
                                  <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="font-semibold text-green-800">
                              Correct Answer: Option {question.correctAnswer}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizDetailViewer;
