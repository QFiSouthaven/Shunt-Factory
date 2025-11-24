# Shunt Factory Backend

Production-ready backend API server for Shunt Factory with secure Gemini API integration, authentication, rate limiting, and full observability.

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │─────→│  Cloud Run   │─────→│   Gemini    │
│  (React)    │      │  (Backend)   │      │    API      │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ├─→ Secret Manager (API Keys)
                            ├─→ Cloud Logging (Observability)
                            └─→ Redis (Rate Limiting - Optional)
```

## Features

- ✅ **Secure API Key Management**: Gemini API keys stored in Google Cloud Secret Manager
- ✅ **Authentication**: API key-based authentication for client requests
- ✅ **Rate Limiting**: Per-user rate limiting (100 req/min standard, 20 req/min for AI endpoints)
- ✅ **Input Validation**: Zod-based schema validation and prompt injection detection
- ✅ **Security Hardening**: Helmet.js security headers, CORS protection
- ✅ **Observability**: Structured logging with Winston + Cloud Logging integration
- ✅ **Production-Ready**: Docker containerization, Cloud Run deployment, health checks
- ✅ **Error Handling**: Comprehensive error handling with detailed logging

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (for containerized deployment)
- Google Cloud Project (for production deployment)

### Local Development

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:
   ```env
   NODE_ENV=development
   PORT=8080
   GEMINI_API_KEY=your-gemini-api-key
   CORS_ORIGIN=http://localhost:3000
   CLIENT_API_KEYS=dev-test-key
   LOG_LEVEL=debug
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

   Server will start at `http://localhost:8080`

4. **Test the API**:
   ```bash
   # Health check
   curl http://localhost:8080/health

   # Gemini API test
   curl -X POST http://localhost:8080/api/gemini/generate \
     -H "Content-Type: application/json" \
     -H "x-api-key: dev-test-key" \
     -d '{"prompt": "Hello, world!", "modelName": "gemini-2.5-flash"}'
   ```

## API Endpoints

### Health & Status

- `GET /health` - Basic health check (no auth required)
- `GET /ready` - Readiness check for external dependencies
- `GET /api/gemini/health` - Gemini service health check

### Gemini AI Operations (All require authentication)

- `POST /api/gemini/shunt` - Perform shunt action
- `POST /api/gemini/modular-prompt` - Execute modular prompt
- `POST /api/gemini/analyze-image` - Analyze image with Gemini
- `POST /api/gemini/generate` - Generic text generation

### Authentication

All API endpoints (except health checks) require an API key:

```bash
-H "x-api-key: your-api-key"
```

## Deployment

### Google Cloud Run (Production)

1. **Set up Google Cloud**:
   ```bash
   # Set project
   gcloud config set project YOUR_PROJECT_ID

   # Enable required APIs
   gcloud services enable run.googleapis.com
   gcloud services enable secretmanager.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   ```

2. **Create secrets**:
   ```bash
   # Gemini API key
   echo -n "your-gemini-api-key" | gcloud secrets create gemini-api-key --data-file=-

   # Client API keys (comma-separated)
   echo -n "key1,key2,key3" | gcloud secrets create client-api-keys --data-file=-

   # Grant Cloud Run access to secrets
   gcloud secrets add-iam-policy-binding gemini-api-key \
     --member=serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com \
     --role=roles/secretmanager.secretAccessor

   gcloud secrets add-iam-policy-binding client-api-keys \
     --member=serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com \
     --role=roles/secretmanager.secretAccessor
   ```

3. **Deploy with Cloud Build**:
   ```bash
   cd /home/halkive/Shunt-Factory
   gcloud builds submit --config=backend/cloudbuild.yaml
   ```

4. **Update CORS origin** (after frontend deployment):
   ```bash
   gcloud run services update shunt-factory-backend \
     --update-env-vars CORS_ORIGIN=https://your-frontend-domain.com
   ```

### Docker (Manual Deployment)

```bash
# Build
docker build -t shunt-factory-backend ./backend

# Run locally
docker run -p 8080:8080 \
  -e NODE_ENV=development \
  -e GEMINI_API_KEY=your-key \
  -e CLIENT_API_KEYS=test-key \
  shunt-factory-backend

# Push to Container Registry
docker tag shunt-factory-backend gcr.io/YOUR_PROJECT_ID/shunt-factory-backend
docker push gcr.io/YOUR_PROJECT_ID/shunt-factory-backend
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | No |
| `PORT` | Server port | `8080` | No |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | `http://localhost:3000` | Yes |
| `GCP_PROJECT_ID` | Google Cloud Project ID | - | Production only |
| `GEMINI_API_KEY` | Gemini API key (dev only) | - | Dev only |
| `GEMINI_API_KEY_SECRET_NAME` | Secret Manager secret name | `gemini-api-key` | Production only |
| `CLIENT_API_KEYS` | Valid client API keys (comma-separated) | - | Production only |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `60000` (1 min) | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | No |
| `ENABLE_CLOUD_LOGGING` | Enable Cloud Logging | `false` | No |
| `LOG_LEVEL` | Logging level | `info` | No |

### Rate Limits

- **Standard endpoints**: 100 requests per minute per user
- **AI endpoints** (`/api/gemini/*`): 20 requests per minute per user

## Security

### API Key Security

- **Development**: API keys stored in `.env.local` (never committed)
- **Production**: API keys stored in Google Cloud Secret Manager
- Keys cached for 5 minutes to reduce Secret Manager API calls

### Request Validation

- All inputs validated with Zod schemas
- Prompt injection detection enabled
- Request size limits (10MB max)
- SQL injection, XSS protection via input sanitization

### Security Headers

Helmet.js provides:
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection

## Monitoring & Observability

### Logs

**Development**: Winston console logs
**Production**: Google Cloud Logging with structured logging

Log levels: `error`, `warn`, `info`, `debug`

### Metrics Logged

- Request latency
- Token usage per request
- Error rates
- Rate limit violations
- API key usage

### Viewing Logs in Production

```bash
# View recent logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=shunt-factory-backend" --limit 50

# Follow logs in real-time
gcloud alpha logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=shunt-factory-backend"
```

## Testing

```bash
# Run tests (when implemented)
npm test

# Lint code
npm run lint

# Build TypeScript
npm run build
```

## Cost Optimization

1. **Cloud Run**: Auto-scales to zero when idle (pay only for requests)
2. **Secret Manager**: Secrets cached for 5 minutes (reduces API calls)
3. **Rate Limiting**: Prevents abuse and unexpected costs
4. **Token Tracking**: All Gemini API calls logged with token usage for cost attribution

## Troubleshooting

### "Failed to initialize Gemini service"

- Check that `GEMINI_API_KEY` is set (dev) or Secret Manager is configured (prod)
- Verify GCP project ID is correct
- Ensure Secret Manager API is enabled

### "Rate limit exceeded"

- Default limits: 100 req/min (standard), 20 req/min (AI)
- Adjust via `RATE_LIMIT_MAX_REQUESTS` environment variable
- Consider implementing Redis for distributed rate limiting

### CORS errors

- Ensure frontend origin is in `CORS_ORIGIN` environment variable
- Check that requests include proper headers

## Next Steps

- [ ] Implement comprehensive test suite
- [ ] Add Vertex AI model deployment support
- [ ] Implement distributed rate limiting with Redis
- [ ] Add request/response caching
- [ ] Implement cost tracking per user
- [ ] Add API usage analytics dashboard
- [ ] Set up alerting for high error rates

## License

MIT
