# Shunt Factory API Documentation

## Overview

The Shunt Factory backend provides a secure API proxy for AI operations. All API calls to Gemini are routed through this backend to keep API keys secure and enable rate limiting, logging, and monitoring.

**Base URL:** `http://localhost:8080` (development) or your deployed Cloud Run URL

## Authentication

All API endpoints (except health checks) require authentication via the `x-api-key` header.

```bash
curl -X POST http://localhost:8080/api/gemini/shunt \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key-here" \
  -d '{"text": "Hello", "action": "summarize", "modelName": "gemini-2.5-flash"}'
```

## Rate Limiting

- **Standard endpoints:** 100 requests per minute per user
- **AI endpoints:** 20 requests per minute per user

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: Time when the rate limit resets

---

## Health Check Endpoints

### GET /health

Basic health check for the server.

**Authentication:** Not required

**Response:**
```json
{
  "status": "healthy",
  "environment": "development",
  "timestamp": "2025-01-19T10:30:00.000Z",
  "uptime": 3600
}
```

### GET /ready

Readiness check for external dependencies.

**Authentication:** Not required

**Response:**
```json
{
  "status": "ready",
  "timestamp": "2025-01-19T10:30:00.000Z"
}
```

### GET /api/gemini/health

Health check for the Gemini service specifically.

**Authentication:** Required

**Response:**
```json
{
  "status": "healthy",
  "service": "gemini",
  "timestamp": "2025-01-19T10:30:00.000Z"
}
```

---

## AI Endpoints

### POST /api/gemini/shunt

Main endpoint for text transformation operations (Shunt actions).

**Authentication:** Required

**Request Body:**
```json
{
  "text": "string (required) - The input text to process",
  "action": "string (required) - The shunt action to perform",
  "modelName": "string (required) - Gemini model to use",
  "context": "string (optional) - Additional context for the operation",
  "priority": "string (optional) - Priority level (normal/high)"
}
```

**Available Actions:**
- `summarize` - Summarize text
- `expand` - Expand on text
- `rewrite` - Rewrite text
- `format_json` - Format as JSON
- `make_actionable` - Convert to actionable items
- `build_skill` - Build a skill from description
- `analyze` - Analyze text
- `translate` - Translate text

**Response:**
```json
{
  "resultText": "string - The processed result",
  "tokenUsage": {
    "prompt_tokens": 100,
    "candidates_tokens": 200,
    "total_tokens": 300
  },
  "latencyMs": 1500
}
```

**Example:**
```bash
curl -X POST http://localhost:8080/api/gemini/shunt \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "text": "The quick brown fox jumps over the lazy dog",
    "action": "summarize",
    "modelName": "gemini-2.5-flash"
  }'
```

---

### POST /api/gemini/modular-prompt

Execute modular prompts with multiple processing modules.

**Authentication:** Required

**Request Body:**
```json
{
  "text": "string (required) - The input text",
  "modules": ["array (required) - List of module names to apply"],
  "context": "string (optional) - Additional context",
  "priority": "string (optional) - Priority level"
}
```

**Response:**
```json
{
  "resultText": "string - The processed result",
  "tokenUsage": {
    "prompt_tokens": 150,
    "candidates_tokens": 300,
    "total_tokens": 450
  },
  "latencyMs": 2500
}
```

**Example:**
```bash
curl -X POST http://localhost:8080/api/gemini/modular-prompt \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "text": "Build a user authentication system",
    "modules": ["architecture", "security", "testing"],
    "context": "React TypeScript application"
  }'
```

---

### POST /api/gemini/analyze-image

Analyze images using Gemini's multimodal capabilities.

**Authentication:** Required

**Request Body:**
```json
{
  "prompt": "string (required) - The analysis prompt",
  "image": {
    "data": "string (required) - Base64 encoded image data",
    "mimeType": "string (required) - Image MIME type (image/png, image/jpeg, etc.)"
  },
  "modelName": "string (required) - Gemini model to use"
}
```

**Response:**
```json
{
  "resultText": "string - The analysis result",
  "tokenUsage": {
    "prompt_tokens": 500,
    "candidates_tokens": 200,
    "total_tokens": 700
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
      "data": "base64-encoded-image-data",
      "mimeType": "image/png"
    },
    "modelName": "gemini-2.5-flash"
  }'
```

---

### POST /api/gemini/generate

Generic text generation endpoint for custom prompts.

**Authentication:** Required

**Request Body:**
```json
{
  "prompt": "string (required) - The prompt to send to Gemini",
  "modelName": "string (required) - Gemini model to use",
  "config": {
    "thinkingConfig": {
      "thinkingBudget": "number (optional) - Token budget for thinking"
    }
  }
}
```

**Response:**
```json
{
  "resultText": "string - The generated result",
  "tokenUsage": {
    "prompt_tokens": 100,
    "candidates_tokens": 500,
    "total_tokens": 600
  },
  "latencyMs": 2000
}
```

**Example:**
```bash
curl -X POST http://localhost:8080/api/gemini/generate \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "prompt": "Write a haiku about programming",
    "modelName": "gemini-2.5-flash"
  }'
```

---

## Error Responses

All endpoints return consistent error responses:

### 400 Bad Request
```json
{
  "error": "Validation Error",
  "message": "Invalid request body",
  "details": [
    {
      "field": "text",
      "message": "Required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing API key"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again later."
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Failed to process request"
}
```

### 503 Service Unavailable
```json
{
  "status": "unhealthy",
  "service": "gemini",
  "error": "Failed to initialize Gemini service",
  "timestamp": "2025-01-19T10:30:00.000Z"
}
```

---

## Models

### Available Gemini Models

- `gemini-2.5-flash` - Fast, efficient model for most tasks
- `gemini-2.5-pro` - Advanced model with extended thinking capabilities

### Model Selection Guidelines

| Use Case | Recommended Model |
|----------|-------------------|
| Quick transformations | gemini-2.5-flash |
| Complex analysis | gemini-2.5-pro |
| Image analysis | gemini-2.5-flash |
| Multi-step reasoning | gemini-2.5-pro |
| High-volume operations | gemini-2.5-flash |

---

## Security Features

### Prompt Injection Protection

The API includes automatic prompt injection detection for all text inputs. Requests containing potential injection attempts will be flagged and logged.

### Input Sanitization

All text inputs are sanitized to remove potential XSS and malicious content.

### Request Validation

All requests are validated against Zod schemas before processing.

---

## Response Headers

All responses include:

- `Content-Type: application/json`
- `X-Request-Id: <uuid>` (for tracing)
- Security headers via Helmet.js (CSP, HSTS, etc.)

---

## SDK Usage (Frontend)

The frontend uses `backendApiService.ts` to communicate with these endpoints:

```typescript
import { performShuntViaBackend } from '@/services/backendApiService';

const result = await performShuntViaBackend(
  text,
  ShuntAction.SUMMARIZE,
  'gemini-2.5-flash',
  context,
  priority
);

console.log(result.resultText);
console.log(result.tokenUsage);
```

---

## Environment Variables

### Backend Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 8080 |
| `NODE_ENV` | Environment | development |
| `CORS_ORIGIN` | Allowed origins | http://localhost:3000 |
| `GEMINI_API_KEY` | Gemini API key | (required) |
| `CLIENT_API_KEYS` | Valid client API keys | (required) |

### Frontend Configuration

| Variable | Description |
|----------|-------------|
| `VITE_BACKEND_URL` | Backend API URL |
| `VITE_API_KEY` | Client API key |
| `VITE_USE_BACKEND` | Enable backend mode |

---

## Changelog

- **v1.0.0** - Initial API release with core endpoints
- **v1.1.0** - Added rate limiting and authentication
- **v1.2.0** - Added prompt injection protection
