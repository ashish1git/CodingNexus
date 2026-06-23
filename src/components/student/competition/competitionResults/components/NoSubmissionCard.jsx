import React from 'react';
import Card from '../../../../shared/Card';

const NoSubmissionCard = ({ onStartSolving }) => {
  return (
    <Card className="p-8 text-center">
      <div className="max-w-md mx-auto">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Submission Yet</h3>
        <p className="text-gray-600 mb-4">
          You haven't submitted any solutions for this competition yet.
        </p>
        <button
          onClick={onStartSolving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Start Solving
        </button>
      </div>
    </Card>
  );
};

export default NoSubmissionCard;
