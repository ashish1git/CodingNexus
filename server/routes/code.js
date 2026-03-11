import express from 'express';
import axios from 'axios';

const router = express.Router();
const JUDGE0_URL = process.env.JUDGE0_URL || 'http://172.17.0.1:2358';

/**
 * Simple code execution endpoint for testing
 * POST /api/code/submit
 * Body: { source_code, language_id, stdin }
 */
router.post('/submit', async (req, res) => {
  try {
    const { source_code, language_id, stdin } = req.body;

    if (!source_code || !language_id) {
      return res.status(400).json({ 
        error: 'source_code and language_id are required' 
      });
    }

    console.log(`🚀 Submitting code to Judge0: ${JUDGE0_URL}`);

    // Submit to Judge0
    const response = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code,
        language_id: parseInt(language_id),
        stdin: stdin || ''
      },
      { 
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const result = response.data;

    res.json({
      success: true,
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      compile_output: result.compile_output,
      time: result.time,
      memory: result.memory,
      token: result.token
    });

  } catch (error) {
    console.error('❌ Judge0 Error:', error.message);
    res.status(500).json({ 
      error: 'Code execution failed', 
      details: error.message,
      judge0_url: JUDGE0_URL
    });
  }
});

/**
 * Get available languages
 * GET /api/code/languages
 */
router.get('/languages', async (req, res) => {
  try {
    const response = await axios.get(`${JUDGE0_URL}/languages`);
    res.json(response.data);
  } catch (error) {
    console.error('❌ Judge0 Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
});

/**
 * Health check for Judge0
 * GET /api/code/health
 */
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${JUDGE0_URL}/about`, { timeout: 5000 });
    res.json({
      judge0_status: 'connected',
      judge0_url: JUDGE0_URL,
      judge0_version: response.data.version
    });
  } catch (error) {
    res.status(500).json({
      judge0_status: 'disconnected',
      judge0_url: JUDGE0_URL,
      error: error.message
    });
  }
});

export default router;
