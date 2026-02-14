/**
 * Quick Judge0 Test - Simple verification script
 */

import axios from 'axios';

const JUDGE0_URL = 'http://64.227.149.20:2358';

console.log('🧪 Quick Judge0 Test\n');
console.log('=' .repeat(50));

// Test 1: Python
console.log('\n📝 Test 1: Python - Hello World');
try {
  const pythonResult = await axios.post(
    `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
    { source_code: 'print("Hello Judge0")', language_id: 71 },
    { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
  );
  console.log(`   Status: ${pythonResult.data.status.description}`);
  console.log(`   Output: ${pythonResult.data.stdout?.trim()}`);
  console.log(`   Time: ${pythonResult.data.time}s`);
  console.log(`   Memory: ${pythonResult.data.memory}KB`);
  if (pythonResult.data.status.id === 3) {
    console.log('   ✅ PASSED');
  } else {
    console.log('   ❌ FAILED');
  }
} catch (e) {
  console.log(`   ❌ ERROR: ${e.message}`);
}

// Test 2: C++
console.log('\n📝 Test 2: C++ - Sum');
try {
  const cppCode = `#include <iostream>
using namespace std;
int main() {
    cout << 5 + 10 << endl;
    return 0;
}`;
  const cppResult = await axios.post(
    `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
    { source_code: cppCode, language_id: 54 },
    { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
  );
  console.log(`   Status: ${cppResult.data.status.description}`);
  console.log(`   Output: ${cppResult.data.stdout?.trim()}`);
  console.log(`   Time: ${cppResult.data.time}s`);
  if (cppResult.data.status.id === 3 && cppResult.data.stdout?.trim() === '15') {
    console.log('   ✅ PASSED');
  } else {
    console.log('   ❌ FAILED');
  }
} catch (e) {
  console.log(`   ❌ ERROR: ${e.message}`);
}

// Test 3: Java
console.log('\n📝 Test 3: Java - Hello World');
try {
  const javaCode = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello Java");
    }
}`;
  const javaResult = await axios.post(
    `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
    { source_code: javaCode, language_id: 62 },
    { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }
  );
  console.log(`   Status: ${javaResult.data.status.description}`);
  console.log(`   Output: ${javaResult.data.stdout?.trim()}`);
  console.log(`   Time: ${javaResult.data.time}s`);
  if (javaResult.data.status.id === 3) {
    console.log('   ✅ PASSED');
  } else {
    console.log('   ❌ FAILED');
  }
} catch (e) {
  console.log(`   ❌ ERROR: ${e.message}`);
}

// Test 4: JavaScript
console.log('\n📝 Test 4: JavaScript - Array');
try {
  const jsCode = `const arr = [1, 2, 3, 4, 5];
console.log(arr.reduce((a, b) => a + b, 0));`;
  const jsResult = await axios.post(
    `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
    { source_code: jsCode, language_id: 63 },
    { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
  );
  console.log(`   Status: ${jsResult.data.status.description}`);
  console.log(`   Output: ${jsResult.data.stdout?.trim()}`);
  console.log(`   Time: ${jsResult.data.time}s`);
  if (jsResult.data.status.id === 3 && jsResult.data.stdout?.trim() === '15') {
    console.log('   ✅ PASSED');
  } else {
    console.log('   ❌ FAILED');
  }
} catch (e) {
  console.log(`   ❌ ERROR: ${e.message}`);
}

// Test 5: C
console.log('\n📝 Test 5: C - Factorial');
try {
  const cCode = `#include <stdio.h>
int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}
int main() {
    printf("%d\\n", factorial(5));
    return 0;
}`;
  const cResult = await axios.post(
    `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
    { source_code: cCode, language_id: 50 },
    { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
  );
  console.log(`   Status: ${cResult.data.status.description}`);
  console.log(`   Output: ${cResult.data.stdout?.trim()}`);
  console.log(`   Time: ${cResult.data.time}s`);
  if (cResult.data.status.id === 3 && cResult.data.stdout?.trim() === '120') {
    console.log('   ✅ PASSED');
  } else {
    console.log('   ❌ FAILED');
  }
} catch (e) {
  console.log(`   ❌ ERROR: ${e.message}`);
}

console.log('\n' + '='.repeat(50));
console.log('🎉 Judge0 Testing Complete!\n');
