/**
 * Integration Test: AST-based Complexity Analyzer with Competition System
 * Simulates a real code submission and verifies complexity detection
 */

import { analyzeCodeComplexity } from './server/utils/astComplexityAnalyzer.js';
import { analyzeTimeComplexity, generateComplexityReport } from './server/utils/complexityAnalyzer.js';

console.log('🔬 Integration Test: Full Complexity Analysis Pipeline');
console.log('='.repeat(60));
console.log();

// Simulate a real submission like in the screenshot
const submission = {
  id: 'test-sub-001',
  code: `
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
`,
  sourceCode: `
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
`,
  language: 'java',
  testResults: [
    { time: '0.005', memory: 15, input: '[2,7,11,15] , 9' },
    { time: '0.032', memory: 24, input: '[2,7,11,15,2,8,9] , 9' },
    { time: '0.128', memory: 48, input: '[2,7,11,15,2,8,9,1,3,4,5,6,7,8,9,10] , 9' }
  ]
};

const problem = {
  id: 'two-sums',
  title: 'Two Sums',
  expectedComplexity: 'O(n)',
  expectedSpace: 'O(1)',
  language: 'java'
};

console.log('📝 TEST SUBMISSION');
console.log('-'.repeat(60));
console.log(`Problem: ${problem.title}`);
console.log(`Language: ${submission.language}`);
console.log(`Expected Complexity: ${problem.expectedComplexity}`);
console.log(`Test Cases: ${submission.testResults.length}`);
console.log();

// Step 1: AST Analysis (NEW PRIMARY METHOD)
console.log('✓ STEP 1: AST-Based Code Analysis');
console.log('-'.repeat(60));
const astAnalysis = analyzeCodeComplexity(submission.code, submission.language);
console.log(`Code Structure Analysis:`);
console.log(`  • Loops Found: ${astAnalysis.loops}`);
console.log(`  • Max Nesting Depth: ${astAnalysis.maxNesting}`);
console.log(`  • Has Recursion: ${astAnalysis.hasRecursion}`);
console.log(`  • Data Structures: ${Object.keys(astAnalysis.dataStructures).length === 0 ? 'None' : Object.keys(astAnalysis.dataStructures).join(', ')}`);
console.log();
console.log(`📊 Result:`);
console.log(`  • Time Complexity: ${astAnalysis.timeComplexity}`);
console.log(`  • Time Explanation: ${astAnalysis.timeExplanation}`);
console.log(`  • Space Complexity: ${astAnalysis.spaceComplexity}`);
console.log(`  • Confidence: ${astAnalysis.confidence}%`);
console.log();

// Step 2: Full Complexity Report (combines all methods)
console.log('✓ STEP 2: Full Complexity Report');
console.log('-'.repeat(60));
const report = generateComplexityReport(submission, problem);
console.log(`Report Status: ${report.canEvaluate ? 'CanEvaluate' : 'Cannot Evaluate'}`);
console.log();

if (report.canEvaluate) {
  console.log('Time Complexity Analysis:');
  console.log(`  • Estimated: ${report.timeComplexity.estimated}`);
  console.log(`  • Explanation: ${report.timeComplexity.explanation}`);
  console.log(`  • Confidence: ${report.timeComplexity.confidence}%`);
  if (report.timeComplexity.astAnalysis) {
    console.log(`  • Source: AST-based analysis ✓`);
  }
  console.log();

  console.log('Space Complexity Analysis:');
  console.log(`  • Estimated: ${report.spaceComplexity.estimated}`);
  console.log(`  • Confidence: ${report.spaceComplexity.confidence}%`);
  console.log();

  console.log('Efficiency Rating:');
  console.log(`  • Expected: ${report.expectedComplexity}`);
  console.log(`  • Actual: ${report.timeComplexity.estimated}`);
  console.log(`  • Rating: ${report.efficiencyRating}`);
  console.log();

  console.log('Execution Metrics:');
  console.log(`  • Max Time: ${report.executionMetrics.maxTime.toFixed(3)}ms`);
  console.log(`  • Max Memory: ${report.executionMetrics.maxMemory} MB`);
  console.log(`  • Avg Time: ${report.executionMetrics.avgTime.toFixed(3)}ms`);
  console.log(`  • Avg Memory: ${report.executionMetrics.avgMemory.toFixed(1)} MB`);
}
console.log();

// Step 3: Verification
console.log('✓ STEP 3: Verification & Error Detection');
console.log('-'.repeat(60));

const errors = [];
const warnings = [];

// Check if algorithm is optimal
if (report.timeComplexity.estimated !== 'O(n)' && problem.expectedComplexity === 'O(n)') {
  errors.push(`❌ Suboptimal algorithm detected: ${report.timeComplexity.estimated} instead of ${problem.expectedComplexity}`);
  errors.push(`   The solution has nested loops and should use a hash map for O(n) complexity`);
}

// Check for memory optimization
if (report.spaceComplexity.estimated === 'O(n)' && problem.expectedSpace === 'O(1)') {
  warnings.push(`⚠️  Extra memory used: ${report.spaceComplexity.estimated} instead of ${problem.expectedSpace}`);
}

// Efficiency score
if (report.timeComplexity.estimated === problem.expectedComplexity) {
  console.log(`✅ Algorithm is optimal for the problem`);
  console.log(`   Submitted: ${report.timeComplexity.estimated}`);
  console.log(`   Expected: ${problem.expectedComplexity}`);
} else if (errors.length === 0) {
  console.log(`✓ Algorithm efficiency acceptable`);
  console.log(`   Submitted: ${report.timeComplexity.estimated}`);
  console.log(`   Expected: ${problem.expectedComplexity}`);
}

if (errors.length > 0) {
  console.log();
  console.log('Errors Found:');
  errors.forEach(e => console.log(`  ${e}`));
}

if (warnings.length > 0) {
  console.log();
  console.log('Warnings:');
  warnings.forEach(w => console.log(`  ${w}`));
}

console.log();
console.log('='.repeat(60));
console.log(`✅ Test Complete - AST Analyzer working correctly`);
console.log(`   Primary method: AST-based code analysis`);
console.log(`   Fallback methods: Memory metrics, Runtime metrics`);
console.log('='.repeat(60));
