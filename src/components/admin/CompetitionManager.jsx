import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Trophy, Plus, Edit, Trash2, Eye, 
  Calendar, Clock, Users, Target, Award, Search,
  Filter, Download, Upload, BarChart3, Medal, FileText, ShieldAlert, Code
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import competitionService from '../../services/competitionService';
import { hasPermission, getPermissionDeniedMessage } from '../../utils/permissions';
import toast from 'react-hot-toast';
import Loading from '../shared/Loading';

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
    testCases: [{ input: '', output: '', hidden: false }],
    // LeetCode-style function signature
    functionName: 'solution',
    returnType: 'int',
    parameters: [{ name: 'nums', type: 'int[]' }]
  });
  const [competitions, setCompetitions] = useState([]);

  // Generate starter code templates for each language based on function signature
  const generateStarterCode = (problem) => {
    const { functionName, returnType, parameters } = problem;
    
    // Map types to different languages
    const typeMapping = {
      java: {
        'int': 'int',
        'int[]': 'int[]',
        'int[][]': 'int[][]',
        'string': 'String',
        'string[]': 'String[]',
        'boolean': 'boolean',
        'double': 'double',
        'float': 'float',
        'long': 'long',
        'List<Integer>': 'List<Integer>',
        'List<String>': 'List<String>',
        'List<List<Integer>>': 'List<List<Integer>>'
      },
      cpp: {
        'int': 'int',
        'int[]': 'vector<int>',
        'int[][]': 'vector<vector<int>>',
        'string': 'string',
        'string[]': 'vector<string>',
        'boolean': 'bool',
        'double': 'double',
        'float': 'float',
        'long': 'long long',
        'List<Integer>': 'vector<int>',
        'List<String>': 'vector<string>',
        'List<List<Integer>>': 'vector<vector<int>>'
      },
      python: {
        'int': 'int',
        'int[]': 'List[int]',
        'int[][]': 'List[List[int]]',
        'string': 'str',
        'string[]': 'List[str]',
        'boolean': 'bool',
        'double': 'float',
        'float': 'float',
        'long': 'int',
        'List<Integer>': 'List[int]',
        'List<String>': 'List[str]',
        'List<List<Integer>>': 'List[List[int]]'
      }
    };

    const getType = (lang, type) => typeMapping[lang]?.[type] || type;

    // Java starter code
    const javaParams = parameters.map(p => `${getType('java', p.type)} ${p.name}`).join(', ');
    const javaCode = `class Solution {
    public ${getType('java', returnType)} ${functionName}(${javaParams}) {
        // Write your solution here
        
    }
}`;

    // C++ starter code
    const cppParams = parameters.map(p => `${getType('cpp', p.type)}& ${p.name}`).join(', ');
    const cppCode = `class Solution {
public:
    ${getType('cpp', returnType)} ${functionName}(${cppParams}) {
        // Write your solution here
        
    }
};`;

    // Python starter code
    const pythonParams = parameters.map(p => `${p.name}: ${getType('python', p.type)}`).join(', ');
    const pythonReturnType = getType('python', returnType);
    const pythonCode = `class Solution:
    def ${functionName}(self, ${pythonParams}) -> ${pythonReturnType}:
        # Write your solution here
        pass`;

    return {
      java: javaCode,
      cpp: cppCode,
      python: pythonCode
    };
  };

  // Check permissions (use manageCompetitions permission)
  const canManageCompetitions = hasPermission(userDetails, 'manageCompetitions');
  const [loading, setLoading] = useState(true);
  const [viewCompetition, setViewCompetition] = useState(null);
  const [editCompetition, setEditCompetition] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    fetchCompetitions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const filters = activeTab !== 'all' ? { status: activeTab } : {};
      const data = await competitionService.getAllCompetitions(filters);
      setCompetitions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching competitions:', error);
      toast.error('Failed to load competitions');
      setCompetitions([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Remove static data - now fetched from API
  const _staticCompetitions = [
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

  // Calculate stats from actual competitions data
  const stats = {
    total: competitions.length,
    ongoing: competitions.filter(c => c.status === 'ongoing').length,
    upcoming: competitions.filter(c => c.status === 'upcoming').length,
    completed: competitions.filter(c => c.status === 'past').length,
    totalParticipants: competitions.reduce((sum, c) => sum + (c.participantCount || 0), 0),
    averageParticipation: competitions.length > 0 
      ? Math.round((competitions.reduce((sum, c) => sum + (c.participantCount || 0), 0) / competitions.length))
      : 0
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

    try {
      const competitionData = {
        ...formData,
        problems: problems
      };
      
      await competitionService.createCompetition(competitionData);
      toast.success('Competition created successfully!');
      setShowCreateModal(false);
      resetForm();
      fetchCompetitions(); // Refresh list
    } catch (error) {
      console.error('Error creating competition:', error);
      toast.error(error.response?.data?.error || 'Failed to create competition');
    }
  };

  const handleDeleteCompetition = async (id) => {
    if (window.confirm('Are you sure you want to delete this competition?')) {
      try {
        await competitionService.deleteCompetition(id);
        toast.success('Competition deleted successfully!');
        fetchCompetitions(); // Refresh list
      } catch (error) {
        console.error('Error deleting competition:', error);
        toast.error(error.response?.data?.error || 'Failed to delete competition');
      }
    }
  };

  const handleViewCompetition = async (id) => {
    try {
      const data = await competitionService.getCompetition(id);
      setViewCompetition(data);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error fetching competition details:', error);
      toast.error('Failed to load competition details');
    }
  };

  const handleViewSubmissions = async (id) => {
    try {
      const data = await competitionService.getCompetitionSubmissions(id);
      setSubmissions(Array.isArray(data) ? data : []);
      setViewCompetition(await competitionService.getCompetition(id));
      setShowSubmissionsModal(true);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load submissions');
    }
  };

  const handleEditCompetition = async (id) => {
    try {
      const data = await competitionService.getCompetition(id);
      setEditCompetition(data);
      setFormData({
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        startTime: data.startTime,
        endTime: data.endTime,
        duration: data.duration,
        prize: data.prizePool || data.prize || '',
        category: data.category,
        type: data.type || 'rated'
      });
      setProblems(data.problems || []);
      setShowEditModal(true);
    } catch (error) {
      console.error('Error fetching competition for edit:', error);
      toast.error('Failed to load competition for editing');
    }
  };

  const handleUpdateCompetition = async () => {
    if (!formData.title || !formData.description) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const competitionData = {
        ...formData,
        problems: problems.map((p, index) => ({
          ...p,
          orderIndex: index
        }))
      };

      await competitionService.updateCompetition(editCompetition.id, competitionData);
      toast.success('Competition updated successfully!');
      setShowEditModal(false);
      setEditCompetition(null);
      fetchCompetitions();
    } catch (error) {
      console.error('Error updating competition:', error);
      toast.error(error.response?.data?.error || 'Failed to update competition');
    }
  };

  const addProblem = () => {
    if (!currentProblem.title || !currentProblem.description) {
      toast.error('Please fill problem title and description');
      return;
    }
    if (currentProblem.testCases.length === 0 || !currentProblem.testCases[0].input) {
      toast.error('Please add at least one test case with input');
      return;
    }
    if (!currentProblem.functionName) {
      toast.error('Please provide a function name');
      return;
    }
    
    // Validate all parameters have names
    const validParams = currentProblem.parameters.filter(p => p.name && p.type);
    if (validParams.length === 0) {
      toast.error('Please add at least one function parameter with a name');
      return;
    }
    
    // Validate all test cases have both input and output
    const emptyOutputCases = currentProblem.testCases.filter(tc => tc.input && !tc.output.trim());
    if (emptyOutputCases.length > 0) {
      toast.error(`${emptyOutputCases.length} test case(s) missing expected output — Judge0 needs output to compare`);
      return;
    }
    
    // Validate test case input formats
    let hasFormatError = false;
    for (let i = 0; i < currentProblem.testCases.length; i++) {
      const tc = currentProblem.testCases[i];
      const inputCheck = validateTestCaseInput(tc.input);
      if (!inputCheck.valid) {
        toast.error(`Test Case ${i + 1} input error: ${inputCheck.message}`);
        hasFormatError = true;
        break;
      }
      const outputCheck = validateTestCaseOutput(tc.output);
      if (!outputCheck.valid) {
        toast.error(`Test Case ${i + 1} output warning: ${outputCheck.message}`);
        hasFormatError = true;
        break;
      }
    }
    if (hasFormatError) return;
    
    // Generate starter code for all supported languages
    const starterCode = generateStarterCode(currentProblem);
    
    const problemWithStarterCode = {
      ...currentProblem,
      id: problems.length + 1,
      starterCode,
      // Ensure parameters are properly formatted
      parameters: validParams
    };
    
    setProblems([...problems, problemWithStarterCode]);
    setCurrentProblem({
      title: '',
      description: '',
      difficulty: 'medium',
      points: 100,
      constraints: [''],
      examples: [{ input: '', output: '', explanation: '' }],
      testCases: [{ input: '', output: '', hidden: false }],
      functionName: 'solution',
      returnType: 'int',
      parameters: [{ name: 'nums', type: 'int[]' }]
    });
    toast.success('Problem added with code templates!');
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

  // Parameter management functions for function signature
  const addParameter = () => {
    setCurrentProblem({
      ...currentProblem,
      parameters: [...currentProblem.parameters, { name: '', type: 'int' }]
    });
  };

  const updateParameter = (index, field, value) => {
    const newParams = [...currentProblem.parameters];
    newParams[index][field] = value;
    setCurrentProblem({ ...currentProblem, parameters: newParams });
  };

  const removeParameter = (index) => {
    if (currentProblem.parameters.length > 1) {
      setCurrentProblem({
        ...currentProblem,
        parameters: currentProblem.parameters.filter((_, i) => i !== index)
      });
    }
  };

  // Common parameter types for dropdown
  const parameterTypes = [
    'int',
    'int[]',
    'int[][]',
    'string',
    'string[]',
    'boolean',
    'double',
    'float',
    'long',
    'List<Integer>',
    'List<String>',
    'List<List<Integer>>'
  ];

  // ═══════════════════════════════════════════════════════════════════════
  // FORMAT GUIDE HELPERS — Shows admin exactly what Judge0 expects
  // ═══════════════════════════════════════════════════════════════════════

  // Get example input format for a parameter type
  const getInputFormatHint = (type) => {
    const hints = {
      'int': '5',
      'int[]': '[1,2,3,4,5]',
      'int[][]': '[[1,2],[3,4],[5,6]]',
      'string': 'hello',
      'string[]': '["abc","def","ghi"]',
      'boolean': 'true',
      'double': '3.14',
      'float': '2.5',
      'long': '999999999',
      'List<Integer>': '[1,2,3,4,5]',
      'List<String>': '["abc","def"]',
      'List<List<Integer>>': '[[1,2],[3,4]]'
    };
    return hints[type] || '...';
  };

  // Get example output format based on return type
  const getOutputFormatHint = (returnType) => {
    const hints = {
      'int': '42',
      'int[]': '[1,2,3]  (no spaces!)',
      'int[][]': '[[1,2],[3,4]]  (no spaces!)',
      'string': 'hello  (no quotes)',
      'string[]': '["abc","def"]',
      'boolean': 'true  (lowercase)',
      'double': '3.14',
      'float': '2.5',
      'long': '999999999',
      'List<Integer>': '[1,2,3]  (no spaces!)',
      'List<String>': '["abc","def"]',
      'List<List<Integer>>': '[[1,2],[3,4]]  (no spaces!)'
    };
    return hints[returnType] || '...';
  };

  // Generate the full input format string from current parameters
  const getFullInputFormat = () => {
    const params = currentProblem.parameters.filter(p => p.name && p.type);
    if (params.length === 0) return '';
    return params.map(p => `${getInputFormatHint(p.type)}`).join(', ');
  };

  // Validate a test case input against parameters
  const validateTestCaseInput = (inputStr) => {
    const params = currentProblem.parameters.filter(p => p.name && p.type);
    if (!inputStr || params.length === 0) return { valid: true, message: '' };
    
    const errors = [];
    let remaining = inputStr.trim();
    
    for (let i = 0; i < params.length; i++) {
      const param = params[i];
      const isArray = param.type.includes('[]') || param.type.includes('List');
      
      if (!remaining && i < params.length) {
        errors.push(`Missing value for parameter "${param.name}" (${param.type})`);
        break;
      }
      
      if (isArray) {
        // Check for opening bracket
        if (remaining.match(/^\s*\[/)) {
          let depth = 0;
          let endIndex = -1;
          for (let j = 0; j < remaining.length; j++) {
            if (remaining[j] === '[') depth++;
            if (remaining[j] === ']') depth--;
            if (depth === 0 && remaining[j] === ']') { endIndex = j; break; }
          }
          if (endIndex === -1) {
            errors.push(`Unmatched brackets for "${param.name}" — close all [ with ]`);
            break;
          }
          // Validate it's valid JSON
          const arrayStr = remaining.substring(0, endIndex + 1);
          try { JSON.parse(arrayStr); } catch { errors.push(`Invalid array for "${param.name}": ${arrayStr}`); }
          remaining = remaining.substring(endIndex + 1).replace(/^\s*,?\s*/, '');
        } else {
          errors.push(`Expected array [..] for "${param.name}" (${param.type}), got: ${remaining.substring(0, 20)}`);
          break;
        }
      } else {
        // Non-array: take until next comma (or end)
        const commaIdx = remaining.indexOf(',');
        let value;
        if (commaIdx > -1 && i < params.length - 1) {
          value = remaining.substring(0, commaIdx).trim();
          remaining = remaining.substring(commaIdx + 1).trim();
        } else {
          value = remaining.trim();
          remaining = '';
        }
        
        // Type-specific validation
        if ((param.type === 'int' || param.type === 'long') && isNaN(parseInt(value))) {
          errors.push(`"${param.name}" should be a number, got: "${value}"`);
        }
        if ((param.type === 'double' || param.type === 'float') && isNaN(parseFloat(value))) {
          errors.push(`"${param.name}" should be a decimal number, got: "${value}"`);
        }
        if (param.type === 'boolean' && !['true', 'false'].includes(value.toLowerCase())) {
          errors.push(`"${param.name}" should be true or false, got: "${value}"`);
        }
      }
    }
    
    if (remaining.trim() && errors.length === 0) {
      errors.push(`Extra values after all parameters: "${remaining.trim()}"`);
    }
    
    return { valid: errors.length === 0, message: errors.join('; ') };
  };

  // Validate output format
  const validateTestCaseOutput = (outputStr) => {
    const returnType = currentProblem.returnType;
    if (!outputStr) return { valid: true, message: '' };
    
    const trimmed = outputStr.trim();
    const warnings = [];
    
    // Check for common mistakes
    if (trimmed !== outputStr) {
      warnings.push('Leading/trailing whitespace will be trimmed');
    }
    
    if ((returnType.includes('[]') || returnType.includes('List')) && trimmed.startsWith('[')) {
      // Check no spaces after commas in arrays
      if (trimmed.includes(', ')) {
        warnings.push('⚠️ SPACES IN ARRAY — Judge0 output has NO spaces: [1,2,3] not [1, 2, 3]');
      }
      // Validate it's valid JSON
      try { JSON.parse(trimmed); } catch { warnings.push('Invalid JSON array format'); }
    }
    
    if (returnType === 'boolean' || returnType === 'bool') {
      if (trimmed === 'True' || trimmed === 'False') {
        warnings.push('⚠️ Must be lowercase: true/false, not True/False');
      }
    }
    
    return { valid: warnings.filter(w => w.startsWith('⚠️')).length === 0, message: warnings.join('; ') };
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
      testCases: [{ input: '', output: '', hidden: false }],
      functionName: 'solution',
      returnType: 'int',
      parameters: [{ name: 'nums', type: 'int[]' }]
    });
  };

  const filteredCompetitions = (competitions || [])
    .filter(comp => activeTab === 'all' || comp.status === activeTab)
    .filter(comp => 
      comp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (loading) {
    return <Loading />;
  }

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
        {/* Access Denied Screen */}
        {!canManageCompetitions ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldAlert className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Access Denied</h2>
              <p className="text-gray-600 mb-6">
                You don't have permission to manage competitions. Contact your administrator to request access.
              </p>
              <Link
                to="/admin/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <>
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
            {canManageCompetitions && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
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
                        <span className="text-sm text-gray-900">{competition.participantCount}</span>
                        <span className="text-xs text-gray-500">/ {competition.participantCount} reg.</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-yellow-600">
                      {competition.prize}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewCompetition(competition.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/admin/competitions/${competition.id}/evaluate`}
                          className="text-green-600 hover:text-green-900"
                          title="Evaluate Submissions"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleViewSubmissions(competition.id)}
                          className="text-purple-600 hover:text-purple-900"
                          title="View Submissions"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditCompetition(competition.id)}
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
          </>
        )}
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

                      {/* Function Signature - LeetCode Style */}
                      <div className="border-2 border-indigo-200 bg-indigo-50 p-4 rounded-lg">
                        <h4 className="text-sm font-semibold text-indigo-800 mb-4 flex items-center gap-2">
                          <Code className="w-4 h-4" />
                          Function Signature (LeetCode Style)
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Function Name *</label>
                            <input
                              type="text"
                              value={currentProblem.functionName}
                              onChange={(e) => setCurrentProblem({ ...currentProblem, functionName: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-mono"
                              placeholder="e.g., twoSum"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Return Type *</label>
                            <select
                              value={currentProblem.returnType}
                              onChange={(e) => setCurrentProblem({ ...currentProblem, returnType: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                            >
                              {parameterTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Parameters */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">Function Parameters</label>
                            <button
                              type="button"
                              onClick={addParameter}
                              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                            >
                              <Plus className="w-4 h-4" /> Add Parameter
                            </button>
                          </div>
                          {currentProblem.parameters.map((param, index) => (
                            <div key={index} className="flex items-center gap-2 mb-2">
                              <input
                                type="text"
                                value={param.name}
                                onChange={(e) => updateParameter(index, 'name', e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-mono"
                                placeholder="Parameter name (e.g., nums)"
                              />
                              <select
                                value={param.type}
                                onChange={(e) => updateParameter(index, 'type', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                              >
                                {parameterTypes.map(type => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                              {currentProblem.parameters.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeParameter(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Preview */}
                        <div className="mt-4 pt-4 border-t border-indigo-200">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Student Sees (Starter Code)</label>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <span className="text-xs text-gray-500 block mb-1">Java</span>
                              <pre className="bg-gray-900 text-green-400 p-2 rounded text-xs font-mono overflow-x-auto">
{`class Solution {
  public ${currentProblem.returnType} ${currentProblem.functionName}(${currentProblem.parameters.map(p => `${p.type} ${p.name}`).join(', ')}) {
    // code here
  }
}`}
                              </pre>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 block mb-1">Python</span>
                              <pre className="bg-gray-900 text-green-400 p-2 rounded text-xs font-mono overflow-x-auto">
{`class Solution:
  def ${currentProblem.functionName}(self, ${currentProblem.parameters.map(p => p.name).join(', ')}):
    # code here
    pass`}
                              </pre>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 block mb-1">C++</span>
                              <pre className="bg-gray-900 text-green-400 p-2 rounded text-xs font-mono overflow-x-auto">
{`class Solution {
public:
  ${currentProblem.returnType} ${currentProblem.functionName}(${currentProblem.parameters.map(p => `${p.type}& ${p.name}`).join(', ')}) {
    // code here
  }
};`}
                              </pre>
                            </div>
                          </div>
                        </div>

                        {/* Execution simulation */}
                        <div className="mt-3 pt-3 border-t border-indigo-200">
                          <label className="block text-sm font-medium text-gray-700 mb-2">🔬 How Judge0 Runs It (Python example with Test Case 1)</label>
                          <pre className="bg-gray-900 text-amber-300 p-3 rounded text-xs font-mono overflow-x-auto whitespace-pre">
{(() => {
  const params = currentProblem.parameters.filter(p => p.name && p.type);
  const tc1 = currentProblem.testCases[0];
  const inputStr = tc1?.input || getFullInputFormat();
  // Simulate parsing
  const lines = [];
  lines.push(`sol = Solution()`);
  lines.push(``);
  lines.push(`# System auto-parses your test case input: "${inputStr}"`);
  params.forEach((p, i) => {
    lines.push(`${p.name} = ${getInputFormatHint(p.type)}  # from input`);
  });
  lines.push(``);
  lines.push(`result = sol.${currentProblem.functionName}(${params.map(p => p.name).join(', ')})`);
  lines.push(`print(result)  # must equal → ${tc1?.output || getOutputFormatHint(currentProblem.returnType).split('  ')[0]}`);
  return lines.join('\n');
})()}
                          </pre>
                        </div>
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

                        {/* ═══ FORMAT GUIDE BOX ═══ */}
                        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 mb-3">
                          <h5 className="text-xs font-bold text-amber-800 mb-2 uppercase tracking-wide">⚡ Judge0 Format Guide — Read This!</h5>
                          
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            {/* INPUT FORMAT */}
                            <div>
                              <p className="font-semibold text-amber-900 mb-1">INPUT FORMAT:</p>
                              <p className="text-amber-800 mb-1">Values in order matching parameters, comma-separated:</p>
                              <div className="bg-white rounded p-2 font-mono text-amber-900 border border-amber-200 space-y-0.5">
                                {currentProblem.parameters.filter(p => p.name && p.type).map((p, i) => (
                                  <div key={i}>
                                    <span className="text-gray-500">{p.name}</span>
                                    <span className="text-gray-400"> ({p.type}): </span>
                                    <span className="text-green-700 font-semibold">{getInputFormatHint(p.type)}</span>
                                  </div>
                                ))}
                                <div className="border-t border-amber-200 pt-1 mt-1">
                                  <span className="text-gray-500">Full input: </span>
                                  <span className="text-blue-700 font-bold">{getFullInputFormat()}</span>
                                </div>
                              </div>
                            </div>

                            {/* OUTPUT FORMAT */}
                            <div>
                              <p className="font-semibold text-amber-900 mb-1">OUTPUT FORMAT (return type: <code className="bg-amber-100 px-1 rounded">{currentProblem.returnType}</code>):</p>
                              <div className="bg-white rounded p-2 font-mono text-amber-900 border border-amber-200 space-y-0.5">
                                <div>
                                  <span className="text-gray-500">Example: </span>
                                  <span className="text-green-700 font-semibold">{getOutputFormatHint(currentProblem.returnType)}</span>
                                </div>
                              </div>
                              <div className="mt-2 space-y-1 text-amber-800">
                                <p>🔴 <strong>EXACT match</strong> — stdout must equal expected output</p>
                                <p>🔴 Arrays: <code className="bg-amber-100 px-1 rounded">[1,2,3]</code> NOT <code className="bg-red-100 px-1 rounded line-through">[1, 2, 3]</code></p>
                                <p>🔴 Boolean: <code className="bg-amber-100 px-1 rounded">true</code> NOT <code className="bg-red-100 px-1 rounded line-through">True</code></p>
                                <p>🔴 String: <code className="bg-amber-100 px-1 rounded">hello</code> NOT <code className="bg-red-100 px-1 rounded line-through">"hello"</code></p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {currentProblem.testCases.map((testCase, index) => {
                          const inputValidation = validateTestCaseInput(testCase.input);
                          const outputValidation = validateTestCaseOutput(testCase.output);
                          return (
                          <div key={index} className={`border p-3 rounded-lg mb-2 ${
                            testCase.input && testCase.output 
                              ? (inputValidation.valid && outputValidation.valid ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50') 
                              : 'border-gray-300 bg-gray-50'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                Test Case {index + 1}
                                {testCase.input && testCase.output && inputValidation.valid && outputValidation.valid && 
                                  <span className="ml-2 text-green-600 text-xs">✅ Valid</span>
                                }
                                {testCase.input && !inputValidation.valid && 
                                  <span className="ml-2 text-red-600 text-xs">❌ Input error</span>
                                }
                                {testCase.output && !outputValidation.valid && 
                                  <span className="ml-2 text-orange-600 text-xs">⚠️ Output warning</span>
                                }
                              </span>
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
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">
                                  Input — {currentProblem.parameters.filter(p=>p.name).map(p => `${p.name}(${p.type})`).join(', ')}
                                </label>
                                <textarea
                                  value={testCase.input}
                                  onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                                  className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-mono ${
                                    testCase.input && !inputValidation.valid ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                  }`}
                                  placeholder={getFullInputFormat() || 'Input'}
                                  rows="2"
                                />
                                {testCase.input && !inputValidation.valid && (
                                  <p className="text-xs text-red-600 mt-1">❌ {inputValidation.message}</p>
                                )}
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">
                                  Expected Output — returns {currentProblem.returnType}
                                </label>
                                <textarea
                                  value={testCase.output}
                                  onChange={(e) => updateTestCase(index, 'output', e.target.value)}
                                  className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-mono ${
                                    testCase.output && !outputValidation.valid ? 'border-orange-400 bg-orange-50' : 'border-gray-300'
                                  }`}
                                  placeholder={getOutputFormatHint(currentProblem.returnType)?.split('  ')[0] || 'Expected Output'}
                                  rows="2"
                                />
                                {testCase.output && outputValidation.message && (
                                  <p className={`text-xs mt-1 ${outputValidation.valid ? 'text-amber-600' : 'text-red-600'}`}>
                                    {outputValidation.message}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          );
                        })}
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

      {/* View Competition Modal */}
      {showViewModal && viewCompetition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 my-8 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">{viewCompetition.title}</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Competition Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <p className="text-gray-900 capitalize">{viewCompetition.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Difficulty</label>
                  <p className="text-gray-900 capitalize">{viewCompetition.difficulty}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Category</label>
                  <p className="text-gray-900">{viewCompetition.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Prize Pool</label>
                  <p className="text-gray-900">{viewCompetition.prizePool || viewCompetition.prize}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Start Time</label>
                  <p className="text-gray-900">{new Date(viewCompetition.startTime).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">End Time</label>
                  <p className="text-gray-900">{new Date(viewCompetition.endTime).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Participants</label>
                  <p className="text-gray-900">{viewCompetition.participantCount || 0}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Problems</label>
                  <p className="text-gray-900">{viewCompetition.problems?.length || 0}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-2">Description</label>
                <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{viewCompetition.description}</p>
              </div>

              {/* Problems List */}
              {viewCompetition.problems && viewCompetition.problems.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Problems ({viewCompetition.problems.length})</h3>
                  <div className="space-y-3">
                    {viewCompetition.problems.map((problem, index) => (
                      <div key={problem.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {index + 1}. {problem.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">{problem.description?.substring(0, 150)}...</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className={`text-xs px-2 py-1 rounded ${
                                problem.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                problem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {problem.difficulty}
                              </span>
                              <span className="text-xs text-gray-600">{problem.points} points</span>
                              <span className="text-xs text-gray-600">{problem.testCases?.length || 0} test cases</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEditCompetition(viewCompetition.id);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit Competition
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Competition Modal */}
      {showEditModal && editCompetition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-5xl w-full p-6 my-8 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Edit Competition</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditCompetition(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Competition Title"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Competition Description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Algorithm, Data Structures"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prize Pool</label>
                  <input
                    type="text"
                    value={formData.prize}
                    onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., ₹5000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="rated">Rated</option>
                    <option value="unrated">Unrated</option>
                  </select>
                </div>
              </div>

              {/* Problems Preview */}
              {problems.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Problems ({problems.length})</h3>
                  <div className="space-y-2">
                    {problems.map((problem, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900">{problem.title}</span>
                          <span className="ml-3 text-sm text-gray-600 capitalize">({problem.difficulty})</span>
                        </div>
                        <span className="text-sm text-gray-600">{problem.points} points</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditCompetition(null);
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateCompetition}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Update Competition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {showSubmissionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-6xl w-full p-6 my-8 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Submissions - {viewCompetition?.title}</h2>
                <p className="text-sm text-gray-600 mt-1">{submissions.length} total submissions</p>
              </div>
              <button
                onClick={() => {
                  setShowSubmissionsModal(false);
                  setSelectedSubmission(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {submissions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No submissions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div key={submission.submissionId} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium text-gray-900">{submission.userName}</p>
                          <p className="text-sm text-gray-600">Roll: {submission.rollNo} | Batch: {submission.batch}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          submission.status === 'completed' ? 'bg-green-100 text-green-800' :
                          submission.status === 'judging' ? 'bg-blue-100 text-blue-800' :
                          submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {submission.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-xs text-gray-600">Score</p>
                          <p className="text-lg font-bold text-gray-900">{submission.totalScore || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Time</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {submission.totalTime ? `${(submission.totalTime / 1000).toFixed(2)}s` : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Submitted</p>
                          <p className="text-xs text-gray-900">
                            {new Date(submission.submittedAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedSubmission(
                            selectedSubmission?.submissionId === submission.submissionId ? null : submission
                          )}
                          className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                        >
                          {selectedSubmission?.submissionId === submission.submissionId ? 'Hide' : 'View Code'}
                        </button>
                      </div>
                    </div>

                    {/* Problem-wise submissions */}
                    {selectedSubmission?.submissionId === submission.submissionId && (
                      <div className="p-4 bg-white space-y-4">
                        {submission.problemSubmissions.map((ps, idx) => (
                          <div key={idx} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-medium text-gray-900">{ps.problemTitle}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    ps.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                    ps.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {ps.difficulty}
                                  </span>
                                  <span className="text-xs text-gray-600">{ps.language}</span>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    ps.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                    ps.status === 'wrong-answer' ? 'bg-red-100 text-red-800' :
                                    ps.status === 'judging' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {ps.status}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-600">Score</p>
                                <p className="text-lg font-bold text-gray-900">{ps.score}/{ps.maxScore}</p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {ps.testsPassed}/{ps.totalTests} tests passed
                                </p>
                              </div>
                            </div>

                            {/* Code Display */}
                            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                              <pre className="text-sm text-gray-100 font-mono whitespace-pre-wrap">
                                {ps.code}
                              </pre>
                            </div>

                            {ps.errorMessage && (
                              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                                <p className="text-sm text-red-800 font-medium">Error:</p>
                                <pre className="text-xs text-red-700 mt-1 whitespace-pre-wrap">{ps.errorMessage}</pre>
                              </div>
                            )}

                            {/* Test Case Results */}
                            {ps.testResults && Array.isArray(ps.testResults) && ps.testResults.length > 0 && (
                              <div className="mt-4">
                                <h5 className="text-sm font-medium text-gray-900 mb-2">Test Case Results:</h5>
                                <div className="space-y-2">
                                  {ps.testResults.map((test, testIdx) => (
                                    <div key={testIdx} className={`p-3 rounded-lg border ${
                                      test.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                                    }`}>
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-medium px-2 py-1 rounded ${
                                              test.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                              Test Case {testIdx + 1}
                                            </span>
                                            <span className={`text-xs font-medium ${
                                              test.passed ? 'text-green-700' : 'text-red-700'
                                            }`}>
                                              {test.passed ? '✓ Passed' : '✗ Failed'}
                                            </span>
                                          </div>
                                          {!test.passed && (
                                            <div className="mt-2 space-y-1">
                                              {test.expectedOutput !== undefined && (
                                                <div className="text-xs">
                                                  <span className="font-medium text-gray-700">Expected:</span>
                                                  <pre className="mt-1 p-2 bg-white rounded text-gray-900 overflow-x-auto">{String(test.expectedOutput)}</pre>
                                                </div>
                                              )}
                                              {test.actualOutput !== undefined && (
                                                <div className="text-xs">
                                                  <span className="font-medium text-gray-700">Got:</span>
                                                  <pre className="mt-1 p-2 bg-white rounded text-gray-900 overflow-x-auto">{String(test.actualOutput)}</pre>
                                                </div>
                                              )}
                                              {test.error && (
                                                <div className="text-xs">
                                                  <span className="font-medium text-red-700">Error:</span>
                                                  <pre className="mt-1 p-2 bg-white rounded text-red-700 overflow-x-auto">{test.error}</pre>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                        <div className="text-right ml-4">
                                          {test.executionTime && (
                                            <p className="text-xs text-gray-600">
                                              {test.executionTime}ms
                                            </p>
                                          )}
                                          {test.memoryUsed && (
                                            <p className="text-xs text-gray-600">
                                              {(test.memoryUsed / 1024).toFixed(2)} KB
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => {
                  setShowSubmissionsModal(false);
                  setSelectedSubmission(null);
                }}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitionManager;

