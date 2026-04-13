import { analyzeCodeComplexity } from './server/utils/astComplexityAnalyzer.js';

console.log('🧪 Testing FIXED AST Analyzer - Sequential vs Nested Loops\n');

// Test 1: TRULY NESTED (should be O(n²))
const nestedCode = `
for (let i = 0; i < n; i++) {
  for (let j = 0; j < n; j++) {
    sum += arr[i][j];
  }
}
`;

console.log('Test 1: TRULY NESTED LOOPS (should be O(n²))');
console.log('Code:', nestedCode);
const result1 = analyzeCodeComplexity(nestedCode, 'javascript');
console.log('✓ Detected:', result1.timeComplexity);
console.log('✓ Max Nesting:', result1.maxNesting);
console.log('✓ Explanation:', result1.timeExplanation);
console.log(result1.timeComplexity === 'O(n²)' ? '✅ CORRECT' : '❌ WRONG');
console.log('\n' + '='.repeat(70) + '\n');

// Test 2: SEQUENTIAL LOOPS (should be O(n), NOT O(n²))
const sequentialCode = `
for (let i = 0; i < n; i++) {
  arr[i] = i * 2;
}

for (let j = 0; j < n; j++) {
  console.log(arr[j]);
}
`;

console.log('Test 2: SEQUENTIAL LOOPS (should be O(n), NOT O(n²))');
console.log('Code:', sequentialCode);
const result2 = analyzeCodeComplexity(sequentialCode, 'javascript');
console.log('✓ Detected:', result2.timeComplexity);
console.log('✓ Max Nesting:', result2.maxNesting);
console.log('✓ Explanation:', result2.timeExplanation);
console.log(result2.timeComplexity === 'O(n)' ? '✅ CORRECT (FIX WORKS!)' : '❌ WRONG (Still broken)');
console.log('\n' + '='.repeat(70) + '\n');

// Test 3: SEQUENTIAL COMPACT (close together, tests the 100-char threshold)
const compactSequentialCode = `
for (let i = 0; i < n; i++) arr[i] = i;
for (let j = 0; j < n; j++) console.log(arr[j]);
`;

console.log('Test 3: SEQUENTIAL COMPACT (should be O(n), tests distance issue)');
console.log('Code:', compactSequentialCode);
const result3 = analyzeCodeComplexity(compactSequentialCode, 'javascript');
console.log('✓ Detected:', result3.timeComplexity);
console.log('✓ Max Nesting:', result3.maxNesting);
console.log('✓ Explanation:', result3.timeExplanation);
console.log(result3.timeComplexity === 'O(n)' ? '✅ CORRECT (FIX WORKS!)' : '❌ WRONG (Still broken)');
console.log('\n' + '='.repeat(70) + '\n');

// Test 4: TRIPLE NESTED (should be O(n³))
const tripleNestedCode = `
for (let i = 0; i < n; i++) {
  for (let j = 0; j < n; j++) {
    for (let k = 0; k < n; k++) {
      sum += arr[i][j][k];
    }
  }
}
`;

console.log('Test 4: TRIPLE NESTED (should be O(n³))');
console.log('Code:', tripleNestedCode);
const result4 = analyzeCodeComplexity(tripleNestedCode, 'javascript');
console.log('✓ Detected:', result4.timeComplexity);
console.log('✓ Max Nesting:', result4.maxNesting);
console.log('✓ Explanation:', result4.timeExplanation);
console.log(result4.timeComplexity === 'O(n³)' ? '✅ CORRECT' : '❌ WRONG');
console.log('\n' + '='.repeat(70) + '\n');

// Test 5: ONE LOOP THEN FUNCTION THEN ANOTHER LOOP (should be O(n))
const loopFunctionLoopCode = `
for (let i = 0; i < n; i++) {
  arr[i] = i;
}

function process() {
  console.log('processing');
}

process();

for (let j = 0; j < n; j++) {
  console.log(arr[j]);
}
`;

console.log('Test 5: LOOP → FUNCTION → LOOP (should be O(n))');
console.log('Code:', loopFunctionLoopCode);
const result5 = analyzeCodeComplexity(loopFunctionLoopCode, 'javascript');
console.log('✓ Detected:', result5.timeComplexity);
console.log('✓ Max Nesting:', result5.maxNesting);
console.log('✓ Total Loops:', result5.loops);
console.log(result5.timeComplexity === 'O(n)' ? '✅ CORRECT (FIX WORKS!)' : '❌ WRONG (Still broken)');
console.log('\n' + '='.repeat(70) + '\n');

// Summary
console.log('🎯 SUMMARY:\n');
const tests = [
  { name: 'Truly Nested O(n²)', result: result1.timeComplexity === 'O(n²)' },
  { name: 'Sequential O(n)', result: result2.timeComplexity === 'O(n)' },
  { name: 'Sequential Compact O(n)', result: result3.timeComplexity === 'O(n)' },
  { name: 'Triple Nested O(n³)', result: result4.timeComplexity === 'O(n³)' },
  { name: 'Loop-Function-Loop O(n)', result: result5.timeComplexity === 'O(n)' }
];

let passed = 0;
tests.forEach(test => {
  console.log(`${test.result ? '✅' : '❌'} ${test.name}`);
  if (test.result) passed++;
});

console.log(`\n${passed}/${tests.length} tests passed`);
if (passed === tests.length) {
  console.log('🎉 FIX SUCCESSFUL - All tests pass!');
} else {
  console.log('⚠️  Some tests still failing - may need further work');
}
