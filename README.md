# Judge0 Express Backend

A Node.js Express backend that communicates with Judge0 for code execution and evaluation.

## Features

- **Single Submissions**: Submit individual code snippets for execution
- **Batch Submissions**: Submit multiple code snippets at once
- **Language Support**: Get list of supported programming languages
- **Result Retrieval**: Fetch execution results with proper error handling
- **Rate Limiting**: Built-in protection against abuse
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Robust error handling with meaningful messages

## API Endpoints

### Single Submissions
- `POST /api/submissions/single` - Create a single submission
- `GET /api/submissions/single/:token` - Get single submission result

### Batch Submissions
- `POST /api/submissions/batch` - Create batch submissions
- `GET /api/submissions/batch?tokens=token1,token2,...` - Get batch results

### Utility Endpoints
- `GET /api/submissions/languages` - Get supported languages
- `GET /health` - Health check endpoint

## Request Examples

### Single Submission
```bash
curl -X POST http://localhost:3000/api/submissions/single \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "print(\"Hello, World!\")",
    "language_id": 71,
    "stdin": "",
    "expected_output": "Hello, World!"
  }'
```

### Get Single Result (with source code)
```bash
curl http://localhost:3000/api/submissions/single/TOKEN_HERE
```

### Get Single Result (without source code)
```bash
curl http://localhost:3000/api/submissions/single/TOKEN_HERE?include_source=false
```

### Batch Submission
```bash
curl -X POST http://localhost:3000/api/submissions/batch \
  -H "Content-Type: application/json" \
  -d '{
    "submissions": [
      {
        "source_code": "print(\"Hello from Python!\")",
        "language_id": 71
      },
      {
        "source_code": "console.log(\"Hello from JavaScript!\");",
        "language_id": 63
      }
    ]
  }'
```

## Enhanced Response Structure

The API now provides enhanced responses with separated output and execution metadata:

```json
{
  "success": true,
  "data": {
    "token": "abc123",
    "status": {
      "id": 3,
      "description": "Accepted"
    },
    "language": {
      "id": 71,
      "name": "Python"
    },
    "execution": {
      "time": "0.023",
      "memory": 9472,
      "wall_time": "0.045"
    },
    "output": {
      "stdout": {
        "raw": "Hello, World!\nDEBUG: Process completed",
        "actual": "Hello, World!",
        "logs": "DEBUG: Process completed",
        "lines": ["Hello, World!", "DEBUG: Process completed"]
      },
      "stderr": null,
      "compile_output": null
    },
    "execution_summary": {
      "success": true,
      "has_output": true,
      "has_errors": false,
      "has_compile_errors": false,
      "execution_time_ms": 23,
      "memory_usage_kb": 9472,
      "status_category": "success"
    }
  }
}
```

## Setup Instructions

1. Ensure Judge0 is running on http://localhost:2358
2. Install dependencies: `npm install`
3. Start the server: `npm start` or `npm run dev` for development
4. The server will run on http://localhost:3000

## Environment Variables

- `PORT` - Server port (default: 3000)
- `JUDGE0_URL` - Judge0 service URL (default: http://localhost:2358)
- `RATE_LIMIT_WINDOW_MS` - Rate limiting window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS` - Maximum requests per window

## Common Language IDs

- JavaScript (Node.js): 63
- Python: 71
- Java: 62
- C++: 54
- C: 50
- Go: 60
- Rust: 73
- PHP: 68
- Ruby: 72
- C#: 51