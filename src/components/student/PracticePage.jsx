import React from 'react';
import { usePracticeEngine } from '../../hooks/usePracticeEngine';
import PracticeSetup from './PracticeSetup';
import PracticeSession from './PracticeSession';
import PracticeResults from './PracticeResults';

/**
 * PracticePage
 * Single entry-point for the practice engine.
 * Renders the right phase (setup → session → results) driven by usePracticeEngine.
 */
export default function PracticePage() {
  const engine = usePracticeEngine();

  if (engine.phase === 'idle' || engine.phase === 'loading') {
    return (
      <PracticeSetup
        onStart={engine.startSession}
        loading={engine.phase === 'loading'}
      />
    );
  }

  if (engine.phase === 'finished') {
    return <PracticeResults engine={engine} />;
  }

  // active | reviewing
  return <PracticeSession engine={engine} />;
}
