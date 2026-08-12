import React from 'react';
import Card from '../../../../shared/Card';
import { getStatusColor, getStatusIcon, formatIST } from '../utils/resultsUtils';

const SubmissionStatusCard = ({ mySubmission, competition }) => {
  // Denominator = total marks of ALL problems in the competition,
  // not just the ones the student attempted
  const competitionMax = (competition?.problems || [])
    .reduce((sum, p) => sum + (p.points || p.maxScore || 0), 0);
  const totalMaxScore = competitionMax || mySubmission?.problems?.reduce((sum, p) => sum + (p.maxScore || 0), 0) || 0;

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Submission Status <h3 className='font-bold text-gray-500 '>Once the Test is Submitted Click on Refresh Results button after 3-4 seconds to get the latest Score</h3></h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-gray-600">Status</p>
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(mySubmission.status)}`}>
            {getStatusIcon(mySubmission.status)} {mySubmission.status}
          </span>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Score</p>
          <p className="text-2xl font-bold text-gray-900">{mySubmission.totalScore || 0}{totalMaxScore > 0 ? `/${totalMaxScore}` : ''}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Submitted At</p>
          <p className="text-sm text-gray-900">
            {formatIST(mySubmission.submittedAt)}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default SubmissionStatusCard;
