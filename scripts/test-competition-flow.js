/**
 * End-to-End Competition Test
 * Simulates actual competition submission flow
 */

import axios from 'axios';

const JUDGE0_URL = process.env.JUDGE0_URL || 'http://64.227.149.20:2358';

// Sample competition problem
const COMPETITION_PROBLEM = {
  id: 1,
  title: 'Two Sum',
  description: 'Given an array of integers, return indices of two numbers that add up to target',
  functionName: 'twoSum',
  parameters: [
    { name: 'nums', type: 'int[]' },
    { name: 'target', type: 'int' }
  ],
  returnType: 'int[]',
  testCases: [
    {
      input: '[2,7,11,15], 9',
      output: '[0,1]',
      explanation: 'nums[0] + nums[1] = 2 + 7 = 9'
    },
    {
      input: '[3,2,4], 6',
      output: '[1,2]',
      explanation: 'nums[1] + nums[2] = 2 + 4 = 6'
    },
    {
      input: '[3,3], 6',
      output: '[0,1]',
      explanation: 'nums[0] + nums[1] = 3 + 3 = 6'
    }
  ]
};

// Sample user submissions
const SUBMISSIONS = [
  {
    language: 'python',
    languageId: 71,
    code: `def twoSum(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []`
  },
  {
    language: 'cpp',
    languageId: 54,
    code: `#include <vector>
#include <unordered_map>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> map;
    for (int i = 0; i < nums.size(); i++) {
        int complement = target - nums[i];
        if (map.find(complement) != map.end()) {
            return {map[complement], i};
        }
        map[nums[i]] = i;
    }
    return {};
}`
  }
];

// Wrap code for execution
function wrapPythonCode(userCode, testCase) {
  // Parse test case input
  const [numsStr, targetStr] = testCase.input.split(',').map(s => s.trim());
  const nums = numsStr;
  const target = targetStr;

  return `
${userCode}

# Test execution
nums = ${nums}
target = ${target}
result = twoSum(nums, target)
print(result)
`;
}

function wrapCppCode(userCode, testCase) {
  const [numsStr, targetStr] = testCase.input.split(',').map(s => s.trim());
  
  // Convert [2,7,11,15] to {2,7,11,15}
  const cppArray = numsStr.replace('[', '{').replace(']', '}');
  const target = targetStr;

  return `
${userCode}

#include <iostream>
int main() {
    vector<int> nums = ${cppArray};
    int target = ${target};
    vector<int> result = twoSum(nums, target);
    
    cout << "[";
    for (int i = 0; i < result.size(); i++) {
        cout << result[i];
        if (i < result.size() - 1) cout << ",";
    }
    cout << "]" << endl;
    
    return 0;
}
`;
}

// Test a single submission
async function testSubmission(submission, problem) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Testing ${submission.language.toUpperCase()} Submission`);
  console.log('='.repeat(70));

  let totalPassed = 0;
  const results = [];

  for (let i = 0; i < problem.testCases.length; i++) {
    const testCase = problem.testCases[i];
    console.log(`\nTest Case ${i + 1}: ${testCase.input}`);
    console.log(`Expected: ${testCase.output}`);

    try {
      // Wrap code with test harness
      let executableCode;
      if (submission.language === 'python') {
        executableCode = wrapPythonCode(submission.code, testCase);
      } else if (submission.language === 'cpp') {
        executableCode = wrapCppCode(submission.code, testCase);
      }

      // Submit to Judge0
      const response = await axios.post(
        `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
        {
          source_code: executableCode,
          language_id: submission.languageId,
          expected_output: testCase.output
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000
        }
      );

      const result = response.data;
      const actualOutput = (result.stdout || '').trim();
      const expectedOutput = testCase.output.trim();
      const passed = result.status?.id === 3 && actualOutput === expectedOutput;

      if (passed) {
        console.log(`✅ PASSED`);
        console.log(`   Output: ${actualOutput}`);
        console.log(`   Time: ${result.time}s, Memory: ${result.memory}KB`);
        totalPassed++;
      } else {
        console.log(`❌ FAILED`);
        console.log(`   Status: ${result.status?.description}`);
        console.log(`   Expected: ${expectedOutput}`);
        console.log(`   Got: ${actualOutput}`);
        if (result.stderr) console.log(`   Error: ${result.stderr}`);
        if (result.message) console.log(`   Message: ${result.message}`);
      }

      results.push({
        testCase: i + 1,
        passed,
        status: result.status?.description,
        output: actualOutput,
        time: result.time,
        memory: result.memory
      });

    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      results.push({
        testCase: i + 1,
        passed: false,
        error: error.message
      });
    }
  }

  const score = Math.round((totalPassed / problem.testCases.length) * 100);
  console.log(`\nFinal Score: ${score}% (${totalPassed}/${problem.testCases.length} test cases passed)`);

  return { score, totalPassed, results };
}

// Main test runner
async function runCompetitionTest() {
  console.log('\n' + '='.repeat(70));
  console.log('  END-TO-END COMPETITION SUBMISSION TEST');
  console.log('='.repeat(70));

  console.log(`\nProblem: ${COMPETITION_PROBLEM.title}`);
  console.log(`Test Cases: ${COMPETITION_PROBLEM.testCases.length}`);
  console.log(`Submissions to Test: ${SUBMISSIONS.length}`);

  // Check Judge0 status first
  console.log(`\n${'─'.repeat(70)}`);
  console.log('Checking Judge0 Status...');
  console.log('─'.repeat(70));

  try {
    const aboutResponse = await axios.get(`${JUDGE0_URL}/about`);
    console.log(`✅ Judge0 Online (Version: ${aboutResponse.data.version})`);

    const workersResponse = await axios.get(`${JUDGE0_URL}/workers`);
    const workers = workersResponse.data;
    
    if (Array.isArray(workers) && workers.length === 0) {
      console.log('❌ NO WORKERS AVAILABLE!');
      console.log('⚠️  Tests will fail. Please start Docker workers first.');
      console.log('   See JUDGE0_DOCKER_GUIDE.md for instructions.\n');
    } else if (workers[0]?.available > 0) {
      console.log(`✅ Workers Available: ${workers[0].available}`);
    }
  } catch (error) {
    console.log(`❌ Cannot connect to Judge0: ${error.message}`);
    console.log('Tests cannot proceed.\n');
    process.exit(1);
  }

  // Test all submissions
  const allResults = [];
  for (const submission of SUBMISSIONS) {
    const result = await testSubmission(submission, COMPETITION_PROBLEM);
    allResults.push({
      language: submission.language,
      ...result
    });
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('  TEST SUMMARY');
  console.log('='.repeat(70));

  allResults.forEach(result => {
    console.log(`\n${result.language.toUpperCase()}:`);
    console.log(`  Score: ${result.score}%`);
    console.log(`  Passed: ${result.totalPassed}/${COMPETITION_PROBLEM.testCases.length}`);
  });

  console.log('\n' + '='.repeat(70));
  
  const allPassed = allResults.every(r => r.totalPassed === COMPETITION_PROBLEM.testCases.length);
  if (allPassed) {
    console.log('🎉 ALL SUBMISSIONS PASSED! Competition system is working!');
  } else {
    console.log('⚠️  Some submissions failed. Check Judge0 workers status.');
  }
  
  console.log('='.repeat(70) + '\n');
}

// Run the test
runCompetitionTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
