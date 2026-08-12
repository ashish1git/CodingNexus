import React from 'react';
import { Trophy } from 'lucide-react';
import { useCompetitionResults } from './hooks/useCompetitionResults';
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
    loading, competition, mySubmission, leaderboard,
    activeTab, setActiveTab, refreshing, handleRefresh,
    navigate, id
  } = useCompetitionResults();

  if (loading) return <Loading />;

  if (!competition) {
    return <CompetitionNotFound onBack={() => navigate('/student/competitions')} />;
  }

  const enableLeaderboard = competition.showLeaderboard !== false;

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
