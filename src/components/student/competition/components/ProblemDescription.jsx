import React from 'react';
import { FileText, ChevronLeft } from 'lucide-react';

/**
 * Problem description panel with difficulty, stats, examples, constraints.
 */
export default function ProblemDescription({ selectedProblem, activeTab, onTabChange, competitionStatus, onToggleDescription }) {
  if (!selectedProblem) return null;

  const isOngoing = competitionStatus === 'ongoing';

  return (
    <div className="h-full overflow-y-auto bg-[#0d1117] comp-scroll min-w-0">
      <div className="p-3 sm:p-5 min-w-0">
          {/* Problem Header */}
          <div className="mb-4 flex items-start justify-between gap-2">
            <h2 className="text-base sm:text-xl font-bold text-white flex items-center gap-2 min-w-0 break-words">
              <span className="text-blue-400 text-sm shrink-0">{selectedProblem.id}.</span>
              <span className="truncate">{selectedProblem.title}</span>
            </h2>
            <button
              onClick={onToggleDescription}
              className="shrink-0 mt-0.5 p-1 text-gray-500 hover:text-white hover:bg-[#21262d] rounded transition-colors"
              title="Collapse description"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

            {/* Tabs */}
            <div className="flex gap-4 sm:gap-6 border-b border-[#30363d] mb-4">
              <button
                onClick={() => onTabChange('description')}
                disabled={isOngoing}
                className={`pb-2 px-1 text-xs font-semibold transition-all ${
                  isOngoing ? 'cursor-not-allowed opacity-50' : ''
                } ${
                  activeTab === 'description'
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Description
              </button>
              <button
                onClick={() => onTabChange('submissions')}
                disabled={isOngoing}
                className={`pb-2 px-1 text-xs font-semibold transition-all ${
                  isOngoing ? 'cursor-not-allowed opacity-50' : ''
                } ${
                  activeTab === 'submissions'
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Submissions
              </button>
             </div>

          {activeTab === 'description' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                  selectedProblem.difficulty === 'easy' ? 'bg-green-500/10 text-green-400 border border-green-500/25' :
                  selectedProblem.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/25' :
                  'bg-red-500/10 text-red-400 border border-red-500/25'
                }`}>
                  {selectedProblem.difficulty.charAt(0).toUpperCase() + selectedProblem.difficulty.slice(1)}
                </span>
                <span className="text-gray-600 hidden sm:inline">•</span>
                <span className="text-gray-400 text-[11px]">Accepted: <span className="text-gray-200 font-medium">{selectedProblem.submissions}</span></span>
                <span className="text-gray-600 hidden sm:inline">•</span>
                <span className="text-gray-400 text-[11px]">Acceptance: <span className="text-gray-200 font-medium">{selectedProblem.acceptanceRate}%</span></span>
              </div>

              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 sm:p-4 min-w-0 overflow-hidden">
                <h3 className="text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">Problem Statement</h3>
                <div className="text-gray-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line break-words">
                  {selectedProblem.description}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Examples</h3>
                {selectedProblem.examples?.map((example, idx) => (
                  <div key={idx} className="bg-[#161b22] rounded-lg p-3 sm:p-4 border border-[#30363d] hover:border-[#484f58] transition-colors min-w-0 overflow-hidden">
                    <p className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] shrink-0">{idx + 1}</span>
                      Example {idx + 1}
                    </p>
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="text-gray-400 mb-1 font-semibold text-[11px]">Input:</div>
                        <pre className="text-gray-200 font-mono bg-[#0d1117] p-2 rounded-md border border-[#30363d] overflow-x-auto whitespace-pre-wrap break-all text-[11px]">{example.input}</pre>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-1 font-semibold text-[11px]">Output:</div>
                        <pre className="text-gray-200 font-mono bg-[#0d1117] p-2 rounded-md border border-[#30363d] overflow-x-auto whitespace-pre-wrap break-all text-[11px]">{example.output}</pre>
                      </div>
                      {example.explanation && (
                        <div className="pt-1">
                          <div className="text-gray-400 mb-1 font-semibold text-[11px]">Explanation:</div>
                          <p className="text-gray-300 leading-relaxed text-[11px] break-words">{example.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 sm:p-4 min-w-0 overflow-hidden">
                <h3 className="text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">Constraints</h3>
                <ul className="space-y-1.5 text-xs text-gray-300">
                  {selectedProblem.constraints?.map((constraint, idx) => (
                    <li key={idx} className="flex items-start gap-2 min-w-0">
                      <span className="text-blue-400 mt-0.5 text-[10px] shrink-0">▸</span>
                      <code className="font-mono text-[11px] bg-[#0d1117] px-2 py-1 rounded border border-[#30363d] break-all min-w-0">{constraint}</code>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="text-center py-16">
              <FileText className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No submissions yet</p>
              <p className="text-xs text-gray-600 mt-1.5">Submit to see results</p>
            </div>
          )}
        </div>
    </div>
  );
}
