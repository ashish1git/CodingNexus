import { useState, useEffect, useRef } from 'react';
import { eventService } from '../../../services/eventService';
import { getServerNow, getQuizStatus, getQuizRemainingSeconds } from '../utils/eventTimeUtils';

/**
 * Hook that syncs with server time and provides server-adjusted time utilities.
 *
 * @param {Object} opts
 * @param {number} opts.syncInterval - How often to re-sync server time in ms (default 30000)
 * @returns {Object} Server time state and helpers
 */
export default function useEventServerTime({ syncInterval = 30000 } = {}) {
  const serverTimeOffsetRef = useRef(0);
  const [serverNow, setServerNow] = useState(() => new Date());

  // Sync server clock periodically
  useEffect(() => {
    let cancelled = false;
    let timeoutId;

    const sync = async () => {
      try {
        const data = await eventService.getServerTime();
        const serverTime = new Date(data.serverTime).getTime();
        serverTimeOffsetRef.current = serverTime - Date.now();
        if (!cancelled) {
          setServerNow(getServerNow(serverTimeOffsetRef));
        }
      } catch {
        // Fall back to client clock silently
        if (!cancelled) {
          setServerNow(new Date());
        }
      }
      if (!cancelled) {
        timeoutId = setTimeout(sync, syncInterval);
      }
    };

    sync();

    // Recompute server now every second for live UI updates
    const tick = setInterval(() => {
      if (!cancelled) {
        setServerNow(getServerNow(serverTimeOffsetRef));
      }
    }, 1000);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      clearInterval(tick);
    };
  }, [syncInterval]);

  return {
    /** Server-adjusted current time (updated every second). */
    serverNow,
    /** The offset ref (useful if you need raw offset elsewhere). */
    serverTimeOffsetRef,
    /** Re-sync immediately. */
    resync: () => {
      serverTimeOffsetRef.current = 0;
      setServerNow(new Date());
    },
    /** Get quiz status using server time. */
    getQuizStatus: (quiz) => getQuizStatus(quiz, serverNow),
    /** Get remaining seconds for quiz using server time. */
    getRemainingSeconds: (quiz) => getQuizRemainingSeconds(quiz, serverNow),
  };
}
