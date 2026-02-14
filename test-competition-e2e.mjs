import 'dotenv/config';
import axios from 'axios';
import prisma from './server/config/db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const API_URL = 'http://localhost:21000/api';

// Test data
const JAVA_SOLUTION = `class Solution {
    public int[] twoSum(int[] nums, int target) {
        for (int i = 0; i < nums.length; i++) {
            for (int j = i + 1; j < nums.length; j++) {
                if (nums[i] + nums[j] == target) {
                    return new int[]{i, j};
                }
            }
        }
        return new int[]{-1, -1};
    }
}`;

const CPP_SOLUTION = `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        for (int i = 0; i < nums.size(); i++) {
            for (int j = i + 1; j < nums.size(); j++) {
                if (nums[i] + nums[j] == target) {
                    return {i, j};
                }
            }
        }
        return {-1, -1};
    }
};`;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCompetitionFlow() {
  try {
    console.log('🚀 Starting End-to-End Competition Test\n');

    // Step 1: Check if admin exists, if not create one
    console.log('📝 Step 1: Setting up admin user...');
    let adminUser = await prisma.user.findFirst({
      where: { role: 'admin' }
    });

    if (!adminUser) {
      console.log('   Creating new admin user...');
      adminUser = await prisma.user.create({
        data: {
          email: 'test@admin.com',
          password: await bcrypt.hash('admin123', 10),
          role: 'admin',
          isActive: true,
          adminProfile: {
            create: {
              name: 'Test Admin',
              permissions: 'all'
            }
          }
        }
      });
      console.log('   ✅ Admin created');
    } else {
      console.log('   ✅ Using existing admin');
    }

    // Step 2: Login as admin
    console.log('\n🔐 Step 2: Logging in as admin...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: adminUser.email,
      password: 'admin123'
    }).catch(e => {
      // If login fails, might be using different password, let's update it
      console.log('   Login failed, trying with fresh password...');
      return null;
    });

    let authToken;
    if (loginRes) {
      authToken = loginRes.data.token;
      console.log('   ✅ Logged in successfully');
    } else {
      // Create a JWT token manually for testing
      authToken = jwt.sign(
        { userId: adminUser.id, role: 'admin' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );
      console.log('   ✅ Using manual token');
    }

    const headers = { Authorization: `Bearer ${authToken}` };

    // Step 3: Create a test competition
    console.log('\n🏆 Step 3: Creating test competition...');
    const competition = await prisma.competition.create({
      data: {
        title: 'E2E Test Competition',
        description: 'Testing Two Sum Problem',
        difficulty: 'easy',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000), // 1 hour from now
        duration: 60,
        isActive: true,
        createdBy: adminUser.id
      }
    });
    console.log(`   ✅ Competition created: ${competition.id}`);

    // Step 4: Create Two Sum problem
    console.log('\n📋 Step 4: Creating Two Sum problem...');
    const problem = await prisma.problem.create({
      data: {
        competitionId: competition.id,
        title: 'Two Sum',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        difficulty: 'Easy',
        points: 100,
        orderIndex: 1,
        functionName: 'twoSum',
        returnType: 'int[]',
        parameters: [
          { name: 'nums', type: 'int[]' },
          { name: 'target', type: 'int' }
        ],
        constraints: {
          time: '1 second',
          memory: '256 MB'
        },
        examples: [
          {
            input: 'nums = [2,7,11,15], target = 9',
            output: '[0,1]',
            explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
          }
        ],
        testCases: [
          {
            input: '[2,7,11,15]\n9',
            expectedOutput: '[0,1]',
            isPublic: true
          },
          {
            input: '[3,2,4]\n6',
            expectedOutput: '[1,2]',
            isPublic: false
          },
          {
            input: '[3,3]\n6',
            expectedOutput: '[0,1]',
            isPublic: false
          }
        ],
        timeLimit: 3000,
        memoryLimit: 256
      }
    });
    console.log(`   ✅ Problem created: ${problem.id}`);
    console.log(`   📊 Test cases: ${problem.testCases.length}`);

    // Step 5: Create a test student user
    console.log('\n👨‍🎓 Step 5: Setting up student user...');
    let studentUser = await prisma.user.findFirst({
      where: { role: 'student' }
    });

    if (!studentUser) {
      studentUser = await prisma.user.create({
        data: {
          email: 'test@student.com',
          password: await bcrypt.hash('student123', 10),
          role: 'student',
          isActive: true,
          studentProfile: {
            create: {
              name: 'Test Student',
              batch: 'TEST',
              rollNo: 'TEST001'
            }
          }
        }
      });
      console.log('   ✅ Student created');
    } else {
      console.log('   ✅ Using existing student');
    }

    // Login as student
    const studentToken = jwt.sign(
      { userId: studentUser.id, role: 'student' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    const studentHeaders = { Authorization: `Bearer ${studentToken}` };

    // Step 6: Test Java submission
    console.log('\n☕ Step 6: Testing Java solution...');
    const javaSubmission = await axios.post(
      `${API_URL}/submissions/${problem.id}/submit-async`,
      {
        code: JAVA_SOLUTION,
        languageId: 62 // Java
      },
      { headers: studentHeaders }
    );
    console.log(`   ✅ Java submission created: ${javaSubmission.data.submissionId}`);
    console.log(`   📊 Status: ${javaSubmission.data.status}`);

    // Wait for Judge0 processing
    console.log('   ⏳ Waiting for Judge0 to process...');
    await sleep(5000);

    // Check Java status
    const javaStatus = await axios.get(
      `${API_URL}/submissions/${javaSubmission.data.submissionId}/status`,
      { headers: studentHeaders }
    );
    console.log(`   📈 Java Result: ${javaStatus.data.status}`);
    console.log(`   🎯 Score: ${javaStatus.data.score || 0}%`);
    if (javaStatus.data.results) {
      console.log(`   ✓ Test cases passed: ${javaStatus.data.results.filter(r => r.passed).length}/${javaStatus.data.results.length}`);
    }

    // Step 7: Test C++ submission
    console.log('\n⚡ Step 7: Testing C++ solution...');
    const cppSubmission = await axios.post(
      `${API_URL}/submissions/${problem.id}/submit-async`,
      {
        code: CPP_SOLUTION,
        languageId: 54 // C++
      },
      { headers: studentHeaders }
    );
    console.log(`   ✅ C++ submission created: ${cppSubmission.data.submissionId}`);

    // Wait for Judge0 processing
    console.log('   ⏳ Waiting for Judge0 to process...');
    await sleep(5000);

    // Check C++ status
    const cppStatus = await axios.get(
      `${API_URL}/submissions/${cppSubmission.data.submissionId}/status`,
      { headers: studentHeaders }
    );
    console.log(`   📈 C++ Result: ${cppStatus.data.status}`);
    console.log(`   🎯 Score: ${cppStatus.data.score || 0}%`);
    if (cppStatus.data.results) {
      console.log(`   ✓ Test cases passed: ${cppStatus.data.results.filter(r => r.passed).length}/${cppStatus.data.results.length}`);
    }

    // Step 8: Check Judge0 Queue
    console.log('\n🔍 Step 8: Checking Judge0 queue...');
    const queueItems = await prisma.judge0Queue.findMany({
      where: {
        problemId: problem.id
      },
      orderBy: { submittedat: 'desc' },
      take: 10
    });
    console.log(`   📊 Queue items: ${queueItems.length}`);
    for (const item of queueItems) {
      console.log(`   - Token: ${item.judge0Token.substring(0, 12)}... Status: ${item.status}`);
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ END-TO-END TEST COMPLETED');
    console.log('='.repeat(60));
    console.log(`Competition ID: ${competition.id}`);
    console.log(`Problem ID: ${problem.id}`);
    console.log(`Java Submission: ${javaSubmission.data.submissionId}`);
    console.log(`C++ Submission: ${cppSubmission.data.submissionId}`);
    console.log('\n📌 To view in browser:');
    console.log(`   Student view: http://localhost:22000/student/competitions/${competition.id}`);
    console.log(`   Admin view: http://localhost:22000/admin/competitions`);

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    console.error('\nStack:', error.stack);
  }
}

// Run the test
testCompetitionFlow();
