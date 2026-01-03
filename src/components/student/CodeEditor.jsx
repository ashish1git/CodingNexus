// src/components/student/CodeEditor.jsx
import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, RotateCcw, Download, Copy, Check } from 'lucide-react';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';

const CodeEditor = () => {
  const editorRef = useRef(null);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(getDefaultCode('javascript'));
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const languages = [
    { value: 'javascript', label: 'JavaScript', icon: 'JS' },
    { value: 'python', label: 'Python', icon: 'PY' },
    { value: 'java', label: 'Java', icon: 'JA' },
    { value: 'cpp', label: 'C++', icon: 'C++' },
    { value: 'c', label: 'C', icon: 'C' }
  ];

  function getDefaultCode(lang) {
    const templates = {
      javascript: `// JavaScript Code Editor
console.log("Hello, Coding Nexus!");

function add(a, b) {
  return a + b;
}

console.log("Sum:", add(5, 3));`,
      python: `# Python Code Editor
print("Hello, Coding Nexus!")

def add(a, b):
    return a + b

print("Sum:", add(5, 3))`,
      java: `// Java Code Editor
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Coding Nexus!");
        System.out.println("Sum: " + add(5, 3));
    }
    
    static int add(int a, int b) {
        return a + b;
    }
}`,
      cpp: `// C++ Code Editor
#include <iostream>
using namespace std;

int add(int a, int b) {
    return a + b;
}

int main() {
    cout << "Hello, Coding Nexus!" << endl;
    cout << "Sum: " << add(5, 3) << endl;
    return 0;
}`,
      c: `// C Code Editor
#include <stdio.h>

int add(int a, int b) {
    return a + b;
}

int main() {
    printf("Hello, Coding Nexus!\\n");
    printf("Sum: %d\\n", add(5, 3));
    return 0;
}`
    };
    return templates[lang] || templates.javascript;
  }

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setCode(getDefaultCode(newLang));
    setOutput('');
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running code...\n');

    try {
      if (language === 'javascript') {
        // Run JavaScript in sandbox
        const logs = [];
        const originalLog = console.log;
        console.log = (...args) => {
          logs.push(args.join(' '));
        };

        try {
          eval(code);
          setOutput(logs.join('\n') || 'Code executed successfully (no output)');
        } catch (error) {
          setOutput(`Error: ${error.message}`);
        } finally {
          console.log = originalLog;
        }
      } else {
        // For other languages, show a message about using external API
        setOutput(`Note: ${languages.find(l => l.value === language)?.label} execution requires server-side compilation.
        
In production, integrate with APIs like:
- Judge0 API
- Piston API
- JDoodle API

For now, this is a code editor with syntax highlighting.
        
Your code:
${code}`);
      }
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const resetCode = () => {
    setCode(getDefaultCode(language));
    setOutput('');
    toast.success('Code reset to template');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCode = () => {
    const extensions = {
      javascript: 'js',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      c: 'c'
    };
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${extensions[language]}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Code downloaded!');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Link
              to="/student/dashboard"
              className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl font-bold">Code Editor</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor Section */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-900 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-400">Language:</label>
                  <div className="flex gap-2">
                    {languages.map((lang) => (
                      <button
                        key={lang.value}
                        onClick={() => handleLanguageChange(lang.value)}
                        className={`px-3 py-1 rounded text-sm font-medium transition ${
                          language === lang.value
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {lang.icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={copyCode}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
                    title="Copy Code"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={downloadCode}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
                    title="Download Code"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={resetCode}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
                    title="Reset Code"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Editor */}
              <Editor
                height="500px"
                language={language}
                value={code}
                onChange={(value) => setCode(value || '')}
                onMount={handleEditorDidMount}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  automaticLayout: true
                }}
              />

              {/* Run Button */}
              <div className="p-4 bg-gray-900 border-t border-gray-700">
                <button
                  onClick={runCode}
                  disabled={isRunning}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRunning ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Run Code
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg border border-gray-700 h-full">
              <div className="p-4 bg-gray-900 border-b border-gray-700">
                <h2 className="font-semibold">Output</h2>
              </div>
              <div className="p-4 h-[500px] overflow-y-auto">
                {output ? (
                  <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                    {output}
                  </pre>
                ) : (
                  <p className="text-gray-500 text-sm">
                    Click "Run Code" to see the output here...
                  </p>
                )}
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-4">
              <h3 className="font-semibold text-blue-300 mb-2">💡 Tips</h3>
              <ul className="text-sm text-blue-200 space-y-1">
                <li>• Use console.log() for JavaScript output</li>
                <li>• Ctrl/Cmd + S to save your work</li>
                <li>• Code is not saved automatically</li>
                <li>• Download your code before leaving</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;