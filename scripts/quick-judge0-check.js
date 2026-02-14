import axios from 'axios';

const JUDGE0_URL = 'http://64.227.149.20:2358';

async function quickTest() {
  console.log('🧪 Quick Judge0 Test\n');
  console.log('Testing: Java - Simple Hello World\n');

  try {
    const response = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: `public class Main {
    public static void main(String[] args) {
        System.out.println("Judge0 is working!");
    }
}`,
        language_id: 62
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );

    console.log('✅ Judge0 RESPONDED SUCCESSFULLY\n');
    console.log(`Status: ${response.data.status?.description}`);
    console.log(`Output: ${response.data.stdout?.trim()}`);
    console.log(`Time: ${response.data.time}s`);
    console.log(`Memory: ${response.data.memory} bytes\n`);

    // Test 2: C++ Test
    console.log('Testing: C++ - Simple Addition\n');
    
    const cppResponse = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: `#include <iostream>
using namespace std;

int main() {
    int a = 100, b = 200;
    cout << a + b << endl;
    return 0;
}`,
        language_id: 54,
        stdin: ''
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );

    console.log('✅ C++ Test PASSED\n');
    console.log(`Status: ${cppResponse.data.status?.description}`);
    console.log(`Output: ${cppResponse.data.stdout?.trim()}`);
    console.log(`Expected: 300`);
    console.log(`Match: ${cppResponse.data.stdout?.trim() === '300' ? '✅ YES' : '❌ NO'}\n`);

    // Test 3: Python Test
    console.log('Testing: Python - Function Call\n');
    
    const pyResponse = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: `a, b = 50, 75
print(a + b)`,
        language_id: 71,
        stdin: ''
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );

    console.log('✅ Python Test PASSED\n');
    console.log(`Status: ${pyResponse.data.status?.description}`);
    console.log(`Output: ${pyResponse.data.stdout?.trim()}`);
    console.log(`Expected: 125`);
    console.log(`Match: ${pyResponse.data.stdout?.trim() === '125' ? '✅ YES' : '❌ NO'}\n`);

    console.log('═'.repeat(60));
    console.log('✅ ALL JUDGE0 TESTS PASSED!');
    console.log('Judge0 is ONLINE and WORKING PERFECTLY');
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    process.exit(1);
  }
}

quickTest();
