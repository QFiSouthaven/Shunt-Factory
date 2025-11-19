# Contributing to Shunt Factory

Thank you for your interest in contributing to Shunt Factory! This document provides guidelines and information for contributors.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style](#code-style)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Commit Messages](#commit-messages)
- [Architecture Guidelines](#architecture-guidelines)

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- Git
- (Optional) Docker for backend deployment testing

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/Shunt-Factory.git
   cd Shunt-Factory
   ```
3. Add upstream remote:
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

# Edit .env.local with your settings
# VITE_BACKEND_URL=http://localhost:8080
# VITE_API_KEY=dev-test-key

# Start development server
npm run dev
```

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your settings
# GEMINI_API_KEY=your-api-key
# CLIENT_API_KEY=your-client-key

# Start development server
npm run dev
```

### Running Full Stack

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
npm run dev
```

---

## Code Style

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Prefer interfaces over types for object shapes
- Use explicit return types for public functions

### React Components

- Use functional components with hooks
- Follow the component organization pattern:
  ```
  components/
    module_name/
      ComponentName.tsx
      ComponentName.css (if needed)
  ```
- Use lazy loading for heavy components

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ShuntPanel.tsx` |
| Functions | camelCase | `performShunt()` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Types/Interfaces | PascalCase | `ShuntAction` |
| Files | kebab-case or camelCase | `gemini-service.ts` |

### Import Order

1. React and external libraries
2. Internal modules (services, utils)
3. Components
4. Types
5. Styles

```typescript
import React, { useState, useEffect } from 'react';
import { z } from 'zod';

import { performShunt } from '@/services/geminiService';
import { logFrontendError } from '@/utils/errorLogger';

import { ControlPanel } from './ControlPanel';

import type { ShuntAction } from '@/types';

import './Shunt.css';
```

---

## Testing

### Running Tests

```bash
# Frontend unit tests
npm run test:run

# Frontend tests in watch mode
npm test

# Frontend coverage
npm run test:coverage

# Backend tests
cd backend && npm test

# E2E tests (requires app running)
npm run test:e2e
```

### Writing Tests

#### Frontend (Vitest)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

#### Backend (Jest)

```typescript
import { myFunction } from '../myService';

describe('myFunction', () => {
  it('should return expected result', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Test Coverage Requirements

- Aim for 80% code coverage
- All new features must include tests
- All bug fixes must include regression tests

---

## Pull Request Process

### Before Submitting

1. **Sync with upstream:**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all tests:**
   ```bash
   npm run test:run
   cd backend && npm test
   ```

3. **Run builds:**
   ```bash
   npm run build
   cd backend && npm run build
   ```

4. **Check for security issues:**
   ```bash
   npm audit
   cd backend && npm audit
   ```

### PR Guidelines

1. **Branch naming:**
   - `feature/description` - new features
   - `fix/description` - bug fixes
   - `docs/description` - documentation
   - `refactor/description` - code refactoring

2. **PR title:** Use conventional commit format
   - `feat: Add new shunt action`
   - `fix: Resolve API timeout issue`
   - `docs: Update API documentation`

3. **PR description:** Include:
   - Summary of changes
   - Related issue numbers
   - Testing performed
   - Screenshots (for UI changes)

4. **Review process:**
   - At least one approval required
   - All CI checks must pass
   - No unresolved comments

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, semicolons) |
| `refactor` | Code refactoring |
| `test` | Adding or fixing tests |
| `chore` | Maintenance tasks |
| `perf` | Performance improvements |

### Examples

```bash
feat(shunt): Add new summarize action

fix(backend): Resolve rate limiting bypass issue

docs(api): Add endpoint documentation for /generate

test(services): Add unit tests for geminiService

chore(deps): Update React to v19
```

---

## Architecture Guidelines

### Frontend Architecture

1. **Use Context for shared state:**
   ```typescript
   // Good - using existing context
   const { settings } = useSettings();

   // Avoid - creating new global state unnecessarily
   ```

2. **Use service layer for API calls:**
   ```typescript
   // Good
   import { performShunt } from '@/services/geminiService';

   // Avoid - direct fetch in components
   ```

3. **Handle errors consistently:**
   ```typescript
   import { logFrontendError, ErrorSeverity } from '@/utils/errorLogger';

   try {
     // operation
   } catch (error) {
     logFrontendError(error, ErrorSeverity.High, {
       context: 'operation_name',
     });
   }
   ```

### Backend Architecture

1. **Use middleware for cross-cutting concerns:**
   - Authentication: `authenticateApiKey`
   - Validation: `validateRequest`
   - Rate limiting: `aiRateLimiter`

2. **Log with context:**
   ```typescript
   logger.info('Operation completed', {
     userId: req.userId,
     latencyMs,
     totalTokens: result.tokenUsage.total_tokens,
   });
   ```

3. **Return consistent response shapes:**
   ```typescript
   res.json({
     resultText: result.text,
     tokenUsage: result.tokenUsage,
     latencyMs,
   });
   ```

### Security Guidelines

1. **Never expose API keys in frontend**
2. **Validate all user inputs**
3. **Use parameterized queries (when adding database)**
4. **Implement rate limiting for expensive operations**
5. **Log security-relevant events**

---

## Getting Help

- **Issues:** Open a GitHub issue for bugs or feature requests
- **Discussions:** Use GitHub Discussions for questions
- **Code Review:** Request review from maintainers

---

## License

By contributing, you agree that your contributions will be licensed under the project's license.

---

Thank you for contributing to Shunt Factory!
