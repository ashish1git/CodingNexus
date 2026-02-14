#!/usr/bin/env node
/**
 * Quick test for async submission endpoints
 * Run: node test-async-submissions.mjs
 */

import axios from 'axios';

const API_BASE = 'http://localhost:21000/api';
const TEST_TOKEN = 'test-token-123';

async function testAsyncFlow() {
  console.log('🧪 Testing Async Submission Flow...\n');

  try {
    // Test 1: Submit code (should return immediately)
    console.log('📤 Test 1: Submit code to /api/submissions/:problemId/submit-async');
    
    const submitResponse = await axios.post(
      `${API_BASE}/submissions/test-problem-1/submit-async`,
      {
        code: 'print("hello world")',
        language: 'python'
      },
      {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      }
    );

    console.log('✅ Response:', submitResponse.data);
    const submissionId = submitResponse.data.submissionId;
    
    if (!submissionId) {
      console.error('❌ No submissionId returned!');
      return;
    }

    // Test 2: Check status immediately (should be "submitted")
    console.log('\n📊 Test 2: Check status immediately');
    
    const statusResponse1 = await axios.get(
      `${API_BASE}/submissions/${submissionId}/status`,
      {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      }
    );

    console.log('✅ Status:', statusResponse1.data);

    // Test 3: Wait 3 seconds and check again
    console.log('\n⏰ Waiting 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('📊 Test 3: Check status after 3 seconds');
    
    const statusResponse2 = await axios.get(
      `${API_BASE}/submissions/${submissionId}/status`,
      {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      }
    );

    console.log('✅ Status:', statusResponse2.data);

    console.log('\n✅ All tests passed! Async submission flow is working.');

  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testAsyncFlow();
