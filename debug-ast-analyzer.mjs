import { analyzeCodeComplexity } from './server/utils/astComplexityAnalyzer.js';

// Test with simple nested loop code
const testCode1 = `
  function twoSum(nums, target) {
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        if (nums[i] + nums[j] === target) {
          return [i, j];
        }
      }
    }
    return [];
  }
`;

console.log('🧪 Testing AST Complexity Analyzer\n');

console.log('Test 1: Nested Loop Code');
console.log('Code:', testCode1);
console.log('\n');

const result1 = analyzeCodeComplexity(testCode1, 'javascript');
console.log('Result:', result1);

console.log('\n' + '='.repeat(60) + '\n');

// Test with a single loop
const testCode2 = `
  function findMax(nums) {
    let max = nums[0];
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] > max) {
        max = nums[i];
      }
    }
    return max;
  }
`;

console.log('Test 2: Single Loop Code');
console.log('Code:', testCode2);
console.log('\n');

const result2 = analyzeCodeComplexity(testCode2, 'javascript');
console.log('Result:', result2);

console.log('\n' + '='.repeat(60) + '\n');

// Test with literal nested loop from test file
const testCode3 = `// Two Sums - Brute Force (O(n²))
      function twoSum(nums, target) {
        for (let i = 0; i < nums.length; i++) {
          for (let j = i + 1; j < nums.length; j++) {
            if (nums[i] + nums[j] === target) {
              return [i, j];
            }
          }
        }
        return [];
      }
    `;

console.log('Test 3: Code from test file');
console.log('Code:', testCode3);
console.log('\n');

const result3 = analyzeCodeComplexity(testCode3, 'javascript');
console.log('Result:', result3);
