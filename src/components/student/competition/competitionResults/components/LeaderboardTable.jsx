import React, { useState, useMemo } from 'react';
import Card from '../../../../shared/Card';
import { formatIST } from '../utils/resultsUtils';
import { Search, Crown, Medal, Trophy } from 'lucide-react';

const medalFor = (rank) => {
  if (rank === 1) return { icon: '🥇', label: 'Gold', color: 'text-yellow-500' };
  if (rank === 2) return { icon: '🥈', label: 'Silver', color: 'text-gray-400' };
  if (rank === 3) return { icon: '🥉', label: 'Bronze', color: 'text-amber-600' };
  return null;
};

const LeaderboardRow = ({ entry, isCurrentUser }) => {
  const rankDisplay = (rank) => {
    const prefix = rank === 1 ? '🥇 ' : rank === 2 ? '🥈 ' : rank === 3 ? '🥉 ' : '';
    return prefix + rank;
  };

  const rankClass = (rank) => {
    if (rank === 1) return 'text-yellow-500 text-lg';
    if (rank === 2) return 'text-gray-400 text-lg';
    if (rank === 3) return 'text-amber-600 text-lg';
    return 'text-gray-900';
  };

  return (
    <tr
      id={isCurrentUser ? `lb-row-${entry.userId}` : undefined}
      className={isCurrentUser ? 'bg-blue-50 ring-2 ring-inset ring-blue-400' : 'hover:bg-gray-50'}
    >
      <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
        <span className={`font-bold ${rankClass(entry.rank)}`}>
          {rankDisplay(entry.rank)}
        </span>
      </td>
      <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">
          {entry.name}
          {isCurrentUser && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-600 text-white">
              You
            </span>
          )}
        </div>
        {(entry.batch || entry.division) && (
          <div className="text-xs text-gray-500">
            {entry.batch}
            {entry.division && <span className="ml-1">• {entry.division}</span>}
          </div>
        )}
      </td>
      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
        {entry.moodleId || 'N/A'}
      </td>
      <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
        <span className={`text-lg font-bold ${isCurrentUser ? 'text-blue-700' : 'text-gray-900'}`}>
          {entry.totalScore}
        </span>
      </td>
      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs text-gray-600 hidden sm:table-cell">
        {formatIST(entry.submittedAt)}
      </td>
    </tr>
  );
};

const Podium = ({ top3, currentUserId }) => {
  // Order: 2nd, 1st, 3rd for a classic podium look
  const order = [top3.find(e => e.rank === 2), top3.find(e => e.rank === 1), top3.find(e => e.rank === 3)].filter(Boolean);
  const heights = { 1: 'h-24 sm:h-28', 2: 'h-16 sm:h-20', 3: 'h-12 sm:h-16' };
  const orders = { 1: 'order-2', 2: 'order-1', 3: 'order-3' };

  return (
    <div className="mb-6 pt-2 pb-4 flex items-end justify-center gap-2 sm:gap-4">
      {order.map((entry) => {
        const medal = medalFor(entry.rank);
        const isYou = entry.userId === currentUserId;
        return (
          <div key={entry.userId} className={`flex flex-col items-center ${orders[entry.rank]} flex-1 max-w-[120px]`}>
            <div className="flex flex-col items-center mb-2 text-center">
              <span className="text-2xl sm:text-3xl mb-1">{medal.icon}</span>
              <span className={`text-sm font-bold truncate max-w-full ${isYou ? 'text-blue-700' : 'text-gray-900'}`}>
                {entry.name}
              </span>
              {isYou && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full mt-0.5">YOU</span>}
              <span className="text-xs text-gray-500 font-semibold">{entry.totalScore} pts</span>
            </div>
            <div className={`w-full rounded-t-xl flex items-start justify-center pt-2 ${heights[entry.rank]} ${
              entry.rank === 1
                ? 'bg-gradient-to-b from-yellow-400/90 to-yellow-500/80'
                : entry.rank === 2
                  ? 'bg-gradient-to-b from-gray-300/90 to-gray-400/80'
                  : 'bg-gradient-to-b from-amber-600/80 to-amber-700/70'
            }`}>
              <span className="text-white font-bold text-lg">{entry.rank}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const LeaderboardTable = ({ leaderboard, currentUserId }) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return leaderboard;
    const q = query.toLowerCase();
    return leaderboard.filter(e =>
      (e.name || '').toLowerCase().includes(q) ||
      (e.moodleId || '').toLowerCase().includes(q) ||
      (e.batch || '').toLowerCase().includes(q) ||
      (e.division || '').toLowerCase().includes(q)
    );
  }, [leaderboard, query]);

  const top3 = leaderboard.slice(0, 3);

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Leaderboard
        </h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, roll, batch..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {top3.length >= 3 && filtered.length === leaderboard.length && (
        <Podium top3={top3} currentUserId={currentUserId} />
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-10">
          <Medal className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {query ? `No results match "${query}"` : 'No submissions yet'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Rank</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden md:table-cell">Moodle ID</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Score</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden sm:table-cell">Submitted At</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((entry) => (
                <LeaderboardRow
                  key={entry.userId}
                  entry={entry}
                  isCurrentUser={entry.userId === currentUserId}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default LeaderboardTable;
