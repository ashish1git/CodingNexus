// Quick diagnosis of Judge0 422 error
import axios from 'axios';

const JUDGE0_URL = 'http://64.227.149.20:2358';

// Test different parameter combinations to find what's causing 422
async function testRequest(testName, requestBody) {
  console.log(`\n🔍 Testing: ${testName}`);
  console.log('Request body:', JSON.stringify(requestBody, null, 2));
  
  try {
    const response = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
      requestBody,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );
    
    console.log('✅ SUCCESS - Status:', response.data.status?.description);
    return true;
  } catch (error) {
    console.log('❌ FAILED - Status:', error.response?.status);
    console.log('Error details:', JSON.stringify(error.response?.data, null, 2));
    return false;
  }
}

async function runDiagnostics() {
  console.log('🚀 Judge0 422 Error Diagnostics');
  console.log('================================\n');
  
  // Test 1: Simple Python with all parameters
  await testRequest('Simple Python with all params', {
    source_code: 'print("Hello")',
    language_id: 71,
    stdin: '',
    expected_output: 'Hello',
    cpu_time_limit: 2,
    memory_limit: 128000
  });
  
  // Test 2: Without cpu_time_limit
  await testRequest('Without cpu_time_limit', {
    source_code: 'print("Hello")',
    language_id: 71,
    stdin: '',
    expected_output: 'Hello',
    memory_limit: 128000
  });
  
  // Test 3: Without memory_limit
  await testRequest('Without memory_limit', {
    source_code: 'print("Hello")',
    language_id: 71,
    stdin: '',
    expected_output: 'Hello',
    cpu_time_limit: 2
  });
  
  // Test 4: Minimal parameters
  await testRequest('Minimal params (no limits)', {
    source_code: 'print("Hello")',
    language_id: 71
  });
  
  // Test 5: With different time limit format
  await testRequest('Time limit as string', {
    source_code: 'print("Hello")',
    language_id: 71,
    cpu_time_limit: '2',
    memory_limit: '128000'
  });
  
  // Test 6: Check if Judge0 supports these parameters
  console.log('\n\n🔍 Checking Judge0 configuration...');
  try {
    const configResponse = await axios.get(`${JUDGE0_URL}/config_info`);
    console.log('Judge0 Config:', JSON.stringify(configResponse.data, null, 2));
  } catch (error) {
    console.log('Could not fetch config:', error.message);
  }
}

runDiagnostics().catch(console.error);
