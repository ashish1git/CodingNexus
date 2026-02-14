/**
 * Comprehensive Judge0 Testing Suite
 * Tests all aspects of Judge0 integration including test cases
 */

import axios from 'axios';

const JUDGE0_URL = 'http://64.227.149.20:2358';

// Color console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test cases for different languages
const TEST_CASES = {
  python: {
    name: 'Python 3.8.1',
    languageId: 71,
    tests: [
      {
        name: 'Hello World',
        code: 'print("Hello World")',
        stdin: '',
        expectedOutput: 'Hello World',
        description: 'Basic print statement'
      },
      {
        name: 'Sum of Two Numbers',
        code: `
a, b = map(int, input().split())
print(a + b)
`,
        stdin: '5 10',
        expectedOutput: '15',
        description: 'Input/output with calculation'
      },
      {
        name: 'Function Test',
        code: `
def add(a, b):
    return a + b

result = add(3, 7)
print(result)
`,
        stdin: '',
        expectedOutput: '10',
        description: 'Function definition and call'
      },
      {
        name: 'Loop Test',
        code: `
for i in range(1, 6):
    print(i)
`,
        stdin: '',
        expectedOutput: '1\n2\n3\n4\n5',
        description: 'Loop iteration'
      }
    ]
  },
  cpp: {
    name: 'C++ (GCC 9.2.0)',
    languageId: 54,
    tests: [
      {
        name: 'Hello World',
        code: `
#include <iostream>
using namespace std;

int main() {
    cout << "Hello World" << endl;
    return 0;
}
`,
        stdin: '',
        expectedOutput: 'Hello World',
        description: 'Basic cout statement'
      },
      {
        name: 'Sum of Two Numbers',
        code: `
#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}
`,
        stdin: '5 10',
        expectedOutput: '15',
        description: 'Input/output with calculation'
      },
      {
        name: 'Function Test',
        code: `
#include <iostream>
using namespace std;

int add(int a, int b) {
    return a + b;
}

int main() {
    int result = add(3, 7);
    cout << result << endl;
    return 0;
}
`,
        stdin: '',
        expectedOutput: '10',
        description: 'Function definition and call'
      }
    ]
  },
  c: {
    name: 'C (GCC 9.2.0)',
    languageId: 50,
    tests: [
      {
        name: 'Hello World',
        code: `
#include <stdio.h>

int main() {
    printf("Hello World\\n");
    return 0;
}
`,
        stdin: '',
        expectedOutput: 'Hello World',
        description: 'Basic printf statement'
      },
      {
        name: 'Sum of Two Numbers',
        code: `
#include <stdio.h>

int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("%d\\n", a + b);
    return 0;
}
`,
        stdin: '5 10',
        expectedOutput: '15',
        description: 'Input/output with calculation'
      }
    ]
  },
  java: {
    name: 'Java (OpenJDK 13.0.1)',
    languageId: 62,
    tests: [
      {
        name: 'Hello World',
        code: `
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}
`,
        stdin: '',
        expectedOutput: 'Hello World',
        description: 'Basic println statement'
      },
      {
        name: 'Sum of Two Numbers',
        code: `
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println(a + b);
    }
}
`,
        stdin: '5 10',
        expectedOutput: '15',
        description: 'Input/output with calculation'
      }
    ]
  },
  javascript: {
    name: 'JavaScript (Node.js 12.14.0)',
    languageId: 63,
    tests: [
      {
        name: 'Hello World',
        code: 'console.log("Hello World");',
        stdin: '',
        expectedOutput: 'Hello World',
        description: 'Basic console.log'
      },
      {
        name: 'Function Test',
        code: `
function add(a, b) {
    return a + b;
}

const result = add(3, 7);
console.log(result);
`,
        stdin: '',
        expectedOutput: '10',
        description: 'Function definition and call'
      }
    ]
  }
};

// Run a single test
async function runTest(language, test) {
  try {
    const response = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: test.code.trim(),
        language_id: language.languageId,
        stdin: test.stdin,
        expected_output: test.expectedOutput
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );

    const result = response.data;
    const actualOutput = (result.stdout || '').trim();
    const expectedOutput = test.expectedOutput.trim();
    const passed = result.status?.id === 3 && actualOutput === expectedOutput;

    return {
      passed,
      status: result.status?.description || 'Unknown',
      statusId: result.status?.id,
      actualOutput,
      expectedOutput,
      time: result.time,
      memory: result.memory,
      stderr: result.stderr,
      compileOutput: result.compile_output,
      message: result.message
    };
  } catch (error) {
    return {
      passed: false,
      error: error.message,
      details: error.response?.data
    };
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n' + '='.repeat(70));
  log('  JUDGE0 COMPREHENSIVE TESTING SUITE', 'cyan');
  console.log('='.repeat(70) + '\n');

  // Step 1: Check Judge0 availability
  log('📡 Step 1: Checking Judge0 Availability...', 'blue');
  try {
    const aboutResponse = await axios.get(`${JUDGE0_URL}/about`);
    log(`✅ Judge0 is online (Version: ${aboutResponse.data.version})`, 'green');
  } catch (error) {
    log(`❌ Judge0 is not accessible: ${error.message}`, 'red');
    process.exit(1);
  }

  // Step 2: Check workers
  log('\n👷 Step 2: Checking Workers Status...', 'blue');
  try {
    const workersResponse = await axios.get(`${JUDGE0_URL}/workers`);
    const workers = workersResponse.data;
    
    if (Array.isArray(workers) && workers.length === 0) {
      log('❌ NO WORKERS RUNNING! Code execution will fail.', 'red');
      log('   Please start Docker workers on your server.', 'yellow');
      log('   See JUDGE0_INTEGRATION.md for instructions.\n', 'yellow');
    } else if (Array.isArray(workers) && workers.length > 0) {
      const workerInfo = workers[0];
      if (workerInfo.available === 0) {
        log(`❌ Workers exist but none available: ${JSON.stringify(workerInfo)}`, 'red');
      } else {
        log(`✅ Workers available: ${workerInfo.available}`, 'green');
        log(`   Idle: ${workerInfo.idle}, Working: ${workerInfo.working}`, 'green');
      }
    }
  } catch (error) {
    log(`⚠️  Could not check workers: ${error.message}`, 'yellow');
  }

  // Step 3: Check configuration
  log('\n⚙️  Step 3: Checking Configuration...', 'blue');
  try {
    const configResponse = await axios.get(`${JUDGE0_URL}/config_info`);
    const config = configResponse.data;
    log(`✅ Max queue size: ${config.max_queue_size}`, 'green');
    log(`   CPU time limit: ${config.cpu_time_limit}s`, 'green');
    log(`   Memory limit: ${config.memory_limit}KB`, 'green');
    log(`   Wait result enabled: ${config.enable_wait_result}`, 'green');
  } catch (error) {
    log(`⚠️  Could not get config: ${error.message}`, 'yellow');
  }

  // Step 4: Run language tests
  log('\n🧪 Step 4: Running Test Cases...', 'blue');
  console.log('='.repeat(70) + '\n');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    error: 0,
    byLanguage: {}
  };

  for (const [langKey, language] of Object.entries(TEST_CASES)) {
    console.log(`\n${'─'.repeat(70)}`);
    log(`Testing ${language.name} (ID: ${language.languageId})`, 'cyan');
    console.log('─'.repeat(70));

    results.byLanguage[langKey] = {
      name: language.name,
      passed: 0,
      failed: 0,
      error: 0
    };

    for (const test of language.tests) {
      results.total++;
      process.stdout.write(`  ${test.name} (${test.description})... `);

      const result = await runTest(language, test);

      if (result.error) {
        log('❌ ERROR', 'red');
        log(`     ${result.error}`, 'red');
        if (result.details) {
          log(`     Details: ${JSON.stringify(result.details)}`, 'red');
        }
        results.failed++;
        results.byLanguage[langKey].error++;
      } else if (result.passed) {
        log('✅ PASSED', 'green');
        log(`     Time: ${result.time}s, Memory: ${result.memory}KB`, 'green');
        results.passed++;
        results.byLanguage[langKey].passed++;
      } else {
        log('❌ FAILED', 'red');
        log(`     Status: ${result.status} (ID: ${result.statusId})`, 'red');
        log(`     Expected: "${result.expectedOutput}"`, 'yellow');
        log(`     Got:      "${result.actualOutput}"`, 'yellow');
        
        if (result.stderr) {
          log(`     Stderr: ${result.stderr}`, 'red');
        }
        if (result.compileOutput) {
          log(`     Compile Output: ${result.compileOutput}`, 'red');
        }
        if (result.message) {
          log(`     Message: ${result.message}`, 'red');
        }
        
        results.failed++;
        results.byLanguage[langKey].failed++;
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  log('  TEST SUMMARY', 'cyan');
  console.log('='.repeat(70));

  console.log(`\nOverall Results:`);
  log(`  Total Tests:   ${results.total}`, 'blue');
  log(`  ✅ Passed:      ${results.passed}`, results.passed > 0 ? 'green' : 'reset');
  log(`  ❌ Failed:      ${results.failed}`, results.failed > 0 ? 'red' : 'reset');
  log(`  ⚠️  Errors:      ${results.error}`, results.error > 0 ? 'yellow' : 'reset');

  console.log(`\nBy Language:`);
  for (const [key, lang] of Object.entries(results.byLanguage)) {
    const total = lang.passed + lang.failed + lang.error;
    const percentage = total > 0 ? ((lang.passed / total) * 100).toFixed(1) : 0;
    console.log(`  ${lang.name}:`);
    log(`    ✅ ${lang.passed}/${total} passed (${percentage}%)`, lang.passed === total ? 'green' : 'yellow');
  }

  console.log('\n' + '='.repeat(70));

  // Final verdict
  if (results.error > 0) {
    log('\n⚠️  ERRORS DETECTED - Judge0 workers may not be running!', 'yellow');
    log('   Run these commands on your server (64.227.149.20):', 'yellow');
    log('   $ ssh user@64.227.149.20', 'cyan');
    log('   $ cd /path/to/judge0', 'cyan');
    log('   $ docker-compose up -d judge0-workers', 'cyan');
    log('   $ docker-compose logs -f judge0-workers\n', 'cyan');
  } else if (results.passed === results.total) {
    log('\n🎉 ALL TESTS PASSED! Judge0 is fully operational!', 'green');
  } else {
    log('\n⚠️  SOME TESTS FAILED - Check output above for details', 'yellow');
  }

  console.log('='.repeat(70) + '\n');
}

// Run the tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
