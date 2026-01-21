// src/components/student/CodeEditor.jsx
import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play } from 'lucide-react';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';

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

  const languages = [
    { value: 'java', icon: 'JA' },
    { value: 'python', icon: 'PY' },
    { value: 'cpp', icon: 'C++' },
    { value: 'javascript', icon: 'JS' },
    { value: 'c', icon: 'C' }
  ];

  const pistonMap = {
    javascript: 'javascript',
    python: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c'
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

  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running code...\n');

    try {
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: pistonMap[language],
          version: '*',
          stdin: input,
          files: [{ content: code }]
        })
      });

      const result = await response.json();
      setOutput(result.run?.stderr || result.run?.stdout || 'No Output');
    } catch (err) {
      setOutput('Execution Error: ' + err.message);
    } finally {
      setIsRunning(false);
    }
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
              onClick={runCode}
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
              <span className="text-xs text-slate-500">stdin</span>
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
              <span className="text-xs text-slate-500">stdout</span>
            </div>
            <pre className="flex-1 bg-slate-900/50 text-slate-200 p-3 text-sm font-mono overflow-auto">
              {output || <span className="text-slate-500">Run code to see output</span>}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
