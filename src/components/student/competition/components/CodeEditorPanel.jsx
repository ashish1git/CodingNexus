import React from 'react';
import { Play, Send, ChevronDown, Trophy } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { getMonacoLanguage } from '../utils/starterCode';
import TestResults from './TestResults';

/**
 * Right panel: editor header (language select + actions), Monaco editor, test results.
 */
export default function CodeEditorPanel({
  code, setCode,
  language, setLanguage,
  selectedProblem,
  submitted, submitting,
  isSaved,
  editorRef,
  handleEditorDidMount,
  handleRunCode,
  handleSaveSolution,
  testResults, showTestCases, setShowTestCases
}) {
  return (
    <div className="w-1/2 h-full flex flex-col bg-[#1e1e1e] border-l border-[#3e3e3e]">
      {/* Editor Header */}
      <div className="px-4 py-2.5 bg-[#262626] border-b border-[#3e3e3e] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="appearance-none bg-[#1e1e1e] text-white text-sm px-4 py-2 pr-10 rounded-lg border border-[#3e3e3e] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer hover:bg-[#252525] hover:border-[#4e4e4e] font-medium"
              style={{ backgroundImage: 'none', minWidth: '140px' }}
            >
              <option value="java" className="bg-[#1e1e1e] text-white">☕ Java</option>
              <option value="cpp" className="bg-[#1e1e1e] text-white">⚡ C++</option>
              <option value="python" className="bg-[#1e1e1e] text-white">🐍 Python</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunCode}
            disabled={submitting || submitted}
            className="px-4 py-2 bg-linear-to-r from-green-600 to-green-500 text-white text-sm rounded-lg hover:from-green-700 hover:to-green-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-green-500/20 hover:shadow-green-500/40"
          >
            <Play className="w-4 h-4" />
            Run
          </button>
          <button
            onClick={handleSaveSolution}
            disabled={submitting || submitted || !code.trim()}
            className="px-4 py-2 bg-linear-to-r from-blue-600 to-blue-500 text-white text-sm rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
          >
            <Send className="w-4 h-4" />
            {isSaved ? 'Update' : 'Save Solution'}
          </button>
        </div>
      </div>

      {/* Code Editor Area */}
      <div className="flex-1 overflow-hidden relative bg-[#1e1e1e]">
        {submitted ? (
          <div className="w-full h-full flex items-center justify-center bg-[#1e1e1e]">
            <div className="text-center">
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Competition Submitted!</h3>
              <p className="text-gray-400">Your solutions have been submitted successfully.</p>
              <p className="text-sm text-gray-500 mt-2">Redirecting to competitions page...</p>
            </div>
          </div>
        ) : (
          <Editor
            height="100%"
            language={getMonacoLanguage(language)}
            value={code}
            onChange={(value) => setCode(value || '')}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              renderWhitespace: 'selection',
              automaticLayout: true,
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
              padding: { top: 16, bottom: 16 },
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 3,
              renderLineHighlight: 'all',
              scrollbar: {
                vertical: 'visible',
                horizontal: 'visible',
                useShadows: false,
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10
              },
              suggestOnTriggerCharacters: true,
              quickSuggestions: true,
              snippetSuggestions: 'inline',
              fontFamily: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
              fontLigatures: true
            }}
            loading={
              <div className="w-full h-full flex items-center justify-center bg-[#1e1e1e]">
                <div className="text-gray-400 text-sm">Loading editor...</div>
              </div>
            }
          />
        )}
      </div>

      {/* Test Results Panel */}
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
