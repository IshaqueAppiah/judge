const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    success: false,
    error: 'Internal Server Error',
    message: 'Something went wrong on the server'
  };

  // Judge0 API errors
  if (err.response && err.response.data) {
    error.message = err.response.data.message || err.message;
    error.statusCode = err.response.status;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.error = 'Validation Error';
    error.message = err.message;
    error.statusCode = 400;
  }

  // Network errors
  if (err.code === 'ECONNREFUSED') {
    error.error = 'Connection Error';
    error.message = 'Cannot connect to Judge0 service. Please ensure it is running.';
    error.statusCode = 503;
  }

  const statusCode = error.statusCode || 500;
  res.status(statusCode).json(error);
};

module.exports = {
  errorHandler
};