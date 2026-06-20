/**
 * Build a violation log entry with environment context.
 */
export function buildLogEntry(type, reason) {
  return {
    type,
    reason,
    timestamp: new Date().toISOString(),
    isFullscreen: !!document.fullscreenElement,
    screenSize: `${window.innerWidth}x${window.innerHeight}`,
    userAgent: navigator.userAgent.substring(0, 120)
  };
}

/**
 * Get the sessionStorage key for a competition + suffix.
 */
export function getStorageKey(competitionId, suffix) {
  return `cn-${competitionId}-${suffix}`;
}

/**
 * Persist violation data to sessionStorage (survives back-button navigation).
 */
export function persistViolationState(storageKey, violationLog, tabCount) {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(violationLog));
    sessionStorage.setItem(`${storageKey}-tabCount`, String(tabCount));
  } catch (_) { /* quota exceeded, ignore */ }
}

/**
 * Restore violation data from sessionStorage.
 * Returns { violationLog: Array, tabCount: number } or nulls.
 */
export function restoreViolationState(storageKey) {
  try {
    const savedViolations = sessionStorage.getItem(storageKey);
    const savedCount = sessionStorage.getItem(`${storageKey}-tabCount`);
    let violationLog = null;
    let tabCount = null;

    if (savedViolations) {
      const parsed = JSON.parse(savedViolations);
      if (Array.isArray(parsed) && parsed.length > 0) {
        violationLog = parsed;
      }
    }
    if (savedCount) {
      const count = parseInt(savedCount, 10);
      if (count > 0) tabCount = count;
    }
    return { violationLog, tabCount };
  } catch (_) {
    return { violationLog: null, tabCount: null };
  }
}

/**
 * Clear violation data from sessionStorage.
 */
export function clearViolationStorage(storageKey) {
  try {
    sessionStorage.removeItem(storageKey);
    sessionStorage.removeItem(`${storageKey}-tabCount`);
  } catch (_) {}
}
