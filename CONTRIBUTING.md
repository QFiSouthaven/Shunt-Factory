# Contributing to Shunt Factory

Thank you for your interest in contributing to Shunt Factory! This document provides guidelines and information to help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Style Guidelines](#style-guidelines)
- [Documentation](#documentation)

---

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Please be considerate and constructive in all interactions.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Git
- A code editor (VS Code recommended)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/Shunt-Factory.git
   cd Shunt-Factory
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/QFiSouthaven/Shunt-Factory.git
   ```

---

## Development Setup

### Frontend Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Configure your environment variables in .env.local
# At minimum, set:
# - VITE_BACKEND_URL=http://localhost:8080
# - VITE_API_KEY=your-dev-key

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Configure your environment variables
# At minimum, set:
# - GEMINI_API_KEY=your-gemini-key
# - CLIENT_API_KEYS=your-dev-key

# Start development server
npm run dev
```

The backend will be available at `http://localhost:8080`.

### Running Full Stack

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
npm run dev
```

---

## Project Structure

```
Shunt-Factory/
├── src/                      # Frontend source code
│   ├── components/           # React components (organized by feature)
│   │   ├── shunt/           # Shunt module components
│   │   ├── weaver/          # Weaver module components
│   │   ├── foundry/         # Foundry module components
│   │   └── mission_control/ # Main navigation hub
│   ├── context/             # React Context providers
│   ├── services/            # API services and utilities
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions
├── backend/                  # Express.js backend
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   └── utils/           # Backend utilities
│   └── __tests__/           # Backend tests
├── test/                     # Frontend unit tests
├── e2e/                      # End-to-end tests (Playwright)
├── docs/                     # Documentation
└── scripts/                  # Build and deployment scripts
```

---

## Making Changes

### Branch Naming

Create a descriptive branch name:

```bash
git checkout -b feature/add-new-shunt-action
git checkout -b fix/resolve-rate-limiting-issue
git checkout -b docs/update-api-documentation
```

### Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

**Examples:**
```
feat(shunt): add new summarize action with context support

fix(backend): resolve rate limiter memory leak

docs(api): add examples for image analysis endpoint
```

### Code Quality

Before committing:

1. **Type check:** `npm run type-check`
2. **Run tests:** `npm run test:run`
3. **Check formatting:** Ensure consistent code style

---

## Testing

### Frontend Tests (Vitest)

```bash
# Run all tests
npm run test:run

# Run tests in watch mode
npm test

# Run specific test file
npx vitest run path/to/test.ts

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui
```

### Backend Tests (Jest)

```bash
cd backend

# Run all tests
npm test

# Run specific test
npx jest path/to/test.ts
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run in headed mode
npm run test:e2e:headed
```

### Writing Tests

**Frontend Test Example:**
```typescript
// test/services/myService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { myFunction } from '@/services/myService';

describe('myFunction', () => {
  it('should return expected result', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

**Backend Test Example:**
```typescript
// backend/src/services/__tests__/myService.test.ts
import { myService } from '../myService';

describe('myService', () => {
  it('should process data correctly', async () => {
    const result = await myService.process('data');
    expect(result).toBeDefined();
  });
});
```

---

## Submitting Changes

### Pull Request Process

1. **Update your fork:**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push your branch:**
   ```bash
   git push origin feature/your-feature
   ```

3. **Create a Pull Request:**
   - Go to GitHub and create a PR
   - Fill out the PR template
   - Link any related issues

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Tests added/updated for changes
- [ ] All tests pass (`npm run test:run` and `cd backend && npm test`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Documentation updated if needed
- [ ] Commit messages follow convention
- [ ] No console.log statements in production code
- [ ] No API keys or secrets in code

### Review Process

- PRs require at least one approval
- CI must pass (tests, type check, build)
- Address all review comments
- Keep PRs focused and reasonably sized

---

## Style Guidelines

### TypeScript

- Use TypeScript strict mode
- Define types for all function parameters and returns
- Use interfaces for object shapes, types for unions
- Avoid `any` - use `unknown` and type guards instead

```typescript
// Good
interface ShuntResult {
  text: string;
  tokenUsage: TokenUsage;
}

async function performShunt(text: string, action: ShuntAction): Promise<ShuntResult> {
  // ...
}

// Avoid
async function performShunt(text: any, action: any): Promise<any> {
  // ...
}
```

### React Components

- Use functional components with hooks
- Keep components focused and small
- Extract reusable logic into custom hooks
- Use the established Context pattern for shared state

```typescript
// Good
const MyComponent: React.FC<MyComponentProps> = ({ title, onAction }) => {
  const [state, setState] = useState<string>('');

  return (
    <div>
      <h2>{title}</h2>
      <button onClick={onAction}>Action</button>
    </div>
  );
};
```

### Error Handling

Use the established error logging pattern:

```typescript
import { logFrontendError, ErrorSeverity } from '@/utils/errorLogger';

try {
  await riskyOperation();
} catch (error) {
  logFrontendError(error, ErrorSeverity.High, {
    context: 'operation_name',
    additionalInfo: 'details'
  });
}
```

### API Calls

Always use the service layer:

```typescript
// Good - use service
import { performShunt } from '@/services/geminiService';
const result = await performShunt(text, action, model);

// Avoid - direct API calls
const response = await fetch('/api/gemini/shunt', { ... });
```

---

## Documentation

### Code Comments

- Add JSDoc comments for public functions
- Explain "why" not "what" in inline comments
- Keep comments up-to-date with code changes

```typescript
/**
 * Performs a shunt action on the provided text using the Gemini API.
 *
 * @param text - The input text to process
 * @param action - The transformation action to perform
 * @param modelName - The Gemini model to use
 * @returns The processed result with token usage
 */
export async function performShunt(
  text: string,
  action: ShuntAction,
  modelName: string
): Promise<ShuntResult> {
  // ...
}
```

### Documentation Files

- Update CLAUDE.md for significant architectural changes
- Update README.md for user-facing changes
- Add API documentation for new endpoints

---

## Getting Help

- Check existing issues for similar problems
- Ask questions in discussions
- Review CLAUDE.md for architecture guidance
- Check docs/API.md for API reference

---

## Recognition

Contributors will be recognized in the project. Thank you for helping make Shunt Factory better!
