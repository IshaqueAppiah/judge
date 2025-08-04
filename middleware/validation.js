const validateSubmission = (req, res, next) => {
  const { source_code, language_id } = req.body;

  if (!source_code) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      message: 'source_code is required'
    });
  }

  if (!language_id) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      message: 'language_id is required'
    });
  }

  if (typeof language_id !== 'number') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      message: 'language_id must be a number'
    });
  }

  next();
};

const validateBatchSubmission = (req, res, next) => {
  const { submissions } = req.body;

  if (!submissions || !Array.isArray(submissions)) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      message: 'submissions must be an array'
    });
  }

  if (submissions.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      message: 'submissions array cannot be empty'
    });
  }

  if (submissions.length > 20) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      message: 'Maximum 20 submissions allowed per batch'
    });
  }

  for (let i = 0; i < submissions.length; i++) {
    const submission = submissions[i];
    
    if (!submission.source_code) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: `submissions[${i}]: source_code is required`
      });
    }

    if (!submission.language_id) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: `submissions[${i}]: language_id is required`
      });
    }

    if (typeof submission.language_id !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: `submissions[${i}]: language_id must be a number`
      });
    }
  }

  next();
};

module.exports = {
  validateSubmission,
  validateBatchSubmission
};