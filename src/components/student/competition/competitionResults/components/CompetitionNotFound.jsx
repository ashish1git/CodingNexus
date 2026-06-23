import React from 'react';
import Card from '../../../shared/Card';

const CompetitionNotFound = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Card className="max-w-2xl mx-auto text-center p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Competition Not Found</h2>
        <button
          onClick={onBack}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Competitions
        </button>
      </Card>
    </div>
  );
};

export default CompetitionNotFound;
