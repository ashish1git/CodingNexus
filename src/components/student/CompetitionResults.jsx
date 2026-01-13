import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import competitionService from '../../services/competitionService';
import Loading from '../shared/Loading';
import Card from '../shared/Card';
import '../../styles/globals.css';

export const CompetitionResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [competition, setCompetition] = useState(null);
  const [mySubmission, setMySubmission] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('my-results');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadResults = async () => {
    try {
      setLoading(true);
      
      // Load competition details
      const compResponse = await competitionService.getCompetition(id);
      setCompetition(compResponse);

      // Load my submission
      try {
        const subResponse = await competitionService.getMySubmission(id);
        console.log('My submission response:', subResponse);
        setMySubmission(subResponse);
      } catch (error) {
        // No submission yet - this is okay
        console.log('No submission found for this competition:', error.message);
        setMySubmission(null);
      }

      // Load leaderboard
      const lbResponse = await competitionService.getLeaderboard(id);
      console.log('Leaderboard response:', lbResponse);
      setLeaderboard(Array.isArray(lbResponse) ? lbResponse : []);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadResults();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      'accepted': 'text-green-600 bg-green-50',
      'wrong-answer': 'text-red-600 bg-red-50',
      'tle': 'text-yellow-600 bg-yellow-50',
      'runtime-error': 'text-orange-600 bg-orange-50',
      'compile-error': 'text-purple-600 bg-purple-50',
      'pending': 'text-gray-600 bg-gray-50',
      'judging': 'text-blue-600 bg-blue-50',
      'completed': 'text-green-600 bg-green-50',
      'failed': 'text-red-600 bg-red-50'
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'accepted': '✅',
      'wrong-answer': '❌',
      'tle': '⏱️',
      'runtime-error': '⚠️',
      'compile-error': '🔧',
      'pending': '⏳',
      'judging': '🔄',
      'completed': '✅',
      'failed': '❌'
    };
    return icons[status] || '•';
  };

  const formatTime = (ms) => {
    if (!ms) return 'N/A';
    return `${(ms / 1000).toFixed(3)}s`;
  };

  const formatMemory = (kb) => {
    if (!kb) return 'N/A';
    return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb} KB`;
  };

  if (loading) {
    return <Loading />;
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <Card className="max-w-2xl mx-auto text-center p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Competition Not Found</h2>
          <button
            onClick={() => navigate('/student/competitions')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Competitions
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/student/competitions')}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            ← Back to Competitions
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{competition.title}</h1>
              <p className="text-gray-600 mt-2">{competition.description}</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {refreshing ? '🔄 Refreshing...' : '🔄 Refresh Results'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('my-results')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'my-results'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              My Results
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'leaderboard'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Leaderboard
            </button>
          </div>
        </div>

        {/* My Results Tab */}
        {activeTab === 'my-results' && (
          <div className="space-y-6">
            {!mySubmission ? (
              <Card className="p-8 text-center">
                <div className="max-w-md mx-auto">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Submission Yet</h3>
                  <p className="text-gray-600 mb-4">You haven't submitted any solutions for this competition yet.</p>
                  <button
                    onClick={() => navigate(`/student/competition/${id}`)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Start Solving
                  </button>
                </div>
              </Card>
            ) : (
              <>
                {/* Overall Status */}
                <Card className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Submission Status</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(mySubmission.status)}`}>
                        {getStatusIcon(mySubmission.status)} {mySubmission.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Score</p>
                      <p className="text-2xl font-bold text-gray-900">{mySubmission.totalScore || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Time</p>
                      <p className="text-lg font-semibold text-gray-900">{formatTime(mySubmission.totalTime)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Submitted At</p>
                      <p className="text-sm text-gray-900">
                        {new Date(mySubmission.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Problem-wise Results */}
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-900">Problem-wise Results</h2>
                  {mySubmission.problems.map((problem, index) => (
                    <Card key={problem.problemId} className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            Problem {index + 1}: {problem.problemTitle}
                          </h3>
                          <div className="flex gap-2 mt-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              problem.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                              problem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {problem.difficulty}
                            </span>
                            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {problem.language}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(problem.status)}`}>
                            {getStatusIcon(problem.status)} {problem.status}
                          </span>
                        </div>
                      </div>

                      {/* Score and Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 bg-gray-50 p-4 rounded-lg">
                        <div>
                          <p className="text-xs text-gray-600">Score</p>
                          <p className="text-lg font-bold text-gray-900">
                            {problem.score}/{problem.maxScore}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Tests Passed</p>
                          <p className="text-lg font-bold text-gray-900">
                            {problem.testsPassed}/{problem.totalTests}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Execution Time</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatTime(problem.executionTime)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Memory Used</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatMemory(problem.memoryUsed)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Judged At</p>
                          <p className="text-xs text-gray-900">
                            {problem.judgedAt ? new Date(problem.judgedAt).toLocaleString() : 'Pending'}
                          </p>
                        </div>
                      </div>

                      {/* Error Message */}
                      {problem.errorMessage && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800 font-medium">Error:</p>
                          <pre className="text-xs text-red-700 mt-1 whitespace-pre-wrap">
                            {problem.errorMessage}
                          </pre>
                        </div>
                      )}

                      {/* Test Case Results */}
                      {problem.testResults && Array.isArray(problem.testResults) && problem.testResults.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 mb-2">Test Case Results:</h4>
                          <div className="space-y-2">
                            {problem.testResults.map((test, testIdx) => (
                              <div
                                key={testIdx}
                                className={`p-3 rounded-lg border ${
                                  test.passed
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-red-50 border-red-200'
                                }`}
                              >
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    Test Case {test.testCase || testIdx + 1}
                                  </span>
                                  <span className={`text-sm font-bold ${test.passed ? 'text-green-600' : 'text-red-600'}`}>
                                    {test.passed ? '✅ Passed' : '❌ Failed'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="font-medium text-gray-700">Status:</span>{' '}
                                    <span className={getStatusColor(test.status)}>{test.status}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Time:</span>{' '}
                                    {formatTime(test.time)}
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Memory:</span>{' '}
                                    {formatMemory(test.memory)}
                                  </div>
                                </div>
                                {!test.passed && (
                                  <div className="mt-2 space-y-1">
                                    <div>
                                      <span className="text-xs font-medium text-gray-700">Expected:</span>
                                      <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto">
                                        {test.expectedOutput}
                                      </pre>
                                    </div>
                                    <div>
                                      <span className="text-xs font-medium text-gray-700">Got:</span>
                                      <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto">
                                        {test.actualOutput}
                                      </pre>
                                    </div>
                                    {test.stderr && (
                                      <div>
                                        <span className="text-xs font-medium text-gray-700">Error:</span>
                                        <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto text-red-600">
                                          {test.stderr}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Leaderboard</h2>
            {leaderboard.length === 0 ? (
              <p className="text-center text-gray-600 py-8">No submissions yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Roll No
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Problems Solved
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Submitted At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaderboard.map((entry) => (
                      <tr
                        key={entry.userId}
                        className={entry.userId === mySubmission?.userId ? 'bg-blue-50' : ''}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`font-bold ${
                            entry.rank === 1 ? 'text-yellow-600 text-lg' :
                            entry.rank === 2 ? 'text-gray-500 text-lg' :
                            entry.rank === 3 ? 'text-orange-600 text-lg' :
                            'text-gray-900'
                          }`}>
                            {entry.rank === 1 && '🥇 '}
                            {entry.rank === 2 && '🥈 '}
                            {entry.rank === 3 && '🥉 '}
                            {entry.rank}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{entry.name}</div>
                          {entry.batch && (
                            <div className="text-xs text-gray-500">{entry.batch}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {entry.rollNo || 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-lg font-bold text-gray-900">
                            {entry.totalScore}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {entry.problemsSolved}/{entry.totalProblems}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatTime(entry.executionTime)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                          {new Date(entry.submittedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default CompetitionResults;
