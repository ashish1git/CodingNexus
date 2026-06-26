// Type mappings for each language
const typeMap = {
  java: {
    'int': 'int', 'int[]': 'int[]', 'int[][]': 'int[][]',
    'string': 'String', 'String': 'String', 'string[]': 'String[]',
    'boolean': 'boolean', 'bool': 'boolean', 'double': 'double',
    'long': 'long', 'List<Integer>': 'List<Integer>', 'List<String>': 'List<String>'
  },
  cpp: {
    'int': 'int', 'int[]': 'vector<int>', 'int[][]': 'vector<vector<int>>',
    'string': 'string', 'String': 'string', 'string[]': 'vector<string>',
    'boolean': 'bool', 'bool': 'bool', 'double': 'double',
    'long': 'long long', 'List<Integer>': 'vector<int>', 'List<String>': 'vector<string>'
  },
  python: {
    'int': 'int', 'int[]': 'List[int]', 'int[][]': 'List[List[int]]',
    'string': 'str', 'String': 'str', 'string[]': 'List[str]',
    'boolean': 'bool', 'bool': 'bool', 'double': 'float',
    'long': 'int', 'List<Integer>': 'List[int]', 'List<String>': 'List[str]'
  }
};

const getType = (type, lang) => typeMap[lang]?.[type] || type;

/**
 * Generate starter code template for a problem in the given language.
 */
export function generateStarterCode(problem, lang) {
  if (!problem) return '';

  const functionName = problem.functionName || 'solution';
  const returnType = problem.returnType || 'int';
  const parameters = problem.parameters || [{ name: 'nums', type: 'int[]' }];

  if (lang === 'java') {
    const params = parameters.map(p => `${getType(p.type, 'java')} ${p.name}`).join(', ');
    return `class Solution {
    public ${getType(returnType, 'java')} ${functionName}(${params}) {
        // Write your solution from here here
        
    }
}`;
  }

  if (lang === 'cpp') {
    const params = parameters.map(p => `${getType(p.type, 'cpp')}& ${p.name}`).join(', ');
    return `class Solution {
public:
    ${getType(returnType, 'cpp')} ${functionName}(${params}) {
        // Write your solution here
        
    }
};`;
  }

  if (lang === 'python') {
    const params = parameters.map(p => `${p.name}: ${getType(p.type, 'python')}`).join(', ');
    return `class Solution:
    def ${functionName}(self, ${params}) -> ${getType(returnType, 'python')}:
        # Write your solution here
        pass`;
  }

  return '';
}

/**
 * Map language identifier to Monaco editor language ID.
 */
export function getMonacoLanguage(lang) {
  const languageMap = {
    'cpp': 'cpp',
    'java': 'java',
    'python': 'python',
    'javascript': 'javascript',
    'c': 'c'
  };
  return languageMap[lang] || 'java';
}

/**
 * Get Tailwind classes for difficulty badge coloring.
 */
export function getDifficultyColor(difficulty) {
  switch (difficulty) {
    case 'easy': return 'bg-green-500/10 text-green-400';
    case 'medium': return 'bg-yellow-500/10 text-yellow-400';
    case 'hard': return 'bg-red-500/10 text-red-400';
    default: return 'bg-gray-500/10 text-gray-400';
  }
}
