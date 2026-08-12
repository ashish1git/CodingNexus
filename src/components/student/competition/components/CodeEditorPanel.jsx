import React from 'react';
import { Play, Send, ChevronDown, Trophy } from 'lucide-react';
import Editor, { loader } from '@monaco-editor/react';
import { getMonacoLanguage } from '../utils/starterCode';
import TestResults from './TestResults';

// Must run BEFORE Editor mounts — pin Monaco CDN to 0.52.2 (0.55+ breaks AMD loading)
loader.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs' } });

export default function CodeEditorPanel({
  code, setCode,
  language, setLanguage,
  selectedProblem,
  submitted, submitting,
  isSaved,
  handleEditorDidMount,
  handleRunCode,
  handleSaveSolution,
  testResults, showTestCases, setShowTestCases,
  isFullscreen,
  showDescription,
  onToggleDescription,
  leftWidth,
  onSetLeftWidth
}) {
  if (submitted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0d1117]">
        <div className="text-center px-8">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Submitted!</h3>
          <p className="text-gray-400 text-sm">Your solutions have been submitted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-[#0d1117] min-w-0">
      {/* Editor Toolbar — sticky */}
      <div className="px-4 py-2 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between shrink-0 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="appearance-none bg-[#21262d] text-gray-200 text-xs px-3 py-1.5 pr-8 rounded-md border border-[#30363d] focus:outline-none focus:border-blue-500 cursor-pointer hover:border-[#484f58] font-medium"
            >
              <option value="java">☕ Java</option>
              <option value="cpp">⚡ C++</option>
              <option value="python">🐍 Python</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
          </div>
          <span className="text-[10px] text-gray-600 hidden sm:inline ml-1">Ctrl+Enter Run</span>

          {/* Quick Split / Panel Layout Controls */}
          {onToggleDescription && (
            <div className="flex items-center gap-1 ml-2 border-l border-[#30363d] pl-2">
              {showDescription ? (
                <>
                  <button
                    onClick={() => onSetLeftWidth?.(leftWidth <= 220 ? 420 : 180)}
                    className={`px-2 py-1 text-[11px] rounded transition-colors flex items-center gap-1 font-medium ${
                      leftWidth <= 220
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'bg-[#21262d] text-gray-400 hover:text-white hover:bg-[#30363d]'
                    }`}
                    title={leftWidth <= 220 ? "Reset Problem Pane to Standard Size" : "Compact Problem Pane to Maximize Code Editor"}
                  >
                    {leftWidth <= 220 ? "↔ Standard Split" : "↙ Compact Problem"}
                  </button>
                  <button
                    onClick={onToggleDescription}
                    className="px-2 py-1 text-[11px] bg-[#21262d] text-gray-400 hover:text-white hover:bg-[#30363d] rounded transition-colors flex items-center gap-1 font-medium"
                    title="Hide problem pane completely to maximize editor"
                  >
                    ⇥ Hide Problem
                  </button>
                </>
              ) : (
                <button
                  onClick={onToggleDescription}
                  className="px-2.5 py-1 text-[11px] bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 rounded transition-colors flex items-center gap-1 font-medium"
                  title="Show problem description split"
                >
                  ⇤ Show Problem
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunCode}
            disabled={submitting || !code?.trim()}
            className="px-4 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed font-medium shadow-md shadow-green-600/20"
          >
            <Play className="w-3 h-3" />
            Run
          </button>
          <button
            onClick={handleSaveSolution}
            disabled={submitting || !code?.trim()}
            className="px-4 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed font-medium shadow-md shadow-blue-600/20"
          >
            <Send className="w-3 h-3" />
            Save Solution
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={getMonacoLanguage(language)}
          value={code}
          onChange={(value) => setCode(value || '')}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          loading={
            <div className="w-full h-full flex items-center justify-center bg-[#0d1117]">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 text-xs">Loading editor...</p>
              </div>
            </div>
          }
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            automaticLayout: false,
            wordWrap: 'on',
            tabSize: 4,
            folding: true,
            glyphMargin: false,
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            formatOnPaste: false,
            formatOnType: true,
            selectionClipboard: false,
            contextmenu: false,
            dragAndDrop: false,
            padding: { top: 12, bottom: 12 },
            lineNumbersMinChars: 3,
            renderLineHighlight: 'all',
            smoothScrolling: true,
            scrollbar: { vertical: 'visible', horizontal: 'visible', useShadows: false, verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            snippetSuggestions: 'inline',
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace",
            fontLigatures: true
          }}
        />
      </div>

      {/* Test Results */}
      {testResults && (
        <TestResults
          testResults={testResults}
          showTestCases={showTestCases}
          onToggle={() => setShowTestCases(!showTestCases)}
        />
      )}
    </div>
  );
}
