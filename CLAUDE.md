# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Shunt Final V** is a professional-grade, memory-efficient frontend interface for advanced AI-driven text transformation, system orchestration, and agentic development. The application integrates with Google's Gemini API and Anthropic's Claude API to provide a comprehensive suite of AI-powered tools.

**Tech Stack:**
- React 19 with TypeScript
- Vite (build tool)
- Google Generative AI SDK (`@google/genai`)
- Anthropic Claude SDK (`@anthropic-ai/sdk`)
- ReactFlow (for visual workflow diagrams)
- Zod (for schema validation)

## Development Commands

### Setup
```bash
npm install                    # Install dependencies
```

**Environment Configuration:**
Create a `.env.local` file in the project root with:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

### Development
```bash
npm run dev                    # Start dev server on port 3000 (http://localhost:3000)
npm run build                  # Build for production (outputs to /dist)
npm run preview                # Preview production build
```

**Note:** There is currently no test framework configured. When adding tests, they should be placed alongside their source files with `.test.ts` or `.test.tsx` extensions.

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

The app expects environment variables in `.env.local`:

- `GEMINI_API_KEY`: Required for all Gemini API operations
- Future: May add `ANTHROPIC_API_KEY` when Claude integration is fully active

Environment variables are exposed to the client via `vite.config.ts`:
```typescript
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}
```

## Additional Resources

- **security.md**: Deep dive into Google AI Studio Build agent architecture and prompt engineering best practices
- **Session Workflow.drawio.svg**: Visual diagram of the session workflow (can be opened in draw.io)
- **AI Studio App**: https://ai.studio/apps/drive/1K-CWFE6D4bkUBMpv4yLR3WF6_nJIpTCl

## Notes for AI Code Assistants

When working on this codebase:
1. Always check if a Context already exists before creating component-level state
2. Use the existing service layer rather than making direct API calls from components
3. Maintain the modular architecture - avoid cross-module dependencies
4. All AI operations should track and return token usage
5. Follow the established error logging patterns
6. Respect the lazy loading strategy for new heavy components
7. When adding new AI features, consider whether they fit in existing modules or need a new one
