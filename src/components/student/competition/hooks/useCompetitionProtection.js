import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { getServerNow, getCompetitionStatus } from '../utils/timeUtils';
import {
  buildLogEntry,
  getStorageKey,
  persistViolationState,
  restoreViolationState,
  clearViolationStorage
} from '../utils/violationUtils';

const MAX_VIOLATIONS = 3;

/**
 * Collect browser diagnostic info for fullscreen troubleshooting.
 */
const getFullscreenDiag = () => ({
  timestamp: new Date().toISOString(),
  browser: (() => {
    const ua = navigator.userAgent;
    if (ua.includes('Edg/')) return 'Edge';
    if (ua.includes('Chrome/')) return 'Chrome';
    if (ua.includes('Firefox/')) return 'Firefox';
    if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
    return 'Unknown';
  })(),
  userAgent: navigator.userAgent.substring(0, 200),
  fullscreenEnabled: document.fullscreenEnabled,
  fullscreenElement: !!document.fullscreenElement,
  userActivationIsActive: navigator.userActivation ? navigator.userActivation.isActive : 'unavailable',
  platform: navigator.platform,
  screenSize: `${screen.width}x${screen.height}`,
  windowSize: `${window.innerWidth}x${window.innerHeight}`
});

/**
 * Fullscreen enforcement, tab-switch detection, clipboard blocking, and
 * violation logging for coding competitions.
 *
 * @param {Object} competition - Competition object with startTime/endTime
 * @param {Object} opts
 * @param {Object} opts.submittedRef - Ref tracking submission state
 * @param {Object} opts.serverTimeOffsetRef - Ref from useTimer for server-adjusted time
 * @param {Function} opts.onKick - Callback(violationCount) when max violations exceeded
 * @returns {Object} Protection state and controls
 */
export default function useCompetitionProtection(competition, { submittedRef, serverTimeOffsetRef, onKick } = {}) {
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarningOverlay, setShowWarningOverlay] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const [fullscreenFailed, setFullscreenFailed] = useState(false);   // F11 fallback trigger
  const [fullscreenDiag, setFullscreenDiag] = useState(null);        // last diagnostic

  const violationLogRef = useRef([]);
  const deviceInfoRef = useRef(null);
  const isFullscreenRef = useRef(false);
  const tabSwitchCountRef = useRef(0);
  const kickTimeoutRef = useRef(null);

  // Sync isFullscreenRef
  useEffect(() => { isFullscreenRef.current = isFullscreen; }, [isFullscreen]);
  useEffect(() => { tabSwitchCountRef.current = tabSwitchCount; }, [tabSwitchCount]);

  // Restore violation state on mount
  useEffect(() => {
    if (!competition?.id) return;
    const storageKey = getStorageKey(competition.id, 'violations');
    const restored = restoreViolationState(storageKey);
    if (restored.violationLog && restored.violationLog.length > 0) {
      violationLogRef.current = restored.violationLog;
    }
    if (restored.tabCount && restored.tabCount > 0) {
      setTabSwitchCount(restored.tabCount);
      tabSwitchCountRef.current = restored.tabCount;
    }
  }, [competition?.id]);

  const persistNow = () => {
    const key = getStorageKey(competition?.id, 'violations');
    persistViolationState(key, violationLogRef.current, tabSwitchCountRef.current);
  };

  const clearLog = () => {
    const key = getStorageKey(competition?.id, 'violations');
    clearViolationStorage(key);
    violationLogRef.current = [];
  };

  // Main protection effect
  useEffect(() => {
    if (!competition) return;

    const serverNow = getServerNow(serverTimeOffsetRef);
    const isOngoing = getCompetitionStatus(competition, serverNow) === 'ongoing';
    if (!isOngoing) return;

    let violationCooldown = false;

    // Capture device fingerprint once
    if (!deviceInfoRef.current) {
      deviceInfoRef.current = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        windowSize: `${window.innerWidth}x${window.innerHeight}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        startTime: new Date().toISOString()
      };
      violationLogRef.current.push({
        ...buildLogEntry('session_start', 'competition protections activated'),
        deviceInfo: deviceInfoRef.current
      });
      persistNow();
    }

    const kickStudent = async (count) => {
      if (submittedRef?.current) return;
      submittedRef.current = true;
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      await onKick?.(count, [...violationLogRef.current]);
      clearLog();
      window.location.href = `/student/competitions?kicked=true&violations=${count}`;
    };

    const recordViolation = (reason) => {
      if (submittedRef?.current) return;
      if (violationCooldown) return;
      violationCooldown = true;
      setTimeout(() => { violationCooldown = false; }, 1000);

      violationLogRef.current.push(buildLogEntry('violation', reason));
      persistNow();

      setTabSwitchCount(prev => {
        const newCount = prev + 1;
        if (newCount >= MAX_VIOLATIONS) {
          setTimeout(() => kickStudent(newCount), 1500);
        } else {
          setShowWarningOverlay(true);
        }
        return newCount;
      });
    };

    const handleWindowBlur = () => {
      window.focus();
      recordViolation('window lost focus (Alt+Tab/minimize)');
    };

    const handleWindowFocus = () => {
      if (kickTimeoutRef.current) {
        clearTimeout(kickTimeoutRef.current);
        kickTimeoutRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation('page hidden (tab switched)');
        kickTimeoutRef.current = setTimeout(() => {
          setTabSwitchCount(prev => { kickStudent(prev); return prev; });
        }, 15000);
      } else {
        if (kickTimeoutRef.current) {
          clearTimeout(kickTimeoutRef.current);
          kickTimeoutRef.current = null;
        }
      }
    };

    const handleBeforeUnload = (e) => {
      if (submittedRef?.current) return;
      e.preventDefault();
      e.returnValue = 'Are you sure? Leaving will end your competition!';
      return 'Are you sure? Leaving will end your competition!';
    };

    const handleFullscreenChange = () => {
      const inFullscreen = !!document.fullscreenElement;
      setIsFullscreen(inFullscreen);
      isFullscreenRef.current = inFullscreen;
      if (inFullscreen) {
        setShowFullscreenPrompt(false);
        setFullscreenFailed(false);
        violationLogRef.current.push(buildLogEntry('fullscreen_enter', 'student entered fullscreen'));
        persistNow();
      } else {
        violationLogRef.current.push(buildLogEntry('fullscreen_exit', 'student exited fullscreen'));
        persistNow();
        recordViolation('exited fullscreen (pressed Escape)');
      }
    };

    const handleFullscreenError = (e) => {
      const diag = getFullscreenDiag();
      setFullscreenDiag(diag);
      setFullscreenFailed(true);
      setIsFullscreen(false);
      isFullscreenRef.current = false;

      console.error('🔴 FULLSCREEN ERROR', diag, e);

      violationLogRef.current.push(buildLogEntry(
        'fullscreen_error',
        `fullscreenerror event: ${e?.message || 'unknown'} | enabled=${diag.fullscreenEnabled} | hasElement=${diag.fullscreenElement} | activation=${diag.userActivationIsActive}`
      ));
      persistNow();
    };

    const logBlocked = (reason) => {
      if (submittedRef?.current) return;
      violationLogRef.current.push(buildLogEntry('clipboard_block', reason));
      persistNow();
    };

    const handleCopy = (e) => {
      e.preventDefault();
      e.stopPropagation();
      logBlocked('copy attempt blocked');
      toast.error('🚫 Copy is disabled during competition');
    };

    const handlePaste = (e) => {
      e.preventDefault();
      e.stopPropagation();
      logBlocked('paste attempt blocked');
      toast.error('🚫 Paste is disabled during competition');
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      logBlocked('right-click/contextmenu blocked');
      toast.error('🚫 Right-click is disabled during competition');
    };

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        logBlocked('Ctrl+C (copy) hotkey blocked');
        toast.error('🚫 Copy is disabled during competition');
        return false;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        logBlocked('Ctrl+V (paste) hotkey blocked');
        toast.error('🚫 Paste is disabled during competition');
        return false;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault();
        logBlocked('Ctrl+X (cut) hotkey blocked');
        toast.error('🚫 Cut is disabled during competition');
        return false;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        logBlocked('Ctrl+W (close tab) blocked');
        toast.error('🚫 Cannot close tab during competition');
        return false;
      }
      if (e.key === 'F11') {
        e.preventDefault();
        logBlocked('F11 fullscreen key blocked');
        return false;
      }
    };

    if (!document.fullscreenElement) setShowFullscreenPrompt(true);

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('fullscreenerror', handleFullscreenError);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      if (kickTimeoutRef.current) clearTimeout(kickTimeoutRef.current);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('fullscreenerror', handleFullscreenError);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competition]);

  const enterFullscreen = () => {
    // Already in fullscreen — nothing to do
    if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
      setShowFullscreenPrompt(false);
      setFullscreenFailed(false);
      return;
    }

    // Pre-check: is fullscreen even possible?
    if (!document.fullscreenEnabled && !document.webkitFullscreenEnabled) {
      const diag = getFullscreenDiag();
      setFullscreenDiag(diag);
      setFullscreenFailed(true);
      console.error('🔴 Fullscreen pre-check failed — fullscreenEnabled is false', diag);
      violationLogRef.current.push(buildLogEntry(
        'fullscreen_error',
        `fullscreenEnabled=false | ua=${diag.userAgent}`
      ));
      persistNow();
      toast.error('Fullscreen is not allowed in this browser/context');
      return;
    }

    const diag = getFullscreenDiag();
    if (!diag.userActivationIsActive && diag.userActivationIsActive !== 'unavailable') {
      setFullscreenDiag(diag);
      setFullscreenFailed(true);
      console.error('🔴 Fullscreen pre-check failed — no user activation', diag);
      violationLogRef.current.push(buildLogEntry(
        'fullscreen_error',
        `no user activation | ua=${diag.userAgent}`
      ));
      persistNow();
      toast.error('Fullscreen requires a direct user action. Please click the button again.');
      return;
    }

    const elem = document.documentElement;
    const tryRequest = (method) => {
      try {
        const promise = elem[method]();
        if (promise && promise.then) {
          promise.then(() => {
            isFullscreenRef.current = true;
            setIsFullscreen(true);
            setFullscreenFailed(false);
            toast.success('✅ Fullscreen enabled - tab switching is locked');
          }).catch(err => {
            const failDiag = getFullscreenDiag();
            setFullscreenDiag(failDiag);
            setFullscreenFailed(true);
            console.error('🔴 Fullscreen request rejected', failDiag, err);
            violationLogRef.current.push(buildLogEntry(
              'fullscreen_error',
              `request rejected: ${err.name}/${err.message} | fullscreenEnabled=${failDiag.fullscreenEnabled}`
            ));
            persistNow();
            toast.error('Could not enable fullscreen. Press F11 or use the button below to try again.');
          });
        } else {
          isFullscreenRef.current = true;
          setIsFullscreen(true);
          setFullscreenFailed(false);
          toast.success('✅ Fullscreen enabled');
        }
      } catch (err) {
        const failDiag = getFullscreenDiag();
        setFullscreenDiag(failDiag);
        setFullscreenFailed(true);
        console.error('🔴 Fullscreen threw exception', failDiag, err);
        violationLogRef.current.push(buildLogEntry(
          'fullscreen_error',
          `exception: ${err.name}/${err.message} | fullscreenEnabled=${failDiag.fullscreenEnabled}`
        ));
        persistNow();
        toast.error('Could not enter fullscreen: ' + err.message);
      }
    };

    if (elem.requestFullscreen) {
      tryRequest('requestFullscreen');
    } else if (elem.webkitRequestFullscreen) {
      tryRequest('webkitRequestFullscreen');
    } else if (elem.msRequestFullscreen) {
      tryRequest('msRequestFullscreen');
    } else {
      const failDiag = getFullscreenDiag();
      setFullscreenDiag(failDiag);
      setFullscreenFailed(true);
      console.error('🔴 No fullscreen API available', failDiag);
      violationLogRef.current.push(buildLogEntry('fullscreen_error', 'no fullscreen API on this browser'));
      persistNow();
      toast.error('Fullscreen not supported in this browser. Press F11 to enter browser fullscreen.');
    }
  };

  return {
    tabSwitchCount,
    setTabSwitchCount,
    showWarningOverlay,
    setShowWarningOverlay,
    showFullscreenPrompt,
    setShowFullscreenPrompt,
    isFullscreen,
    setIsFullscreen,
    enterFullscreen,
    fullscreenFailed,
    fullscreenDiag,
    violationLogRef,
    tabSwitchCountRef,
    clearViolationLog: clearLog
  };
}
