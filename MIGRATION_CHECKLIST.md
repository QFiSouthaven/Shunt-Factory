# Frontend Migration Checklist

## Overview

This checklist helps you migrate your existing frontend code from **direct Gemini API calls** (insecure) to **backend API calls** (secure).

## Pre-Migration

- [ ] Backend deployed and running (see `backend/QUICK_START.md`)
- [ ] Backend health check passes: `curl YOUR_BACKEND_URL/health`
- [ ] You have a client API key from backend setup
- [ ] Frontend `.env.local` configured with `VITE_BACKEND_URL` and `VITE_API_KEY`

## Step 1: Update Environment Variables

**File: `.env.local`** (create if it doesn't exist)

```env
# Backend API URL
VITE_BACKEND_URL=http://localhost:8080  # or your production URL
VITE_API_KEY=your-client-api-key

# Remove these (no longer needed):
# GEMINI_API_KEY=...
# API_KEY=...
```

- [ ] Created `.env.local` with backend configuration
- [ ] Removed `GEMINI_API_KEY` from frontend `.env`
- [ ] Never commit `.env.local` to git

## Step 2: Find All Gemini Service Imports

Search your codebase for imports from `geminiService.ts`:

```bash
# Find all imports
grep -r "from.*geminiService" --include="*.tsx" --include="*.ts"
```

**Common locations**:
- [ ] `App.tsx`
- [ ] `components/Shunt.tsx`
- [ ] `components/Orchestrator.tsx`
- [ ] `components/ImageAnalyzer.tsx`
- [ ] Any custom components using AI

## Step 3: Replace Imports

### Option A: Simple Replacement (Recommended)

**Before**:
```typescript
import {
  performShunt,
  executeModularPrompt,
  analyzeImage,
  generateRawText
} from './services/geminiService';
```

**After**:
```typescript
import {
  performShuntViaBackend as performShunt,
  executeModularPromptViaBackend as executeModularPrompt,
  analyzeImageViaBackend as analyzeImage,
  generateContentViaBackend as generateRawText
} from './services/backendApiService';
```

- [ ] Updated all imports using the `as` aliasing pattern

### Option B: Gradual Migration

**Keep both services**:
```typescript
import { performShunt as performShuntDirect } from './services/geminiService';
import { performShuntViaBackend } from './services/backendApiService';

// Use feature flag
const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';
const performShunt = USE_BACKEND ? performShuntViaBackend : performShuntDirect;
```

- [ ] Set up feature flag if needed
- [ ] Test with backend enabled
- [ ] Remove old code after validation

## Step 4: Update Function Calls

Most function signatures are **identical**, so no changes needed!

### Functions with Same Interface ✅

These work without modification:

```typescript
// ✅ No changes needed
performShunt(text, action, model, context, priority)
executeModularPrompt(text, modules, context, priority)
analyzeImage(prompt, image, model)
generateRawText(prompt, model)
```

### Functions That Changed ⚠️

**Chat Functions** - Need update:

**Before**:
```typescript
import { startChat } from './services/geminiService';
const chat = startChat(history);
```

**After**:
```typescript
// Not yet implemented in backend
// Use direct Gemini service for chat (or implement backend endpoint)
```

- [ ] Identified chat usage
- [ ] Decided on approach (keep direct or extend backend)

**Development Plan Functions**:

```typescript
// These may need backend implementation:
// - generateDevelopmentPlan
// - generateProjectTome
// - generateApiDocumentation
// - generateQualityReport
```

- [ ] Identified which advanced functions you use
- [ ] Added to backend if needed (extend `backend/src/routes/gemini.routes.ts`)

## Step 5: Update Error Handling

Backend returns structured errors:

**Before**:
```typescript
try {
  const result = await performShunt(text, action, model);
} catch (error) {
  console.error('Gemini API error:', error);
}
```

**After** (same, but better errors):
```typescript
try {
  const result = await performShunt(text, action, model);
} catch (error) {
  // Backend provides detailed error messages
  console.error('Backend API error:', error.message);
  // Possible errors:
  // - "Rate limit exceeded"
  // - "Invalid API key"
  // - "Validation error"
}
```

- [ ] Updated error handling if needed
- [ ] Added user-friendly error messages

## Step 6: Test Each Component

### Test Checklist:

**Basic Functionality**:
- [ ] Shunt actions work (Amplify, Compress, etc.)
- [ ] Modular prompts work
- [ ] Image analysis works (if used)
- [ ] Token usage displays correctly
- [ ] Loading states work

**Error Cases**:
- [ ] Invalid input shows error
- [ ] Network errors handled gracefully
- [ ] Rate limiting works (try many requests)

**Performance**:
- [ ] Response times acceptable
- [ ] No console errors
- [ ] Token counts match expectations

## Step 7: Remove Old Gemini Service (Optional)

Once everything works with the backend:

- [ ] Remove `GEMINI_API_KEY` from `vite.config.ts` (lines 14-15)
- [ ] Consider archiving `services/geminiService.ts` (don't delete yet)
- [ ] Update any documentation referencing direct API calls

**File: `vite.config.ts`**

**Before**:
```typescript
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
},
```

**After**:
```typescript
define: {
  // Removed - API keys now in backend only
},
```

- [ ] Updated vite config
- [ ] Rebuilt frontend: `npm run build`
- [ ] Verified API keys not in bundle

## Step 8: Verify Security

```bash
# Build production bundle
npm run build

# Search for API keys in bundle (should find NONE)
grep -r "AIza" dist/  # or whatever your key prefix is
grep -r "GEMINI_API_KEY" dist/

# Should only find VITE_BACKEND_URL and VITE_API_KEY (safe to expose)
```

- [ ] No API keys in production bundle
- [ ] Only backend URL and client API key in bundle (this is safe)
- [ ] Tested in production mode

## Step 9: Update Documentation

- [ ] Updated README with new architecture
- [ ] Added backend URL to deployment docs
- [ ] Noted that `GEMINI_API_KEY` no longer needed in frontend

## Step 10: Deploy

**Backend** (if not already done):
```bash
gcloud builds submit --config=backend/cloudbuild.yaml
```

**Frontend** (Netlify/Vercel):
1. Update environment variables:
   - `VITE_BACKEND_URL`: Your Cloud Run URL
   - `VITE_API_KEY`: Your client API key
2. Trigger deployment
3. Test production site

- [ ] Backend deployed
- [ ] Frontend environment variables updated
- [ ] Frontend deployed
- [ ] Production site tested

## Troubleshooting

### "Failed to fetch" errors

**Issue**: Frontend can't reach backend

**Fix**:
```bash
# Check CORS is configured
gcloud run services describe shunt-factory-backend \
  --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env)"

# Update CORS_ORIGIN if needed
gcloud run services update shunt-factory-backend \
  --region=us-central1 \
  --update-env-vars CORS_ORIGIN=https://your-frontend.com
```

### "401 Unauthorized" errors

**Issue**: API key not being sent

**Fix**:
```typescript
// Check .env.local
console.log(import.meta.env.VITE_API_KEY); // Should not be undefined

// Verify header is sent
const headers = new Headers();
headers.set('x-api-key', import.meta.env.VITE_API_KEY);
```

### "429 Too Many Requests"

**Issue**: Rate limit exceeded

**Fix**:
- This is expected! Rate limits protect you from abuse
- Wait 60 seconds and try again
- Or contact admin to increase your limits

### Different response format

**Issue**: Response structure changed

**Check**:
```typescript
// Backend response format:
{
  resultText: string,
  tokenUsage: { prompt_tokens, completion_tokens, total_tokens, model },
  latencyMs: number
}

// Same as before! Should work without changes.
```

## Migration Complete! 🎉

Checklist Summary:

- [ ] Backend deployed and tested
- [ ] Frontend environment configured
- [ ] All imports updated
- [ ] All components tested
- [ ] Old API keys removed
- [ ] Security verified
- [ ] Documentation updated
- [ ] Production deployment successful

## Rollback Plan

If you need to rollback:

1. **Keep `geminiService.ts`** - Don't delete it until confident
2. **Revert imports** back to `geminiService`
3. **Restore `GEMINI_API_KEY`** in frontend `.env`
4. **Redeploy frontend**

The old code will still work (but remain insecure).

## Next Steps After Migration

- [ ] Monitor backend logs for errors
- [ ] Track API usage and costs
- [ ] Set up monitoring alerts
- [ ] Optimize rate limits based on usage
- [ ] Implement caching if needed

---

**Questions?** See:
- [Backend Quick Start](backend/QUICK_START.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Backend Implementation Summary](BACKEND_IMPLEMENTATION_SUMMARY.md)
