import React from 'react';

/**
 * Competition overlays: tab-switch warning, 60s warning, fullscreen prompt,
 * and F11 fallback dialog when requestFullscreen fails.
 */
export default function Overlays({
  showWarningOverlay,
  tabSwitchCount,
  onDismissWarning,
  showTimeWarning,
  onDismissTimeWarning,
  showFullscreenPrompt,
  onEnterFullscreen,
  competitionStatus,
  fullscreenFailed,
  fullscreenDiag,
  onDismissFullscreenFailed
}) {
  // Temporarily unblock F11 when showing fallback dialog
  const handleF11FallbackKeyDown = (e) => {
    if (e.key === 'F11') {
      // Allow F11 through — we want user to use browser fullscreen
      return;
    }
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <>
      {/* ⚠️ TAB SWITCH WARNING OVERLAY */}
      {showWarningOverlay && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center">
          <div className="bg-[#1e1e1e] border-2 border-red-500 rounded-2xl p-10 max-w-md w-full mx-4 text-center shadow-2xl shadow-red-500/20">
            <div className="text-6xl mb-4">🚨</div>
            <h2 className="text-2xl font-bold text-red-400 mb-2">Tab Switch Detected!</h2>
            <p className="text-gray-300 mb-2">You switched away from the competition window.</p>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 mb-4 inline-block">
              <span className="text-red-400 font-bold text-lg">Violations: {tabSwitchCount} / 3</span>
            </div>
            <p className="text-yellow-400 text-sm font-semibold mb-2">
              ⚠️ After 3 violations your solutions will be auto-submitted and you will be removed.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              All tab switches are logged and reviewed by administrators. Repeated violations may result in disqualification.
            </p>
            <button
              onClick={onDismissWarning}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors text-lg"
            >
              🔒 Re-enter Fullscreen & Continue
            </button>
          </div>
        </div>
      )}

      {/* ⏰ 60-SECOND WARNING OVERLAY */}
      {showTimeWarning && !showWarningOverlay && (
        <div className="fixed inset-0 z-[9997] bg-black/85 flex items-center justify-center">
          <div className="bg-[#1e1e1e] border-2 border-red-500 rounded-2xl p-10 max-w-md w-full mx-4 text-center shadow-2xl shadow-red-500/20 animate-pulse">
            <div className="text-6xl mb-4">⏰</div>
            <h2 className="text-2xl font-bold text-red-400 mb-2">Time is Running Out!</h2>
            <p className="text-gray-300 mb-4 text-lg">
              Less than <span className="text-red-400 font-bold text-2xl">60 seconds</span> remaining.
            </p>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4">
              <p className="text-yellow-400 font-semibold">
                Your solutions will be <span className="text-red-400">auto-submitted</span> when time expires.
              </p>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              Make sure all your code is saved. Any unsaved changes will be included in the auto-submission.
            </p>
            <button
              onClick={onDismissTimeWarning}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors text-lg"
            >
              Got it, I'm almost done!
            </button>
          </div>
        </div>
      )}

      {/* 🔒 FULLSCREEN REQUIRED BANNER */}
      {showFullscreenPrompt && !showWarningOverlay && !fullscreenFailed && competitionStatus === 'ongoing' && (
        <div className="fixed inset-0 z-[9998] bg-black/90 flex items-center justify-center">
          <div className="bg-[#1e1e1e] border-2 border-yellow-500 rounded-2xl p-10 max-w-md w-full mx-4 text-center shadow-2xl shadow-yellow-500/20">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">Fullscreen Required</h2>
            <p className="text-gray-300 mb-6">
              This competition must be taken in fullscreen mode.<br />
              Tab switching is monitored and all violations are logged.
            </p>
            <button
              onClick={onEnterFullscreen}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-colors text-lg"
            >
              🖥️ Enter Fullscreen & Start Competition
            </button>
          </div>
        </div>
      )}

      {/* 🔧 F11 FALLBACK DIALOG — shown when requestFullscreen fails */}
      {fullscreenFailed && !showWarningOverlay && competitionStatus === 'ongoing' && (
        <div
          className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center"
          onKeyDown={handleF11FallbackKeyDown}
        >
          <div className="bg-[#1e1e1e] border-2 border-red-500 rounded-2xl p-10 max-w-lg w-full mx-4 text-center shadow-2xl shadow-red-500/30">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-400 mb-3">Fullscreen Failed</h2>
            <p className="text-gray-300 mb-4">
              Automatic fullscreen could not be activated on this device.
            </p>

            {/* Diagnostic info */}
            {fullscreenDiag && (
              <div className="bg-[#111] border border-[#333] rounded-lg p-3 mb-4 text-left text-xs font-mono text-gray-400 space-y-1">
                <p><span className="text-gray-500">Browser:</span> {fullscreenDiag.browser} | {fullscreenDiag.platform}</p>
                <p><span className="text-gray-500">fullscreenEnabled:</span> <span className={fullscreenDiag.fullscreenEnabled ? 'text-green-400' : 'text-red-400'}>{String(fullscreenDiag.fullscreenEnabled)}</span></p>
                <p><span className="text-gray-500">userActivation:</span> <span className={fullscreenDiag.userActivationIsActive ? 'text-green-400' : 'text-red-400'}>{String(fullscreenDiag.userActivationIsActive)}</span></p>
                <p className="truncate"><span className="text-gray-500">UA:</span> {fullscreenDiag.userAgent}</p>
              </div>
            )}

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
              <p className="text-yellow-400 font-bold text-lg mb-1">Press F11</p>
              <p className="text-yellow-300/70 text-sm">
                Press the <kbd className="px-1.5 py-0.5 bg-yellow-500/20 border border-yellow-500/40 rounded text-yellow-300 font-mono text-xs">F11</kbd> key
                on your keyboard to manually enter fullscreen mode, then click Continue.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onEnterFullscreen}
                className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-colors text-sm"
              >
                🔄 Retry Fullscreen
              </button>
              <button
                onClick={onDismissFullscreenFailed}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors text-sm"
              >
                Continue (F11 pressed)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
