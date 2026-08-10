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
      <div className="bg-[#161b22] border-r border-[#30363d] shrink-0">
        <button
          onClick={onToggle}
          className="p-3 text-gray-400 hover:text-white hover:bg-[#21262d] transition-colors rounded-lg m-2"
          title="Show problem list"
        >
          <List className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-[#161b22] border-r border-[#30363d] overflow-y-auto shrink-0 comp-scroll">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase">
            Problems {Object.keys(problemSolutions).filter(id => problemSolutions[id]?.saved).length}/{problems?.length}
          </div>
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-[#21262d]"
            title="Hide problem list"
          >
            <ChevronUp className="w-4 h-4 rotate-90" />
          </button>
        </div>
        <div className="space-y-1.5">
          {problems?.map((problem, index) => (
            <button
              key={problem.id}
              onClick={() => onSwitchProblem(problem)}
              className={`w-full text-left px-3 py-2.5 rounded-md transition-all group ${
                selectedProblem?.id === problem.id
                  ? 'bg-[#1f2937] text-white border border-[#30363d]'
                  : 'text-gray-400 hover:bg-[#21262d] hover:text-gray-200'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                {problemSolutions[problem.id]?.saved ? (
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-600 shrink-0 group-hover:border-gray-500 transition-colors" />
                )}
                <span className="text-xs font-medium truncate">
                  {index + 1}. {problem.title}
                </span>
              </div>
              <div className="flex items-center justify-between ml-6.5">
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  problem.difficulty === 'easy' ? 'bg-green-500/10 text-green-400' :
                  problem.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-red-500/10 text-red-400'
                }`}>
                  {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                </span>
                <span className="text-[10px] text-gray-500 font-medium">{problem.points} pts</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
