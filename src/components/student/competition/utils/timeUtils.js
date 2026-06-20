/**
 * Pad a number to 2 digits.
 */
const pad = (n) => String(n).padStart(2, '0');

/**
 * Get server-time-adjusted current time.
 */
export function getServerNow(serverTimeOffsetRef) {
  return new Date(Date.now() + serverTimeOffsetRef.current);
}

/**
 * Determine competition status from server-relative time.
 */
export function getCompetitionStatus(competition, serverNow) {
  if (!competition) return 'unknown';
  const start = new Date(competition.startTime);
  const end = new Date(competition.endTime);
  if (serverNow < start) return 'not-started';
  if (serverNow > end) return 'ended';
  return 'ongoing';
}

/**
 * Get human-readable time-until-start string or empty string if already started.
 */
export function getTimeUntilStart(competition, serverNow) {
  if (!competition) return '';
  const start = new Date(competition.startTime);
  const diff = start - serverNow;
  if (diff <= 0) return '';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `Starts in ${days}d ${hours % 24}h`;
  }
  return `Starts in ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Format time remaining object into display string.
 */
export function formatTimeRemaining(timeRemaining) {
  if (timeRemaining.expired) return "⏰ Time's up!";
  return `${pad(timeRemaining.hours)}:${pad(timeRemaining.minutes)}:${pad(timeRemaining.seconds)} remaining`;
}

/**
 * Format a date to IST locale string.
 */
export function formatToIST(dateStr) {
  return new Date(dateStr).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}
