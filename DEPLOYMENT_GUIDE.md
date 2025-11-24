# Shunt Factory - Complete Deployment Guide

This guide walks you through deploying the Shunt Factory application with a secure, production-ready backend on Google Cloud Platform.

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────┐
│                 │         │                  │         │              │
│   Frontend      │────────→│  Backend API     │────────→│  Gemini API  │
│   (React/Vite)  │         │  (Cloud Run)     │         │              │
│                 │         │                  │         │              │
└─────────────────┘         └──────────────────┘         └──────────────┘
        │                           │
        │                           ├─→ Secret Manager (API Keys)
        │                           ├─→ Cloud Logging
        │                           └─→ Cloud Monitoring
        │
     Deploy to                   Deploy to
  Netlify/Vercel              Google Cloud Run
```

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **Gemini API Key** from [Google AI Studio](https://makersuite.google.com/app/apikey)
3. **gcloud CLI** installed ([Installation Guide](https://cloud.google.com/sdk/docs/install))
4. **Node.js 20+** installed
5. **Docker** installed (optional, for local testing)

## Part 1: Backend Deployment

### Step 1: Set Up Google Cloud Project

```bash
# Authenticate with Google Cloud
gcloud auth login

# Create a new project (or use existing)
gcloud projects create shunt-factory --name="Shunt Factory"

# Set the project
gcloud config set project shunt-factory

# Enable billing (required for Cloud Run)
# Visit: https://console.cloud.google.com/billing
```

### Step 2: Run Setup Script

The setup script will enable all required APIs and create secrets:

```bash
cd /home/halkive/Shunt-Factory
chmod +x backend/scripts/setup-gcp.sh
./backend/scripts/setup-gcp.sh
```

When prompted:
- Enter your **Gemini API key**
- Enter **client API keys** (or let it generate random ones - save these!)

### Step 3: Deploy Backend to Cloud Run

```bash
# Submit the build and deploy
gcloud builds submit --config=backend/cloudbuild.yaml

# Wait for deployment to complete (5-10 minutes)
```

### Step 4: Get Backend URL

```bash
# Get the deployed backend URL
gcloud run services describe shunt-factory-backend \
  --region=us-central1 \
  --format="value(status.url)"

# Example output: https://shunt-factory-backend-abc123-uc.a.run.app
```

**Save this URL** - you'll need it for the frontend configuration.

### Step 5: Test Backend

```bash
# Set your backend URL
BACKEND_URL="https://shunt-factory-backend-abc123-uc.a.run.app"

# Health check
curl $BACKEND_URL/health

# Test Gemini endpoint (replace YOUR_API_KEY with one of your client API keys)
curl -X POST $BACKEND_URL/api/gemini/generate \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "prompt": "Say hello!",
    "modelName": "gemini-2.5-flash"
  }'
```

Expected response:
```json
{
  "resultText": "Hello! How can I help you today?",
  "tokenUsage": {
    "prompt_tokens": 3,
    "completion_tokens": 8,
    "total_tokens": 11,
    "model": "gemini-2.5-flash"
  },
  "latencyMs": 1234
}
```

## Part 2: Frontend Configuration

### Step 1: Configure Environment Variables

Create `.env.local` in the project root:

```bash
cd /home/halkive/Shunt-Factory
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Backend API URL (from Step 4 above)
VITE_BACKEND_URL=https://shunt-factory-backend-abc123-uc.a.run.app

# Your client API key (from setup script)
VITE_API_KEY=your-client-api-key-here
```

### Step 2: Update Frontend Code to Use Backend

You have two options:

#### Option A: Use New Backend Service (Recommended)

Replace imports in your components:

```typescript
// OLD (Direct Gemini calls - INSECURE)
import { performShunt } from './services/geminiService';

// NEW (Backend API calls - SECURE)
import { performShuntViaBackend as performShunt } from './services/backendApiService';
```

#### Option B: Migrate Gradually

Use the backend service alongside the existing service during migration.

### Step 3: Test Frontend Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` and test the application.

### Step 4: Build Frontend

```bash
# Build for production
npm run build

# Test production build locally
npm run preview
```

## Part 3: Frontend Deployment

### Option A: Netlify

1. **Connect Repository**:
   - Go to [Netlify](https://www.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub/GitLab repository

2. **Configure Build Settings**:
   ```
   Build command: npm run build
   Publish directory: dist
   ```

3. **Add Environment Variables**:
   - Go to Site settings → Environment variables
   - Add:
     - `VITE_BACKEND_URL`: Your Cloud Run backend URL
     - `VITE_API_KEY`: Your client API key

4. **Deploy**:
   - Click "Deploy site"

5. **Update CORS**:
   ```bash
   # Get your Netlify URL (e.g., https://shunt-factory.netlify.app)
   # Update backend CORS
   gcloud run services update shunt-factory-backend \
     --region=us-central1 \
     --update-env-vars CORS_ORIGIN=https://shunt-factory.netlify.app
   ```

### Option B: Vercel

1. **Connect Repository**:
   - Go to [Vercel](https://vercel.com/)
   - Click "Add New" → "Project"
   - Import your repository

2. **Configure Project**:
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   ```

3. **Add Environment Variables**:
   - Add:
     - `VITE_BACKEND_URL`: Your Cloud Run backend URL
     - `VITE_API_KEY`: Your client API key

4. **Deploy**:
   - Click "Deploy"

5. **Update CORS**:
   ```bash
   # Get your Vercel URL (e.g., https://shunt-factory.vercel.app)
   gcloud run services update shunt-factory-backend \
     --region=us-central1 \
     --update-env-vars CORS_ORIGIN=https://shunt-factory.vercel.app
   ```

### Option C: Google Cloud Storage + Cloud CDN

```bash
# Build frontend
npm run build

# Create bucket
gsutil mb gs://shunt-factory-frontend

# Upload files
gsutil -m rsync -r dist/ gs://shunt-factory-frontend

# Make bucket public
gsutil iam ch allUsers:objectViewer gs://shunt-factory-frontend

# Enable website configuration
gsutil web set -m index.html -e index.html gs://shunt-factory-frontend

# Access at: https://storage.googleapis.com/shunt-factory-frontend/index.html
```

## Part 4: Post-Deployment

### Monitor Backend

```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=shunt-factory-backend" --limit 50

# Follow logs in real-time
gcloud alpha logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=shunt-factory-backend"

# View metrics
gcloud monitoring dashboards list
```

### Set Up Alerts (Optional)

```bash
# Create alert for high error rate
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=5 \
  --condition-threshold-duration=60s
```

### Cost Monitoring

1. Go to [GCP Billing](https://console.cloud.google.com/billing)
2. Set up budget alerts
3. Monitor daily costs

**Expected costs (approximate)**:
- Cloud Run: $0 - $50/month (depends on traffic)
- Secret Manager: ~$0.06/month
- Cloud Logging: ~$0.50/month
- Cloud Build: $0.003/build-minute

## Part 5: Testing the Full Stack

### Test 1: Health Checks

```bash
# Backend health
curl https://YOUR-BACKEND-URL/health

# Frontend (visit in browser)
https://YOUR-FRONTEND-URL
```

### Test 2: End-to-End AI Request

1. Open your deployed frontend
2. Enter some text
3. Click a shunt action button
4. Verify:
   - Request completes successfully
   - No API key errors
   - Results display correctly

### Test 3: Security

```bash
# Should fail (no API key)
curl -X POST https://YOUR-BACKEND-URL/api/gemini/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test"}'

# Should return 401 Unauthorized
```

### Test 4: Rate Limiting

```bash
# Send 101 requests rapidly (should hit rate limit)
for i in {1..101}; do
  curl -X POST https://YOUR-BACKEND-URL/api/gemini/generate \
    -H "Content-Type: application/json" \
    -H "x-api-key: YOUR_API_KEY" \
    -d '{"prompt": "test"}' &
done

# Should see 429 Too Many Requests after request 100
```

## Troubleshooting

### Backend won't deploy

```bash
# Check build logs
gcloud builds list --limit=5

# View specific build
gcloud builds log BUILD_ID
```

### CORS errors in frontend

```bash
# Verify CORS_ORIGIN is set correctly
gcloud run services describe shunt-factory-backend \
  --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env)"

# Update if needed
gcloud run services update shunt-factory-backend \
  --region=us-central1 \
  --update-env-vars CORS_ORIGIN=https://your-frontend-url.com
```

### "Failed to initialize Gemini service"

```bash
# Check if secret exists
gcloud secrets versions access latest --secret=gemini-api-key

# Verify IAM permissions
gcloud secrets get-iam-policy gemini-api-key
```

### High costs

1. Check request logs for abuse
2. Reduce rate limits
3. Add more aggressive input validation
4. Implement request caching

## Security Best Practices

1. **Rotate API Keys Regularly**:
   ```bash
   # Update client API keys
   echo -n "new-key-1,new-key-2" | gcloud secrets versions add client-api-keys --data-file=-
   ```

2. **Monitor Access Logs**:
   - Review Cloud Logging for suspicious activity
   - Set up alerts for failed auth attempts

3. **Keep Dependencies Updated**:
   ```bash
   cd backend
   npm audit
   npm update
   ```

4. **Enable Cloud Armor** (for DDoS protection):
   - Set up WAF rules in GCP Console
   - Add rate limiting at load balancer level

## Next Steps

- [ ] Set up custom domain for backend
- [ ] Implement Redis for distributed rate limiting
- [ ] Add monitoring dashboard
- [ ] Set up CI/CD for automatic deployments
- [ ] Implement A/B testing for UI variations
- [ ] Add comprehensive analytics

## Support

For issues or questions:
- Check backend logs: `gcloud logging read ...`
- Review [Backend README](backend/README.md)
- Review security documentation: [security.md](security.md)

---

**Congratulations!** 🎉 You now have a production-ready, secure Shunt Factory deployment with:
- ✅ API keys secured in Secret Manager
- ✅ Authentication and rate limiting
- ✅ Comprehensive logging and monitoring
- ✅ Auto-scaling infrastructure
- ✅ Cost-optimized deployment
