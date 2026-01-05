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

  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(getDefaultCode('javascript'));
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
    <div className="min-h-screen bg-gray-900 text-white">

      {/* ===== NAVBAR (FIXED & COMPACT) ===== */}
      <div className="bg-gray-800 border-b border-gray-700 h-14 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-4 grid grid-cols-3 items-center">
          
          {/* Left */}
          <Link to="/student/dashboard" className="flex items-center gap-2 text-gray-300 hover:text-white">
            <ArrowLeft size={18} />
            Back
          </Link>

          {/* Center */}
          <div className="text-center font-bold text-lg">
            <span className="text-blue-500">Coding Nexus</span>{' '}
            <span className="text-white">Online Code Compiler</span>
          </div>

          {/* Right (empty for balance) */}
          <div></div>
        </div>
      </div>
      {/* ================================== */}

      <div className="max-w-7xl mx-auto p-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-800 rounded-lg overflow-hidden">
          <div className="p-4 flex justify-between bg-gray-900 border-b">
            <div className="flex gap-2">
              {languages.map(l => (
                <button
                  key={l.value}
                  onClick={() => handleLanguageChange(l.value)}
                  className={`px-3 py-1 rounded ${
                    language === l.value ? 'bg-indigo-600' : 'bg-gray-700'
                  }`}
                >
                  {l.icon}
                </button>
              ))}
            </div>

            <button
              onClick={runCode}
              disabled={isRunning}
              className="bg-green-600 px-4 py-2 rounded"
            >
              <Play className="inline w-4 h-4 mr-1" />
              Run
            </button>
          </div>

          <Editor
            height="480px"
            theme="vs-dark"
            language={language}
            value={code}
            onChange={(v) => setCode(v || '')}
            onMount={handleEditorMount}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              quickSuggestions: true,
              suggestOnTriggerCharacters: true
            }}
          />

          <div className="p-4 bg-gray-900 border-t">
            <textarea
              rows="3"
              className="w-full bg-gray-800 border border-gray-700 p-2 rounded"
              placeholder="Standard Input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg">
          <div className="p-4 bg-gray-900 border-b">Output</div>
          <pre className="p-4 h-[300px] overflow-auto text-sm">
            {output || 'Run code to see output'}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
