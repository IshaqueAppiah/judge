const axios = require('axios');

class Judge0Service {
  constructor() {
    this.baseURL = process.env.JUDGE0_URL || 'http://localhost:2358';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  async createSubmission(submission, options = {}) {
    try {
      // If useActualAsExpected is true, first run without expected_output to get actual output
      if (options.useActualAsExpected) {
        return await this.createSubmissionWithActualAsExpected(submission);
      }

      const response = await this.client.post('/submissions', submission, {
        params: {
          base64_encoded: 'false',
          wait: 'true'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create submission: ${error.response?.data?.message || error.message}`);
    }
  }

  async createSubmissionWithActualAsExpected(submission) {
    try {
      // First, run without expected_output to get the actual output
      const firstSubmission = { ...submission };
      delete firstSubmission.expected_output;

      const firstResponse = await this.client.post('/submissions', firstSubmission, {
        params: {
          base64_encoded: 'false',
          wait: 'true'
        }
      });

      // Use the raw stdout output as expected output (before our processing)
      const rawOutput = firstResponse.data.stdout;

      if (!rawOutput || !rawOutput.trim()) {
        throw new Error('No raw output found to use as expected output');
      }

      // Now create a second submission with the raw output as expected output
      const secondSubmission = {
        ...submission,
        expected_output: rawOutput.trim()
      };

      const secondResponse = await this.client.post('/submissions', secondSubmission, {
        params: {
          base64_encoded: 'false',
          wait: 'true'
        }
      });

      // Add metadata about the process
      const result = secondResponse.data;
      result._metadata = {
        used_actual_as_expected: true,
        extracted_output: rawOutput.trim(),
        first_submission_token: firstResponse.data.token
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to create submission with actual as expected: ${error.response?.data?.message || error.message}`);
    }
  }

  async getSubmission(token) {
    try {
      const response = await this.client.get(`/submissions/${token}`, {
        params: {
          base64_encoded: 'false'
        }
      });
      return this.processSubmissionResult(response.data);
    } catch (error) {
      throw new Error(`Failed to get submission: ${error.response?.data?.message || error.message}`);
    }
  }

  async createBatchSubmissions(submissions) {
    try {
      const response = await this.client.post('/submissions/batch', {
        submissions: submissions
      }, {
        params: {
          base64_encoded: 'false'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create batch submissions: ${error.response?.data?.message || error.message}`);
    }
  }

  async getBatchSubmissions(tokens) {
    try {
      const response = await this.client.get('/submissions/batch', {
        params: {
          tokens: tokens.join(','),
          base64_encoded: 'false'
        }
      });
      return response.data.map(submission => this.processSubmissionResult(submission));
    } catch (error) {
      throw new Error(`Failed to get batch submissions: ${error.response?.data?.message || error.message}`);
    }
  }

  processSubmissionResult(submission) {
    const result = {
      token: submission.token,
      status: {
        id: submission.status?.id,
        description: submission.status?.description
      },
      language: {
        id: submission.language_id,
        name: submission.language?.name
      },
      execution: {
        time: submission.time,
        memory: submission.memory,
        wall_time: submission.wall_time
      },
      output: {
        stdout: this.cleanOutput(submission.stdout),
        stderr: this.cleanOutput(submission.stderr),
        compile_output: this.cleanOutput(submission.compile_output)
      },
      source_code: submission.source_code,
      stdin: submission.stdin,
      expected_output: submission.expected_output,
      created_at: submission.created_at,
      finished_at: submission.finished_at
    };

    // Add execution result summary
    result.execution_summary = this.getExecutionSummary(submission);
    
    // Add output comparison details for debugging
    if (submission.expected_output && result.output.stdout?.actual) {
      result.output_comparison = this.compareOutputs(
        result.output.stdout.actual,
        submission.expected_output
      );
    }
    
    // Also add metadata if it exists from the submission result
    if (submission._metadata) {
      result._metadata = submission._metadata;
    }
    
    return result;
  }

  cleanOutput(output) {
    if (!output) return null;
    
    // Remove trailing newlines and whitespace
    const cleaned = output.trim();
    
    // Separate actual output from potential debug/log messages
    const lines = cleaned.split('\n');
    const actualOutput = [];
    const logs = [];
    const extractedValues = new Set(); // Track extracted values to avoid duplicates
    
    lines.forEach(line => {
      // Common log patterns to separate from actual output
      if (this.isLogLine(line)) {
        logs.push(line);
        // Extract actual output from debug messages
        const actualFromLog = this.extractActualFromLog(line);
        if (actualFromLog && !extractedValues.has(actualFromLog)) {
          actualOutput.push(actualFromLog);
          extractedValues.add(actualFromLog);
        }
      } else if (!extractedValues.has(line.trim())) {
        // Only add non-log lines if they haven't been extracted already
        actualOutput.push(line);
        extractedValues.add(line.trim());
      }
    });
    
    return {
      raw: cleaned,
      actual: actualOutput.length > 0 ? actualOutput.join('\n').trim() : null,
      logs: logs.length > 0 ? logs.join('\n') : null,
      lines: lines
    };
  }

  compareOutputs(actualOutput, expectedOutput) {
    console.log('DEBUG - Comparing outputs:');
    console.log('Actual:', JSON.stringify(actualOutput));
    console.log('Expected:', JSON.stringify(expectedOutput));
    
    if (!actualOutput || !expectedOutput) {
      return {
        match: false,
        reason: 'Missing output for comparison',
        actual_length: actualOutput?.length || 0,
        expected_length: expectedOutput?.length || 0
      };
    }

    const actualTrimmed = actualOutput.trim();
    const expectedTrimmed = expectedOutput.trim();
    
    const comparison = {
      exact_match: actualOutput === expectedOutput,
      trimmed_match: actualTrimmed === expectedTrimmed,
      case_insensitive_match: actualTrimmed.toLowerCase() === expectedTrimmed.toLowerCase(),
      actual_output: actualOutput,
      expected_output: expectedOutput,
      actual_length: actualOutput.length,
      expected_length: expectedOutput.length,
      differences: []
    };

    console.log('DEBUG - Comparison result:', comparison);

    // Find specific differences
    if (!comparison.exact_match) {
      if (actualOutput.length !== expectedOutput.length) {
        comparison.differences.push('Length mismatch');
      }
      
      if (actualTrimmed !== expectedTrimmed) {
        comparison.differences.push('Content difference after trimming');
      }
      
      if (actualOutput !== actualTrimmed || expectedOutput !== expectedTrimmed) {
        comparison.differences.push('Whitespace differences');
      }
      
      // Check for invisible characters
      const actualCodes = [...actualOutput].map(c => c.charCodeAt(0));
      const expectedCodes = [...expectedOutput].map(c => c.charCodeAt(0));
      
      if (JSON.stringify(actualCodes) !== JSON.stringify(expectedCodes)) {
        comparison.differences.push('Character encoding differences');
        comparison.actual_char_codes = actualCodes;
        comparison.expected_char_codes = expectedCodes;
      }
    }

    return comparison;
  }

  extractActualFromLog(line) {
    // Extract actual output from common debug message patterns
    const extractionPatterns = [
      { pattern: /^Generated greeting:\s*(.+)$/i, group: 1 },
      { pattern: /^Debug: Generated greeting -\s*(.+)$/i, group: 1 },
      { pattern: /^Output:\s*(.+)$/i, group: 1 },
      { pattern: /^Result:\s*(.+)$/i, group: 1 },
      { pattern: /^Answer:\s*(.+)$/i, group: 1 },
      { pattern: /^Response:\s*(.+)$/i, group: 1 },
      { pattern: /^Final:\s*(.+)$/i, group: 1 },
      { pattern: /^Calculated:\s*(.+)$/i, group: 1 }
    ];
    
    for (const { pattern, group } of extractionPatterns) {
      const match = line.match(pattern);
      if (match && match[group]) {
        return match[group].trim();
      }
    }
    
    return null;
  }

  isLogLine(line) {
    const logPatterns = [
      /^DEBUG:/i,
      /^INFO:/i,
      /^WARNING:/i,
      /^ERROR:/i,
      /^TRACE:/i,
      /^\[.*\]/,  // Bracketed timestamps or tags
      /^\d{4}-\d{2}-\d{2}/,  // Date patterns
      /^Starting the function/i,  // Debug messages
      /^Input name is:/i,  // Debug messages
      /^Generated greeting:/i,  // Debug messages
      /^Debug:/i,  // Debug prefix
      /^Log:/i,   // Log prefix
      /^Processing/i,  // Processing messages
      /^Calculating/i,  // Calculation messages
      /^print\s*\(/,  // Debug print statements
      /^System\.out\.print/,  // Java system output
      /^std::/,  // C++ std namespace
      /^#.*debug/i,  // Comment-style debug
    ];
    
    return logPatterns.some(pattern => pattern.test(line.trim()));
  }

  getExecutionSummary(submission) {
    const status = submission.status;
    const hasOutput = submission.stdout && submission.stdout.trim();
    const hasErrors = submission.stderr && submission.stderr.trim();
    const hasCompileErrors = submission.compile_output && submission.compile_output.trim();
    
    return {
      success: status?.id === 3, // Accepted
      has_output: !!hasOutput,
      has_errors: !!hasErrors,
      has_compile_errors: !!hasCompileErrors,
      execution_time_ms: submission.time ? parseFloat(submission.time) * 1000 : null,
      memory_usage_kb: submission.memory ? parseInt(submission.memory) : null,
      status_category: this.getStatusCategory(status?.id)
    };
  }

  getStatusCategory(statusId) {
    if (!statusId) return 'unknown';
    
    const categories = {
      1: 'queued',      // In Queue
      2: 'processing',  // Processing
      3: 'success',     // Accepted
      4: 'wrong',       // Wrong Answer
      5: 'timeout',     // Time Limit Exceeded
      6: 'compile_error', // Compilation Error
      7: 'runtime_error', // Runtime Error (SIGSEGV)
      8: 'runtime_error', // Runtime Error (SIGXFSZ)
      9: 'runtime_error', // Runtime Error (SIGFPE)
      10: 'runtime_error', // Runtime Error (SIGABRT)
      11: 'runtime_error', // Runtime Error (NZEC)
      12: 'runtime_error', // Runtime Error (Other)
      13: 'internal_error', // Internal Error
      14: 'runtime_error'  // Exec Format Error
    };
    
    return categories[statusId] || 'unknown';
  }

  async getLanguages() {
    try {
      const response = await this.client.get('/languages');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get languages: ${error.response?.data?.message || error.message}`);
    }
  }

  async getStatuses() {
    try {
      const response = await this.client.get('/statuses');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get statuses: ${error.response?.data?.message || error.message}`);
    }
  }
}

module.exports = new Judge0Service();