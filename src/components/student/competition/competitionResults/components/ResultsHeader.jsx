import React from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';

const ResultsHeader = ({ competition, refreshing, onRefresh, onBack }) => {
  return (
    <div className="mb-6 sm:mb-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 mb-4 text-sm font-medium transition group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Competitions
      </button>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 p-5 sm:p-8 text-white shadow-xl shadow-indigo-200">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/40 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-purple-300/40 rounded-full blur-3xl" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1">Competition Results</p>
            <h1 className="text-2xl sm:text-3xl font-bold break-words leading-tight">{competition.title}</h1>
            {competition.description && (
              <p className="text-indigo-100/90 text-sm mt-2 line-clamp-2 max-w-2xl">{competition.description}</p>
            )}
          </div>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-white/15 border border-white/25 text-white font-semibold text-sm hover:bg-white/25 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0 self-start sm:self-auto backdrop-blur"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Results'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsHeader;
