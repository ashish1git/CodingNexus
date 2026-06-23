import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { eventService } from '../../services/eventService';
import { getServerNow, getQuizStatus, getQuizRemainingSeconds } from './utils/eventTimeUtils';

const ServerTimeContext = createContext(null);

/**
 * Wraps components so they all share the same server-synced clock.
 *
 * Usage:
 *   import { ServerTimeProvider, useServerTime } from './ServerTimeProvider';
 *
 *   function App() {
 *     return (
 *       <ServerTimeProvider>
 *         <EventQuizList />
 *         <EventQuizAttempt />
 *       </ServerTimeProvider>
 *     );
 *   }
 *
 *   // Inside any child:
 *   const { serverNow, getQuizStatus } = useServerTime();
 *
 * @param {Object} props
 * @param {Function} props.fetchTime - Async function that returns { serverTime }. Defaults to eventService.getServerTime.
 * @param {number} props.syncInterval - Sync interval in ms (default 30000).
 */
export function ServerTimeProvider({ children, fetchTime, syncInterval = 30000, fallback }) {
  const doFetch = fetchTime || eventService.getServerTime;
  const serverTimeOffsetRef = useRef(0);
  const readyRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [serverNow, setServerNow] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId;
    let tickId;

    const sync = async () => {
      try {
        const data = await doFetch();
        const serverTime = new Date(data.serverTime).getTime();
        serverTimeOffsetRef.current = serverTime - Date.now();
        if (!cancelled) {
          setServerNow(getServerNow(serverTimeOffsetRef));
          if (!readyRef.current) {
            readyRef.current = true;
            setReady(true);
          }
        }
      } catch {
        if (!cancelled) {
          setServerNow(new Date());
          if (!readyRef.current) {
            readyRef.current = true;
            setReady(true);
          }
        }
      }
      if (!cancelled) timeoutId = setTimeout(sync, syncInterval);
    };

    sync();

    // Start 1-second tick only after first sync completes
    const waitForReady = setInterval(() => {
      if (readyRef.current && !cancelled) {
        clearInterval(waitForReady);
        tickId = setInterval(() => {
          if (!cancelled) setServerNow(getServerNow(serverTimeOffsetRef));
        }, 1000);
      }
    }, 100);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      clearInterval(tickId);
      clearInterval(waitForReady);
    };
  }, [syncInterval]);

  const resync = useCallback(() => {
    serverTimeOffsetRef.current = 0;
    setServerNow(new Date());
    setReady(true);
    readyRef.current = true;
  }, []);

  const value = {
    serverNow,
    serverTimeOffsetRef,
    ready,
    resync,
    getQuizStatus: (quiz) => quiz && serverNow ? getQuizStatus(quiz, serverNow) : 'unknown',
    getRemainingSeconds: (quiz) => quiz && serverNow ? getQuizRemainingSeconds(quiz, serverNow) : 0,
  };

  return (
    <ServerTimeContext.Provider value={value}>
      {ready ? children : (fallback || null)}
    </ServerTimeContext.Provider>
  );
}

/**
 * Hook to consume server time from the nearest ServerTimeProvider.
 */
export function useServerTime() {
  const ctx = useContext(ServerTimeContext);
  if (!ctx) {
    throw new Error('useServerTime must be used within a <ServerTimeProvider>');
  }
  return ctx;
}
