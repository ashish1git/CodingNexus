// src/components/student/CodeEditor.jsx
import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, X } from 'lucide-react';
import Editor from '@monaco-editor/react';

/* ================= JAVA SNIPPETS ================= */
function registerJavaSnippets(monaco) {
  monaco.languages.registerCompletionItemProvider('java', {
    provideCompletionItems: () => ({
      suggestions: [
        {
          label: 'psvm',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            'public static void main(String[] args) {',
            '\t$0',
            '}'
          ].join('\n'),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
        },
        {
          label: 'main',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            'public static void main(String[] args) {',
            '\t$0',
            '}'
          ].join('\n'),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
        },
        {
          label: 'sout',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'System.out.println($0);',
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
        },
        {
          label: 'fori',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            'for (int i = 0; i < $1; i++) {',
            '\t$0',
            '}'
          ].join('\n'),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
        },
        {
          label: 'ifn',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            'if ($1 == null) {',
            '\t$0',
            '}'
          ].join('\n'),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
        },
        {
          label: 'tryc',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            'try {',
            '\t$0',
            '} catch (Exception e) {',
            '\te.printStackTrace();',
            '}'
          ].join('\n'),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
        }
      ]
    })
  });
}
/* ================================================= */

const CodeEditor = () => {
  const editorRef = useRef(null);

  const [language, setLanguage] = useState('java');
  const [code, setCode] = useState(getDefaultCode('java'));
  const [output, setOutput] = useState('');
  const [input, setInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [showInputModal, setShowInputModal] = useState(false);
  const [modalInput, setModalInput] = useState('');

  const languages = [
    { value: 'java', icon: 'JA' },
    { value: 'python', icon: 'PY' },
    { value: 'cpp', icon: 'C++' },
    { value: 'javascript', icon: 'JS' },
    { value: 'c', icon: 'C' }
  ];

  // Judge0 language IDs
  const judge0Map = {
    javascript: 63,  // Node.js
    python: 71,      // Python 3
    java: 62,        // Java
    cpp: 54,         // C++ (GCC 9.2.0)
    c: 50            // C (GCC 9.2.0)
  };

  function getDefaultCode(lang) {
    const templates = {
      javascript: `// JavaScript
console.log("Hello Coding Nexus");`,
      python: `# Python
print("Hello Coding Nexus")`,
      java: `// Java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello Coding Nexus");
    }
}`,
      cpp: `// C++
#include <iostream>
using namespace std;
int main(){
  cout<<"Hello Coding Nexus";
  return 0;
}`,
      c: `// C
#include <stdio.h>
int main(){
  printf("Hello Coding Nexus");
  return 0;
}`
    };
    return templates[lang];
  }

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    registerJavaSnippets(monaco);
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(getDefaultCode(lang));
    setOutput('');
    setInput('');
  };

  const executeCode = async (stdinContent) => {
    setIsRunning(true);
    setOutput('Running code...\n');

    try {
      const response = await fetch('/api/code/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_code: code,
          language_id: judge0Map[language],
          stdin: stdinContent
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setOutput('Execution Error: ' + (result.details || result.error || 'Unknown error'));
        return;
      }

      const out = result.stdout || '';
      const err = result.stderr || '';
      const compile = result.compile_output || '';

      if (compile) {
        setOutput('Compile Error:\n' + compile);
      } else if (err) {
        setOutput(out + (out ? '\n' : '') + 'stderr:\n' + err);
      } else {
        setOutput(out || 'No output');
      }
    } catch (err) {
      setOutput('Execution Error: ' + err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunClick = () => {
    setModalInput(input);
    setShowInputModal(true);
  };

  const handleModalRun = () => {
    setShowInputModal(false);
    setInput(modalInput);
    executeCode(modalInput);
  };

  const handleModalCancel = () => {
    setShowInputModal(false);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col overflow-hidden">

      {/* ===== NAVBAR (SLEEK & PROFESSIONAL) ===== */}
      <div className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700/50 shadow-lg z-50">
        <div className="max-w-[1920px] mx-auto px-6 h-14 flex items-center justify-between">
          
          {/* Left - Back Button */}
          <Link 
            to="/student/dashboard" 
            className="flex items-center gap-2 text-slate-300 hover:text-indigo-400 transition-colors font-medium"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Back</span>
          </Link>

          {/* Center - Title */}
          <div className="text-center">
            <h1 className="font-bold text-lg sm:text-xl">
              <span className="bg-gradient-to-r from-indigo-400 to-blue-500 bg-clip-text text-transparent">
                Coding Nexus
              </span>
              <span className="text-slate-200 ml-2 hidden md:inline">Online Code Compiler</span>
            </h1>
          </div>

          {/* Right - Language Selector */}
          <div className="flex items-center gap-2">
            {languages.map(l => (
              <button
                key={l.value}
                onClick={() => handleLanguageChange(l.value)}
                className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                  language === l.value 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {l.icon}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* ================================== */}

      {/* Main Content - Fixed Height Calculation */}
      <div className="flex-1 flex flex-col p-3 sm:p-4 gap-3 max-w-[1920px] mx-auto w-full overflow-hidden">
        
        {/* Top Section - Editor */}
        <div className="h-[calc(100%-12rem)] bg-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700/50 shadow-2xl flex flex-col">
          
          {/* Editor Header */}
          <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-700/50 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-sm text-slate-400 font-mono">
                {language === 'javascript' ? 'script.js' : 
                 language === 'python' ? 'script.py' : 
                 language === 'java' ? 'Main.java' : 
                 language === 'cpp' ? 'main.cpp' : 'main.c'}
              </span>
            </div>

            <button
              onClick={handleRunClick}
              disabled={isRunning}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 px-6 py-2 rounded-lg font-semibold text-sm shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {isRunning ? 'Running...' : 'Run'}
            </button>
          </div>

          {/* Code Editor - Takes remaining height */}
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              theme="vs-dark"
              language={language}
              value={code}
              onChange={(v) => setCode(v || '')}
              onMount={handleEditorMount}
              options={{
                fontSize: 15,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                quickSuggestions: true,
                suggestOnTriggerCharacters: true,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                lineHeight: 24,
                padding: { top: 16, bottom: 16 }
              }}
            />
          </div>
        </div>

        {/* Bottom Section - Input & Output */}
        <div className="h-44 grid grid-cols-1 lg:grid-cols-2 gap-3 flex-shrink-0">
          
          {/* Input Section */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700/50 shadow-lg flex flex-col">
            <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-700/50 flex items-center justify-between flex-shrink-0">
              <span className="text-sm font-semibold text-slate-300">Standard Input</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">stdin</span>
                <button
                  onClick={() => setInput('')}
                  className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                  title="Clear input"
                >
                  <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
                </button>
              </div>
            </div>
            <textarea
              className="code-editor-input flex-1 bg-black p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
              placeholder="Enter input here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ color: '#67e8f9', WebkitTextFillColor: '#67e8f9' }}
            />
          </div>

          {/* Output Section */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700/50 shadow-lg flex flex-col">
            <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-700/50 flex items-center justify-between flex-shrink-0">
              <span className="text-sm font-semibold text-slate-300">Output</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">stdout</span>
                <button
                  onClick={() => setOutput('')}
                  className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                  title="Clear output"
                >
                  <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
                </button>
              </div>
            </div>
            <pre className="flex-1 bg-slate-900/50 text-slate-200 p-3 text-sm font-mono overflow-auto">
              {output || <span className="text-slate-500">Run code to see output</span>}
            </pre>
          </div>
        </div>
      </div>

      {/* Input Confirmation Modal */}
      {showInputModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Provide Input</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter all program inputs separated by newlines
                </p>
              </div>
              <button
                onClick={handleModalCancel}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <textarea
                className="w-full h-40 bg-slate-900 border border-slate-600 rounded-xl p-4 text-sm font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                placeholder={`e.g. if program reads two numbers:\n5\n10`}
                value={modalInput}
                onChange={(e) => setModalInput(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleModalRun();
                  }
                }}
              />
              <p className="text-xs text-slate-500 mt-2">
                Tip: Press Ctrl+Enter to run quickly
              </p>
            </div>

            <div className="px-6 py-4 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={handleModalCancel}
                className="px-5 py-2 rounded-lg text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleModalRun}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-colors flex items-center gap-2 shadow-lg"
              >
                <Play size={16} />
                Run Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
