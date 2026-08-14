import React from 'react';
import Card from '../../../../shared/Card';
import { SearchX, ArrowLeft } from 'lucide-react';

const CompetitionNotFound = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <Card className="max-w-xl mx-auto text-center p-8 sm:p-12">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-red-50 flex items-center justify-center mb-5">
          <SearchX className="w-9 h-9 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Competition Not Found</h2>
        <p className="text-gray-500 mb-6">
          This competition may have been removed or the link is incorrect.
        </p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Competitions
        </button>
      </Card>
    </div>
  );
};

export default CompetitionNotFound;
