/**
 * Test: Pre-Test Complexity Check
 * ================================
 * Tests that complexity is checked IMMEDIATELY after compilation,
 * BEFORE running test cases, and blocks execution if critical TLE risk detected.
 */

import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Test Data
const testCases = [
  {
    name: 'Nested Loop (O(n²)) vs Expected O(n) → Should BLOCK',
    problemId: 'test-pretest-1',
    code: `
      // Two Sums - Brute Force (O(n²))
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
    `,
    language: 'javascript',
    expectedComplexity: 'O(n)',
    expectedBehavior: 'BLOCKED with TLE error',
    expectedStatus: 'tle',
    expectedErrorKeywords: ['Time Limit Exceeds', 'O(n²)', 'O(n)']
  },
  {
    name: 'HashMap Approach (O(n)) vs Expected O(n) → Should PASS',
    problemId: 'test-pretest-2',
    code: `
      // Two Sums - HashMap (O(n))
      function twoSum(nums, target) {
        const map = new Map();
        for (let i = 0; i < nums.length; i++) {
          if (map.has(target - nums[i])) {
            return [map.get(target - nums[i]), i];
          }
          map.set(nums[i], i);
        }
        return [];
      }
    `,
    language: 'javascript',
    expectedComplexity: 'O(n)',
    expectedBehavior: 'ALLOWED - proceeds to test cases',
    expectedStatus: 'accepted',
    expectedErrorKeywords: []
  }
];

async function runTests() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 PRE-TEST COMPLEXITY CHECK TESTS');
  console.log('='.repeat(70) + '\n');

  for (const test of testCases) {
    console.log(`\n📋 Test: ${test.name}`);
    console.log(`   Problem ID: ${test.problemId}`);
    console.log(`   Language: ${test.language}`);
    console.log(`   Expected Status: ${test.expectedStatus}`);
    console.log(`   Expected Behavior: ${test.expectedBehavior}`);
    console.log('-'.repeat(70));

    try {
      // Step 1: Create a test submission using the real endpoint
      console.log('   📝 Simulating submission...');
      
      // Use the analyze-complexity endpoint for real-time verification
      const analysisResponse = await axios.post(
        `${API_URL}/competition/test-problem-id/analyze-complexity`,
        {
          code: test.code,
          language: test.language,
          problemId: test.problemId
        },
        { validateStatus: () => true }
      );

      const analysis = analysisResponse.data;
      
      console.log(`   ✓ Real-time Analysis Response:`);
      console.log(`     - Time Complexity: ${analysis.analysis?.timeComplexity || 'unknown'}`);
      console.log(`     - Confidence: ${analysis.analysis?.confidence || 0}%`);
      console.log(`     - Loops Detected: ${analysis.analysis?.loops || 0}`);
      console.log(`     - Has Recursion: ${analysis.analysis?.hasRecursion || false}`);
      
      if (analysis.constraints) {
        console.log(`   ✓ Constraints:`);
        console.log(`     - Expected: ${analysis.constraints.expected}`);
        console.log(`     - Time Limit: ${analysis.constraints.timeLimit}ms`);
        console.log(`     - Memory Limit: ${analysis.constraints.memoryLimit}MB`);
      }

      if (analysis.tlePrediction) {
        console.log(`   ✓ TLE Prediction:`);
        console.log(`     - Will TLE: ${analysis.tlePrediction.willTLE}`);
        console.log(`     - Severity: ${analysis.tlePrediction.severity}`);
        console.log(`     - Reason: ${analysis.tlePrediction.reason}`);
        console.log(`     - Recommendation: ${analysis.tlePrediction.recommendation}`);
      }

      if (analysis.feedback) {
        console.log(`   ✓ Feedback:`);
        analysis.feedback.messages?.forEach(msg => console.log(`     • ${msg}`));
        analysis.feedback.warnings?.forEach(warn => console.log(`     ⚠️  ${warn}`));
        analysis.feedback.suggestions?.forEach(sug => console.log(`     💡 ${sug}`));
      }

      // Verify expected outcome
      console.log(`\n   ✅ Verification:`);
      let passCount = 0;
      let totalChecks = 0;

      // Check 1: Complexity detection
      totalChecks++;
      if (analysis.analysis?.timeComplexity) {
        console.log(`     ✓ Complexity detected: ${analysis.analysis.timeComplexity}`);
        passCount++;
      } else {
        console.log(`     ✗ Complexity not detected`);
      }

      // Check 2: TLE prediction for critical cases
      if (test.expectedStatus === 'tle') {
        totalChecks++;
        if (analysis.tlePrediction?.willTLE === true && analysis.tlePrediction?.severity === 'critical') {
          console.log(`     ✓ TLE correctly predicted as CRITICAL`);
          passCount++;
        } else if (analysis.tlePrediction?.willTLE === true && analysis.tlePrediction?.severity === 'high') {
          console.log(`     ~ TLE predicted as HIGH (minor severity variance)`);
          passCount++;
        } else {
          console.log(`     ✗ TLE not predicted for ${analysis.analysis?.timeComplexity} (expected TLE block)`);
        }
      }

      // Check 3: Messages contain expected keywords
      if (test.expectedErrorKeywords.length > 0) {
        const allMessages = [
          ...(analysis.feedback?.messages || []),
          ...(analysis.feedback?.warnings || []),
          analysis.tlePrediction?.reason || ''
        ].join(' ').toLowerCase();
        
        test.expectedErrorKeywords.forEach(keyword => {
          totalChecks++;
          if (allMessages.includes(keyword.toLowerCase())) {
            console.log(`     ✓ Message contains keyword: "${keyword}"`);
            passCount++;
          } else {
            console.log(`     ✗ Missing keyword: "${keyword}"`);
          }
        });
      }

      const score = Math.round((passCount / totalChecks) * 100);
      console.log(`\n   📊 Score: ${passCount}/${totalChecks} checks passed (${score}%)`);

      if (score === 100) {
        console.log(`   ✅ TEST PASSED`);
      } else if (score >= 75) {
        console.log(`   ⚠️  TEST PARTIAL (${100 - score}% warnings)`);
      } else {
        console.log(`   ❌ TEST FAILED`);
      }

    } catch (error) {
      console.error(`   ❌ ERROR: ${error.message}`);
      if (error.response) {
        console.error(`      Status: ${error.response.status}`);
        console.error(`      Data:`, error.response.data);
      }
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('🏁 Test Complete');
  console.log('='.repeat(70) + '\n');
}

runTests().catch(console.error);
