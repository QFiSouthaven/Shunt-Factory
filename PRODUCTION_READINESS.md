# Production Readiness Guide

This document outlines the production-ready features implemented in Aether Shunt and provides guidance for deployment.

## ✅ Completed Production Features

### 1. Error Handling & Recovery

#### Base Error Boundary
- **Location**: `components/ErrorBoundary.tsx`
- **Features**:
  - Graceful error catching
  - User-friendly error messages
  - MIA notification integration
  - Stack trace details (expandable)

#### Specialized Error Boundaries
- **FeatureErrorBoundary** (`components/common/FeatureErrorBoundary.tsx`)
  - Per-feature error isolation
  - Reset/retry capabilities
  - Feature-specific error messages

- **AsyncErrorBoundary** (`components/common/AsyncErrorBoundary.tsx`)
  - Network error detection
  - Automatic retry logic (max 3 attempts)
  - Retry countdown UI

#### Global Error Handling
- **Location**: `utils/errorLogger.ts`
- **Features**:
  - Window error handler
  - Unhandled promise rejection handler
  - Error severity levels (Low, Medium, High, Critical)
  - Automatic MIA alert creation
  - User-friendly API error messages

### 2. Environment Configuration

#### Environment Files
- `.env.example` - Template with all available variables
- `.env.development` - Development configuration
- `.env.staging` - Staging configuration
- `.env.production` - Production configuration
- `.env.local` - Local overrides (gitignored)

#### Configuration Service
- **Location**: `config/environment.ts`
- **Features**:
  - Type-safe configuration access
  - Environment detection (dev/staging/prod)
  - Feature flags
  - Rate limiting configs
  - Security settings
  - Third-party integrations
  - Configuration validation

#### Feature Flags
```typescript
config.features.telemetry          // Analytics tracking
config.features.errorReporting     // Sentry/error reporting
config.features.analytics          // Google Analytics
config.features.debugTools         // Debug mode
config.features.performanceMonitoring  // Core Web Vitals
```

### 3. Logging System

#### Production Logger
- **Location**: `services/logger.service.ts`
- **Features**:
  - Log levels (debug, info, warn, error)
  - Environment-aware logging
  - Console log control per environment
  - Log history tracking
  - Log export functionality
  - External service integration (Sentry, etc.)
  - Performance timing
  - Grouped logging

#### Usage
```typescript
import { logger } from './services/logger.service';

logger.debug('Debugging info', { context: 'data' });
logger.info('Information', { userId: '123' });
logger.warn('Warning message', { reason: 'rate limit' });
logger.error('Error occurred', error, { context: 'extra data' });
```

### 4. CI/CD Pipeline

#### GitHub Actions Workflows

**CI Workflow** (`.github/workflows/ci.yml`)
- Triggers: Push/PR to main/develop
- Jobs:
  - Lint & Type Check
  - Build (dev/staging/prod)
  - Security Scan (npm audit)
  - Dependency Check
  - Bundle Size Analysis

**Deploy Staging** (`.github/workflows/deploy-staging.yml`)
- Triggers: Push to develop, manual dispatch
- Features:
  - Automated staging deployment
  - Build verification
  - Multiple deployment targets (Vercel/Netlify/AWS)

**Deploy Production** (`.github/workflows/deploy-production.yml`)
- Triggers: Push to main, tags, manual dispatch
- Features:
  - Pre-deployment checks
  - Security audit
  - Production build verification
  - Multiple deployment targets
  - GitHub release creation
  - Post-deployment verification

### 5. Build Scripts

#### Bash Scripts
- `scripts/build.sh [environment]` - Build with environment
- `scripts/deploy.sh [environment]` - Deploy to hosting
- `scripts/local-preview.sh` - Preview production build

#### NPM Scripts
```json
{
  "dev": "vite",                           // Development server
  "build": "vite build",                   // Standard build
  "build:dev": "VITE_APP_ENV=development vite build",
  "build:staging": "VITE_APP_ENV=staging vite build",
  "build:prod": "VITE_APP_ENV=production vite build",
  "preview": "vite preview",               // Preview build
  "type-check": "tsc --noEmit",           // Type checking
  "lint": "tsc --noEmit",                 // Lint check
  "clean": "rm -rf dist node_modules/.vite",
  "analyze": "vite-bundle-visualizer"     // Bundle analysis
}
```

### 6. Performance Monitoring

#### Core Web Vitals
- **Location**: `services/performance.service.ts`
- **Metrics Tracked**:
  - **LCP** (Largest Contentful Paint) - Target: < 2.5s
  - **FID** (First Input Delay) - Target: < 100ms
  - **CLS** (Cumulative Layout Shift) - Target: < 0.1
  - **FCP** (First Contentful Paint) - Target: < 1.8s
  - **TTFB** (Time to First Byte) - Target: < 600ms

#### Features
- Automatic metric collection
- Performance rating (good/needs-improvement/poor)
- Custom performance marks and measures
- Analytics integration (GA4, PostHog)
- Export performance data

#### Usage
```typescript
import { performanceMonitor } from './services/performance.service';

// Mark performance points
performanceMonitor.mark('feature-start');
// ... operation ...
performanceMonitor.mark('feature-end');
performanceMonitor.measure('feature-duration', 'feature-start', 'feature-end');

// Get metrics
const metrics = performanceMonitor.getCoreWebVitals();
```

### 7. Security Hardening

#### Security Service
- **Location**: `services/security.service.ts`

#### Content Security Policy (CSP)
- Meta tag CSP implementation
- Configurable policy per environment
- Whitelisted CDNs and APIs
- Strict in production, relaxed in development

#### Input Sanitization
- XSS prevention
- HTML sanitization
- Script tag removal
- Event handler stripping
- JavaScript protocol blocking

#### Rate Limiting (Client-Side)
- Feature-based rate limits:
  - Shunt: 50 requests/minute
  - Weaver: 10 requests/minute
  - Foundry: 20 requests/minute
- Configurable per environment
- Automatic reset windows

#### File Upload Validation
- Size limits (default 10MB)
- Type validation
- Extension whitelist
- Secure error messages

#### Other Security Features
- URL validation (prevent open redirect)
- Secure random token generation
- SHA-256 hashing
- Secure local storage wrapper
- Security headers recommendations

#### Usage
```typescript
import { security } from './services/security.service';

// Sanitize input
const safe = security.sanitizeInput(userInput);

// Check rate limit
const { allowed, remaining } = security.checkShuntRateLimit(userId);
if (!allowed) {
  // Show rate limit error
}

// Validate file
const { valid, error } = security.validateFileUpload(file);
```

### 8. Build Optimization

#### Vite Configuration Enhancements
- Manual chunk splitting for optimal caching
- Separate vendor bundles:
  - vendor-react (React core)
  - vendor-ai (Gemini + Anthropic SDKs)
  - vendor-reactflow
  - vendor-pdf
  - vendor-markdown
  - vendor-utils
  - vendor-misc
- Optimized asset file names with hashing
- CSS code splitting and minification
- ESBuild optimizations:
  - Remove console/debugger in production
  - Minify identifiers, whitespace, syntax
  - Tree shaking enabled
- Source maps for staging only
- Fast Refresh for development

## 🚀 Deployment Guide

### Prerequisites
1. Node.js 20+ installed
2. npm or yarn package manager
3. Git repository access
4. Deployment platform account (Vercel/Netlify/AWS)

### Environment Setup

1. **Copy environment template**:
   ```bash
   cp .env.example .env.local
   ```

2. **Configure API keys**:
   ```bash
   # Required
   GEMINI_API_KEY=your_gemini_api_key

   # Optional
   ANTHROPIC_API_KEY=your_anthropic_api_key
   VITE_SENTRY_DSN=your_sentry_dsn
   VITE_GA_TRACKING_ID=your_ga_id
   ```

3. **Set environment**:
   ```bash
   VITE_APP_ENV=production  # or staging, development
   ```

### Build Process

#### Option 1: Using Build Scripts (Recommended)
```bash
# Development build
./scripts/build.sh development

# Staging build
./scripts/build.sh staging

# Production build
./scripts/build.sh production
```

#### Option 2: Using NPM Scripts
```bash
npm run build:prod
```

#### Option 3: Manual Build
```bash
export VITE_APP_ENV=production
npm run build
```

### Deployment

#### Option 1: Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Or use deployment script
./scripts/deploy.sh production
```

#### Option 2: Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist

# Or use deployment script
./scripts/deploy.sh production
```

#### Option 3: AWS S3 + CloudFront
```bash
# Build
npm run build:prod

# Sync to S3
aws s3 sync dist/ s3://your-bucket --delete

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

#### Option 4: GitHub Pages
```bash
# Build
npm run build:prod

# Deploy using GitHub Actions (automatic on push to main)
# Or manually:
npm install -g gh-pages
gh-pages -d dist
```

### GitHub Actions Deployment

The repository includes automated deployment workflows:

1. **Staging Deployment**:
   - Automatic on push to `develop` branch
   - Manual trigger via GitHub Actions UI

2. **Production Deployment**:
   - Automatic on push to `main` branch
   - Automatic on version tags (`v1.0.0`, etc.)
   - Manual trigger via GitHub Actions UI

**Required Secrets** (configure in GitHub repository settings):
```
GEMINI_API_KEY              # Google Gemini API key
ANTHROPIC_API_KEY           # Anthropic Claude API key (optional)
VERCEL_TOKEN                # If using Vercel
VERCEL_ORG_ID
VERCEL_PROJECT_ID
NETLIFY_AUTH_TOKEN          # If using Netlify
NETLIFY_SITE_ID
AWS_ACCESS_KEY_ID           # If using AWS
AWS_SECRET_ACCESS_KEY
CLOUDFRONT_DISTRIBUTION_ID
SENTRY_DSN                  # Error tracking
GA_TRACKING_ID              # Google Analytics
```

## 📊 Monitoring & Observability

### Performance Monitoring
- Core Web Vitals tracked automatically
- Metrics sent to Google Analytics (if configured)
- Performance data exportable via UI

### Error Tracking
- All errors logged via error logger
- MIA assistant notified of errors
- Sentry integration ready (add DSN)

### Logging
- Production: ERROR level only
- Staging: INFO level
- Development: DEBUG level
- Logs exportable as JSON

## 🔒 Security Checklist

### Before Production Deployment
- [ ] Review and update CSP policy
- [ ] Configure Sentry DSN for error reporting
- [ ] Enable rate limiting
- [ ] Verify API keys are in environment variables (not in code)
- [ ] Enable CSP in production environment
- [ ] Review security headers
- [ ] Test file upload validation
- [ ] Verify input sanitization is working

### Post-Deployment
- [ ] Verify CSP is active (check browser console)
- [ ] Test error boundary functionality
- [ ] Check performance metrics
- [ ] Monitor error rates in Sentry
- [ ] Review rate limit effectiveness
- [ ] Test with security scanner (e.g., OWASP ZAP)

## 🧪 Testing Production Build

### Local Preview
```bash
# Build and preview
./scripts/local-preview.sh

# Or manually
npm run build:prod
npm run preview
```

### Verification Checklist
- [ ] Application loads without errors
- [ ] All tabs/features functional
- [ ] No console.log statements visible
- [ ] Source maps not exposed (production)
- [ ] CSP warnings resolved
- [ ] Performance metrics look good
- [ ] Error boundaries work correctly
- [ ] File uploads work with validation

## 🎯 Performance Targets

### Core Web Vitals Targets
- **LCP**: < 2.5s (Good)
- **FID**: < 100ms (Good)
- **CLS**: < 0.1 (Good)
- **FCP**: < 1.8s (Good)
- **TTFB**: < 600ms (Good)

### Bundle Size Targets
- **Initial JS bundle**: < 500KB (gzipped)
- **Total page size**: < 2MB
- **Images**: Optimized and lazy-loaded
- **Fonts**: Preloaded and subset

## 📈 Optimization Tips

### Code Splitting
- Features are lazy-loaded where appropriate
- Vendor bundles are separated for better caching
- Route-based code splitting recommended for future updates

### Image Optimization
- Use WebP format where possible
- Lazy load images below the fold
- Use responsive images with srcset
- Implement blur placeholders

### Caching Strategy
- Static assets have cache-busting hashes
- Vendor chunks rarely change (good for caching)
- HTML file should have no-cache headers
- Assets should have long-term caching

## 🔄 Rollback Procedure

### If Production Deployment Fails

1. **Immediate Rollback**:
   ```bash
   # Revert to previous commit
   git revert HEAD
   git push origin main

   # Or rollback on platform
   vercel rollback  # Vercel
   netlify rollback  # Netlify
   ```

2. **Investigate Issue**:
   - Check error logs
   - Review Sentry errors
   - Check performance metrics
   - Verify environment variables

3. **Fix and Redeploy**:
   - Fix issue in develop branch
   - Test in staging
   - Deploy to production when verified

## 📞 Support & Troubleshooting

### Common Issues

**Build Fails**
- Check Node.js version (requires 20+)
- Clear cache: `npm run clean && npm ci`
- Verify environment variables are set

**CSP Violations**
- Check browser console for specific violations
- Update CSP policy in `services/security.service.ts`
- Test in staging before production

**Performance Issues**
- Check bundle sizes: `npm run build && ls -lh dist/assets/js/`
- Use bundle analyzer: `npm run analyze`
- Review lazy loading implementation

**Rate Limiting Not Working**
- Verify environment config is loaded
- Check rate limit values in config
- Clear browser local storage

## 📝 Next Steps

### Recommended Enhancements
1. Add comprehensive testing (Jest, React Testing Library, Playwright)
2. Set up Sentry for production error tracking
3. Implement analytics dashboard
4. Add A/B testing framework
5. Set up synthetic monitoring
6. Implement progressive web app (PWA) features
7. Add service worker for offline support

### Backend Integration (When Ready)
1. Update API base URLs in environment configs
2. Implement authentication flow
3. Replace client-side rate limiting with server-side
4. Move API keys to backend
5. Implement proper CORS policies
6. Set up backend error reporting

---

**Version**: 2.0.0-professional
**Last Updated**: 2025-01-17
**Maintained By**: Aether Shunt Development Team
