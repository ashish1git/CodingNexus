import React from 'react';
import { useCompetitionResults } from './hooks/useCompetitionResults';
import Loading from '../../../shared/Loading';
import ResultsHeader from './components/ResultsHeader';
import ResultsTabs from './components/ResultsTabs';
import SubmissionStatusCard from './components/SubmissionStatusCard';
import ProblemResultCard from './components/ProblemResultCard';
import LeaderboardTable from './components/LeaderboardTable';
import NoSubmissionCard from './components/NoSubmissionCard';
import CompetitionNotFound from './components/CompetitionNotFound';

const ENABLE_LEADERBOARD = true;

const CompetitionResults = () => {
  const {
    loading, competition, mySubmission, leaderboard,
    activeTab, setActiveTab, refreshing, handleRefresh,
    navigate, id
  } = useCompetitionResults();

  if (loading) return <Loading />;

  if (!competition) {
    return <CompetitionNotFound onBack={() => navigate('/student/competitions')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <ResultsHeader
          competition={competition}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onBack={() => navigate('/student/competitions')}
        />

        <ResultsTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          enableLeaderboard={ENABLE_LEADERBOARD}
        />

        {activeTab === 'my-results' && (
          <div className="space-y-6">
            {!mySubmission ? (
              <NoSubmissionCard
                onStartSolving={() => navigate(`/student/competition/${id}`)}
              />
            ) : (
              <>
                <SubmissionStatusCard mySubmission={mySubmission} />

                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-900">Problem-wise Results</h2>
                  {mySubmission.problems.map((problem, index) => (
                    <ProblemResultCard
                      key={problem.problemId}
                      problem={problem}
                      index={index}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {ENABLE_LEADERBOARD && activeTab === 'leaderboard' && (
          <LeaderboardTable
            leaderboard={leaderboard}
            currentUserId={mySubmission?.userId}
          />
        )}
      </div>
    </div>
  );
};

export default CompetitionResults;
