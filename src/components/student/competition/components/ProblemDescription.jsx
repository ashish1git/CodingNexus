import React from 'react';
import { FileText, ChevronLeft } from 'lucide-react';

/**
 * Problem description panel with difficulty, stats, examples, constraints.
 */
export default function ProblemDescription({ selectedProblem, activeTab, onTabChange, competitionStatus, onToggleDescription }) {
  if (!selectedProblem) return null;

  const isOngoing = competitionStatus === 'ongoing';

  return (
    <div className="h-full overflow-y-auto bg-[#1a1a1a] scrollbar-thin scrollbar-thumb-[#3e3e3e] scrollbar-track-transparent">
      <div className="p-6">
          {/* Problem Header */}
          <div className="mb-6 flex items-start justify-between">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-blue-400">{selectedProblem.id}.</span>
              {selectedProblem.title}
            </h2>
            <button
              onClick={onToggleDescription}
              className="shrink-0 mt-1 p-1.5 text-gray-500 hover:text-white hover:bg-[#3e3e3e] rounded-lg transition-colors"
              title="Collapse description"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-[#3e3e3e]">
              <button
                onClick={() => onTabChange('description')}
                disabled={isOngoing}
                className={`pb-3 px-1 text-sm font-semibold transition-all ${
                  isOngoing ? 'cursor-not-allowed opacity-50' : ''
                } ${
                  activeTab === 'description'
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
                title={isOngoing ? 'Tab switching is disabled during competition' : ''}
              >
                Description
              </button>
              <button
                onClick={() => onTabChange('submissions')}
                disabled={isOngoing}
                className={`pb-3 px-1 text-sm font-semibold transition-all ${
                  isOngoing ? 'cursor-not-allowed opacity-50' : ''
                } ${
                  activeTab === 'submissions'
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
                title={isOngoing ? 'Tab switching is disabled during competition' : ''}
              >
                Submissions
              </button>
             </div>

          {activeTab === 'description' && (
            <div className="space-y-6">
              {/* Difficulty and Stats */}
              <div className="flex items-center gap-4 text-sm">
                <span className={`px-3 py-1.5 rounded-lg font-semibold ${
                  selectedProblem.difficulty === 'easy' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                  selectedProblem.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                  'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {selectedProblem.difficulty.charAt(0).toUpperCase() + selectedProblem.difficulty.slice(1)}
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400 font-medium">Accepted: <span className="text-white">{selectedProblem.submissions}</span></span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400 font-medium">Acceptance: <span className="text-white">{selectedProblem.acceptanceRate}%</span></span>
              </div>

              {/* Description */}
              <div className="bg-[#262626] border border-[#3e3e3e] rounded-lg p-5">
                <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Problem Statement</h3>
                <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {selectedProblem.description}
                </div>
              </div>

              {/* Examples */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Examples</h3>
                {selectedProblem.examples?.map((example, idx) => (
                  <div key={idx} className="bg-[#262626] rounded-lg p-5 border border-[#3e3e3e] hover:border-[#4e4e4e] transition-colors">
                    <p className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">{idx + 1}</span>
                      Example {idx + 1}
                    </p>
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="text-gray-400 mb-2 font-semibold">Input:</div>
                        <pre className="text-white font-mono bg-[#1e1e1e] p-3 rounded-lg border border-[#3e3e3e]">{example.input}</pre>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-2 font-semibold">Output:</div>
                        <pre className="text-white font-mono bg-[#1e1e1e] p-3 rounded-lg border border-[#3e3e3e]">{example.output}</pre>
                      </div>
                      {example.explanation && (
                        <div className="pt-2">
                          <div className="text-gray-400 mb-2 font-semibold">Explanation:</div>
                          <p className="text-gray-300 leading-relaxed">{example.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Constraints */}
              <div className="bg-[#262626] border border-[#3e3e3e] rounded-lg p-5">
                <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">Constraints</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  {selectedProblem.constraints?.map((constraint, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-blue-400 mt-1 text-xs">▸</span>
                      <code className="font-mono text-sm bg-[#1e1e1e] px-3 py-1.5 rounded border border-[#3e3e3e]">{constraint}</code>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="text-center py-20">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No submissions yet</p>
              <p className="text-sm text-gray-500 mt-2">Submit your solution to see results here</p>
            </div>
          )}
        </div>
    </div>
  );
}
