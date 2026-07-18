import React, { memo, useCallback } from 'react';
import { Check, Bookmark, ExternalLink, Clock, Star } from 'lucide-react';
import { classNames } from '../../../utils/helpers';

const difficultyConfig = {
  'Very Easy': 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
  'Easy': 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
  'Medium': 'bg-amber-900/40 text-amber-300 border-amber-700/50',
  'Hard': 'bg-red-900/40 text-red-300 border-red-700/50',
  'Very Hard': 'bg-red-900/60 text-red-200 border-red-700/60',
};

const ProblemRow = memo(({ problem, isCompleted, isBookmarked, onToggleComplete, onToggleBookmark }) => {
  const handleComplete = useCallback(() => onToggleComplete(problem.id), [problem.id, onToggleComplete]);
  const handleBookmark = useCallback(() => onToggleBookmark(problem.id), [problem.id, onToggleBookmark]);
  const handlePractice = useCallback(() => {
    if (problem.leetcodeUrl) window.open(problem.leetcodeUrl, '_blank');
  }, [problem.leetcodeUrl]);

  return (
    <tr className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
      <td className="py-2.5 pl-3">
        <button
          onClick={handleComplete}
          className={classNames(
            'w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-all',
            isCompleted
              ? 'bg-emerald-600 border-emerald-500 text-white'
              : 'border-slate-600 hover:border-emerald-500 hover:bg-emerald-600/10'
          )}
        >
          {isCompleted && <Check className="w-3.5 h-3.5" />}
        </button>
      </td>
      <td className="py-2.5 pr-3">
        <div className="flex items-center gap-2">
          <span className={classNames('text-sm', isCompleted ? 'text-slate-500 line-through' : 'text-slate-200')}>
            {problem.title}
          </span>
        </div>
      </td>
      <td className="py-2.5">
        <span className={classNames('text-xs px-2 py-0.5 rounded border', difficultyConfig[problem.difficulty] || 'bg-slate-800 text-slate-400 border-slate-700')}>
          {problem.difficulty}
        </span>
      </td>
      <td className="py-2.5">
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Clock className="w-3 h-3" />
          {problem.estimatedMinutes}m
        </div>
      </td>
      <td className="py-2.5">
        <button
          onClick={handlePractice}
          className="flex items-center gap-1 text-xs px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-600/30 rounded transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Practice
        </button>
      </td>
      <td className="py-2.5 text-center">
        <span className="text-xs text-slate-500">
          {problem.companies?.length || '—'}
        </span>
      </td>
      <td className="py-2.5 pr-3">
        <button
          onClick={handleBookmark}
          className={classNames(
            'transition-colors',
            isBookmarked ? 'text-amber-400' : 'text-slate-600 hover:text-amber-400'
          )}
        >
          {isBookmarked ? <Star className="w-4 h-4 fill-amber-400" /> : <Star className="w-4 h-4" />}
        </button>
      </td>
    </tr>
  );
});

ProblemRow.displayName = 'ProblemRow';
export default ProblemRow;
