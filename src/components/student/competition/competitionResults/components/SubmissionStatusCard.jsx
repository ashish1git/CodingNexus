import React from 'react';
import Card from '../../../../shared/Card';
import { getStatusColor, getStatusIcon, formatIST } from '../utils/resultsUtils';
import { Clock, Info } from 'lucide-react';

const SubmissionStatusCard = ({ mySubmission, competition }) => {
  // Denominator = total marks of ALL problems in the competition,
  // not just the ones the student attempted
  const competitionMax = (competition?.problems || [])
    .reduce((sum, p) => sum + (p.points || p.maxScore || 0), 0);
  const totalMaxScore = competitionMax || mySubmission?.problems?.reduce((sum, p) => sum + (p.maxScore || 0), 0) || 0;

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-5">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Submission Status</h2>
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(mySubmission.status)}`}>
          {getStatusIcon(mySubmission.status)} {mySubmission.status}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-1">Total Score</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
            {mySubmission.totalScore || 0}
            {totalMaxScore > 0 && <span className="text-lg text-gray-400 font-semibold"> / {totalMaxScore}</span>}
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Submitted At
          </p>
          <p className="text-sm sm:text-base font-semibold text-gray-900">
            {formatIST(mySubmission.submittedAt)}
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-1">Problems</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
            {(mySubmission.problems || []).filter(p => p.status === 'accepted' || p.score > 0 || (p.isEvaluated && p.manualMarks > 0)).length}
            <span className="text-lg text-gray-400 font-semibold"> / {mySubmission.problems?.length || 0}</span>
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm text-blue-700">
          Once the test is submitted, click <span className="font-semibold">Refresh Results</span> after 3-4 seconds to get the latest score.
        </p>
      </div>
    </Card>
  );
};

export default SubmissionStatusCard;
