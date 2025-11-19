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

### Frontend Setup
```bash
npm install                    # Install dependencies
```

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
npx vitest run test/example.test.ts  # Run a single test file
```

### Backend Setup
```bash
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
npm test -- src/services/__tests__/geminiService.test.ts  # Run a single test file
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

The application follows a **modular, context-driven architecture** with a central navigation hub (MissionControl) that lazy-loads specialized modules on demand.

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

### Context Architecture

The app heavily relies on React Context API for state management. All contexts are defined in `/context/`:

- **SettingsContext**: User preferences (theme, colors, animations, audio)
- **TelemetryContext**: Analytics and usage tracking
- **MCPContext**: Model Context Protocol for AI tool integration
- **MailboxContext**: File-based communication between modules
- **MiaContext**: AI assistant state and conversation history
- **SubscriptionContext**: User subscription and feature access
- **UndoRedoContext**: Global undo/redo functionality
- **ActiveTabContext**: Current active module in MissionControl

**Important:** When adding new features that need global state, consider whether it should be a new context or fit within an existing one. Avoid prop drilling by using the appropriate context.

### Module System

The application is organized into specialized modules accessed through MissionControl (`/components/mission_control/`):

- **Shunt**: Text transformation engine with multiple AI-powered operations (summarize, amplify, format, etc.)
- **Weaver**: Complex multi-step workflow orchestration
- **Foundry**: Multi-agent system for code review and design
- **Framework**: Architecture visualization and simulation
- **Chat**: Direct AI chat interface
- **Image Analysis**: Image processing and analysis
- **Terminal**: In-browser terminal emulation
- **Oraculum**: Knowledge base and query system
- **Chronicle**: Session history and logging
- **Tool for AI**: Job queue and execution system
- **Deploy**: Deployment management
- **Documentation**: Project documentation management
- **Settings**: User preferences and configuration

**Module Loading:** All modules are lazy-loaded via `React.lazy()` to improve initial load time. When adding new modules:
1. Create the module in `/components/[module_name]/`
2. Add lazy import in `MissionControl.tsx`
3. Register in the `tabs` array with icon and label
4. Add the tab key to the `MissionControlTabKey` union type in `/types/index.ts`

### Service Layer

Services (`/services/`) encapsulate all external API calls and complex business logic:

- **geminiService.ts**: Google Gemini API integration
  - `performShunt()`: Execute single Shunt actions
  - `executeModularPrompt()`: Run complex multi-module prompts
  - `gradeOutput()`: Quality scoring for outputs
  - `synthesizeDocuments()`: Multi-document processing

- **prompts.ts**: Centralized prompt engineering
  - All AI prompts are defined here for consistency
  - `getPromptForAction()`: Maps ShuntAction to prompt
  - `constructModularPrompt()`: Builds complex multi-part prompts

- **toolApi.ts**: Tool execution framework for AI agents
- **miaService.ts**: Mia AI assistant logic
- **diagramService.ts**: Mermaid diagram generation and sanitization
- **telemetry.service.ts** & **telemetry.ts**: Analytics tracking
- **versionControl.service.ts**: File versioning for the Mailbox system
- **audioService.ts**: UI sound effects
- **apiUtils.ts**: Retry logic and error handling for API calls

**When modifying services:**
- Always use `withRetries()` wrapper from `apiUtils.ts` for external API calls
- Log errors using `logFrontendError()` from `/utils/errorLogger.ts`
- Return structured responses with token usage for AI operations
- API keys are accessed via `process.env.API_KEY` (defined in `vite.config.ts`)

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

All TypeScript types and interfaces are centralized in `/types/`:

- **index.ts**: Core application types (ShuntAction, MissionControlTab, etc.)
- **schemas.ts**: Zod schemas for runtime validation
- **telemetry.ts**: Telemetry event types
- **mcp.ts**: Model Context Protocol types
- **autonomous.ts**: Autonomous agent types

**Key Types:**
- `ShuntAction`: Enum of all text transformation operations
- `PromptModuleKey`: Modular prompt building blocks
- `MissionControlTabKey`: Union type of all available modules
- `TokenUsage`: AI model token consumption tracking

**Pattern:** All validated data structures should have both a Zod schema (in `schemas.ts`) and a derived TypeScript type using `z.infer<typeof schema>`.

### Security

Input sanitization is critical when dealing with user input that goes to AI models:

- **security.ts** (`/utils/`): `sanitizeInput()` function removes potentially harmful content
- **Prompt Injection Guard**: Optional feature that can be enabled per ShuntAction
- **Error Logging**: All errors are logged with severity levels (Low, Medium, High, Critical)

**When accepting user input:**
1. Sanitize with `sanitizeInput()` before sending to AI
2. Consider enabling prompt injection guard for sensitive operations
3. Never trust data from external sources without validation

### Path Aliases

The project uses `@/` as an alias for the root directory (configured in `vite.config.ts` and `tsconfig.json`):

```typescript
import { ShuntAction } from '@/types';
import { performShunt } from '@/services/geminiService';
```

Use this alias for all imports to maintain consistency and enable easier refactoring.

## Key Architectural Patterns

### 1. Provider Pattern
All global state is managed through React Context providers, nested in a specific order in `App.tsx`. Settings must be outermost, followed by Telemetry, then feature-specific contexts.

### 2. Lazy Loading
All MissionControl modules use `React.lazy()` with `Suspense` boundaries to split code and improve performance. The `LoadingFallback` component provides consistent loading states.

### 3. Error Boundaries
Critical UI sections (MissionControl, MiaAssistant) are wrapped in `ErrorBoundary` components to prevent cascading failures.

### 4. Mailbox Pattern
Inter-module communication uses a file-based "Mailbox" system (`MailboxContext`). Modules can send files to each other asynchronously, with versioning support.

### 5. Telemetry
All user interactions should be tracked via `useTelemetry()` hook:
```typescript
const { trackEvent } = useTelemetry();
trackEvent('module_name', 'action_name', { metadata });
```

### 6. Audio Feedback
UI interactions can trigger sounds via `audioService`:
```typescript
import { audioService } from '@/services/audioService';
audioService.playSound('tab_switch'); // or 'success', 'error', etc.
```

## Common Development Patterns

### Adding a New Shunt Action

1. Add the action to `ShuntAction` enum in `/types/index.ts`
2. Add the prompt logic in `/services/prompts.ts` → `getPromptForAction()`
3. Update UI in `/components/shunt/ControlPanel.tsx` to include new button
4. Test with various inputs

### Creating a New Module

1. Create directory: `/components/[module_name]/`
2. Create main component: `[ModuleName].tsx`
3. Add lazy import in `MissionControl.tsx`
4. Add tab definition to `tabs` array
5. Update `MissionControlTabKey` type in `/types/index.ts`
6. Import and register icon from `/components/icons.tsx`

### Working with AI APIs

**Gemini API:**
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

**Thinking Budget:** Complex actions (MAKE_ACTIONABLE, BUILD_A_SKILL) automatically use extended thinking when `gemini-*-pro` models are used.

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
  // handle gracefully
}
```

## Project-Specific Guidelines

### Prompt Engineering
All prompts are centralized in `/services/prompts.ts`. When modifying:
- Follow the XML-based structure for Gemini's "Build" agent compatibility (see `/security.md`)
- Use structured output schemas where possible
- Include few-shot examples for complex tasks
- Test prompts across multiple model versions (Flash vs Pro)

### Component Organization
Components should be organized by feature/module, not by type:
```
✅ Good: /components/shunt/InputPanel.tsx
❌ Avoid: /components/panels/ShuntInput.tsx
```

### State Management Priority
1. Local component state (`useState`) for UI-only state
2. Context for feature-level state (e.g., MiaContext for Mia features)
3. Avoid global state for temporary or derived data

### Performance Considerations
- Use `useCallback` and `useMemo` for expensive operations in frequently re-rendering components
- Lazy load heavy dependencies (e.g., PDF.js, JSZip) only when needed
- Monitor token usage and display to user (all AI operations return `TokenUsage`)

## Environment Variables

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
