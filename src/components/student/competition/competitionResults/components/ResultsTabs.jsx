import React from 'react';

const ResultsTabs = ({ activeTab, onTabChange, enableLeaderboard }) => {
  return (
    <div className="mb-6 border-b border-gray-200">
      <div className="flex gap-4">
        <button
          onClick={() => onTabChange('my-results')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'my-results'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          My Results
        </button>
        {enableLeaderboard && (
          <button
            onClick={() => onTabChange('leaderboard')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'leaderboard'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Leaderboard
          </button>
        )}
      </div>
    </div>
  );
};

export default ResultsTabs;
