/**
 * Judge0 Docker Evaluation Script
 * Monitors and evaluates Docker container health
 */

import axios from 'axios';

const JUDGE0_URL = process.env.JUDGE0_URL || 'http://64.227.149.20:2358';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
  console.log('\n' + '='.repeat(70));
  log(`  ${message}`, 'cyan');
  console.log('='.repeat(70) + '\n');
}

// Evaluate Judge0 health
async function evaluateJudge0() {
  header('JUDGE0 DOCKER EVALUATION');

  const evaluation = {
    timestamp: new Date().toISOString(),
    url: JUDGE0_URL,
    checks: {
      connectivity: false,
      workers: false,
      configuration: false,
      execution: false
    },
    details: {},
    score: 0,
    maxScore: 4
  };

  // Check 1: Connectivity
  log('🔌 Check 1: API Connectivity', 'blue');
  try {
    const response = await axios.get(`${JUDGE0_URL}/about`, { timeout: 5000 });
    evaluation.checks.connectivity = true;
    evaluation.details.version = response.data.version;
    evaluation.details.maintainer = response.data.maintainer;
    evaluation.score++;
    log(`✅ PASS - Judge0 API is responding`, 'green');
    log(`   Version: ${response.data.version}`, 'green');
  } catch (error) {
    log(`❌ FAIL - Cannot connect to Judge0 API`, 'red');
    log(`   Error: ${error.message}`, 'red');
    evaluation.details.connectivityError = error.message;
  }

  // Check 2: Workers Status
  log('\n👷 Check 2: Docker Workers Status', 'blue');
  try {
    const response = await axios.get(`${JUDGE0_URL}/workers`, { timeout: 5000 });
    const workers = response.data;

    if (Array.isArray(workers)) {
      if (workers.length === 0) {
        log(`❌ FAIL - Workers array is empty`, 'red');
        log(`   This means NO worker containers are running`, 'red');
        evaluation.details.workers = { status: 'none', data: [] };
      } else {
        const workerInfo = workers[0];
        evaluation.details.workers = workerInfo;

        if (workerInfo.available > 0) {
          evaluation.checks.workers = true;
          evaluation.score++;
          log(`✅ PASS - ${workerInfo.available} worker(s) available`, 'green');
          log(`   Idle: ${workerInfo.idle}, Working: ${workerInfo.working}`, 'green');
          log(`   Queue Size: ${workerInfo.size}`, 'green');
        } else {
          log(`❌ FAIL - Workers exist but none available`, 'red');
          log(`   Available: ${workerInfo.available}`, 'red');
          log(`   This means workers are registered but not ready`, 'yellow');
        }
      }
    }
  } catch (error) {
    log(`❌ FAIL - Cannot check workers status`, 'red');
    log(`   Error: ${error.message}`, 'red');
    evaluation.details.workersError = error.message;
  }

  // Check 3: Configuration
  log('\n⚙️  Check 3: System Configuration', 'blue');
  try {
    const response = await axios.get(`${JUDGE0_URL}/config_info`, { timeout: 5000 });
    const config = response.data;
    
    evaluation.checks.configuration = true;
    evaluation.score++;
    evaluation.details.config = {
      maxQueueSize: config.max_queue_size,
      cpuTimeLimit: config.cpu_time_limit,
      memoryLimit: config.memory_limit,
      enableWaitResult: config.enable_wait_result,
      maintenanceMode: config.maintenance_mode
    };

    log(`✅ PASS - Configuration accessible`, 'green');
    log(`   Max Queue Size: ${config.max_queue_size}`, 'green');
    log(`   CPU Time Limit: ${config.cpu_time_limit}s`, 'green');
    log(`   Memory Limit: ${config.memory_limit}KB`, 'green');
    log(`   Wait Result: ${config.enable_wait_result ? 'Enabled' : 'Disabled'}`, 'green');
    log(`   Maintenance Mode: ${config.maintenance_mode ? 'ON' : 'OFF'}`, config.maintenance_mode ? 'yellow' : 'green');
  } catch (error) {
    log(`❌ FAIL - Cannot get configuration`, 'red');
    log(`   Error: ${error.message}`, 'red');
    evaluation.details.configError = error.message;
  }

  // Check 4: Code Execution Test
  log('\n🧪 Check 4: Code Execution Test', 'blue');
  try {
    log(`   Submitting Python test code...`, 'cyan');
    const response = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: 'print("OK")',
        language_id: 71, // Python
        expected_output: 'OK'
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );

    const result = response.data;
    evaluation.details.executionTest = {
      status: result.status?.description,
      statusId: result.status?.id,
      stdout: result.stdout,
      time: result.time,
      memory: result.memory,
      message: result.message
    };

    if (result.status?.id === 3 && result.stdout?.trim() === 'OK') {
      evaluation.checks.execution = true;
      evaluation.score++;
      log(`✅ PASS - Code executed successfully`, 'green');
      log(`   Output: "${result.stdout?.trim()}"`, 'green');
      log(`   Time: ${result.time}s, Memory: ${result.memory}KB`, 'green');
    } else {
      log(`❌ FAIL - Code execution failed`, 'red');
      log(`   Status: ${result.status?.description} (ID: ${result.status?.id})`, 'red');
      log(`   Output: "${result.stdout || '(empty)'}"`, 'red');
      if (result.message) {
        log(`   Message: ${result.message}`, 'yellow');
      }
    }
  } catch (error) {
    log(`❌ FAIL - Cannot execute code`, 'red');
    log(`   Error: ${error.message}`, 'red');
    if (error.response?.data) {
      log(`   Response: ${JSON.stringify(error.response.data)}`, 'yellow');
    }
    evaluation.details.executionError = error.message;
  }

  // Generate Report
  header('EVALUATION REPORT');

  const percentage = (evaluation.score / evaluation.maxScore) * 100;
  
  log(`Score: ${evaluation.score}/${evaluation.maxScore} (${percentage.toFixed(0)}%)`, 
      percentage === 100 ? 'green' : percentage >= 50 ? 'yellow' : 'red');
  log(`Timestamp: ${evaluation.timestamp}`, 'cyan');
  log(`Judge0 URL: ${JUDGE0_URL}`, 'cyan');

  console.log('\nCheck Results:');
  console.log(`  ${evaluation.checks.connectivity ? '✅' : '❌'} API Connectivity`);
  console.log(`  ${evaluation.checks.workers ? '✅' : '❌'} Docker Workers`);
  console.log(`  ${evaluation.checks.configuration ? '✅' : '❌'} Configuration`);
  console.log(`  ${evaluation.checks.execution ? '✅' : '❌'} Code Execution`);

  // Diagnosis and Recommendations
  header('DIAGNOSIS & RECOMMENDATIONS');

  if (evaluation.score === evaluation.maxScore) {
    log('🎉 EXCELLENT! Your Judge0 setup is fully functional!', 'green');
    log('   All systems are operational and ready for production.', 'green');
  } else {
    if (!evaluation.checks.connectivity) {
      log('🔴 CRITICAL: API not accessible', 'red');
      log('   → Check if Docker container is running', 'yellow');
      log('   → Verify firewall allows port 2358', 'yellow');
      log('   → Check server IP: 64.227.149.20', 'yellow');
    }

    if (!evaluation.checks.workers) {
      log('🔴 CRITICAL: Workers not running', 'red');
      log('   → Start workers: docker-compose up -d judge0-workers', 'yellow');
      log('   → Check logs: docker-compose logs judge0-workers', 'yellow');
      log('   → Verify Redis connection in workers', 'yellow');
    }

    if (!evaluation.checks.configuration) {
      log('⚠️  WARNING: Configuration not accessible', 'yellow');
      log('   → This usually means API issues', 'yellow');
    }

    if (!evaluation.checks.execution) {
      log('🔴 CRITICAL: Code execution failing', 'red');
      log('   → Most likely workers are not running', 'yellow');
      log('   → Could also be file system permission issues in /box', 'yellow');
      log('   → Check worker container logs for errors', 'yellow');
    }
  }

  // Docker Commands
  header('USEFUL DOCKER COMMANDS');

  console.log('On your Judge0 server (64.227.149.20), run:\n');
  
  log('# Check running containers', 'cyan');
  console.log('docker ps | grep judge0\n');
  
  log('# Start Judge0 stack', 'cyan');
  console.log('docker-compose up -d\n');
  
  log('# Start only workers', 'cyan');
  console.log('docker-compose up -d judge0-workers\n');
  
  log('# Check worker logs', 'cyan');
  console.log('docker-compose logs -f judge0-workers\n');
  
  log('# Restart workers', 'cyan');
  console.log('docker-compose restart judge0-workers\n');
  
  log('# Check worker status', 'cyan');
  console.log('docker-compose exec judge0-workers ps aux\n');
  
  log('# View all logs', 'cyan');
  console.log('docker-compose logs --tail=50\n');

  console.log('='.repeat(70) + '\n');

  // Save evaluation report
  evaluation.reportGenerated = new Date().toISOString();
  
  return evaluation;
}

// Run evaluation
evaluateJudge0()
  .then(evaluation => {
    // Save to file using ES modules
    import('fs').then(fs => {
      const filename = `judge0-evaluation-${Date.now()}.json`;
      fs.writeFileSync(filename, JSON.stringify(evaluation, null, 2));
      log(`\n📄 Detailed report saved to: ${filename}`, 'green');
      process.exit(evaluation.score === evaluation.maxScore ? 0 : 1);
    });
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
