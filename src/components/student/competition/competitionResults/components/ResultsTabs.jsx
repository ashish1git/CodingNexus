import React from 'react';
import { FileText, Trophy } from 'lucide-react';

const ResultsTabs = ({ activeTab, onTabChange, enableLeaderboard }) => {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="inline-flex flex-col sm:flex-row gap-1.5 sm:gap-2 bg-gray-100 p-1.5 rounded-xl w-full sm:w-auto">
        <button
          onClick={() => onTabChange('my-results')}
          className={`flex items-center justify-center gap-2 px-5 sm:px-7 py-2.5 rounded-lg font-semibold text-sm transition ${
            activeTab === 'my-results'
              ? 'bg-white text-indigo-700 shadow-md'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          My Results
        </button>
        {enableLeaderboard && (
          <button
            onClick={() => onTabChange('leaderboard')}
            className={`flex items-center justify-center gap-2 px-5 sm:px-7 py-2.5 rounded-lg font-semibold text-sm transition ${
              activeTab === 'leaderboard'
                ? 'bg-white text-indigo-700 shadow-md'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Leaderboard
          </button>
        )}
      </div>
    </div>
  );
};

export default ResultsTabs;
