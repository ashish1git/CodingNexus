import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Trophy, Plus, Edit, Trash2, Eye, 
  Calendar, Clock, Users, Target, Award, Search,
  Filter, Download, Upload, BarChart3, Medal
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const CompetitionManager = () => {
  const { userDetails } = useAuth();
  const [activeTab, setActiveTab] = useState('all'); // all, ongoing, upcoming, past
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Basic Info, 2: Problems
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    startTime: '',
    endTime: '',
    duration: 180,
    prize: '',
    category: '',
    type: 'rated'
  });
  const [problems, setProblems] = useState([]);
  const [currentProblem, setCurrentProblem] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    points: 100,
    constraints: [''],
    examples: [{ input: '', output: '', explanation: '' }],
    testCases: [{ input: '', output: '', hidden: false }]
  });

  // Static data - will be replaced with API calls later
  const competitions = [
    {
      id: 1,
      title: 'Weekly Code Sprint #42',
      description: 'Test your problem-solving skills in this fast-paced coding competition',
      difficulty: 'medium',
      status: 'ongoing',
      startTime: '2026-01-07T10:00:00',
      endTime: '2026-01-07T18:00:00',
      participants: 156,
      problems: 5,
      prize: '₹5000',
      type: 'rated',
      category: 'Algorithm',
      createdBy: 'Admin',
      registrations: 234
    },
    {
      id: 2,
      title: 'January Long Challenge',
      description: 'Month-long coding challenge with increasing difficulty',
      difficulty: 'hard',
      status: 'ongoing',
      startTime: '2026-01-01T00:00:00',
      endTime: '2026-01-31T23:59:59',
      participants: 423,
      problems: 8,
      prize: '₹15000',
      type: 'rated',
      category: 'Mixed',
      createdBy: 'Admin',
      registrations: 567
    },
    {
      id: 3,
      title: 'Dynamic Programming Marathon',
      description: 'Master DP with specially curated problems',
      difficulty: 'hard',
      status: 'upcoming',
      startTime: '2026-01-10T14:00:00',
      endTime: '2026-01-10T17:00:00',
      participants: 0,
      problems: 6,
      prize: '₹8000',
      type: 'rated',
      category: 'Dynamic Programming',
      createdBy: 'Admin',
      registrations: 89
    }
  ];

  const stats = {
    total: 15,
    ongoing: 2,
    upcoming: 5,
    completed: 8,
    totalParticipants: 1234,
    averageParticipation: 82
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'hard': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ongoing': return 'bg-green-100 text-green-800 border-green-300';
      case 'upcoming': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'past': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCreateCompetition = async (e) => {
    e.preventDefault();
    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }
    // TODO: API call to create competition with problems
    const competitionData = {
      ...formData,
      problems: problems
    };
    console.log('Creating competition:', competitionData);
    toast.success('Competition created successfully!');
    setShowCreateModal(false);
    resetForm();
  };

  const handleDeleteCompetition = async (id) => {
    if (window.confirm('Are you sure you want to delete this competition?')) {
      // TODO: API call to delete
      toast.success('Competition deleted successfully!');
    }
  };

  const addProblem = () => {
    if (!currentProblem.title || !currentProblem.description) {
      toast.error('Please fill problem title and description');
      return;
    }
    if (currentProblem.testCases.length === 0 || !currentProblem.testCases[0].input) {
      toast.error('Please add at least one test case');
      return;
    }
    setProblems([...problems, { ...currentProblem, id: problems.length + 1 }]);
    setCurrentProblem({
      title: '',
      description: '',
      difficulty: 'medium',
      points: 100,
      constraints: [''],
      examples: [{ input: '', output: '', explanation: '' }],
      testCases: [{ input: '', output: '', hidden: false }]
    });
    toast.success('Problem added!');
  };

  const removeProblem = (index) => {
    setProblems(problems.filter((_, i) => i !== index));
  };

  const addConstraint = () => {
    setCurrentProblem({
      ...currentProblem,
      constraints: [...currentProblem.constraints, '']
    });
  };

  const updateConstraint = (index, value) => {
    const newConstraints = [...currentProblem.constraints];
    newConstraints[index] = value;
    setCurrentProblem({ ...currentProblem, constraints: newConstraints });
  };

  const removeConstraint = (index) => {
    setCurrentProblem({
      ...currentProblem,
      constraints: currentProblem.constraints.filter((_, i) => i !== index)
    });
  };

  const addExample = () => {
    setCurrentProblem({
      ...currentProblem,
      examples: [...currentProblem.examples, { input: '', output: '', explanation: '' }]
    });
  };

  const updateExample = (index, field, value) => {
    const newExamples = [...currentProblem.examples];
    newExamples[index][field] = value;
    setCurrentProblem({ ...currentProblem, examples: newExamples });
  };

  const removeExample = (index) => {
    setCurrentProblem({
      ...currentProblem,
      examples: currentProblem.examples.filter((_, i) => i !== index)
    });
  };

  const addTestCase = () => {
    setCurrentProblem({
      ...currentProblem,
      testCases: [...currentProblem.testCases, { input: '', output: '', hidden: false }]
    });
  };

  const updateTestCase = (index, field, value) => {
    const newTestCases = [...currentProblem.testCases];
    newTestCases[index][field] = value;
    setCurrentProblem({ ...currentProblem, testCases: newTestCases });
  };

  const removeTestCase = (index) => {
    setCurrentProblem({
      ...currentProblem,
      testCases: currentProblem.testCases.filter((_, i) => i !== index)
    });
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      title: '',
      description: '',
      difficulty: 'medium',
      startTime: '',
      endTime: '',
      duration: 180,
      prize: '',
      category: '',
      type: 'rated'
    });
    setProblems([]);
    setCurrentProblem({
      title: '',
      description: '',
      difficulty: 'medium',
      points: 100,
      constraints: [''],
      examples: [{ input: '', output: '', explanation: '' }],
      testCases: [{ input: '', output: '', hidden: false }]
    });
  };

  const filteredCompetitions = competitions
    .filter(comp => activeTab === 'all' || comp.status === activeTab)
    .filter(comp => 
      comp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Competition Management</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="w-8 h-8 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            <p className="text-sm text-gray-600">Total Contests</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.ongoing}</p>
            <p className="text-sm text-gray-600">Ongoing</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.upcoming}</p>
            <p className="text-sm text-gray-600">Upcoming</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Medal className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.completed}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.totalParticipants}</p>
            <p className="text-sm text-gray-600">Total Participants</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.averageParticipation}%</p>
            <p className="text-sm text-gray-600">Avg. Participation</p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search competitions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('ongoing')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === 'ongoing'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Ongoing
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === 'upcoming'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Upcoming
              </button>
            </div>

            {/* Create Button */}
            {userDetails?.role === 'superadmin' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus className="w-5 h-5" />
                Create Competition
              </button>
            )}
          </div>
        </div>

        {/* Competitions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Competition
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prize
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCompetitions.map((competition) => (
                  <tr key={competition.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{competition.title}</div>
                        <div className="text-sm text-gray-500">{competition.category}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(competition.status)}`}>
                        {competition.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getDifficultyColor(competition.difficulty)}`}>
                        {competition.difficulty.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>{formatDateTime(competition.startTime)}</div>
                      <div className="text-xs text-gray-400">to {formatDateTime(competition.endTime)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{competition.participants}</span>
                        <span className="text-xs text-gray-500">/ {competition.registrations} reg.</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-yellow-600">
                      {competition.prize}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {userDetails?.role === 'superadmin' && (
                          <button
                            onClick={() => handleDeleteCompetition(competition.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCompetitions.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No competitions found</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Competition Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-5xl w-full p-6 my-8 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Create New Competition</h2>
                <div className="flex items-center gap-4 mt-2">
                  <div className={`flex items-center gap-2 ${currentStep === 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                      1
                    </div>
                    <span className="text-sm font-medium">Basic Info</span>
                  </div>
                  <div className="w-12 h-0.5 bg-gray-300"></div>
                  <div className={`flex items-center gap-2 ${currentStep === 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                      2
                    </div>
                    <span className="text-sm font-medium">Add Problems</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCompetition}>
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      rows="3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="e.g., Algorithm, DP, etc."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                      <select
                        value={formData.difficulty}
                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                      <input
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                      <input
                        type="datetime-local"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Duration (min)</label>
                      <input
                        type="number"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="rated">Rated</option>
                        <option value="practice">Practice</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prize</label>
                    <input
                      type="text"
                      value={formData.prize}
                      onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="e.g., ₹5000 or Certificates"
                      required
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
                    >
                      Next: Add Problems
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        resetForm();
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Add Problems */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  {/* Added Problems List */}
                  {problems.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-3">Added Problems ({problems.length})</h3>
                      <div className="space-y-2">
                        {problems.map((problem, index) => (
                          <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">{index + 1}. {problem.title}</p>
                              <p className="text-sm text-gray-600">
                                {problem.difficulty} • {problem.points} points • {problem.testCases.length} test cases
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeProblem(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Current Problem Form */}
                  <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-4">Add New Problem</h3>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Problem Title *</label>
                          <input
                            type="text"
                            value={currentProblem.title}
                            onChange={(e) => setCurrentProblem({ ...currentProblem, title: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="e.g., Two Sum"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Points *</label>
                          <input
                            type="number"
                            value={currentProblem.points}
                            onChange={(e) => setCurrentProblem({ ...currentProblem, points: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Problem Description *</label>
                        <textarea
                          value={currentProblem.description}
                          onChange={(e) => setCurrentProblem({ ...currentProblem, description: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          rows="4"
                          placeholder="Describe the problem statement..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                        <select
                          value={currentProblem.difficulty}
                          onChange={(e) => setCurrentProblem({ ...currentProblem, difficulty: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>

                      {/* Constraints */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">Constraints</label>
                          <button
                            type="button"
                            onClick={addConstraint}
                            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" /> Add Constraint
                          </button>
                        </div>
                        {currentProblem.constraints.map((constraint, index) => (
                          <div key={index} className="flex items-center gap-2 mb-2">
                            <input
                              type="text"
                              value={constraint}
                              onChange={(e) => updateConstraint(index, e.target.value)}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                              placeholder="e.g., 1 <= nums.length <= 10^4"
                            />
                            {currentProblem.constraints.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeConstraint(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Examples */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">Examples</label>
                          <button
                            type="button"
                            onClick={addExample}
                            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" /> Add Example
                          </button>
                        </div>
                        {currentProblem.examples.map((example, index) => (
                          <div key={index} className="border border-gray-300 p-3 rounded-lg mb-2">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">Example {index + 1}</span>
                              {currentProblem.examples.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeExample(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={example.input}
                                onChange={(e) => updateExample(index, 'input', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                                placeholder="Input: nums = [2,7,11,15], target = 9"
                              />
                              <input
                                type="text"
                                value={example.output}
                                onChange={(e) => updateExample(index, 'output', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                                placeholder="Output: [0,1]"
                              />
                              <input
                                type="text"
                                value={example.explanation}
                                onChange={(e) => updateExample(index, 'explanation', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                                placeholder="Explanation (optional)"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Test Cases */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">Test Cases *</label>
                          <button
                            type="button"
                            onClick={addTestCase}
                            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" /> Add Test Case
                          </button>
                        </div>
                        {currentProblem.testCases.map((testCase, index) => (
                          <div key={index} className="border border-gray-300 p-3 rounded-lg mb-2 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">Test Case {index + 1}</span>
                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={testCase.hidden}
                                    onChange={(e) => updateTestCase(index, 'hidden', e.target.checked)}
                                    className="rounded"
                                  />
                                  <span className="text-gray-600">Hidden</span>
                                </label>
                                {currentProblem.testCases.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeTestCase(index)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <textarea
                                value={testCase.input}
                                onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-mono"
                                placeholder="Input"
                                rows="2"
                              />
                              <textarea
                                value={testCase.output}
                                onChange={(e) => updateTestCase(index, 'output', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-mono"
                                placeholder="Expected Output"
                                rows="2"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={addProblem}
                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        Add This Problem
                      </button>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={problems.length === 0}
                      className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create Competition ({problems.length} problems)
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitionManager;
