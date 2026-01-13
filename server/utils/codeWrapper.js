// server/utils/codeWrapper.js
// Code wrapper utilities for function-only submissions

/**
 * Wraps user's function code with test harness for Judge0 execution
 * @param {string} userCode - User's function implementation
 * @param {string} language - Programming language (python/cpp/java/c)
 * @param {object} problem - Problem metadata
 * @param {object} testCase - Test case with input/output
 * @returns {string} - Complete executable code
 */
function wrapCodeForExecution(userCode, language, problem, testCase) {
  const wrappers = {
    python: wrapPython,
    cpp: wrapCpp,
    java: wrapJava,
    c: wrapC
  };

  const wrapper = wrappers[language.toLowerCase()];
  if (!wrapper) {
    throw new Error(`Unsupported language: ${language}`);
  }

  return wrapper(userCode, problem, testCase);
}

/**
 * Python wrapper - wraps user function with JSON I/O
 */
function wrapPython(userCode, problem, testCase) {
  const functionName = problem.functionName || 'solution';
  const inputs = testCase.input;
  const parameters = problem.parameters || [];
  
  // Parse inputs into function arguments
  const inputParsing = generatePythonInputParsing(parameters, inputs);
  const outputFormatting = generatePythonOutputFormatting(problem.returnType);
  const functionArgs = parameters.map(p => p.name).join(', ');

  return `import json
import sys

# User's solution code
${userCode}

# Test harness
if __name__ == "__main__":
    try:
        # Parse inputs
${inputParsing}
        
        # Execute user's function
        result = ${functionName}(${functionArgs})
        
        # Format output
${outputFormatting}
        print(output)
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)
`;
}

/**
 * C++ wrapper - wraps user class/function with I/O
 */
function wrapCpp(userCode, problem, testCase) {
  const functionName = problem.functionName || 'solution';
  const className = 'Solution';
  const parameters = problem.parameters || [];
  
  const inputParsing = generateCppInputParsing(parameters, testCase.input);
  const outputFormatting = generateCppOutputFormatting(problem.returnType);
  const functionArgs = parameters.map(p => p.name).join(', ');

  return `#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
using namespace std;

// User's solution code
${userCode}

// Helper functions for parsing
${getCppHelperFunctions()}

int main() {
    try {
        ${className} sol;
        
        // Parse inputs
${inputParsing}
        
            // Execute user's function
            auto result = sol.${functionName}(${functionArgs});        // Format output
${outputFormatting}
        cout << output << endl;
        
        return 0;
    } catch (exception& e) {
        cerr << "Error: " << e.what() << endl;
        return 1;
    }
}
`;
}

/**
 * Java wrapper - wraps user class with I/O
 */
function wrapJava(userCode, problem, testCase) {
  const functionName = problem.functionName || 'solution';
  const className = 'Solution';
  const parameters = problem.parameters || [];
  
  const inputParsing = generateJavaInputParsing(parameters, testCase.input);
  const outputFormatting = generateJavaOutputFormatting(problem.returnType);
  const functionArgs = parameters.map(p => p.name).join(', ');

  return `import java.util.*;
import java.io.*;

// User's solution code
${userCode}

public class Main {
    public static void main(String[] args) {
        try {
            ${className} sol = new ${className}();
            
            // Parse inputs
${inputParsing}
            
            // Execute user's function
            var result = sol.${functionName}(${functionArgs});
            
            // Format output
${outputFormatting}
            System.out.println(output);
            
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            System.exit(1);
        }
    }
    
    ${getJavaHelperFunctions()}
}
`;
}

/**
 * C wrapper - wraps user function with I/O
 */
function wrapC(userCode, problem, testCase) {
  const functionName = problem.functionName || 'solution';
  const parameters = problem.parameters || [];
  
  const inputParsing = generateCInputParsing(parameters, testCase.input);
  const outputFormatting = generateCOutputFormatting(problem.returnType);
  const functionArgs = parameters.map(p => p.name).join(', ');

  return `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// User's solution code
${userCode}

int main() {
    // Parse inputs
${inputParsing}
    
    // Execute user's function
    ${problem.returnType} result = ${functionName}(${functionArgs});
    
    // Format output
${outputFormatting}
    printf("%s\\n", output);
    
    return 0;
}
`;
}

// ============= INPUT PARSING GENERATORS =============

function generatePythonInputParsing(parameters, inputs) {
  if (!parameters || parameters.length === 0) {
    return '        pass  # No inputs';
  }

  const lines = [];
  parameters.forEach((param, index) => {
    const inputValue = Array.isArray(inputs) ? inputs[index] : inputs[param.name];
    const pythonValue = JSON.stringify(inputValue);
    lines.push(`        ${param.name} = ${pythonValue}`);
  });
  
  return lines.join('\n');
}

function generateCppInputParsing(parameters, inputs) {
  if (!parameters || parameters.length === 0) {
    return '        // No inputs';
  }

  const lines = [];
  parameters.forEach((param, index) => {
    const inputValue = Array.isArray(inputs) ? inputs[index] : inputs[param.name];
    const cppValue = formatCppValue(inputValue, param.type);
    lines.push(`        ${param.type} ${param.name} = ${cppValue};`);
  });
  
  return lines.join('\n');
}

function generateJavaInputParsing(parameters, inputs) {
  if (!parameters || parameters.length === 0) {
    return '            // No inputs';
  }

  const lines = [];
  parameters.forEach((param, index) => {
    const inputValue = Array.isArray(inputs) ? inputs[index] : inputs[param.name];
    const javaValue = formatJavaValue(inputValue, param.type);
    lines.push(`            ${param.type} ${param.name} = ${javaValue};`);
  });
  
  return lines.join('\n');
}

function generateCInputParsing(parameters, inputs) {
  if (!parameters || parameters.length === 0) {
    return '    // No inputs';
  }

  const lines = [];
  parameters.forEach((param, index) => {
    const inputValue = Array.isArray(inputs) ? inputs[index] : inputs[param.name];
    const cValue = formatCValue(inputValue, param.type);
    lines.push(`    ${param.type} ${param.name} = ${cValue};`);
  });
  
  return lines.join('\n');
}

// ============= OUTPUT FORMATTING GENERATORS =============

function generatePythonOutputFormatting(returnType) {
  if (returnType === 'string' || returnType === 'str') {
    return `        output = result`;
  } else if (returnType === 'int' || returnType === 'float' || returnType === 'bool') {
    return `        output = str(result)`;
  } else {
    return `        output = json.dumps(result)`;
  }
}

function generateCppOutputFormatting(returnType) {
  if (returnType.includes('vector')) {
    return `        string output = vectorToString(result);`;
  } else if (returnType.includes('string')) {
    return `        string output = result;`;
  } else {
    return `        string output = to_string(result);`;
  }
}

function generateJavaOutputFormatting(returnType) {
  if (returnType.contains('List') || returnType.contains('[]')) {
    return `            String output = Arrays.toString(result);`;
  } else {
    return `            String output = String.valueOf(result);`;
  }
}

function generateCOutputFormatting(returnType) {
  if (returnType.includes('*')) {
    return `    char* output = result;`;
  } else {
    return `    char output[100]; sprintf(output, "%d", result);`;
  }
}

// ============= VALUE FORMATTERS =============

function formatCppValue(value, type) {
  if (Array.isArray(value)) {
    const elements = value.map(v => JSON.stringify(v)).join(', ');
    return `{${elements}}`;
  }
  return JSON.stringify(value);
}

function formatJavaValue(value, type) {
  if (Array.isArray(value)) {
    const elements = value.map(v => JSON.stringify(v)).join(', ');
    return `new ${type}{${elements}}`;
  }
  return JSON.stringify(value);
}

function formatCValue(value, type) {
  if (Array.isArray(value)) {
    const elements = value.map(v => JSON.stringify(v)).join(', ');
    return `{${elements}}`;
  }
  return JSON.stringify(value);
}

// ============= HELPER FUNCTIONS =============

function getCppHelperFunctions() {
  return `
// Helper to convert vector to string
template<typename T>
string vectorToString(const vector<T>& v) {
    ostringstream oss;
    oss << "[";
    for (size_t i = 0; i < v.size(); i++) {
        oss << v[i];
        if (i < v.size() - 1) oss << ",";
    }
    oss << "]";
    return oss.str();
}
`;
}

function getJavaHelperFunctions() {
  return `
    // Helper functions for array conversion
    static String arrayToString(int[] arr) {
        return Arrays.toString(arr);
    }
`;
}

export { wrapCodeForExecution };
