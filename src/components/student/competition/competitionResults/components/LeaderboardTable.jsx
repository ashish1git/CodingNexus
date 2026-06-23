import React from 'react';
import Card from '../../../../shared/Card';
import { formatIST } from '../utils/resultsUtils';

const LeaderboardRow = ({ entry, isCurrentUser }) => {
  const rankDisplay = (rank) => {
    const prefix = rank === 1 ? '🥇 ' : rank === 2 ? '🥈 ' : rank === 3 ? '🥉 ' : '';
    return prefix + rank;
  };

  const rankClass = (rank) => {
    if (rank === 1) return 'text-yellow-600 text-lg';
    if (rank === 2) return 'text-gray-500 text-lg';
    if (rank === 3) return 'text-orange-600 text-lg';
    return 'text-gray-900';
  };

  return (
    <tr className={isCurrentUser ? 'bg-blue-50' : ''}>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`font-bold ${rankClass(entry.rank)}`}>
          {rankDisplay(entry.rank)}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{entry.name}</div>
        {entry.batch && <div className="text-xs text-gray-500">{entry.batch}</div>}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
        {entry.moodleId || 'N/A'}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-lg font-bold text-gray-900">{entry.totalScore}</span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
        {formatIST(entry.submittedAt)}
      </td>
    </tr>
  );
};

const LeaderboardTable = ({ leaderboard, currentUserId }) => {
  if (leaderboard.length === 0) {
    return <p className="text-center text-gray-600 py-8">No submissions yet</p>;
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Leaderboard</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Rank</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Moodle ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Submitted At</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leaderboard.map((entry) => (
              <LeaderboardRow
                key={entry.userId}
                entry={entry}
                isCurrentUser={entry.userId === currentUserId}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default LeaderboardTable;
