// Format Indian-style name ("LastName FirstName MiddleName") to display format ("FirstName LastName")
export const formatDisplayName = (name) => {
  if (!name || !name.trim()) return '';
  return name.trim();
};

// ─── Server-side starter code generator (mirrors frontend) ──────────
export const generateStarterCode = (problem) => {
  const { functionName = 'solution', returnType = 'int', parameters = [] } = problem;
  const typeMapping = {
    java: { 'int': 'int', 'int[]': 'int[]', 'int[][]': 'int[][]', 'string': 'String', 'string[]': 'String[]', 'boolean': 'boolean', 'double': 'double', 'float': 'float', 'long': 'long', 'List<Integer>': 'List<Integer>', 'List<String>': 'List<String>', 'List<List<Integer>>': 'List<List<Integer>>' },
    cpp: { 'int': 'int', 'int[]': 'vector<int>', 'int[][]': 'vector<vector<int>>', 'string': 'string', 'string[]': 'vector<string>', 'boolean': 'bool', 'double': 'double', 'float': 'float', 'long': 'long long', 'List<Integer>': 'vector<int>', 'List<String>': 'vector<string>', 'List<List<Integer>>': 'vector<vector<int>>' },
    python: { 'int': 'int', 'int[]': 'List[int]', 'int[][]': 'List[List[int]]', 'string': 'str', 'string[]': 'List[str]', 'boolean': 'bool', 'double': 'float', 'float': 'float', 'long': 'int', 'List<Integer>': 'List[int]', 'List<String>': 'List[str]', 'List<List<Integer>>': 'List[List[int]]' }
  };
  const getType = (lang, t) => typeMapping[lang]?.[t] || t;

  const javaParams = parameters.map(p => `${getType('java', p.type)} ${p.name}`).join(', ');
  const java = `class Solution {\n    public ${getType('java', returnType)} ${functionName}(${javaParams}) {\n        // Write your solution here\n        \n    }\n}`;

  const cppParams = parameters.map(p => `${getType('cpp', p.type)}& ${p.name}`).join(', ');
  const cpp = `class Solution {\npublic:\n    ${getType('cpp', returnType)} ${functionName}(${cppParams}) {\n        // Write your solution here\n        \n    }\n};`;

  const pythonParams = parameters.map(p => `${p.name}: ${getType('python', p.type)}`).join(', ');
  const python = `class Solution:\n    def ${functionName}(${pythonParams}) -> ${getType('python', returnType)}:\n        # Write your solution here\n        pass`;

  return { java, cpp, python };
};
