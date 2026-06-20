import { useState, useEffect, useRef, useCallback } from 'react';
import competitionService from '../../../../services/competitionService';
import toast from 'react-hot-toast';
import { getServerNow, getCompetitionStatus, getTimeUntilStart } from '../utils/timeUtils';

/**
 * Competition countdown timer with server time sync.
 *
 * @param {Object} competition - Competition object with startTime/endTime
 * @param {Object} opts
 * @param {Object} opts.submittedRef - Ref tracking whether already submitted
 * @param {Function} opts.onExpiry - Callback when timer reaches zero
 * @param {number} opts.warningThresholdMs - Ms before expiry to trigger warning (default 60000)
 * @returns {Object} Timer state and helpers
 */
export default function useTimer(competition, { submittedRef, onExpiry, warningThresholdMs = 60000 } = {}) {
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false });
  const [showTimeWarning, setShowTimeWarning] = useState(false);

  const serverTimeOffsetRef = useRef(0);
  const expiryAutoSubmitTriggeredRef = useRef(false);
  const sixtySecWarningShownRef = useRef(false);

  // Reset expiry flags when competition changes
  useEffect(() => {
    expiryAutoSubmitTriggeredRef.current = false;
    sixtySecWarningShownRef.current = false;
  }, [competition?.id]);

  // Server clock sync every 30s
  useEffect(() => {
    if (!competition?.id) return;
    let cancelled = false;
    let interval;

    const syncTimer = async () => {
      try {
        const data = await competitionService.getTimerSync(competition.id);
        const serverTime = new Date(data.serverTime).getTime();
        serverTimeOffsetRef.current = serverTime - Date.now();
      } catch (e) {
        console.warn('Timer sync failed, using client clock:', e.message);
      }
      if (!cancelled) {
        interval = setTimeout(syncTimer, 30000);
      }
    };

    syncTimer();
    return () => {
      cancelled = true;
      clearTimeout(interval);
    };
  }, [competition?.id]);

  // Live countdown
  useEffect(() => {
    if (!competition?.endTime) return;

    const updateTimer = () => {
      const end = new Date(competition.endTime);
      const now = getServerNow(serverTimeOffsetRef);
      const diff = end - now;

      if (diff <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0, expired: true });

        if (!submittedRef?.current && !expiryAutoSubmitTriggeredRef.current) {
          expiryAutoSubmitTriggeredRef.current = true;
          toast("⏰ Time is up! Auto submitting your solutions...");
          setTimeout(() => onExpiry?.(), 1000);
        }
        return;
      }

      if (diff <= warningThresholdMs && !sixtySecWarningShownRef.current) {
        sixtySecWarningShownRef.current = true;
        setShowTimeWarning(true);
        toast('⚠️ 60 seconds remaining — your solutions will be auto-submitted when time expires.', {
          duration: 6000,
          style: { background: '#dc2626', color: '#fff', fontWeight: '600' }
        });
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ hours, minutes, seconds, expired: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competition?.endTime]);

  /** Get competition status using server-adjusted time. */
  const status = getCompetitionStatus(competition, getServerNow(serverTimeOffsetRef));

  /** Get time-until-start display string. */
  const timeUntilStart = getTimeUntilStart(competition, getServerNow(serverTimeOffsetRef));

  /** Format time remaining for display. */
  const getTimeRemainingDisplay = useCallback(() => {
    if (timeRemaining.expired) return "⏰ Time's up!";
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(timeRemaining.hours)}:${pad(timeRemaining.minutes)}:${pad(timeRemaining.seconds)} remaining`;
  }, [timeRemaining]);

  return {
    timeRemaining,
    showTimeWarning,
    setShowTimeWarning,
    getTimeRemainingDisplay,
    getCompetitionStatus: status,
    getTimeUntilStart: timeUntilStart,
    serverTimeOffsetRef
  };
}
