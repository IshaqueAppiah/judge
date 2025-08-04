const express = require('express');
const router = express.Router();
const judge0Service = require('../services/judge0.service');
const { validateSubmission, validateBatchSubmission } = require('../middleware/validation');

// Single submission endpoint
router.post('/single', validateSubmission, async (req, res) => {
  try {
    const { source_code, language_id, stdin, expected_output, use_actual_as_expected } = req.body;
    
    const submission = {
      source_code,
      language_id,
      stdin: stdin || '',
      expected_output: expected_output || null
    };

    const options = {
      useActualAsExpected: use_actual_as_expected === true
    };

    // Create submission and wait for result
    const submissionResult = await judge0Service.createSubmission(submission, options);
    
    // Get the processed result
    const result = await judge0Service.getSubmission(submissionResult.token);
    
    // Include metadata if it exists
    if (submissionResult._metadata) {
      result._metadata = submissionResult._metadata;
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Single submission error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to create submission',
      message: error.message
    });
  }
});

// Get single submission result
router.get('/single/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { include_source } = req.query;
    
    const result = await judge0Service.getSubmission(token);
    
    // Optionally exclude source code from response
    if (include_source === 'false') {
      delete result.source_code;
    }
    
    res.json({
      success: true,
      data: result,
      metadata: {
        token: token,
        retrieved_at: new Date().toISOString(),
        include_source: include_source !== 'false'
      }
    });
  } catch (error) {
    console.error('Get submission error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get submission result',
      message: error.message
    });
  }
});

// Bulk submissions endpoint
router.post('/batch', validateBatchSubmission, async (req, res) => {
  try {
    const { submissions } = req.body;
    
    const result = await judge0Service.createBatchSubmissions(submissions);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Batch submission error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to create batch submissions',
      message: error.message
    });
  }
});

// Get batch submission results
router.get('/batch', async (req, res) => {
  try {
    const { tokens, include_source } = req.query;
    
    if (!tokens) {
      return res.status(400).json({
        success: false,
        error: 'Missing tokens parameter'
      });
    }

    const tokenArray = tokens.split(',');
    const result = await judge0Service.getBatchSubmissions(tokenArray);
    
    // Optionally exclude source code from responses
    if (include_source === 'false') {
      result.forEach(submission => {
        delete submission.source_code;
      });
    }
    
    res.json({
      success: true,
      data: result,
      metadata: {
        tokens: tokenArray,
        count: result.length,
        retrieved_at: new Date().toISOString(),
        include_source: include_source !== 'false'
      }
    });
  } catch (error) {
    console.error('Get batch submissions error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get batch submission results',
      message: error.message
    });
  }
});

// Get supported languages
router.get('/languages', async (req, res) => {
  try {
    const languages = await judge0Service.getLanguages();
    res.json({
      success: true,
      data: languages
    });
  } catch (error) {
    console.error('Get languages error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get supported languages',
      message: error.message
    });
  }
});

module.exports = router;