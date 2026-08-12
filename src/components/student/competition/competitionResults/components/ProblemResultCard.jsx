import React from 'react';
import Card from '../../../../shared/Card';
import { getStatusColor, getStatusIcon, getDifficultyStyle, formatIST } from '../utils/resultsUtils';

const ProblemResultCard = ({ problem, index }) => {
  const maxScore = problem.maxScore || problem.points || 10;
  const displayStatus = problem.isEvaluated ? 'accepted' : problem.status;
  const displayScore = problem.isEvaluated && problem.manualMarks !== null
    ? `${problem.manualMarks}/${maxScore}`
    : `${problem.score}/${maxScore}`;

  return (
    <Card key={problem.problemId} className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Problem {index + 1}: {problem.problemTitle}
          </h3>
          <div className="flex gap-2 mt-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyStyle(problem.difficulty)}`}>
              {problem.difficulty}
            </span>
            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
              {problem.language}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(displayStatus)}`}>
            {getStatusIcon(displayStatus)} {displayStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 bg-gray-50 p-4 rounded-lg">
        <div>
          <p className="text-xs text-gray-600">Score</p>
          <p className="text-lg font-bold text-gray-900">{displayScore}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Status</p>
          <p className="text-sm font-semibold text-gray-900">{displayStatus}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Submitted At</p>
          <p className="text-xs text-gray-900">{formatIST(problem.judgedAt)}</p>
        </div>
      </div>

      {problem.errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-medium">Error:</p>
          <pre className="text-xs text-red-700 mt-1 whitespace-pre-wrap">{problem.errorMessage}</pre>
        </div>
      )}

      <div className="mb-4">
        <h4 className="text-sm font-bold text-gray-900 mb-2">Your Code:</h4>
        {problem.code ? (
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs font-mono whitespace-pre-wrap break-words">
            {problem.code}
          </pre>
        ) : (
          <div className="bg-gray-100 p-4 rounded-lg text-gray-600 text-sm">No code available</div>
        )}
      </div>

      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-bold text-blue-900 mb-3">📋 Evaluator Review</h4>
        {problem.isEvaluated ? (
          <div className="space-y-2">
            <div>
              <p className="text-xs text-blue-700 font-medium">Marks Given:</p>
              <p className="text-2xl font-bold text-blue-900">{problem.manualMarks}/{maxScore}</p>
            </div>
            {problem.evaluatorComments ? (
              <div>
                <p className="text-xs text-blue-700 font-medium">Remarks:</p>
                <p className="text-sm text-blue-800 mt-1 leading-relaxed">{problem.evaluatorComments}</p>
              </div>
            ) : (
              <p className="text-xs text-blue-600 italic">No remarks provided</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-blue-600 italic">Awaiting evaluator review...</p>
        )}
      </div>
    </Card>
  );
};

export default ProblemResultCard;
