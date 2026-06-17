import React, { useState, useCallback } from 'react';
import { usePracticeEngine } from '../../hooks/usePracticeEngine';
import PracticeSetup from './PracticeSetup';
import PracticeSession from './PracticeSession';
import PracticeResults from './PracticeResults';
import { Cpu } from 'lucide-react';

/**
 * PracticePage
 * Single entry-point for the practice engine.
 * Renders the right phase (setup → session → results) driven by usePracticeEngine.
 */
export default function PracticePage() {
  const engine = usePracticeEngine();
  const [setupKey, setSetupKey] = useState(0);

  const handleReset = useCallback(() => {
    engine.reset();
    setSetupKey(k => k + 1);
  }, [engine]);

  if (engine.phase === 'loading') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <LoadingCpuIcon />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-white">AI is Generating Your Questions</h2>
            <p className="text-slate-400 text-sm max-w-xs">
              Crafting fresh placement-style questions in real time. This may take 5–15 seconds.
            </p>
          </div>
          <div className="w-56 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full animate-[loadBar_2s_ease-in-out_infinite]"
              style={{ '--tw-translate-x': '100%' }}
            />
          </div>
        </div>
        <style>{`
          @keyframes loadBar {
            0%   { width: 5%;  transform: translateX(0); }
            30%  { width: 50%; }
            60%  { width: 85%; }
            90%  { width: 95%; transform: translateX(0); }
            100% { width: 98%; }
          }
        `}</style>
      </div>
    );
  }

  if (engine.phase === 'idle') {
    return (
      <PracticeSetup
        key={setupKey}
        onStart={engine.startSession}
        loading={false}
      />
    );
  }

  if (engine.phase === 'finished') {
    return <PracticeResults engine={engine} onReset={handleReset} />;
  }

  // active | reviewing
  return <PracticeSession engine={engine} />;
}

function LoadingCpuIcon() {
  return (
    <svg className="w-10 h-10 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2" className="animate-pulse" />
      <rect x="9" y="9" width="6" height="6" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
      <line x1="9" y1="1" x2="9" y2="4" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
      <line x1="15" y1="1" x2="15" y2="4" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
      <line x1="9" y1="20" x2="9" y2="23" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
      <line x1="15" y1="20" x2="15" y2="23" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
      <line x1="20" y1="9" x2="23" y2="9" className="animate-pulse" style={{ animationDelay: '0.35s' }} />
      <line x1="20" y1="14" x2="23" y2="14" className="animate-pulse" style={{ animationDelay: '0.55s' }} />
      <line x1="1" y1="9" x2="4" y2="9" className="animate-pulse" style={{ animationDelay: '0.45s' }} />
      <line x1="1" y1="14" x2="4" y2="14" className="animate-pulse" style={{ animationDelay: '0.65s' }} />
    </svg>
  );
}
