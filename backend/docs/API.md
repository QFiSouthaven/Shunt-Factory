# Shunt Factory Backend API Documentation

## Overview

The Shunt Factory backend provides a secure API proxy for AI operations using Google's Gemini API. All AI-related API keys are kept secure on the server side and never exposed to the frontend.

**Base URL:** `http://localhost:8080` (development) or your deployed Cloud Run URL

## Authentication

All `/api/gemini/*` endpoints require API key authentication via the `x-api-key` header.

```bash
curl -X POST http://localhost:8080/api/gemini/shunt \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-client-api-key" \
  -d '{"text": "Hello", "action": "summarize"}'
```

### Environment Variables

- **Development:** Set `CLIENT_API_KEY` in backend `.env` file
- **Production:** Any non-empty API key is accepted (configure proper validation as needed)

## Rate Limiting

Two tiers of rate limiting are applied:

| Tier | Limit | Window | Endpoints |
|------|-------|--------|-----------|
| Standard | 100 requests | 1 minute | All endpoints |
| AI Operations | 20 requests | 1 minute | `/api/gemini/*` |

Rate limit headers are included in responses:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

---

## Endpoints

### Health Check Endpoints

#### GET /health

Server health check (no authentication required).

**Response:**
```json
{
  "status": "healthy",
  "environment": "development",
  "timestamp": "2024-01-19T12:00:00.000Z",
  "uptime": 3600.123
}
```

#### GET /ready

Readiness check for container orchestration.

**Response:**
```json
{
  "status": "ready",
  "timestamp": "2024-01-19T12:00:00.000Z"
}
```

---

### AI Operation Endpoints

All AI endpoints require authentication and are rate limited.

#### POST /api/gemini/shunt

Main endpoint for text transformation operations.

**Request Body:**
```json
{
  "text": "string (1-100000 chars, required)",
  "action": "string (required) - e.g., 'summarize', 'amplify', 'format_json'",
  "modelName": "string (optional, default: 'gemini-2.5-flash')",
  "context": "string (optional) - additional context for the operation",
  "priority": "string (optional) - 'low', 'normal', 'high'",
  "promptInjectionGuardEnabled": "boolean (optional, default: false)"
}
```

**Response:**
```json
{
  "resultText": "string - the transformed text",
  "tokenUsage": {
    "prompt_tokens": 100,
    "completion_tokens": 50,
    "total_tokens": 150,
    "model": "gemini-2.5-flash"
  },
  "latencyMs": 1234
}
```

**Example:**
```bash
curl -X POST http://localhost:8080/api/gemini/shunt \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "text": "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet.",
    "action": "summarize",
    "modelName": "gemini-2.5-flash"
  }'
```

---

#### POST /api/gemini/modular-prompt

Execute modular prompts with multiple processing modules.

**Request Body:**
```json
{
  "text": "string (1-100000 chars, required)",
  "modules": ["string array (required) - list of module names"],
  "context": "string (optional)",
  "priority": "string (optional)",
  "promptInjectionGuardEnabled": "boolean (optional, default: false)"
}
```

**Response:**
```json
{
  "resultText": "string",
  "tokenUsage": {
    "prompt_tokens": 200,
    "completion_tokens": 100,
    "total_tokens": 300,
    "model": "gemini-2.5-pro"
  },
  "latencyMs": 2500
}
```

**Notes:**
- Always uses `gemini-2.5-pro` model
- Includes thinking config with 32768 token budget

---

#### POST /api/gemini/analyze-image

Analyze images using Gemini's vision capabilities.

**Request Body:**
```json
{
  "prompt": "string (required) - what to analyze",
  "image": {
    "base64Data": "string (required) - base64 encoded image",
    "mimeType": "string (required) - 'image/png', 'image/jpeg', 'image/gif', 'image/webp'"
  },
  "modelName": "string (optional, default: 'gemini-2.5-flash')"
}
```

**Response:**
```json
{
  "resultText": "string - analysis result",
  "tokenUsage": {
    "prompt_tokens": 1000,
    "completion_tokens": 200,
    "total_tokens": 1200,
    "model": "gemini-2.5-flash"
  },
  "latencyMs": 3000
}
```

**Example:**
```bash
curl -X POST http://localhost:8080/api/gemini/analyze-image \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "prompt": "Describe what you see in this image",
    "image": {
      "base64Data": "/9j/4AAQSkZJRg...",
      "mimeType": "image/jpeg"
    }
  }'
```

---

#### POST /api/gemini/generate

Generic text generation endpoint with custom configuration.

**Request Body:**
```json
{
  "prompt": "string (1-100000 chars, required)",
  "modelName": "string (optional, default: 'gemini-2.5-flash')",
  "config": {
    "temperature": "number (0-2, optional)",
    "topP": "number (0-1, optional)",
    "topK": "number (1-100, optional)",
    "maxOutputTokens": "number (1-8192, optional)",
    "responseMimeType": "string (optional)",
    "responseSchema": "object (optional) - JSON schema for structured output"
  }
}
```

**Response:**
```json
{
  "resultText": "string",
  "tokenUsage": {
    "prompt_tokens": 50,
    "completion_tokens": 100,
    "total_tokens": 150,
    "model": "gemini-2.5-flash"
  },
  "latencyMs": 1000
}
```

**Example with custom config:**
```bash
curl -X POST http://localhost:8080/api/gemini/generate \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "prompt": "Write a creative story about a robot",
    "modelName": "gemini-2.5-pro",
    "config": {
      "temperature": 0.9,
      "maxOutputTokens": 2048
    }
  }'
```

---

#### GET /api/gemini/health

Check Gemini service health and API key validity.

**Response (healthy):**
```json
{
  "status": "healthy",
  "service": "gemini",
  "timestamp": "2024-01-19T12:00:00.000Z"
}
```

**Response (unhealthy):**
```json
{
  "status": "unhealthy",
  "service": "gemini",
  "error": "Failed to initialize Gemini service",
  "timestamp": "2024-01-19T12:00:00.000Z"
}
```

---

## Error Responses

### Validation Error (400)

```json
{
  "error": "Validation Error",
  "message": "Invalid request data",
  "details": [
    {
      "path": "text",
      "message": "String must contain at least 1 character(s)"
    }
  ]
}
```

### Authentication Error (401)

```json
{
  "error": "Unauthorized",
  "message": "API key is required"
}
```

### Prompt Injection Detected (400)

```json
{
  "error": "Invalid Input",
  "message": "Potential prompt injection detected. Please rephrase your request."
}
```

### Rate Limit Exceeded (429)

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 60
}
```

### Internal Server Error (500)

```json
{
  "error": "Internal Server Error",
  "message": "Failed to process shunt request"
}
```

### Not Found (404)

```json
{
  "error": "Not Found",
  "message": "Route GET /unknown not found"
}
```

---

## Security Features

### Input Validation

All inputs are validated using Zod schemas:
- Text length limits (1-100,000 characters)
- Allowed MIME types for images
- Required fields validation
- Type coercion and defaults

### Prompt Injection Detection

The API detects and blocks common prompt injection patterns:
- "ignore previous instructions"
- "disregard previous instructions"
- "you are now"
- "new instructions:"
- Special tokens (`<|...|>`)

### Security Headers

Helmet.js provides security headers:
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Content-Type-Options
- X-Frame-Options

### CORS

Configurable CORS with:
- Allowed origins (via `CORS_ORIGIN` env var)
- Credentials support
- Allowed methods and headers

---

## Models

### Available Models

| Model | Use Case | Thinking Config |
|-------|----------|-----------------|
| `gemini-2.5-flash` | Fast, cost-effective operations | No |
| `gemini-2.5-pro` | Complex tasks, better quality | Yes (32768 tokens) |

### When Pro Model with Thinking is Used

- `modular-prompt` endpoint (always)
- `shunt` endpoint with actions: `make_actionable`, `build_skill`

---

## Environment Configuration

### Required Variables

```bash
# Server
PORT=8080
NODE_ENV=development|staging|production

# API Keys
GEMINI_API_KEY=your-gemini-api-key
CLIENT_API_KEY=your-client-api-key

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Optional Variables

```bash
# Google Cloud (production)
GCP_PROJECT_ID=your-project-id
GEMINI_API_KEY_SECRET_NAME=gemini-api-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
ENABLE_CLOUD_LOGGING=false
```

---

## Usage Examples

### JavaScript/TypeScript (Frontend)

```typescript
const response = await fetch('http://localhost:8080/api/gemini/shunt', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.VITE_API_KEY,
  },
  body: JSON.stringify({
    text: 'Your text here',
    action: 'summarize',
    modelName: 'gemini-2.5-flash',
  }),
});

const { resultText, tokenUsage, latencyMs } = await response.json();
```

### Python

```python
import requests

response = requests.post(
    'http://localhost:8080/api/gemini/shunt',
    headers={
        'Content-Type': 'application/json',
        'x-api-key': 'your-api-key',
    },
    json={
        'text': 'Your text here',
        'action': 'summarize',
        'modelName': 'gemini-2.5-flash',
    }
)

data = response.json()
print(data['resultText'])
```

### cURL

```bash
curl -X POST http://localhost:8080/api/gemini/shunt \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"text": "Hello world", "action": "amplify"}'
```

---

## Deployment

### Docker

```bash
cd backend
docker build -t shunt-backend .
docker run -p 8080:8080 --env-file .env shunt-backend
```

### Google Cloud Run

The backend is configured for Cloud Run deployment:
- See `cloudbuild.yaml` for CI/CD configuration
- Run `scripts/setup-gcp.sh` (Unix) or `scripts/setup-gcp.ps1` (Windows) for setup
- API keys should be stored in Google Cloud Secret Manager

---

## Changelog

- **v1.0.0** - Initial release with Gemini API proxy
- **v1.1.0** - Added rate limiting and security middleware
- **v1.2.0** - Added image analysis endpoint
- **v1.3.0** - Added modular prompt support
