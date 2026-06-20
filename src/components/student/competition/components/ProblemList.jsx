import React from 'react';
import { CheckCircle, ChevronUp, List } from 'lucide-react';

/**
 * Left sidebar listing all problems with solved/difficulty indicators.
 */
export default function ProblemList({
  problems,
  selectedProblem,
  problemSolutions,
  onSwitchProblem,
  showProblemList,
  onToggle
}) {
  if (!showProblemList) {
    return (
      <div className="bg-[#262626] border-r border-[#3e3e3e] shrink-0">
        <button
          onClick={onToggle}
          className="p-3 text-gray-400 hover:text-white hover:bg-[#2e2e2e] transition-colors rounded-lg m-2"
          title="Show problem list"
        >
          <List className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-[#262626] border-r border-[#3e3e3e] overflow-y-auto shrink-0 scrollbar-thin scrollbar-thumb-[#3e3e3e] scrollbar-track-transparent">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="text-xs font-semibold text-gray-400 tracking-wider uppercase">
            Problems {Object.keys(problemSolutions).filter(id => problemSolutions[id]?.saved).length}/{problems?.length}
          </div>
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-[#2e2e2e]"
            title="Hide problem list"
          >
            <ChevronUp className="w-4 h-4 rotate-90" />
          </button>
        </div>
        <div className="space-y-2">
          {problems?.map((problem, index) => (
            <button
              key={problem.id}
              onClick={() => onSwitchProblem(problem)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all group ${
                selectedProblem?.id === problem.id
                  ? 'bg-[#3e3e3e] text-white shadow-md border border-[#4e4e4e]'
                  : 'text-gray-300 hover:bg-[#2e2e2e] hover:border hover:border-[#3e3e3e]'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                {problemSolutions[problem.id]?.saved ? (
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-600 shrink-0 group-hover:border-gray-500 transition-colors" />
                )}
                <span className="text-sm font-semibold truncate">
                  {index + 1}. {problem.title}
                </span>
              </div>
              <div className="flex items-center justify-between ml-8">
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  problem.difficulty === 'easy' ? 'bg-green-500/10 text-green-400' :
                  problem.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-red-500/10 text-red-400'
                }`}>
                  {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                </span>
                <span className="text-xs text-gray-500 font-medium">{problem.points} pts</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
