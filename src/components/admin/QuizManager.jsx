import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Clock,
  Calendar,
  Users,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Award,
  RefreshCw,
  Search,
  Filter,
  FileText,
  ClipboardList,
  ShieldAlert
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { hasPermission, getPermissionDeniedMessage } from '../../utils/permissions';
import toast from 'react-hot-toast';

const QuizManager = () => {
  const { userDetails } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBatch, setFilterBatch] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Check permissions
  const canCreateQuizzes = hasPermission(userDetails, 'createQuizzes');

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const response = await adminService.getAllQuizzes();
      if (response.success) {
        const quizList = (response.quizzes || []).map(quiz => ({
          ...quiz,
          startTime: new Date(quiz.startTime),
          endTime: new Date(quiz.endTime),
          createdAt: new Date(quiz.createdAt)
        }));
        setQuizzes(quizList);
      } else {
        toast.error('Failed to load quizzes');
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      if (error.message === 'Invalid token' || error.message === 'No token provided') {
        toast.error('Session expired. Please log in again.');
        setTimeout(() => navigate('/admin/login'), 2000);
      } else {
        toast.error('Failed to load quizzes');
      }
    } finally {
      setLoading(false);
    }
  };

  const getQuizStatus = (quiz) => {
    const now = new Date();
    if (now >= quiz.startTime && now <= quiz.endTime) return 'active';
    if (now < quiz.startTime) return 'upcoming';
    return 'ended';
  };

  const handleDelete = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await adminService.deleteQuiz(quizId);
      if (response.success) {
        toast.success('Quiz deleted successfully');
        fetchQuizzes();
      } else {
        toast.error('Failed to delete quiz');
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Failed to delete quiz');
    }
  };

  const handleToggleActive = async (quiz) => {
    try {
      const response = await adminService.updateQuiz(quiz.id, {
        isActive: !quiz.isActive
      });
      if (response.success) {
        toast.success(`Quiz ${quiz.isActive ? 'deactivated' : 'activated'} successfully`);
        fetchQuizzes();
      } else {
        toast.error('Failed to update quiz');
      }
    } catch (error) {
      console.error('Error updating quiz:', error);
      toast.error('Failed to update quiz');
    }
  };

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBatch = filterBatch === 'all' || quiz.batch === filterBatch;
    const status = getQuizStatus(quiz);
    const matchesStatus = filterStatus === 'all' || status === filterStatus;
    
    return matchesSearch && matchesBatch && matchesStatus;
  });

  const getStatusBadge = (quiz) => {
    const status = getQuizStatus(quiz);
    const badges = {
      active: { color: 'bg-green-100 text-green-800', text: 'Active', icon: CheckCircle },
      upcoming: { color: 'bg-blue-100 text-blue-800', text: 'Upcoming', icon: Clock },
      ended: { color: 'bg-gray-100 text-gray-800', text: 'Ended', icon: XCircle }
    };
    const badge = badges[status];
    const Icon = badge.icon;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  const formatDateTime = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = {
    total: quizzes.length,
    active: quizzes.filter(q => getQuizStatus(q) === 'active').length,
    upcoming: quizzes.filter(q => getQuizStatus(q) === 'upcoming').length,
    ended: quizzes.filter(q => getQuizStatus(q) === 'ended').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Quiz Management</h1>
          </div>
          <button
            onClick={() => navigate('/admin/quiz/create')}
            disabled={!canCreateQuizzes}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            Create New Quiz
          </button>
        </div>

        {/* Access Denied Screen */}
        {!canCreateQuizzes ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldAlert className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Access Denied</h2>
              <p className="text-gray-600 mb-6">
                You don't have permission to manage quizzes. Contact your administrator to request access.
              </p>
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Quizzes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Award className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ended</p>
                <p className="text-2xl font-bold text-gray-600">{stats.ended}</p>
              </div>
              <XCircle className="w-8 h-8 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search quizzes..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
            >
              <option value="all">All Batches</option>
              <option value="Basic">Basic</option>
              <option value="Advanced">Advanced</option>
            </select>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="ended">Ended</option>
            </select>
          </div>
        </div>

        {/* Quiz List */}
        {filteredQuizzes.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Quizzes Found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterBatch !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first quiz to get started'}
            </p>
            <button
              onClick={() => navigate('/admin/quiz/create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Create Quiz
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{quiz.title}</h3>
                      {getStatusBadge(quiz)}
                      {!quiz.isActive && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </div>
                    {quiz.description && (
                      <p className="text-gray-600 mb-3">{quiz.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-gray-500">Batch:</span>
                        <span className="font-semibold text-gray-900">{quiz.batch}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-green-500" />
                        <span className="font-medium text-gray-500">Start:</span>
                        <span className="font-semibold text-gray-900">{formatDateTime(quiz.startTime)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span className="font-medium text-gray-500">Duration:</span>
                        <span className="font-semibold text-gray-900">{quiz.duration} min</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-purple-500" />
                        <span className="font-medium text-gray-500">Questions:</span>
                        <span className="font-semibold text-gray-900">{Array.isArray(quiz.questions) ? quiz.questions.length : 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => navigate(`/admin/quiz/edit/${quiz.id}`)}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition group relative"
                      title="Edit Quiz"
                    >
                      <Edit className="w-5 h-5" />
                      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">Edit Quiz</span>
                    </button>
                    <button
                      onClick={() => navigate(`/admin/quiz/details/${quiz.id}`)}
                      className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition group relative"
                      title="View Questions"
                    >
                      <FileText className="w-5 h-5" />
                      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">View Questions</span>
                    </button>
                    <button
                      onClick={() => navigate(`/admin/quiz/submissions/${quiz.id}`)}
                      className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition group relative"
                      title="View Submissions"
                    >
                      <ClipboardList className="w-5 h-5" />
                      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">View Submissions</span>
                    </button>
                    <button
                      onClick={() => handleToggleActive(quiz)}
                      className={`p-2 rounded-lg transition group relative ${
                        quiz.isActive
                          ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                      title={quiz.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {quiz.isActive ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                        {quiz.isActive ? 'Deactivate Quiz' : 'Activate Quiz'}
                      </span>
                    </button>
                    <button
                      onClick={() => handleDelete(quiz.id)}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition group relative"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">Delete Quiz</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
};

export default QuizManager;
