// Judge0 Language IDs
const LANGUAGE_IDS = {
  BASH: 46,
  C: 50,
  CPP: 54,
  CSHARP: 51,
  GO: 60,
  JAVA: 62,
  JAVASCRIPT: 63,
  KOTLIN: 78,
  PHP: 68,
  PYTHON: 71,
  RUBY: 72,
  RUST: 73,
  TYPESCRIPT: 74
};

// Judge0 Status IDs
const STATUS_IDS = {
  IN_QUEUE: 1,
  PROCESSING: 2,
  ACCEPTED: 3,
  WRONG_ANSWER: 4,
  TIME_LIMIT_EXCEEDED: 5,
  COMPILATION_ERROR: 6,
  RUNTIME_ERROR_SIGSEGV: 7,
  RUNTIME_ERROR_SIGXFSZ: 8,
  RUNTIME_ERROR_SIGFPE: 9,
  RUNTIME_ERROR_SIGABRT: 10,
  RUNTIME_ERROR_NZEC: 11,
  RUNTIME_ERROR_OTHER: 12,
  INTERNAL_ERROR: 13,
  EXEC_FORMAT_ERROR: 14
};

// Status descriptions for frontend
const STATUS_DESCRIPTIONS = {
  1: { name: 'In Queue', category: 'pending', color: 'blue' },
  2: { name: 'Processing', category: 'pending', color: 'yellow' },
  3: { name: 'Accepted', category: 'success', color: 'green' },
  4: { name: 'Wrong Answer', category: 'failed', color: 'red' },
  5: { name: 'Time Limit Exceeded', category: 'failed', color: 'orange' },
  6: { name: 'Compilation Error', category: 'error', color: 'red' },
  7: { name: 'Runtime Error (SIGSEGV)', category: 'error', color: 'red' },
  8: { name: 'Runtime Error (SIGXFSZ)', category: 'error', color: 'red' },
  9: { name: 'Runtime Error (SIGFPE)', category: 'error', color: 'red' },
  10: { name: 'Runtime Error (SIGABRT)', category: 'error', color: 'red' },
  11: { name: 'Runtime Error (NZEC)', category: 'error', color: 'red' },
  12: { name: 'Runtime Error (Other)', category: 'error', color: 'red' },
  13: { name: 'Internal Error', category: 'error', color: 'purple' },
  14: { name: 'Exec Format Error', category: 'error', color: 'red' }
};

module.exports = {
  LANGUAGE_IDS,
  STATUS_IDS,
  STATUS_DESCRIPTIONS
};