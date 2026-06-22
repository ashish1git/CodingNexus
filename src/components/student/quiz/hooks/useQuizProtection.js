import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

const MAX_VIOLATIONS = 3;

/**
 * Fullscreen enforcement + violation tracking for student quizzes.
 * On 3 violations, fires onMaxViolations so the caller can auto-submit.
 */
export default function useQuizProtection({ onMaxViolations } = {}) {
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarningOverlay, setShowWarningOverlay] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
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

    const handleCopy = (e) => { e.preventDefault(); toast.error('🚫 Copy disabled'); };
    const handlePaste = (e) => { e.preventDefault(); toast.error('🚫 Paste disabled'); };
    const handleContext = (e) => { e.preventDefault(); };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContext);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContext);
    };
  }, [recordViolation]);

  const enterFullscreen = useCallback(() => {
    const el = document.documentElement;
    const request = el.requestFullscreen?.bind(el)
      || el.webkitRequestFullscreen?.bind(el)
      || el.msRequestFullscreen?.bind(el);
    if (request) {
      request().then(() => {
        setShowFullscreenPrompt(false);
        toast.success('✅ Fullscreen enabled');
      }).catch(() => toast.error('Could not enter fullscreen'));
    } else {
      toast.error('Fullscreen not supported');
    }
  }, []);

  return {
    tabSwitchCount,
    showWarningOverlay,
    setShowWarningOverlay,
    showFullscreenPrompt,
    setShowFullscreenPrompt,
    enterFullscreen,
    submittedRef,
    MAX_VIOLATIONS,
  };
}
