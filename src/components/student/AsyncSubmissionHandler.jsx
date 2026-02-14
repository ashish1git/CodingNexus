import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

/**
 * ✅ SMART POLLING COMPONENT
 * 
 * Features:
 * - Submit code WITHOUT waiting
 * - Poll for results (responsive, non-blocking)
 * - Stop polling when results ready
 * - Exponential backoff (3s, 4s, 5s...)
 * - No browser freezing
 */
const AsyncSubmissionHandler = ({ problemId, code, language, onSuccess, onError }) => {
  const { user } = useContext(AuthContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState('idle');
  const [submissionId, setSubmissionId] = useState(null);
  const [result, setResult] = useState(null);
  const [pollCount, setPollCount] = useState(0);

  /**
   * Step 1: Submit WITHOUT waiting
   * ✅ Returns immediately
   * ❌ NOT blocking
   */
  const handleSubmit = async () => {
    if (isSubmitting || !code || !language) return;

    setIsSubmitting(true);
    setStatus('submitted');
    setResult(null);
    setPollCount(0);

    try {
      console.log('📤 Submitting code (no wait)...');

      const response = await axios.post(
        `/api/submissions/${problemId}/submit-async`,
        { code, language },
        {
          headers: { Authorization: `Bearer ${user?.token}` },
          timeout: 5000  // Submit itself shouldn't take long
        }
      );

      const { submissionId: id } = response.data;
      setSubmissionId(id);
      setStatus('processing');

      // ✅ START POLLING - Don't wait for response
      startSmartPolling(id);

    } catch (error) {
      console.error('Submission error:', error);
      setStatus('error');
      setResult({ error: error.response?.data?.error || error.message });
      onError?.(error);
      setIsSubmitting(false);
    }
  };

  /**
   * Smart polling with exponential backoff
   * - First check: 3 seconds
   * - Second check: 4 seconds
   * - Third check: 5 seconds
   * - Eventually: 10 seconds max
   * 
   * Stops when results ready
   * Falls back to on-demand fetching if polling is disabled
   */
  const startSmartPolling = (id) => {
    let currentPollCount = 0;
    const maxPolls = 50;  // Max ~5 minutes of polling

    const poll = () => {
      if (currentPollCount >= maxPolls) {
        setStatus('timeout');
        setResult({ error: 'Results check timed out. Try refreshing page.' });
        setIsSubmitting(false);
        return;
      }

      // Try smart status check first, then fallback to on-demand fetch
      Promise.race([
        checkStatus(id),  // Standard polling
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 8000)
        )
      ]).then(data => {
        setPollCount(currentPollCount + 1);

        if (data.status === 'completed' || data.status === 'error') {
          setStatus(data.status);
          setResult(data);
          onSuccess?.(data);
          setIsSubmitting(false);
          console.log('✅ Polling stopped - results ready');
        } else {
          // Schedule next poll with exponential backoff
          const nextDelay = Math.min(3000 + (currentPollCount * 1000), 10000);
          currentPollCount++;
          
          console.log(`⏱️  Next check in ${nextDelay}ms (poll #${currentPollCount})`);
          setTimeout(poll, nextDelay);
        }
      }).catch(error => {
        // If standard status check fails, try on-demand fetching
        console.warn('Status check failed, trying on-demand fetch:', error.message);
        
        fetchResultsOnDemand(id)
          .then(data => {
            setPollCount(currentPollCount + 1);

            if (data.status === 'completed') {
              setStatus('completed');
              setResult(data);
              onSuccess?.(data);
              setIsSubmitting(false);
              console.log('✅ On-demand fetch successful');
            } else {
              // Still processing
              const nextDelay = Math.min(5000 + (currentPollCount * 1000), 15000);
              currentPollCount++;
              setTimeout(poll, nextDelay);
            }
          })
          .catch(err => {
            // Fallback failed, continue polling
            console.warn('On-demand fetch also failed, continuing polling');
            const nextDelay = Math.min(5000 + (currentPollCount * 1000), 15000);
            currentPollCount++;
            setTimeout(poll, nextDelay);
          });
      });
    };

    // Start first poll after 2 seconds
    setTimeout(poll, 2000);
  };

  /**
   * On-demand result fetching
   * Calls backend to fetch results directly from Judge0
   */
  const fetchResultsOnDemand = async (id) => {
    try {
      const response = await axios.post(
        `/api/submissions/${id}/fetch-results`,
        {},
        {
          headers: { Authorization: `Bearer ${user?.token}` },
          timeout: 10000
        }
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Check status from backend
   * ✅ Lightweight request (just checking status)
   * ❌ Non-blocking (one request at a time)
   */
  const checkStatus = async (id) => {
    try {
      const response = await axios.get(
        `/api/submissions/${id}/status`,
        {
          headers: { Authorization: `Bearer ${user?.token}` },
          timeout: 5000
        }
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return {
    isSubmitting,
    status,
    result,
    submissionId,
    handleSubmit,
    pollCount
  };
};

/**
 * UI COMPONENT: Shows status while polling
 */
export const SubmissionStatusUI = ({ status, result, pollCount }) => {
  const statusMessages = {
    submitted: {
      icon: '⏳',
      title: 'Submitting Code',
      message: 'Please wait while your code is being processed...'
    },
    processing: {
      icon: '🔄',
      title: 'Running Tests',
      message: `Your code is running test cases... (check #${pollCount})`
    },
    completed: {
      icon: '✅',
      title: 'Done!',
      message: result?.message || 'Code execution completed'
    },
    error: {
      icon: '❌',
      title: 'Error',
      message: result?.error || 'Something went wrong'
    },
    timeout: {
      icon: '⏱️',
      title: 'Timeout',
      message: 'Results check timed out'
    }
  };

  const currentStatus = statusMessages[status] || statusMessages.processing;

  if (status === 'idle') return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="text-5xl mb-4">
            {status === 'processing' ? (
              <span className="inline-block animate-spin">🔄</span>
            ) : (
              currentStatus.icon
            )}
          </div>

          <h2 className="text-2xl font-bold mb-2">{currentStatus.title}</h2>
          <p className="text-gray-600 mb-4">{currentStatus.message}</p>

          {status === 'completed' && result && (
            <div className="bg-green-50 border border-green-200 rounded p-4 text-left mb-4">
              <p className="text-green-800 font-semibold mb-2">Results:</p>
              <p>✅ Passed: {result.passed}/{result.total}</p>
              <p>⏱️ Time: {result.executionTime}ms</p>
              <p>📊 Score: {result.score || 0}%</p>
            </div>
          )}

          {status === 'error' && result && (
            <div className="bg-red-50 border border-red-200 rounded p-4 text-left mb-4">
              <p className="text-red-800">{result.error}</p>
            </div>
          )}

          {['submitted', 'processing'].includes(status) && (
            <div className="flex justify-center gap-2 mb-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          )}

          <p className="text-sm text-gray-500">
            {status === 'processing' ? '💡 You can continue using the app while we process your code.' : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AsyncSubmissionHandler;
