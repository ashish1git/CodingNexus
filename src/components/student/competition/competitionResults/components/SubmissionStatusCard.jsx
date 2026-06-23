import React from 'react';
import Card from '../../../../shared/Card';
import { getStatusColor, getStatusIcon, formatIST } from '../utils/resultsUtils';

const SubmissionStatusCard = ({ mySubmission }) => {
  return (
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
