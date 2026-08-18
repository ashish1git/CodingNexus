import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, CheckCircle2, XCircle, Eye, EyeOff, Braces } from 'lucide-react';

const TestCaseRow = ({ test }) => {
  const [showDetails, setShowDetails] = useState(false);
  const passed = test.passed;
  const hasDetails = test.input !== undefined || test.expectedOutput !== undefined || test.actualOutput !== undefined || test.error;

  return (
    <div className={`rounded-lg border ${passed ? 'border-emerald-200 bg-emerald-50/60' : 'border-red-200 bg-red-50/60'}`}>
      <button
        onClick={() => hasDetails && setShowDetails(!showDetails)}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left ${hasDetails ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <span className={`flex items-center justify-center w-5 h-5 rounded-full shrink-0 ${passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
          {passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${passed ? 'text-emerald-800' : 'text-red-700'}`}>
            Test Case {test.testCase}
            {test.hidden && (
              <span className="ml-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500 uppercase">
                <EyeOff className="w-2.5 h-2.5" /> Hidden
              </span>
            )}
          </p>
          {test.status && (
            <p className="text-xs text-gray-500 mt-0.5">{test.status}{test.time != null ? ` · ${test.time}s` : ''}</p>
          )}
        </div>
        {hasDetails && (
          <span className="text-gray-400 shrink-0">
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        )}
      </button>

      {showDetails && hasDetails && (
        <div className="px-3 pb-3 space-y-2">
          {test.input !== undefined && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Input</p>
              <pre className="text-[11px] font-mono bg-white border border-gray-200 rounded-md p-2 overflow-x-auto whitespace-pre-wrap break-all text-gray-700">{test.input}</pre>
            </div>
          )}
          {test.expectedOutput !== undefined && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Expected Output</p>
              <pre className="text-[11px] font-mono bg-white border border-gray-200 rounded-md p-2 overflow-x-auto whitespace-pre-wrap break-all text-gray-700">{test.expectedOutput}</pre>
            </div>
          )}
          {test.actualOutput !== undefined && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Your Output</p>
              <pre className={`text-[11px] font-mono rounded-md p-2 overflow-x-auto whitespace-pre-wrap break-all border ${passed ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
                {test.actualOutput}
              </pre>
            </div>
          )}
          {test.error && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Error</p>
              <pre className="text-[11px] font-mono bg-red-50 border border-red-200 rounded-md p-2 overflow-x-auto whitespace-pre-wrap break-all text-red-700">{test.error}</pre>
            </div>
          )}
          {(test.stderr || test.compile_output) && !passed && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Details</p>
              <pre className="text-[11px] font-mono bg-gray-50 border border-gray-200 rounded-md p-2 overflow-x-auto whitespace-pre-wrap break-all text-gray-600">
                {test.compile_output || test.stderr}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const TestResultsBreakdown = ({ testResults, testsPassed, totalTests }) => {
  const [showAll, setShowAll] = useState(false);
  if (!Array.isArray(testResults) || testResults.length === 0) return null;

  const passedCount = testResults.filter(t => t.passed).length;
  const failedCount = testResults.length - passedCount;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-gray-700">Test Case Results</p>
        <span className="text-xs font-semibold text-gray-500">
          <span className="text-emerald-600">{passedCount} passed</span>
          {failedCount > 0 && <span className="text-red-500"> · {failedCount} failed</span>}
          <span className="text-gray-400"> · {totalTests || testResults.length} total</span>
        </span>
      </div>

      {testResults.length > 4 && !showAll ? (
        <>
          <div className="space-y-1.5">
            {testResults.slice(0, 4).map((test, i) => (
              <TestCaseRow key={i} test={test} />
            ))}
          </div>
          <button
            onClick={() => setShowAll(true)}
            className="mt-2 w-full py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" /> Show all {testResults.length} test cases
          </button>
        </>
      ) : (
        <div className="space-y-1.5">
          {testResults.map((test, i) => (
            <TestCaseRow key={i} test={test} />
          ))}
        </div>
      )}
    </div>
  );
};

const ProblemDetails = ({ problem }) => {
  const [open, setOpen] = useState(false);
  const hasTestResults = Array.isArray(problem.testResults) && problem.testResults.length > 0;
  const hasContent = problem.problemDescription || problem.problemExamples?.length || problem.problemConstraints?.length;

  if (!hasContent && !hasTestResults) return null;

  return (
    <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <FileText className="w-4 h-4 text-indigo-500" />
          Problem Details
          {hasTestResults && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              {problem.testsPassed}/{problem.totalTests} tests passed
            </span>
          )}
        </span>
        <span className="text-gray-400">
          {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </span>
      </button>

      {open && (
        <div className="p-4 sm:p-5 space-y-5 bg-white">
          {/* Description */}
          {problem.problemDescription && (
            <div>
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Problem Statement</h4>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line break-words">
                {problem.problemDescription}
              </p>
            </div>
          )}

          {/* Examples */}
          {Array.isArray(problem.problemExamples) && problem.problemExamples.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Examples</h4>
              <div className="space-y-3">
                {problem.problemExamples.map((example, idx) => (
                  <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs font-bold text-gray-800 mb-2">Example {idx + 1}</p>
                    <div className="space-y-2">
                      {example.input !== undefined && (
                        <div>
                          <p className="text-[10px] font-semibold text-gray-500 mb-0.5">Input</p>
                          <pre className="text-[11px] font-mono bg-white border border-gray-200 rounded-md p-2 overflow-x-auto whitespace-pre-wrap break-all text-gray-700">{example.input}</pre>
                        </div>
                      )}
                      {example.output !== undefined && (
                        <div>
                          <p className="text-[10px] font-semibold text-gray-500 mb-0.5">Output</p>
                          <pre className="text-[11px] font-mono bg-white border border-gray-200 rounded-md p-2 overflow-x-auto whitespace-pre-wrap break-all text-gray-700">{example.output}</pre>
                        </div>
                      )}
                      {example.explanation && (
                        <div>
                          <p className="text-[10px] font-semibold text-gray-500 mb-0.5">Explanation</p>
                          <p className="text-xs text-gray-600 leading-relaxed">{example.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Constraints */}
          {Array.isArray(problem.problemConstraints) && problem.problemConstraints.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Braces className="w-3.5 h-3.5" /> Constraints
              </h4>
              <ul className="space-y-1.5">
                {problem.problemConstraints.map((constraint, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-400 mt-0.5 text-[10px] shrink-0">▸</span>
                    <code className="font-mono text-[11px] bg-gray-50 px-2 py-1 rounded border border-gray-200 break-all min-w-0 text-gray-700">{constraint}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Per-test-case breakdown */}
          {hasTestResults && (
            <TestResultsBreakdown
              testResults={problem.testResults}
              testsPassed={problem.testsPassed}
              totalTests={problem.totalTests}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ProblemDetails;
