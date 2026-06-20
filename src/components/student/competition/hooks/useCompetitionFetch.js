import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import competitionService from '../../../../services/competitionService';
import toast from 'react-hot-toast';

/**
 * Fetch competition data, handle registration, restore drafts.
 */
export default function useCompetitionFetch(competitionId) {
  const navigate = useNavigate();
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [problemSolutions, setProblemSolutions] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const fetchCompetition = async () => {
    try {
      setLoading(true);
      const data = await competitionService.getCompetition(competitionId);
      setCompetition(data);
      if (data.problems && data.problems.length > 0) {
        setSelectedProblem(data.problems[0]);
      }

      if (data.incompleteResubmit && data.incompleteSubmissionData?.problemSubmissions) {
        const savedSolutions = {};
        data.incompleteSubmissionData.problemSubmissions.forEach(ps => {
          savedSolutions[ps.problemId] = {
            code: ps.code || '',
            language: ps.language || 'java',
            saved: true
          };
        });
        setProblemSolutions(savedSolutions);
      }

      if (data.draftCodes && Object.keys(data.draftCodes).length > 0) {
        setProblemSolutions(prev => {
          const merged = { ...prev };
          Object.entries(data.draftCodes).forEach(([problemId, draft]) => {
            if (!merged[problemId]?.saved) {
              merged[problemId] = {
                code: draft.code || '',
                language: draft.language || 'java',
                saved: false,
                fromDraft: true
              };
            }
          });
          return merged;
        });
      }

      if (data.hasSubmitted) {
        setSubmitted(true);
      }

      if (!data.isRegistered && !data.hasSubmitted) {
        try {
          await competitionService.registerForCompetition(competitionId);
        } catch (regError) {
          // registration errors are non-fatal
        }
      }
    } catch (error) {
      toast.error('Failed to load competition');
      navigate('/student/competitions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competitionId]);

  useEffect(() => {
    if (competition && competition.problems?.length > 0 && !selectedProblem) {
      setSelectedProblem(competition.problems[0]);
    }
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    competition,
    loading,
    selectedProblem,
    setSelectedProblem,
    problemSolutions,
    setProblemSolutions,
    submitted,
    setSubmitted
  };
}
