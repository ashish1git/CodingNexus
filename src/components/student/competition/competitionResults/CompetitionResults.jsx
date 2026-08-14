import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Trophy, Bell, TrendingUp, ArrowRight } from 'lucide-react';
import { useCompetitionResults } from './hooks/useCompetitionResults';
import competitionService from '../../../../services/competitionService';
import { scrollToId } from './utils/resultsUtils';
import Card from '../../../shared/Card';
import Loading from '../../../shared/Loading';
import ResultsHeader from './components/ResultsHeader';
import ResultsTabs from './components/ResultsTabs';
import SubmissionStatusCard from './components/SubmissionStatusCard';
import ProblemResultCard from './components/ProblemResultCard';
import LeaderboardTable from './components/LeaderboardTable';
import NoSubmissionCard from './components/NoSubmissionCard';
import CompetitionNotFound from './components/CompetitionNotFound';

const CompetitionResults = () => {
  const {
    loading, competition, mySubmission, setMySubmission, leaderboard,
    activeTab, setActiveTab, refreshing, handleRefresh,
    navigate, id
  } = useCompetitionResults();

  const [acknowledgingId, setAcknowledgingId] = useState(null);

  const myUserId = mySubmission?.userId;
  const myLeaderboardEntry = leaderboard.find((e) => e.userId === myUserId);

  const unacknowledgedReviews = useMemo(
    () => (mySubmission?.problems || []).filter(
      (p) => p.isEvaluated && p.evaluatorComments && p.reviewAcknowledged === false
    ),
    [mySubmission]
  );

  const handleAcknowledge = useCallback(async (problemId) => {
    if (!mySubmission) return;
    setAcknowledgingId(problemId);
    try {
      await competitionService.acknowledgeReview(id, problemId);
      // Optimistically mark as acknowledged, then refresh to stay in sync
      setMySubmission((prev) => ({
        ...prev,
        problems: prev.problems.map((p) =>
          p.problemId === problemId ? { ...p, reviewAcknowledged: true } : p
        )
      }));
      await handleRefresh();
    } catch (error) {
      console.error('Error acknowledging review:', error);
    } finally {
      setAcknowledgingId(null);
    }
  }, [id, mySubmission, handleRefresh, setMySubmission]);

  // Auto-scroll to the student's own leaderboard row when the leaderboard tab opens
  useEffect(() => {
    if (activeTab === 'leaderboard' && myUserId) {
      const t = setTimeout(() => {
        if (!scrollToId(`lb-row-${myUserId}`)) {
          // Row not rendered yet (leaderboard still loading) — retry once
          setTimeout(() => scrollToId(`lb-row-${myUserId}`), 400);
        }
      }, 150);
      return () => clearTimeout(t);
    }
  }, [activeTab, myUserId, leaderboard]);

  // Auto-scroll to the first problem with an unacknowledged evaluator review
  useEffect(() => {
    if (activeTab === 'my-results' && unacknowledgedReviews.length > 0) {
      const first = unacknowledgedReviews[0];
      const t = setTimeout(() => {
        scrollToId(`problem-card-${first.problemId}`);
      }, 150);
      return () => clearTimeout(t);
    }
  }, [activeTab, unacknowledgedReviews]);

  const goToLeaderboard = useCallback(() => {
    setActiveTab('leaderboard');
  }, [setActiveTab]);

  if (loading) return <Loading />;

  if (!competition) {
    return <CompetitionNotFound onBack={() => navigate('/student/competitions')} />;
  }

  const enableLeaderboard = competition.showLeaderboard !== false;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <ResultsHeader
          competition={competition}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onBack={() => navigate('/student/competitions')}
        />

        {unacknowledgedReviews.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-800">
                You have {unacknowledgedReviews.length} new evaluator review{unacknowledgedReviews.length > 1 ? 's' : ''}!
              </p>
              <p className="text-xs text-amber-700 break-words mt-0.5">
                Review{unacknowledgedReviews.length > 1 ? 's' : ''} on{' '}
                {unacknowledgedReviews.map((p) => {
                  const idx = (mySubmission?.problems || []).findIndex((x) => x.problemId === p.problemId);
                  return `Problem ${idx + 1}${p.problemTitle ? ` (${p.problemTitle})` : ''}`;
                }).join(', ')} — scroll down and click "I've read this review" to dismiss.
              </p>
            </div>
          </div>
        )}

        {mySubmission && enableLeaderboard && myLeaderboardEntry && (
          <div className="mb-6 relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 p-5 sm:p-6 shadow-sm">
            <div className="absolute inset-0 opacity-40">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-200/50 rounded-full blur-3xl" />
            </div>
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Your Standing
              </h2>
              <button
                onClick={goToLeaderboard}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition self-start sm:self-auto group"
              >
                View full leaderboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
              <div className="p-4 bg-white rounded-xl border border-indigo-100 shadow-sm">
                <p className="text-xs font-medium text-gray-500 mb-1">Your Rank</p>
                <p className="text-3xl font-bold text-indigo-700">
                  {myLeaderboardEntry.rank === 1 ? '🥇' : myLeaderboardEntry.rank === 2 ? '🥈' : myLeaderboardEntry.rank === 3 ? '🥉' : '#'}{' '}
                  {myLeaderboardEntry.rank}
                  <span className="text-lg text-gray-400 font-semibold"> / {leaderboard.length}</span>
                </p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-indigo-100 shadow-sm">
                <p className="text-xs font-medium text-gray-500 mb-1">Your Score</p>
                <p className="text-3xl font-bold text-gray-900">{myLeaderboardEntry.totalScore}</p>
              </div>
            </div>
          </div>
        )}

        <ResultsTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          enableLeaderboard={true}
        />

        {activeTab === 'my-results' && (
          <div className="space-y-6">
            {!mySubmission ? (
              <NoSubmissionCard
                onStartSolving={() => navigate(`/student/competition/${id}`)}
              />
            ) : (
              <>
                <SubmissionStatusCard mySubmission={mySubmission} competition={competition} />

                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-900">Problem-wise Results</h2>
                  {mySubmission.problems.map((problem, index) => (
                    <ProblemResultCard
                      key={problem.problemId}
                      problem={problem}
                      index={index}
                      onAcknowledge={() => handleAcknowledge(problem.problemId)}
                      acknowledging={acknowledgingId === problem.problemId}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          enableLeaderboard ? (
            <LeaderboardTable
              leaderboard={leaderboard}
              currentUserId={mySubmission?.userId}
            />
          ) : (
            <Card className="p-8">
              <div className="text-center py-8">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Leaderboard will be displayed soon</h3>
                <p className="text-gray-500">The leaderboard will be available once the System verifies all the Scores. Stay tuned!</p>
              </div>
            </Card>
          )
        )}
      </div>
    </div>
  );
};

export default CompetitionResults;
