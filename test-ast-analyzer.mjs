/**
 * Test the AST-based complexity analyzer
 * Using the Two Sums problem from the screenshot as test case
 */

import { analyzeCodeComplexity, analyzeComplexity } from './server/utils/astComplexityAnalyzer.js';

// Test Case 1: Brute Force Two Sums (O(n²))
const bruteForceCode = `
class Solution {
  public int[] solution(int[] nums, int target) {
    // Write your solution here
    for(int i = 0; i < nums.length; i++){
      for(int j = 0; j < nums.length; j++){
        if(target==nums[i]+nums[j]){
          int[] num = {i, j};
          return num;
        }
      }
    }
    return nums;
  }
}
`;

// Test Case 2: Optimized Two Sums with HashMap (O(n))
const optimizedCode = `
class Solution {
  public int[] solution(int[] nums, int target) {
    HashMap<Integer, Integer> map = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
      int complement = target - nums[i];
      if (map.containsKey(complement)) {
        return new int[] { map.get(complement), i };
      }
      map.put(nums[i], i);
    }
    return new int[] {};
  }
}
`;

// Test Case 3: Single Loop (O(n))
const linearCode = `
function solution(nums, target) {
  const seen = new Set();
  for (let i = 0; i < nums.length; i++) {
    if (seen.has(target - nums[i])) {
      return [seen.get(target - nums[i]), i];
    }
    seen.add(nums[i]);
  }
  return [];
}
`;

console.log('🧪 AST Complexity Analyzer Test Suite');
console.log('======================================\n');

console.log('✅ Test 1: Brute Force Two Sums (Expected O(n²))');
console.log('-'.repeat(50));
const result1 = analyzeCodeComplexity(bruteForceCode, 'java');
console.log(JSON.stringify(result1, null, 2));
console.log();

console.log('✅ Test 2: Optimized Two Sums with HashMap (Expected O(n))');
console.log('-'.repeat(50));
const result2 = analyzeCodeComplexity(optimizedCode, 'java');
console.log(JSON.stringify(result2, null, 2));
console.log();

console.log('✅ Test 3: Single Loop - Linear Search (Expected O(n))');
console.log('-'.repeat(50));
const result3 = analyzeCodeComplexity(linearCode, 'javascript');
console.log(JSON.stringify(result3, null, 2));
console.log();

// Verify results
console.log('📊 Verification Results');
console.log('-'.repeat(50));
console.log(`Test 1 - Brute Force: ${result1.timeComplexity === 'O(n²)' ? '✓ PASS' : '✗ FAIL'}`);
console.log(`Test 2 - Optimized (HashMap): ${result2.timeComplexity === 'O(n)' ? '✓ PASS' : '✗ FAIL'}`);
console.log(`Test 3 - Linear Search: ${result3.timeComplexity === 'O(n)' ? '✓ PASS' : '✗ FAIL'}`);
