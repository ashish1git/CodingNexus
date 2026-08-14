import React from 'react';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Terminal, AlertCircle, Zap } from 'lucide-react';

function getOptimizationStyle(multiplier) {
  if (multiplier <= 0.70) return { bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400', icon: 'text-red-400' };
  if (multiplier <= 0.85) return { bg: 'bg-orange-500/10 border-orange-500/30', text: 'text-orange-400', icon: 'text-orange-400' };
  return { bg: 'bg-yellow-500/10 border-yellow-500/30', text: 'text-yellow-400', icon: 'text-yellow-400' };
}

/**
 * Expandable test results panel showing per-case pass/fail, I/O, errors,
 * and optimization feedback when solution is correct but inefficient.
 */
export default function TestResults({ testResults, showTestCases, onToggle }) {
  const { efficiencyMultiplier, optimizationFeedback } = testResults;
  const showOptimization = efficiencyMultiplier != null && efficiencyMultiplier < 1.0 && optimizationFeedback;

  return (
    <div className="border-t border-[#3e3e3e] bg-[#262626] shadow-lg">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#2e2e2e] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-gray-400" />
          <span className="font-semibold text-sm text-white">Test Results</span>
          {testResults.accepted ? (
            <span className="text-green-400 text-sm flex items-center gap-2 font-medium px-3 py-1 bg-green-500/10 rounded-full">
              <CheckCircle className="w-4 h-4" />
              Accepted ({testResults.total}/{testResults.total})
            </span>
          ) : (
            <span className="text-red-400 text-sm font-medium px-3 py-1 bg-red-500/10 rounded-full">
              {testResults.passed}/{testResults.total} Passed
            </span>
          )}
        </div>
        {showTestCases ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {showTestCases && (
        <div className="max-h-80 overflow-y-auto border-t border-[#3e3e3e]">
          <div className="p-4 space-y-3">
            {showOptimization && (() => {
              const style = getOptimizationStyle(efficiencyMultiplier);
              return (
                <div className={`p-4 rounded-lg border-2 flex items-start gap-3 ${style.bg}`}>
                  <Zap className={`w-5 h-5 mt-0.5 flex-shrink-0 ${style.icon}`} />
                  <div>
                    <p className={`text-sm font-semibold ${style.text}`}>
                      Performance Notice — {Math.round((1 - efficiencyMultiplier) * 100)}% deduction
                    </p>
                    <p className="text-sm text-gray-300 mt-1">{optimizationFeedback}</p>
                  </div>
                </div>
              );
            })()}
            {testResults.cases?.map((testCase) => (
              <div
                key={testCase.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  testCase.passed
                    ? 'bg-green-500/5 border-green-500/30 hover:bg-green-500/10'
                    : 'bg-red-500/5 border-red-500/30 hover:bg-red-500/10'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {testCase.passed ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="text-sm font-semibold text-white">
                      Test Case {testCase.id}
                      {testCase.hidden && <span className="text-gray-500 ml-2 text-xs">(Hidden)</span>}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 font-medium px-2 py-1 bg-[#1e1e1e] rounded">
                    {testCase.time}
                  </span>
                </div>
                {!testCase.hidden && (
                  <div className="space-y-3 text-xs font-mono mt-3">
                    <div>
                      <div className="text-gray-400 mb-1.5 font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Input:
                      </div>
                      <pre className="text-gray-200 bg-[#1e1e1e] p-3 rounded-lg overflow-x-auto border border-[#3e3e3e]">{testCase.input || 'N/A'}</pre>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1.5 font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Expected:
                      </div>
                      <pre className="text-gray-200 bg-[#1e1e1e] p-3 rounded-lg overflow-x-auto border border-[#3e3e3e]">
                        {testCase.expected ?? testCase.expectedOutput ?? 'N/A'}
                      </pre>
                    </div>
                    <div>
                      <div className={`mb-1.5 font-semibold flex items-center gap-2 ${testCase.passed ? 'text-green-400' : 'text-red-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${testCase.passed ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        Your Output:
                      </div>
                      <pre className={`p-3 rounded-lg overflow-x-auto border ${
                        testCase.passed
                          ? 'text-green-400 bg-green-500/5 border-green-500/20'
                          : 'text-red-400 bg-red-500/5 border-red-500/20'
                      }`}>
                        {testCase.actual ?? testCase.actualOutput ?? 'No output'}
                      </pre>
                    </div>
                    {(testCase.error || testCase.compile_output || testCase.stderr) && (
                      <div>
                        <div className="text-red-400 mb-1.5 font-semibold flex items-center gap-2">
                          <AlertCircle className="w-3 h-3" />
                          Error:
                        </div>
                        <pre className="text-red-400 bg-red-500/5 p-3 rounded-lg overflow-x-auto text-xs border border-red-500/20 whitespace-pre-wrap">
                          {testCase.error || testCase.compile_output || testCase.stderr}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
