import React from 'react';
import Card from '../../../../shared/Card';
import { FileEdit, ArrowRight } from 'lucide-react';

const NoSubmissionCard = ({ onStartSolving }) => {
  return (
    <Card className="p-8 sm:p-12 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-indigo-50 flex items-center justify-center mb-5">
          <FileEdit className="w-9 h-9 text-indigo-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Submission Yet</h3>
        <p className="text-gray-500 mb-6">
          You haven't submitted any solutions for this competition yet. Jump in and start solving!
        </p>
        <button
          onClick={onStartSolving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition active:scale-[0.98] shadow-lg shadow-indigo-200"
        >
          Start Solving
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
};

export default NoSubmissionCard;
