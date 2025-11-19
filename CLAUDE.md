# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Shunt Final V** is a professional-grade, memory-efficient frontend interface for advanced AI-driven text transformation, system orchestration, and agentic development. The application integrates with Google's Gemini API and Anthropic's Claude API to provide a comprehensive suite of AI-powered tools.

**Tech Stack:**

Frontend:
- React 19 with TypeScript
- Vite (build tool)
- Google Generative AI SDK (`@google/genai`)
- Anthropic Claude SDK (`@anthropic-ai/sdk`)
- ReactFlow (for visual workflow diagrams)
- Zod (for schema validation)
- Express.js backend (API proxy for security)
- Vitest (testing)

Backend:
- Express.js with TypeScript
- Google Cloud Secret Manager
- Winston logging with Cloud Logging
- Jest (testing)
- Docker for deployment

## Development Commands

### Frontend Setup
```bash
npm install                    # Install frontend dependencies
cd backend && npm install      # Install backend dependencies
```

**Environment Configuration:**

Frontend `.env.local`:
```
VITE_BACKEND_URL=http://localhost:8080
VITE_API_KEY=your_client_api_key_here
```

Backend `.env`:
```
GEMINI_API_KEY=your_gemini_api_key_here
CLIENT_API_KEY=your_client_api_key_here
PORT=8080
NODE_ENV=development
### Frontend Development
```bash
npm run dev                    # Start dev server on port 3000
npm run build                  # Build for production (outputs to /dist)
npm run build:staging          # Build for staging environment
npm run preview                # Preview production build
npm run type-check             # TypeScript validation only
npm run analyze                # Bundle size analysis
```

### Frontend Testing
```bash
npm test                       # Run tests in watch mode
npm run test:run               # Single test run
npm run test:coverage          # Coverage report
npm run test:ui                # UI dashboard for tests
```

### Backend Setup
```bash
npm run dev                    # Start frontend dev server (http://localhost:3000)
cd backend && npm run dev      # Start backend dev server (http://localhost:8080)
npm run build                  # Build frontend for production
npm run build:prod             # Build with production environment
npm run preview                # Preview production build
npm run clean                  # Remove build artifacts
npm run type-check             # Run TypeScript type checking
```

### Testing
```bash
# Frontend (Vitest)
npm test                       # Run tests in watch mode
npm run test:run               # Run tests once
npm run test:ui                # Run tests with UI
npm run test:coverage          # Run tests with coverage

# Backend (Jest)
cd backend && npm test         # Run all backend tests

# Run specific test file
npx vitest run path/to/test.ts
```

### Windows 11 / PowerShell
```powershell
.\scripts\build.ps1 -Environment production    # Build for production
.\scripts\deploy.ps1 -Environment staging      # Deploy to staging
.\scripts\local-preview.ps1                    # Local preview
.\backend\scripts\setup-gcp.ps1                # GCP backend setup
cd backend && npm install      # Install backend dependencies
```

### Backend Development
```bash
cd backend
npm run dev                    # Dev server with hot reload (port 8080)
npm run build                  # TypeScript compilation
npm start                      # Run compiled server
npm run lint                   # ESLint
npm test                       # Run Jest tests
```

### Running Full Stack Locally
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend (with backend integration)
# Set VITE_USE_BACKEND=true in .env.local
npm run dev
```

## Architecture Overview

### High-Level Structure

The application follows a **modular, context-driven architecture** with:
- Frontend: React SPA with lazy-loaded modules
- Backend: Express API proxy (keeps API keys secure)

**Core Application Flow:**
```
App.tsx (Root)
  ├─ Multiple Context Providers (nested)
  │   ├─ SettingsProvider
  │   ├─ TelemetryProvider
  │   ├─ MCPProvider (Model Context Protocol)
  │   ├─ MailboxProvider (inter-module communication)
  │   ├─ MiaProvider (AI assistant)
  │   ├─ SubscriptionProvider
  │   └─ UndoRedoProvider
  │
  └─ AppContent
      ├─ MissionControl (main navigation hub)
      └─ MiaAssistant (floating AI assistant)
```

### Frontend-Backend Communication

**Security Architecture:** All AI API calls route through the backend to keep API keys secure.

```typescript
// Frontend services use backendApiService.ts
import { performShuntViaBackend } from '@/services/backendApiService';

// Backend endpoints (backend/src/routes/gemini.routes.ts)
POST /api/gemini/shunt          # Text transformation
POST /api/gemini/modular        # Modular prompts
POST /api/gemini/analyze-image  # Image analysis
POST /api/gemini/generate       # General content generation
```

### Context Architecture

All contexts are defined in `/context/`:

- **SettingsContext**: User preferences (theme, colors, animations, audio)
- **TelemetryContext**: Analytics and usage tracking
- **MCPContext**: Model Context Protocol for AI tool integration
- **MailboxContext**: File-based communication between modules
- **MiaContext**: AI assistant state and conversation history
- **SubscriptionContext**: User subscription and feature access (Pro/Free tiers)
- **UndoRedoContext**: Global undo/redo functionality
- **ActiveTabContext**: Current active module in MissionControl

### Module System

Modules accessed through MissionControl (`/components/mission_control/`):

- **Shunt**: Text transformation engine
- **Weaver**: Multi-step workflow orchestration
- **Foundry**: Multi-agent system for code review
- **Framework**: Architecture visualization
- **Chat**: Direct AI chat interface
- **Image Analysis**: Image processing
- **Terminal**: In-browser terminal emulation
- **Oraculum**: Knowledge base and query system
- **Chronicle**: Session history and logging
- **Tool for AI**: Job queue and execution
- **Deploy**: Deployment management
- **Documentation**: Project documentation
- **Settings**: User preferences

**Adding New Modules:**
1. Create directory: `/components/[module_name]/`
2. Add lazy import in `MissionControl.tsx`
3. Register in the `tabs` array
4. Add to `MissionControlTabKey` union type in `/types/index.ts`

### Service Layer

**Frontend Services (`/services/`):**

- **backendApiService.ts**: Routes all AI calls through backend
- **geminiService.ts**: Wraps backend API calls with retry logic
- **prompts.ts**: Centralized prompt engineering
- **toolApi.ts**: Tool execution framework for AI agents
- **miaService.ts**: Mia AI assistant logic
- **apiUtils.ts**: Retry logic (`withRetries()`) and error handling

**Backend Services (`/backend/src/services/`):**

- **geminiService.ts**: Direct Gemini API calls
- **secretManager.ts**: GCP Secret Manager integration

**When modifying services:**
- Always use `withRetries()` wrapper from `apiUtils.ts`
- Log errors using `logFrontendError()` from `/utils/errorLogger.ts`
- Return structured responses with token usage

### Backend Architecture

The backend (`/backend/`) is a production-ready Express.js server that securely handles AI API calls:

```
backend/
├── src/
│   ├── config/environment.ts      # Configuration validation
│   ├── middleware/
│   │   ├── auth.ts                # API key authentication (x-api-key header)
│   │   ├── rateLimiter.ts         # Per-user rate limiting
│   │   └── validation.ts          # Zod validation + prompt injection detection
│   ├── routes/gemini.routes.ts    # API endpoints
│   ├── services/
│   │   ├── geminiService.ts       # Server-side Gemini client
│   │   └── secretManager.ts       # Google Cloud Secret Manager
│   ├── utils/logger.ts            # Winston + Cloud Logging
│   └── server.ts                  # Express server entry
├── Dockerfile                     # Multi-stage production build
└── cloudbuild.yaml                # Cloud Build CI/CD
```

**API Endpoints:**
- `GET /health`, `/ready` - Health checks
- `POST /api/gemini/shunt` - Shunt action execution
- `POST /api/gemini/modular-prompt` - Modular prompt execution
- `POST /api/gemini/analyze-image` - Image analysis
- `POST /api/gemini/generate` - Generic text generation

**Security Features:**
- API key authentication via `x-api-key` header
- Two-tier rate limiting (100 req/min standard, 20 req/min for AI)
- Input validation with Zod schemas
- Prompt injection detection
- Helmet.js security headers

**Backend/Frontend Integration:**
The frontend can operate in two modes controlled by `VITE_USE_BACKEND`:
- `false`: Frontend calls Gemini API directly (development)
- `true`: Frontend routes calls through backend API (production)

### Type System

All types in `/types/`:

- **index.ts**: Core types (ShuntAction, MissionControlTab, etc.)
- **schemas.ts**: Zod schemas for runtime validation
- **telemetry.ts**: Telemetry event types
- **mcp.ts**: Model Context Protocol types
- **autonomous.ts**: Autonomous agent types

**Pattern:** Validated structures should have both Zod schema and derived TypeScript type using `z.infer<typeof schema>`.

### Path Aliases

```typescript
import { ShuntAction } from '@/types';
import { performShunt } from '@/services/geminiService';
```

## Key Architectural Patterns

### 1. Provider Pattern
Global state through nested Context providers in `App.tsx`. Settings outermost, then Telemetry, then feature-specific.

### 2. Lazy Loading
All MissionControl modules use `React.lazy()` with `Suspense` boundaries.

### 3. Error Boundaries
Critical UI sections wrapped in `ErrorBoundary` components.

### 4. Mailbox Pattern
Inter-module file communication via `MailboxContext` with versioning support.

### 5. Feature Tiering
Subscription-based feature access (Pro/Free) managed by `SubscriptionContext` and `SidebarNav` component.

### 6. Telemetry
```typescript
const { trackEvent } = useTelemetry();
trackEvent('module_name', 'action_name', { metadata });
```

### 7. Audio Feedback
```typescript
import { audioService } from '@/services/audioService';
audioService.playSound('tab_switch');
```

## Common Development Patterns

### Adding a New Shunt Action

1. Add to `ShuntAction` enum in `/types/index.ts`
2. Add prompt in `/services/prompts.ts` → `getPromptForAction()`
3. Update UI in `/components/shunt/ControlPanel.tsx`

### Working with AI APIs

```typescript
import { performShunt } from '@/services/geminiService';
const { resultText, tokenUsage } = await performShunt(
  text,
  ShuntAction.SUMMARIZE,
  'gemini-2.5-flash',
  context,
  priority,
  promptInjectionGuardEnabled
);
```

### Error Handling

```typescript
import { logFrontendError, ErrorSeverity } from '@/utils/errorLogger';

try {
  // risky operation
} catch (error) {
  logFrontendError(error, ErrorSeverity.High, {
    context: 'operation_name',
    additionalInfo: 'details'
  });
}
```

## Backend Structure

```
backend/
├── src/
│   ├── server.ts              # Express app entry point
│   ├── routes/
│   │   └── gemini.routes.ts   # AI API endpoints
│   ├── services/
│   │   ├── geminiService.ts   # Gemini API integration
│   │   └── secretManager.ts   # GCP secrets
│   ├── middleware/
│   │   ├── auth.ts            # API key validation
│   │   ├── validation.ts      # Request validation
│   │   └── rateLimiter.ts     # Rate limiting
│   └── utils/
│       └── logger.ts          # Logging utility
├── scripts/
│   ├── setup-gcp.sh           # Unix GCP setup
│   └── setup-gcp.ps1          # Windows GCP setup
└── cloudbuild.yaml            # GCP Cloud Build config
```

## Project-Specific Guidelines

### Security
- All AI calls route through backend (API keys never exposed in browser)
- Input sanitization via `sanitizeInput()` in `/utils/security.ts`
- Optional Prompt Injection Guard per ShuntAction
- Rate limiting on backend endpoints

### Prompt Engineering
All prompts in `/services/prompts.ts`:
- Follow XML-based structure for Gemini compatibility
- Use structured output schemas
- Test across Flash and Pro models

### Component Organization
```
✅ Good: /components/shunt/InputPanel.tsx
❌ Avoid: /components/panels/ShuntInput.tsx
```

### State Management Priority
1. Local `useState` for UI-only state
2. Context for feature-level state
3. Avoid global state for temporary data

### Performance
- Use `useCallback`/`useMemo` for expensive operations
- Lazy load heavy dependencies (PDF.js, JSZip)
- Monitor and display token usage

## Important Files

- **backup/frontend-direct-api/**: Original frontend code with direct API calls (for reference)
- **WINDOWS_SETUP.md**: Complete Windows 11 setup guide
- **security.md**: Prompt engineering and Build agent architecture

## Notes for AI Code Assistants

1. Check if a Context exists before creating component-level state
2. Use service layer - don't make direct API calls from components
3. Maintain modular architecture - avoid cross-module dependencies
4. All AI operations must track and return token usage
5. Follow established error logging patterns
6. Respect lazy loading for heavy components
7. Frontend AI calls must go through `backendApiService.ts`
8. Use cross-platform npm scripts (cross-env, rimraf)
### Frontend (`.env.local` in project root)

**Backend Integration:**
```bash
VITE_BACKEND_URL=http://localhost:8080
VITE_API_KEY=dev-test-key
VITE_USE_BACKEND=false           # true for backend mode, false for direct API calls
VITE_USE_MULTI_AGENT=true
```

**API Keys (frontend-only mode):**
```bash
GEMINI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here  # Optional
```

**Environment & Feature Flags:**
```bash
VITE_APP_ENV=development         # development|staging|production
VITE_ENABLE_TELEMETRY=true
VITE_ENABLE_DEBUG_TOOLS=true
VITE_LOG_LEVEL=info
```

**Rate Limiting (frontend):**
```bash
VITE_RATE_LIMIT_SHUNT=50
VITE_RATE_LIMIT_WEAVER=10
VITE_RATE_LIMIT_FOUNDRY=20
```

### Backend (`.env.local` in `/backend/`)

```bash
NODE_ENV=development
PORT=8080
CORS_ORIGIN=http://localhost:3000

# GCP Integration
GCP_PROJECT_ID=your-project-id
GEMINI_API_KEY_SECRET_NAME=gemini-api-key
GEMINI_API_KEY=dev-key-only      # Only for local dev

# Authentication
CLIENT_API_KEYS=key1,key2,key3   # Comma-separated valid API keys

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
ENABLE_CLOUD_LOGGING=false
LOG_LEVEL=debug
```

Environment variables are exposed to the frontend client via `vite.config.ts` `define` block.

## Testing

### Frontend (Vitest)

Configuration: `vitest.config.ts`
- Environment: happy-dom
- Setup file: `./test/setup.ts`
- Coverage provider: v8

Test files go in `/test/` directory. Use `.test.ts` or `.test.tsx` extensions.

### Backend (Jest)

Configuration: `backend/jest.config.js`
- Preset: ts-jest
- Environment: node

Test files go alongside source in `__tests__/` directories:
- `src/middleware/__tests__/` - auth, rateLimiter, validation tests
- `src/services/__tests__/` - geminiService, secretManager tests
- `src/routes/__tests__/` - gemini.routes tests

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

**CI Pipeline (`ci.yml`):**
- Runs on push/PR to main/develop
- Lint & type check
- Matrix builds (development, staging, production)
- Security scan (npm audit)
- Bundle size analysis (PR only)

**Deploy to Staging (`deploy-staging.yml`):**
- Triggers on push to `develop` branch
- Pre-deployment verification
- Staging environment build

**Deploy to Production (`deploy-production.yml`):**
- Triggers on push to `main` or version tags
- Pre-deployment checks
- Production build verification (console.log removal, bundle sizes)
- Post-deployment health checks
- GitHub release creation for tags

## Deployment

### Docker (Backend)

```bash
cd backend
docker build -t shunt-backend .
docker run -p 8080:8080 --env-file .env.local shunt-backend
```

### Google Cloud Run

Backend is configured for Cloud Run deployment:
- Uses `cloudbuild.yaml` for CI/CD
- Secrets managed via Google Cloud Secret Manager
- Auto-scales to zero
- Run `backend/scripts/setup-gcp.sh` for initial GCP setup

### Build Optimization

Frontend uses advanced Vite chunk splitting (9 manual chunks):
- Core: react, reactflow
- Heavy: pdf, jszip, transformers
- AI: google-genai, anthropic
- Utils: markdown, misc

Sourcemaps are only generated for staging builds.

## Additional Resources

- **security.md**: Deep dive into Google AI Studio Build agent architecture and prompt engineering best practices
- **backend/README.md**: Comprehensive backend API documentation
- **backend/QUICK_START.md**: 5-minute backend quick start guide
- **DEPLOYMENT_GUIDE.md**: Complete deployment guide for backend and frontend
- **Session Workflow.drawio.svg**: Visual diagram of the session workflow (can be opened in draw.io)

## Notes for AI Code Assistants

When working on this codebase:
1. Always check if a Context already exists before creating component-level state
2. Use the existing service layer rather than making direct API calls from components
3. Maintain the modular architecture - avoid cross-module dependencies
4. All AI operations should track and return token usage
5. Follow the established error logging patterns
6. Respect the lazy loading strategy for new heavy components
7. When adding new AI features, consider whether they fit in existing modules or need a new one
8. Backend endpoints must include authentication middleware and rate limiting
9. Run tests before committing: `npm run test:run` (frontend) and `cd backend && npm test` (backend)
10. Check `VITE_USE_BACKEND` setting when debugging AI API issues
