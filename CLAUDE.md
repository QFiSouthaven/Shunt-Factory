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
- Vitest (testing)

Backend:
- Express.js with TypeScript
- Google Cloud Secret Manager
- Winston logging with Cloud Logging
- Jest (testing)
- Docker for deployment

## Development Commands

### Setup
```bash
npm install                    # Install frontend dependencies
cd backend && npm install      # Install backend dependencies
```

### Frontend Development
```bash
npm run dev                    # Start dev server on port 3000
npm run build                  # Build for production (outputs to /dist)
npm run build:dev              # Build for development environment
npm run build:staging          # Build for staging environment
npm run build:prod             # Build for production environment
npm run preview                # Preview production build
npm run clean                  # Remove build artifacts
npm run type-check             # TypeScript validation only
npm run analyze                # Bundle size analysis
```

### Frontend Testing
```bash
npm test                       # Run tests in watch mode
npm run test:run               # Single test run
npm run test:coverage          # Coverage report
npm run test:ui                # UI dashboard for tests
npx vitest run test/example.test.ts  # Run a single test file
```

### Backend Development
```bash
cd backend
npm run dev                    # Dev server with hot reload (port 8080)
npm run build                  # TypeScript compilation
npm start                      # Run compiled server
npm run lint                   # ESLint
npm test                       # Run Jest tests
npm test -- src/services/__tests__/geminiService.test.ts  # Run a single test file
```

### Running Full Stack Locally
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
npm run dev
```

### Windows 11 / PowerShell
```powershell
.\scripts\build.ps1 -Environment production    # Build for production
.\scripts\deploy.ps1 -Environment staging      # Deploy to staging
.\scripts\local-preview.ps1                    # Local preview
.\backend\scripts\setup-gcp.ps1                # GCP backend setup
```

## Environment Variables

### Frontend (`.env.local` in project root)

```bash
VITE_BACKEND_URL=http://localhost:8080
VITE_API_KEY=dev-test-key
VITE_APP_ENV=development         # development|staging|production
```

### Backend (`.env` in `/backend/`)

```bash
NODE_ENV=development
PORT=8080
GEMINI_API_KEY=your_gemini_api_key_here
CLIENT_API_KEY=your_client_api_key_here

# Local LLM (optional, for privacy)
LM_STUDIO_URL=http://localhost:1234/v1
LM_STUDIO_MODEL=local-model
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2
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
- **localLLMService.ts**: Local LLM integration (LM Studio, Ollama)

**Backend Services (`/backend/src/services/`):**

- **geminiService.ts**: Direct Gemini API calls
- **secretManager.ts**: GCP Secret Manager integration

**When modifying services:**
- Always use `withRetries()` wrapper from `apiUtils.ts`
- Log errors using `logFrontendError()` from `/utils/errorLogger.ts`
- Return structured responses with token usage

### Backend Architecture

The backend (`/backend/`) is a production-ready Express.js server:

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
├── scripts/
│   ├── setup-gcp.sh               # Unix GCP setup
│   └── setup-gcp.ps1              # Windows GCP setup
├── Dockerfile                     # Multi-stage production build
└── cloudbuild.yaml                # Cloud Build CI/CD
```

**API Endpoints:**
- `GET /health`, `/ready` - Health checks
- `POST /api/gemini/shunt` - Shunt action execution
- `POST /api/gemini/modular-prompt` - Modular prompt execution
- `POST /api/gemini/analyze-image` - Image analysis
- `POST /api/gemini/generate` - Generic text generation

**Local LLM Endpoints (Privacy-focused):**
- `GET /api/local-llm/health` - Check LM Studio/Ollama availability
- `GET /api/local-llm/models` - List available local models
- `POST /api/local-llm/generate` - Generate text with local LLM
- `POST /api/local-llm/shunt` - Shunt action with local LLM
- `POST /api/local-llm/chat` - Multi-turn chat with local LLM

**Security Features:**
- API key authentication via `x-api-key` header
- Two-tier rate limiting (100 req/min standard, 20 req/min for AI)
- Input validation with Zod schemas
- Prompt injection detection
- Helmet.js security headers

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

## Testing

### Frontend (Vitest)

Configuration: `vitest.config.ts`
- Environment: happy-dom
- Setup file: `./test/setup.ts`
- Coverage provider: v8

Test files use `.test.ts` or `.test.tsx` extensions.

### Backend (Jest)

Configuration: `backend/jest.config.js`
- Preset: ts-jest
- Environment: node

Test files in `__tests__/` directories alongside source.

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

- **ci.yml**: Lint, type check, matrix builds, security scan
- **deploy-staging.yml**: Deploy on push to `develop`
- **deploy-production.yml**: Deploy on push to `main` or version tags

## Deployment

### Docker (Backend)

```bash
cd backend
docker build -t shunt-backend .
docker run -p 8080:8080 --env-file .env shunt-backend
```

### Google Cloud Run

Backend configured for Cloud Run:
- Uses `cloudbuild.yaml` for CI/CD
- Secrets via Google Cloud Secret Manager
- Run `backend/scripts/setup-gcp.sh` (Unix) or `setup-gcp.ps1` (Windows)

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
- **.claude/coordination.md**: Multi-instance Claude collaboration tracking

## Notes for AI Code Assistants

1. Check if a Context exists before creating component-level state
2. Use service layer - don't make direct API calls from components
3. Maintain modular architecture - avoid cross-module dependencies
4. All AI operations must track and return token usage
5. Follow established error logging patterns
6. Respect lazy loading for heavy components
7. Frontend AI calls must go through `backendApiService.ts`
8. Use cross-platform npm scripts (cross-env, rimraf)
9. Backend endpoints must include authentication middleware and rate limiting
10. Run tests before committing: `npm run test:run` (frontend) and `cd backend && npm test` (backend)
