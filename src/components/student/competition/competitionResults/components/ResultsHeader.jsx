import React from 'react';

const ResultsHeader = ({ competition, refreshing, onRefresh, onBack }) => {
  return (
    <div className="mb-6">
      <button
        onClick={onBack}
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
          onClick={onRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {refreshing ? '🔄 Refreshing...' : '🔄 Refresh Results'}
        </button>
      </div>
    </div>
  );
};

export default ResultsHeader;
