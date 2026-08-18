import React from 'react';
import Card from '../../../../shared/Card';
import { getStatusColor, getStatusIcon, getDifficultyStyle, formatIST } from '../utils/resultsUtils';
import { BellRing, CheckCircle2, Code2 } from 'lucide-react';
import ProblemDetails from './ProblemDetails';

// Render evaluator remarks preserving whitespace/newlines/emojis, with **bold** and *italic* support
const renderRemarks = (text) => {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={i} className="font-bold text-blue-900">{part.slice(2, -2)}</strong>;
    }
    if (/^\*[^*]+\*$/.test(part)) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    return part;
  });
};

const ProblemResultCard = ({ problem, index, onAcknowledge, acknowledging }) => {
  const maxScore = problem.maxScore || problem.points || 10;
  const displayStatus = problem.isEvaluated ? 'accepted' : problem.status;
  const displayScore = problem.isEvaluated && problem.manualMarks !== null
    ? `${problem.manualMarks}/${maxScore}`
    : `${problem.score}/${maxScore}`;
  const hasNewReview = problem.isEvaluated && problem.evaluatorComments && problem.reviewAcknowledged === false;

  return (
    <div id={`problem-card-${problem.problemId}`}>
      <Card className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-5">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 break-words">
              <span className="text-indigo-600">Problem {index + 1}:</span>{' '}
              {problem.problemTitle}
            </h3>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`px-2 py-1 rounded-md text-xs font-medium ${getDifficultyStyle(problem.difficulty)}`}>
                {problem.difficulty}
              </span>
              <span className="px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                {problem.language}
              </span>
            </div>
          </div>
          <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
            {hasNewReview && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 animate-pulse">
                <BellRing className="w-3 h-3" /> New Review
              </span>
            )}
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(displayStatus)}`}>
              {getStatusIcon(displayStatus)} {displayStatus}
            </span>
          </div>
        </div>

        {/* Score summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 mb-0.5">Score</p>
            <p className="text-lg font-bold text-gray-900">{displayScore}</p>
          </div>
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 mb-0.5">Status</p>
            <p className="text-sm font-semibold text-gray-900 capitalize">{displayStatus}</p>
          </div>
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 mb-0.5">Judged At</p>
            <p className="text-xs text-gray-900">{formatIST(problem.judgedAt)}</p>
          </div>
        </div>

        {problem.errorMessage && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-800 font-medium mb-1">Error:</p>
            <pre className="text-xs text-red-700 whitespace-pre-wrap font-mono leading-relaxed">{problem.errorMessage}</pre>
          </div>
        )}

        {/* Code */}
        <div className="mb-5">
          <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
            <Code2 className="w-4 h-4 text-gray-400" /> Your Code
          </h4>
          {problem.code ? (
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-xs font-mono whitespace-pre-wrap break-words leading-relaxed">
              {problem.code}
            </pre>
          ) : (
            <div className="bg-gray-100 p-4 rounded-xl text-gray-500 text-sm">No code available</div>
          )}
        </div>

        {/* Evaluator Review */}
        <div className={`p-4 rounded-xl border ${hasNewReview ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
            <h4 className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-500" /> Evaluator Review
            </h4>
            {hasNewReview && onAcknowledge && (
              <button
                onClick={onAcknowledge}
                disabled={acknowledging}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap self-start transition"
              >
                {acknowledging ? 'Acknowledging...' : "✓ I've read this review"}
              </button>
            )}
          </div>
          {problem.isEvaluated ? (
            <div className="space-y-2">
              <div>
                <p className="text-xs text-blue-700 font-medium">Marks Given</p>
                <p className="text-2xl font-bold text-blue-900">{problem.manualMarks}/{maxScore}</p>
              </div>
              {problem.evaluatorComments ? (
                <div>
                  <p className="text-xs text-blue-700 font-medium mb-1">Remarks</p>
                  <pre className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap break-words" style={{ fontFamily: 'inherit' }}>{renderRemarks(problem.evaluatorComments)}</pre>
                </div>
              ) : (
                <p className="text-xs text-blue-600 italic">No remarks provided</p>
              )}
            </div>
        ) : (
          <p className="text-xs text-blue-600 italic">Awaiting evaluator review...</p>
        )}
      </div>

      <ProblemDetails problem={problem} />
      </Card>
    </div>
  );
};

export default ProblemResultCard;
