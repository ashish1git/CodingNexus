#!/usr/bin/env node
/**
 * Complete Judge0 Validation Test
 * Tests Java and C++ with multiple test cases
 * Verifies: Compilation → Execution → Results
 */

import axios from 'axios';

const JUDGE0_URL = 'http://64.227.149.20:2358';

// Test Cases
const testCases = {
  java: {
    name: 'Java - Sum of Two Numbers',
    code: `import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.IOException;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String[] input = reader.readLine().split(" ");
        int a = Integer.parseInt(input[0]);
        int b = Integer.parseInt(input[1]);
        System.out.println(a + b);
        reader.close();
    }
}`,
    languageId: 62, // Java
    tests: [
      { input: '5 3', expected: '8', name: 'Positive numbers' },
      { input: '-10 7', expected: '-3', name: 'Negative numbers' },
      { input: '0 0', expected: '0', name: 'Zero values' },
      { input: '100 200', expected: '300', name: 'Large numbers' },
      { input: '-5 -5', expected: '-10', name: 'Both negative' }
    ]
  },
  cpp: {
    name: 'C++ - Sum of Two Numbers',
    code: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}`,
    languageId: 54, // C++
    tests: [
      { input: '5 3', expected: '8', name: 'Positive numbers' },
      { input: '-10 7', expected: '-3', name: 'Negative numbers' },
      { input: '0 0', expected: '0', name: 'Zero values' },
      { input: '100 200', expected: '300', name: 'Large numbers' },
      { input: '-5 -5', expected: '-10', name: 'Both negative' }
    ]
  }
};

async function testLanguage(languageKey) {
  const testSuite = testCases[languageKey];
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🧪 Testing: ${testSuite.name}`);
  console.log(`${'='.repeat(70)}\n`);

  let passedTests = 0;
  const results = [];

  for (let i = 0; i < testSuite.tests.length; i++) {
    const testCase = testSuite.tests[i];
    const testNum = i + 1;

    try {
      console.log(`📝 Test ${testNum}: ${testCase.name}`);
      console.log(`   Input: "${testCase.input}"`);
      console.log(`   Expected: "${testCase.expected}"`);

      // Submit to Judge0
      const response = await axios.post(
        `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
        {
          source_code: testSuite.code,
          language_id: testSuite.languageId,
          stdin: testCase.input
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        }
      );

      const result = response.data;
      const stdout = (result.stdout || '').trim();
      const passed = stdout === testCase.expected && result.status?.id === 3;

      console.log(`   Status: ${result.status?.description || 'Unknown'}`);
      console.log(`   Output: "${stdout}"`);
      console.log(`   Time: ${result.time || '0'}s`);
      console.log(`   Memory: ${result.memory || '0'} bytes`);

      if (result.compile_output) {
        console.log(`   ⚠️ Compile Output: ${result.compile_output}`);
      }

      if (result.stderr) {
        console.log(`   ⚠️ Stderr: ${result.stderr.substring(0, 200)}`);
      }

      if (passed) {
        console.log(`   ✅ PASSED\n`);
        passedTests++;
      } else {
        console.log(`   ❌ FAILED\n`);
      }

      results.push({
        testNum,
        name: testCase.name,
        passed,
        status: result.status?.description,
        output: stdout,
        expected: testCase.expected
      });

    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      if (error.response) {
        console.log(`   HTTP Status: ${error.response.status}`);
        console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      console.log();
      results.push({
        testNum,
        name: testCase.name,
        passed: false,
        error: error.message
      });
    }
  }

  // Summary
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`📊 Summary: ${passedTests}/${testSuite.tests.length} tests passed`);
  console.log(`${'─'.repeat(70)}\n`);

  return {
    language: languageKey,
    name: testSuite.name,
    passed: passedTests,
    total: testSuite.tests.length,
    results
  };
}

async function checkJudge0Status() {
  console.log('\n🔍 Checking Judge0 by sending test submission...\n');
  
  try {
    const response = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: 'print("test")',
        language_id: 71
      },
      { timeout: 10000 }
    );
    
    console.log('✅ Judge0 is ONLINE and RESPONDING');
    console.log(`   Language: Python`);
    console.log(`   Status: ${response.data.status?.description}`);
    return true;
  } catch (error) {
    console.log('❌ Judge0 is not responding to submissions');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 JUDGE0 COMPLETE VALIDATION TEST');
  console.log('='.repeat(70));

  // Check Judge0 status first
  const isOnline = await checkJudge0Status();
  if (!isOnline) {
    console.log('\n⚠️ Judge0 is not accessible. Please check your server.');
    process.exit(1);
  }

  // Run tests
  const javaResults = await testLanguage('java');
  const cppResults = await testLanguage('cpp');

  // Final summary
  console.log('\n' + '='.repeat(70));
  console.log('📋 FINAL SUMMARY');
  console.log('='.repeat(70));
  console.log(`\nJava:  ${javaResults.passed}/${javaResults.total} tests passed`);
  console.log(`C++:   ${cppResults.passed}/${cppResults.total} tests passed`);

  const totalPassed = javaResults.passed + cppResults.passed;
  const totalTests = javaResults.total + cppResults.total;

  if (totalPassed === totalTests) {
    console.log(`\n✅ ALL ${totalTests} TESTS PASSED! Judge0 is working perfectly.\n`);
    process.exit(0);
  } else {
    console.log(`\n⚠️ ${totalTests - totalPassed}/${totalTests} tests failed.\n`);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
