// server/utils/codeWrapper.js
// Code wrapper utilities for function-only submissions - LeetCode Style

/**
 * Wraps user's function code with test harness for Judge0 execution
 * Supports: Java, C++, Python
 * 
 * @param {string} userCode - User's function implementation
 * @param {string} language - Programming language (python/cpp/java)
 * @param {object} problem - Problem metadata with functionName, parameters, returnType
 * @param {object} testCase - Test case with input/output
 * @returns {string} - Complete executable code
 */
function wrapCodeForExecution(userCode, language, problem, testCase) {
  const lang = language.toLowerCase();
  
  // Check if user submitted a complete program (with main)
  if (isCompleteProgram(userCode, lang)) {
    return handleCompleteProgram(userCode, lang, testCase);
  }
  
  // Otherwise wrap as function-only submission
  const wrappers = {
    python: wrapPython,
    cpp: wrapCpp,
    java: wrapJava,
    c: wrapCpp // C treated similar to C++ for basic problems
  };

  const wrapper = wrappers[lang];
  if (!wrapper) {
    throw new Error(`Unsupported language: ${language}`);
  }

  return wrapper(userCode, problem, testCase);
}

/**
 * Check if user code is a complete program with main method
 */
function isCompleteProgram(userCode, language) {
  if (language === 'java') {
    return userCode.includes('public static void main') || 
           userCode.includes('public class Main');
  }
  if (language === 'cpp' || language === 'c') {
    return userCode.includes('int main(') || userCode.includes('int main (');
  }
  if (language === 'python') {
    return userCode.includes('if __name__') && userCode.includes('__main__');
  }
  return false;
}

/**
 * Handle complete program submissions - just fix class name for Java
 */
function handleCompleteProgram(userCode, language, testCase) {
  if (language === 'java') {
    // Replace public class ClassName with public class Main
    const classNameMatch = userCode.match(/public\s+class\s+(\w+)/);
    if (classNameMatch && classNameMatch[1] !== 'Main') {
      return userCode.replace(
        new RegExp(`public\\s+class\\s+${classNameMatch[1]}`, 'g'),
        'public class Main'
      );
    }
  }
  return userCode;
}

/**
 * Parse test case input string to array of values
 * Handles formats like: "5, 3" or "[1,2,3], 5" or "[[1,2],[3,4]]"
 */
function parseTestInput(inputStr, parameters) {
  if (!inputStr || !parameters || parameters.length === 0) {
    return [];
  }
  
  // If input is already an array, use it directly
  if (Array.isArray(inputStr)) {
    return inputStr;
  }
  
  // Try to parse as JSON first
  try {
    const parsedInputs = [];
    let remaining = String(inputStr).trim();
    
    for (let i = 0; i < parameters.length; i++) {
      const param = parameters[i];
      const isArray = param.type.includes('[]') || param.type.includes('List') || param.type.includes('vector');
      
      if (isArray) {
        // Find matching bracket for array
        const bracketMatch = remaining.match(/^\s*\[/);
        if (bracketMatch) {
          let depth = 0;
          let endIndex = -1;
          for (let j = 0; j < remaining.length; j++) {
            if (remaining[j] === '[') depth++;
            if (remaining[j] === ']') depth--;
            if (depth === 0 && remaining[j] === ']') {
              endIndex = j;
              break;
            }
          }
          if (endIndex > -1) {
            const arrayStr = remaining.substring(0, endIndex + 1);
            parsedInputs.push(JSON.parse(arrayStr));
            remaining = remaining.substring(endIndex + 1).replace(/^\s*,?\s*/, '');
            continue;
          }
        }
      }
      
      // Handle non-array values
      const commaIndex = remaining.indexOf(',');
      let value;
      if (commaIndex > -1 && i < parameters.length - 1) {
        value = remaining.substring(0, commaIndex).trim();
        remaining = remaining.substring(commaIndex + 1).trim();
      } else {
        value = remaining.trim();
        remaining = '';
      }
      
      // Parse the value based on type
      if (param.type === 'string' || param.type === 'String' || param.type === 'str') {
        value = value.replace(/^["']|["']$/g, '');
        parsedInputs.push(value);
      } else if (param.type === 'boolean' || param.type === 'bool') {
        parsedInputs.push(value === 'true' || value === 'True');
      } else if (param.type.includes('double') || param.type.includes('float')) {
        parsedInputs.push(parseFloat(value));
      } else {
        parsedInputs.push(parseInt(value) || 0);
      }
    }
    
    return parsedInputs;
  } catch (e) {
    // Fallback: split by comma
    return String(inputStr).split(',').map(v => {
      const trimmed = v.trim();
      if (!isNaN(trimmed)) {
        return trimmed.includes('.') ? parseFloat(trimmed) : parseInt(trimmed);
      }
      return trimmed;
    });
  }
}

/**
 * Java wrapper - wraps user Solution class with main method
 */
function wrapJava(userCode, problem, testCase) {
  const functionName = problem.functionName || 'solution';
  const parameters = problem.parameters || [];
  const returnType = problem.returnType || 'int';
  const inputs = parseTestInput(testCase.input, parameters);
  
  // Generate variable declarations
  const declarations = parameters.map((param, index) => {
    const value = inputs[index];
    return generateJavaDeclaration(param.name, param.type, value);
  }).join('\n            ');
  
  // Generate function call arguments
  const functionArgs = parameters.map(p => p.name).join(', ');
  
  // Generate output formatting
  const outputCode = generateJavaOutputCode(returnType);
  
  return `import java.util.*;
import java.io.*;

${userCode}

public class Main {
    public static void main(String[] args) {
        try {
            Solution sol = new Solution();
            
            // Parse inputs
            ${declarations}
            
            // Execute solution
            ${getJavaReturnType(returnType)} result = sol.${functionName}(${functionArgs});
            
            // Output result
            ${outputCode}
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
}`;
}

/**
 * Generate Java variable declaration with value
 */
function generateJavaDeclaration(name, type, value) {
  if (type === 'int[]') {
    const arr = Array.isArray(value) ? value : [value];
    return `int[] ${name} = new int[]{${arr.join(', ')}};`;
  }
  if (type === 'int[][]') {
    const arr = Array.isArray(value) ? value : [[value]];
    const rows = arr.map(row => `{${row.join(', ')}}`).join(', ');
    return `int[][] ${name} = new int[][]{${rows}};`;
  }
  if (type === 'String[]' || type === 'string[]') {
    const arr = Array.isArray(value) ? value : [value];
    const strs = arr.map(s => `"${s}"`).join(', ');
    return `String[] ${name} = new String[]{${strs}};`;
  }
  if (type === 'String' || type === 'string') {
    return `String ${name} = "${value}";`;
  }
  if (type === 'boolean' || type === 'bool') {
    return `boolean ${name} = ${value};`;
  }
  if (type === 'double') {
    return `double ${name} = ${value};`;
  }
  if (type === 'long') {
    return `long ${name} = ${value}L;`;
  }
  if (type === 'List<Integer>' || type === 'List<int>') {
    const arr = Array.isArray(value) ? value : [value];
    return `List<Integer> ${name} = new ArrayList<>(Arrays.asList(${arr.map(v => `${v}`).join(', ')}));`;
  }
  if (type === 'List<String>') {
    const arr = Array.isArray(value) ? value : [value];
    return `List<String> ${name} = new ArrayList<>(Arrays.asList(${arr.map(s => `"${s}"`).join(', ')}));`;
  }
  // Default: int
  return `int ${name} = ${value !== undefined ? value : 0};`;
}

/**
 * Get Java return type string
 */
function getJavaReturnType(type) {
  const typeMap = {
    'int': 'int',
    'int[]': 'int[]',
    'int[][]': 'int[][]',
    'string': 'String',
    'String': 'String',
    'string[]': 'String[]',
    'String[]': 'String[]',
    'boolean': 'boolean',
    'bool': 'boolean',
    'double': 'double',
    'float': 'float',
    'long': 'long',
    'List<Integer>': 'List<Integer>',
    'List<String>': 'List<String>',
    'List<List<Integer>>': 'List<List<Integer>>'
  };
  return typeMap[type] || type;
}

/**
 * Generate Java output code based on return type
 */
function generateJavaOutputCode(returnType) {
  if (returnType === 'int[]') {
    return 'System.out.println(Arrays.toString(result).replace(" ", ""));';
  }
  if (returnType === 'int[][]') {
    return `StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < result.length; i++) {
                sb.append(Arrays.toString(result[i]).replace(" ", ""));
                if (i < result.length - 1) sb.append(",");
            }
            sb.append("]");
            System.out.println(sb.toString());`;
  }
  if (returnType === 'String[]' || returnType === 'string[]') {
    return 'System.out.println(Arrays.toString(result));';
  }
  if (returnType.includes('List')) {
    return 'System.out.println(result.toString().replace(" ", ""));';
  }
  if (returnType === 'boolean' || returnType === 'bool') {
    return 'System.out.println(result);';
  }
  // Default for primitives
  return 'System.out.println(result);';
}

/**
 * C++ wrapper - wraps user Solution class with main()
 */
function wrapCpp(userCode, problem, testCase) {
  const functionName = problem.functionName || 'solution';
  const parameters = problem.parameters || [];
  const returnType = problem.returnType || 'int';
  const inputs = parseTestInput(testCase.input, parameters);
  
  // Generate variable declarations
  const declarations = parameters.map((param, index) => {
    const value = inputs[index];
    return generateCppDeclaration(param.name, param.type, value);
  }).join('\n        ');
  
  // Generate function call arguments
  const functionArgs = parameters.map(p => p.name).join(', ');
  
  // Generate output code
  const outputCode = generateCppOutputCode(returnType);
  
  return `#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <unordered_map>
#include <unordered_set>
#include <queue>
#include <stack>
#include <climits>
using namespace std;

${userCode}

// Helper function to print vectors
template<typename T>
void printVector(const vector<T>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) {
        cout << v[i];
        if (i < v.size() - 1) cout << ",";
    }
    cout << "]";
}

template<typename T>
void printVector2D(const vector<vector<T>>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) {
        printVector(v[i]);
        if (i < v.size() - 1) cout << ",";
    }
    cout << "]";
}

int main() {
    try {
        Solution sol;
        
        // Parse inputs
        ${declarations}
        
        // Execute solution
        auto result = sol.${functionName}(${functionArgs});
        
        // Output result
        ${outputCode}
        cout << endl;
        
        return 0;
    } catch (exception& e) {
        cerr << "Error: " << e.what() << endl;
        return 1;
    }
}`;
}

/**
 * Generate C++ variable declaration with value
 */
function generateCppDeclaration(name, type, value) {
  if (type === 'int[]' || type === 'vector<int>') {
    const arr = Array.isArray(value) ? value : [value];
    return `vector<int> ${name} = {${arr.join(', ')}};`;
  }
  if (type === 'int[][]' || type === 'vector<vector<int>>') {
    const arr = Array.isArray(value) ? value : [[value]];
    const rows = arr.map(row => `{${row.join(', ')}}`).join(', ');
    return `vector<vector<int>> ${name} = {${rows}};`;
  }
  if (type === 'string[]' || type === 'vector<string>') {
    const arr = Array.isArray(value) ? value : [value];
    const strs = arr.map(s => `"${s}"`).join(', ');
    return `vector<string> ${name} = {${strs}};`;
  }
  if (type === 'string' || type === 'String') {
    return `string ${name} = "${value}";`;
  }
  if (type === 'boolean' || type === 'bool') {
    return `bool ${name} = ${value};`;
  }
  if (type === 'double') {
    return `double ${name} = ${value};`;
  }
  if (type === 'long' || type === 'long long') {
    return `long long ${name} = ${value};`;
  }
  // Default: int
  return `int ${name} = ${value !== undefined ? value : 0};`;
}

/**
 * Generate C++ output code based on return type
 */
function generateCppOutputCode(returnType) {
  if (returnType.includes('[][]') || returnType.includes('vector<vector')) {
    return 'printVector2D(result);';
  }
  if (returnType.includes('[]') || returnType.includes('vector')) {
    return 'printVector(result);';
  }
  if (returnType === 'boolean' || returnType === 'bool') {
    return 'cout << (result ? "true" : "false");';
  }
  // Default for primitives
  return 'cout << result;';
}

/**
 * Python wrapper - wraps user Solution class with test harness
 */
function wrapPython(userCode, problem, testCase) {
  const functionName = problem.functionName || 'solution';
  const parameters = problem.parameters || [];
  const returnType = problem.returnType || 'int';
  const inputs = parseTestInput(testCase.input, parameters);
  
  // Generate variable assignments
  const assignments = parameters.map((param, index) => {
    const value = inputs[index];
    return generatePythonAssignment(param.name, param.type, value);
  }).join('\n        ');
  
  // Generate function call arguments
  const functionArgs = parameters.map(p => p.name).join(', ');
  
  // Generate output code
  const outputCode = generatePythonOutputCode(returnType);
  
  return `from typing import List, Optional
import json

${userCode}

if __name__ == "__main__":
    try:
        sol = Solution()
        
        # Parse inputs
        ${assignments}
        
        # Execute solution
        result = sol.${functionName}(${functionArgs})
        
        # Output result
        ${outputCode}
    except Exception as e:
        import sys
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)
`;
}

/**
 * Generate Python variable assignment
 */
function generatePythonAssignment(name, type, value) {
  if (Array.isArray(value)) {
    return `${name} = ${JSON.stringify(value)}`;
  }
  if (type === 'string' || type === 'str' || type === 'String') {
    return `${name} = "${value}"`;
  }
  if (type === 'boolean' || type === 'bool') {
    return `${name} = ${value ? 'True' : 'False'}`;
  }
  return `${name} = ${value !== undefined ? value : 0}`;
}

/**
 * Generate Python output code
 */
function generatePythonOutputCode(returnType) {
  if (returnType.includes('List') || returnType.includes('[]')) {
    return `output = json.dumps(result).replace(' ', '')
        print(output)`;
  }
  if (returnType === 'boolean' || returnType === 'bool') {
    return `print(str(result).lower())`;
  }
  return 'print(result)';
}

export { wrapCodeForExecution };
