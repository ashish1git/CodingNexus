import axios from 'axios';

// Test the /run endpoint to verify complexity analysis is being returned

const API_BASE = 'http://localhost:3000/api';

// Test code with nested loops (O(n²))
const testCode = `
class Solution {
  public int[] twoSum(int[] nums, int target) {
    for (int i = 0; i < nums.length; i++) {
      for (int j = i + 1; j < nums.length; j++) {
        if (nums[i] + nums[j] == target) {
          return new int[]{i, j};
        }
      }
    }
    return new int[]{};
  }
}
`;

// You'll need to:
// 1. Get a real problem ID from database
// 2. Get a real auth token

async function testRunEndpoint() {
  try {
    console.log('🧪 Testing /run endpoint...\n');

    // First, get competitions to find a problem ID
    console.log('📋 Fetching competitions...');
    const competitionsRes = await axios.get(`${API_BASE}/competitions`, {
      headers: {
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODFhYWU1OC0xNzdhLTQyMDEtYmZhMC1hZmE0OTdhNDJmZTgiLCJlbWFpbCI6InBhbmNoYWxAdGVzdC5jb20iLCJyb2xlIjoic3R1ZGVudCIsImlhdCI6MTc0NDMxNzI4OX0.WDxVSN51rI0jN_OqKwzl6X8WNKoU3QKN2Rjg8zJvwvM`
      }
    });

    const competitions = competitionsRes.data;
    if (!competitions || competitions.length === 0) {
      console.log('❌ No competitions found');
      return;
    }

    const competition = competitions[0];
    const problem = competition.problems[0];

    console.log(`✅ Found problem: ${problem.title} (ID: ${problem.id})`);

    // Now test the /run endpoint
    console.log('\n🏃 Testing POST /submissions/:id/run...');
    const runRes = await axios.post(
      `${API_BASE}/submissions/${problem.id}/run`,
      {
        code: testCode,
        language: 'java'
      },
      {
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODFhYWU1OC0xNzdhLTQyMDEtYmZhMC1hZmE0OTdhNDJmZTgiLCJlbWFpbCI6InBhbmNoYWxAdGVzdC5jb20iLCJyb2xlIjoic3R1ZGVudCIsImlhdCI6MTc0NDMxNzI4OX0.WDxVSN51rI0jN_OqKwzl6X8WNKoU3QKN2Rjg8zJvwvM`
        }
      }
    );

    console.log('\n📊 Response from /run endpoint:');
    console.log(JSON.stringify(runRes.data, null, 2));

    // Check for complexity analysis
    if (runRes.data.complexity) {
      console.log('\n✅ Complexity analysis FOUND:');
      console.log(`   Time: ${runRes.data.complexity.timeComplexity}`);
      console.log(`   Space: ${runRes.data.complexity.spaceComplexity}`);
      console.log(`   Confidence: ${runRes.data.complexity.confidence}%`);
    } else {
      console.log('\n❌ Complexity analysis NOT in response!');
    }

    if (runRes.data.tlePrediction) {
      console.log('\n✅ TLE Prediction FOUND:');
      console.log(`   willTLE: ${runRes.data.tlePrediction.willTLE}`);
      console.log(`   Severity: ${runRes.data.tlePrediction.severity}`);
    } else {
      console.log('\n❌ TLE Prediction NOT in response!');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testRunEndpoint();
