import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import competitionService from '../../../../../services/competitionService';

export const useCompetitionResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [competition, setCompetition] = useState(null);
  const [mySubmission, setMySubmission] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('my-results');
  const [refreshing, setRefreshing] = useState(false);

  const loadResults = useCallback(async () => {
    try {
      setLoading(true);
      const compResponse = await competitionService.getCompetition(id);
      setCompetition(compResponse);

      try {
        const subResponse = await competitionService.getMySubmission(id);
        setMySubmission(subResponse);
      } catch (error) {
        console.log('No submission found for this competition:', error.message);
        setMySubmission(null);
      }

      const lbResponse = await competitionService.getLeaderboard(id);
      const filteredLeaderboard = Array.isArray(lbResponse) ? lbResponse : [];
      setLeaderboard(filteredLeaderboard);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadResults();
    setRefreshing(false);
  }, [loadResults]);

  return {
    loading, competition, mySubmission, setMySubmission, leaderboard,
    activeTab, setActiveTab, refreshing, handleRefresh,
    navigate, id
  };
};
