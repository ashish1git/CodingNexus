import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

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
 * Fullscreen enforcement + violation tracking for student quizzes.
 * On 3 violations, fires onMaxViolations so the caller can auto-submit.
 */
export default function useQuizProtection({ onMaxViolations } = {}) {
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarningOverlay, setShowWarningOverlay] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const [fullscreenFailed, setFullscreenFailed] = useState(false);
  const [fullscreenDiag, setFullscreenDiag] = useState(null);
  const submittedRef = useRef(false);
  const tabSwitchCountRef = useRef(0);

  useEffect(() => { tabSwitchCountRef.current = tabSwitchCount; }, [tabSwitchCount]);

  const recordViolation = useCallback((reason) => {
    if (submittedRef.current) return;
    setTabSwitchCount(prev => {
      const next = prev + 1;
      if (next >= MAX_VIOLATIONS) {
        submittedRef.current = true;
        setTimeout(() => onMaxViolations?.(next), 1500);
      } else {
        setShowWarningOverlay(true);
      }
      return next;
    });
  }, [onMaxViolations]);

  useEffect(() => {
    let violationCooldown = false;

    if (!document.fullscreenElement) setShowFullscreenPrompt(true);

    const handleBlur = () => {
      window.focus();
      if (violationCooldown || submittedRef.current) return;
      violationCooldown = true;
      setTimeout(() => { violationCooldown = false; }, 1000);
      recordViolation('window lost focus (Alt+Tab/minimize)');
      setTabSwitchCount(prev => {
        if (prev + 1 < MAX_VIOLATIONS) setShowWarningOverlay(true);
        return prev;
      });
    };

    const handleVisibility = () => {
      if (document.hidden && !submittedRef.current) {
        recordViolation('page hidden (tab switched)');
      }
    };

    const handleBeforeUnload = (e) => {
      if (submittedRef.current) return;
      e.preventDefault();
      e.returnValue = 'Leaving will auto-submit your quiz!';
      return e.returnValue;
    };

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'w'].includes(e.key)) {
        e.preventDefault();
        toast.error(`🚫 ${e.key.toUpperCase()} is disabled during quiz`);
      }
      if (e.key === 'F11') e.preventDefault();
    };

    const handleFullscreenChange = () => {
      const inFullscreen = !!document.fullscreenElement;
      if (inFullscreen) {
        setShowFullscreenPrompt(false);
        setFullscreenFailed(false);
      }
    };

    const handleFullscreenError = (e) => {
      const diag = getFullscreenDiag();
      setFullscreenDiag(diag);
      setFullscreenFailed(true);
      console.error('🔴 QUIZ FULLSCREEN ERROR', diag, e);
    };

    const handleCopy = (e) => { e.preventDefault(); toast.error('🚫 Copy disabled'); };
    const handlePaste = (e) => { e.preventDefault(); toast.error('🚫 Paste disabled'); };
    const handleContext = (e) => { e.preventDefault(); };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('fullscreenerror', handleFullscreenError);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContext);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('fullscreenerror', handleFullscreenError);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContext);
    };
  }, [recordViolation]);

  const enterFullscreen = useCallback(() => {
    if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
      setShowFullscreenPrompt(false);
      setFullscreenFailed(false);
      return;
    }

    if (!document.fullscreenEnabled && !document.webkitFullscreenEnabled) {
      const diag = getFullscreenDiag();
      setFullscreenDiag(diag);
      setFullscreenFailed(true);
      console.error('🔴 Quiz fullscreen pre-check failed — fullscreenEnabled is false', diag);
      toast.error('Fullscreen is not allowed in this browser/context');
      return;
    }

    const el = document.documentElement;
    const request = el.requestFullscreen?.bind(el)
      || el.webkitRequestFullscreen?.bind(el)
      || el.msRequestFullscreen?.bind(el);

    if (request) {
      request().then(() => {
        setShowFullscreenPrompt(false);
        setFullscreenFailed(false);
        toast.success('✅ Fullscreen enabled');
      }).catch((err) => {
        const diag = getFullscreenDiag();
        setFullscreenDiag(diag);
        setFullscreenFailed(true);
        console.error('🔴 Quiz fullscreen request rejected', diag, err);
        toast.error('Could not enter fullscreen. Press F11 for browser fullscreen.');
      });
    } else {
      const diag = getFullscreenDiag();
      setFullscreenDiag(diag);
      setFullscreenFailed(true);
      console.error('🔴 Quiz fullscreen — no API available', diag);
      toast.error('Fullscreen not supported in this browser. Press F11 to enter fullscreen.');
    }
  }, []);

  return {
    tabSwitchCount,
    showWarningOverlay,
    setShowWarningOverlay,
    showFullscreenPrompt,
    setShowFullscreenPrompt,
    enterFullscreen,
    fullscreenFailed,
    fullscreenDiag,
    setFullscreenFailed,
    submittedRef,
    MAX_VIOLATIONS,
  };
}
