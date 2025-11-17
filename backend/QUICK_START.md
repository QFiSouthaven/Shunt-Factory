# Backend Quick Start Guide

## TL;DR - Get Running in 5 Minutes

### Local Development

```bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local

# 4. Edit .env.local - ADD YOUR GEMINI API KEY
cat > .env.local << EOF
NODE_ENV=development
PORT=8080
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
CORS_ORIGIN=http://localhost:3000
CLIENT_API_KEYS=dev-test-key
LOG_LEVEL=debug
EOF

# 5. Start server
npm run dev

# 6. Test it works
curl http://localhost:8080/health
```

Expected output:
```json
{"status":"healthy","environment":"development","timestamp":"...","uptime":1.234}
```

### Test AI Endpoint

```bash
curl -X POST http://localhost:8080/api/gemini/generate \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-test-key" \
  -d '{
    "prompt": "Say hello in 3 words",
    "modelName": "gemini-2.5-flash"
  }'
```

Expected output:
```json
{
  "resultText": "Hello there, friend!",
  "tokenUsage": {...},
  "latencyMs": 1234
}
```

### Update Frontend to Use Backend

```bash
# 1. Go to frontend root
cd ..

# 2. Create frontend .env
cat > .env.local << EOF
VITE_BACKEND_URL=http://localhost:8080
VITE_API_KEY=dev-test-key
EOF

# 3. Update your components
# Replace: import { performShunt } from './services/geminiService';
# With:    import { performShuntViaBackend as performShunt } from './services/backendApiService';

# 4. Start frontend
npm run dev
```

Visit http://localhost:3000 - your app now uses the secure backend!

## Production Deployment

```bash
# 1. Setup GCP (one time only)
./backend/scripts/setup-gcp.sh

# 2. Deploy
gcloud builds submit --config=backend/cloudbuild.yaml

# 3. Get backend URL
gcloud run services describe shunt-factory-backend \
  --region=us-central1 \
  --format="value(status.url)"

# 4. Update frontend .env.local with the URL
```

## Troubleshooting

**Port 8080 already in use?**
```bash
# Kill the process
lsof -ti:8080 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

**"GEMINI_API_KEY not set"?**
```bash
# Make sure .env.local exists and has your key
cat backend/.env.local | grep GEMINI_API_KEY
```

**Cannot connect to backend from frontend?**
```bash
# Check backend is running
curl http://localhost:8080/health

# Check CORS_ORIGIN includes your frontend URL
# Edit backend/.env.local and restart
```

## What's Running?

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Backend Server (http://localhost:8080)                │
│                                                         │
│  Routes:                                                │
│    GET  /health                    ✅ No auth needed    │
│    GET  /ready                     ✅ No auth needed    │
│    POST /api/gemini/shunt          🔒 Auth required    │
│    POST /api/gemini/generate       🔒 Auth required    │
│    POST /api/gemini/analyze-image  🔒 Auth required    │
│    POST /api/gemini/modular-prompt 🔒 Auth required    │
│                                                         │
│  Authentication: x-api-key header                       │
│  Rate Limit: 100 req/min (standard), 20 req/min (AI)   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Next Steps

1. ✅ Backend running locally
2. ✅ Frontend configured to use backend
3. ⬜ Test end-to-end in browser
4. ⬜ Deploy to production (see DEPLOYMENT_GUIDE.md)

## Need Help?

- Full deployment guide: [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md)
- Backend details: [README.md](README.md)
- Architecture summary: [BACKEND_IMPLEMENTATION_SUMMARY.md](../BACKEND_IMPLEMENTATION_SUMMARY.md)
