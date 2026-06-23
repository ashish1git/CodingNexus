/**
 * Get server-time-adjusted current time.
 */
export function getServerNow(serverTimeOffsetRef) {
  return new Date(Date.now() + (serverTimeOffsetRef?.current || 0));
}

/**
 * Get quiz status from server-relative time.
 */
export function getQuizStatus(quiz, serverNow) {
  if (!quiz || !serverNow) return 'unknown';
  const start = new Date(quiz.startTime);
  const end = new Date(quiz.endTime);
  if (quiz.attempted) return 'attempted';
  if (serverNow < start) return 'upcoming';
  if (serverNow > end) return 'ended';
  return 'active';
}

/**
 * Get remaining seconds for a quiz attempt, respecting endTime and duration.
 */
export function getQuizRemainingSeconds(quiz, serverNow) {
  if (!quiz?.endTime || !serverNow) return 0;
  const end = new Date(quiz.endTime);
  const windowRemaining = Math.floor((end - serverNow) / 1000);
  const durationSeconds = (quiz.duration || 60) * 60;
  return Math.min(Math.max(windowRemaining, 0), durationSeconds);
}

/**
 * Format seconds into HH:MM:SS display.
 */
export function formatTime(seconds) {
  if (seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
