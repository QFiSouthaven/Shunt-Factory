---
name: test-driven-agent
description: Use this skill when you need to autonomously generate production-ready code with comprehensive tests using Test-Driven Development. Automatically generates failing tests from acceptance criteria, writes minimal implementation code, executes tests, and self-heals errors through iterative debugging. Best for: feature implementation, API development, algorithm implementation, bug fixes that need test coverage.
---

# Test-Driven Agent (TDA) Skill

## Purpose

This skill enables autonomous code generation following strict Test-Driven Development (TDD) principles. It transforms user stories with acceptance criteria into production-ready, fully-tested code through a 5-phase workflow with self-healing capabilities.

## When to Use This Skill

- **Feature Implementation**: User requests a new feature with specific requirements
- **API Development**: Building endpoints with defined contracts and error handling
- **Algorithm Implementation**: Solving coding problems with test coverage
- **Bug Fixes**: Fixing bugs while ensuring regression tests prevent recurrence
- **Refactoring**: Rewriting code while maintaining test coverage

**Do NOT use for**: Simple documentation, UI/UX design, or tasks without testable requirements.

## How It Works

### The 5-Phase TDA Workflow

```
User Story → RAG Context → Test Generation → Code Generation → Self-Healing
```

1. **Phase 1: User Story Analysis**
   - Parse acceptance criteria in Given-When-Then format
   - Validate requirements completeness
   - Identify test scenarios

2. **Phase 2: RAG Context Gathering**
   - Query existing codebase for patterns
   - Retrieve relevant APIs and libraries
   - Understand architectural constraints

3. **Phase 3: Test Generation (RED)**
   - Generate failing tests from each acceptance criterion
   - Create edge case tests
   - Follow test framework best practices

4. **Phase 4: Code Generation (GREEN)**
   - Write minimal code to make tests pass
   - Implement proper error handling
   - Follow language-specific best practices

5. **Phase 5: Self-Healing (REFACTOR)**
   - Execute all tests
   - If failures detected, use error-forward prompting
   - Iteratively debug and fix (max 5 iterations)
   - Learn from each failure

## Usage Instructions

### Step 1: Prepare the User Story Metaprompt

Create a structured user story in JSON format:

```typescript
{
  "system_role": "test_driven_agent",
  "timestamp": "2024-01-15T10:00:00Z",
  "id": "unique-id",
  "task_id": "feature-name",
  "source_trigger": "manual",
  "user_story": {
    "title": "Short feature title",
    "description": "Detailed feature description",
    "acceptance_criteria": [
      {
        "id": "ac-1",
        "given": "Initial state or context",
        "when": "Action or trigger",
        "then": "Expected outcome",
        "priority": 1
      }
    ],
    "priority": "high"
  },
  "rag_context_queries": [
    "Existing authentication patterns",
    "Database schema for users"
  ],
  "technical_constraints": {
    "language": "typescript",
    "framework": "express",
    "test_framework": "jest",
    "coding_standards": ["airbnb", "async-await"]
  }
}
```

### Step 2: Import and Initialize TDA Service

```typescript
import { tdaService } from '../services/testDrivenAgent.service';
import { UserStoryMetaprompt } from '../types/autonomous';

// Your metaprompt from Step 1
const userStory: UserStoryMetaprompt = { /* ... */ };
```

### Step 3: Execute the Workflow

```typescript
const result = await tdaService.executeWorkflow(userStory);

// Result contains:
// - generated_tests: All test files created
// - generated_code: Implementation files
// - test_results: Pass/fail status of each test
// - healing_iterations: Debug attempts made
// - final_status: 'success' | 'partial' | 'failed'
```

### Step 4: Review and Deploy

```typescript
if (result.final_status === 'success') {
  console.log('✅ All tests passing!');
  console.log('Generated files:', result.generated_code);
  // Deploy or commit the code
} else {
  console.log('⚠️ Some tests failed after max iterations');
  console.log('Healing attempts:', result.healing_iterations);
  // Review failures and adjust acceptance criteria
}
```

## Examples

### Example 1: User Authentication API

```typescript
const authStory: UserStoryMetaprompt = {
  system_role: 'test_driven_agent',
  timestamp: new Date().toISOString(),
  id: generateUniqueId(),
  task_id: 'user-auth',
  source_trigger: 'manual',
  user_story: {
    title: 'Implement JWT-based user authentication',
    description: 'Users can login with email/password and receive JWT token',
    acceptance_criteria: [
      {
        id: generateUniqueId(),
        given: 'Valid user credentials (email: test@example.com, password: secret123)',
        when: 'POST /api/auth/login is called',
        then: 'Return 200 with valid JWT token containing user data',
        priority: 1
      },
      {
        id: generateUniqueId(),
        given: 'Invalid credentials',
        when: 'POST /api/auth/login is called',
        then: 'Return 401 Unauthorized with error message',
        priority: 2
      }
    ],
    priority: 'high'
  },
  rag_context_queries: [
    'JWT library usage in the codebase',
    'User model structure',
    'Existing auth middleware patterns'
  ],
  technical_constraints: {
    language: 'typescript',
    framework: 'express',
    test_framework: 'jest',
    coding_standards: ['airbnb']
  }
};

const result = await tdaService.executeWorkflow(authStory);
```

### Example 2: Data Validation Function

```typescript
const validationStory: UserStoryMetaprompt = {
  system_role: 'test_driven_agent',
  task_id: 'email-validator',
  user_story: {
    title: 'Email validation function',
    description: 'Validate email addresses according to RFC 5322',
    acceptance_criteria: [
      {
        id: 'ac-1',
        given: 'A valid email string "user@example.com"',
        when: 'validateEmail(email) is called',
        then: 'Return true',
        priority: 1
      },
      {
        id: 'ac-2',
        given: 'Invalid email formats (no @, no domain, etc)',
        when: 'validateEmail(email) is called',
        then: 'Return false',
        priority: 2
      }
    ],
    priority: 'medium'
  },
  rag_context_queries: ['Email validation patterns in utils'],
  technical_constraints: {
    language: 'typescript',
    test_framework: 'jest'
  }
};
```

## Advanced Features

### Self-Healing Error Recovery

The TDA automatically detects and fixes errors:

```typescript
// If test execution fails:
// 1. Error context is extracted (message, stack trace, code)
// 2. Error-forward prompting analyzes root cause
// 3. Proposed fixes are generated with confidence scores
// 4. Best fix is applied automatically
// 5. Tests re-run
// 6. Process repeats up to 5 times
```

### RAG-Enhanced Context

The TDA queries your existing codebase to:
- Find similar implementations
- Discover relevant APIs and patterns
- Understand architectural conventions
- Reuse existing utilities

### Workflow State Inspection

```typescript
const state = tdaService.getWorkflowState();

console.log('Current Phase:', state.current_phase);
console.log('RAG Results:', state.rag_results);
console.log('Generated Tests:', state.generated_tests);
console.log('Healing Iterations:', state.healing_iterations);
```

## Best Practices

1. **Write Clear Acceptance Criteria**
   - Use Given-When-Then format consistently
   - One scenario per acceptance criterion
   - Include both happy path and error cases

2. **Provide Good RAG Queries**
   - Reference existing code patterns
   - Specify relevant files or modules
   - Include API documentation queries

3. **Set Appropriate Constraints**
   - Specify language and framework
   - Define coding standards
   - Choose correct test framework

4. **Review Generated Code**
   - Even with 'success' status, review the implementation
   - Check for security vulnerabilities
   - Ensure it matches architectural patterns

5. **Iterate on Failures**
   - If status is 'partial' or 'failed', review healing iterations
   - Adjust acceptance criteria if too ambiguous
   - Add more specific technical constraints

## Troubleshooting

**Issue:** Tests generated but code doesn't compile
- **Solution:** Check technical_constraints match your project setup
- **Solution:** Ensure rag_context_queries point to valid existing code

**Issue:** Self-healing fails after max iterations
- **Solution:** Acceptance criteria may be too complex; split into smaller stories
- **Solution:** Add more specific error handling requirements

**Issue:** Generated code doesn't follow project conventions
- **Solution:** Add coding_standards to technical_constraints
- **Solution:** Improve rag_context_queries to reference style guide

## Integration with Other Skills

- **Combine with Cognitive UI Optimizer**: TDA generates backend, CAI generates frontend
- **Combine with Self-Optimizing Product**: TDA is one component of the full SOP loop
- **Combine with Error Debugger**: Manual debugging of complex failures

## Technical Details

**Service Location:** `services/testDrivenAgent.service.ts`
**Type Definitions:** `types/autonomous.ts` (TDAWorkflowState, TDAPhase)
**Dependencies:** Requires `geminiService` for LLM integration

## Output Format

The TDA returns a `TDAWorkflowState` object:

```typescript
{
  metaprompt: UserStoryMetaprompt,           // Your input
  current_phase: TDAPhase,                    // Final phase reached
  rag_results: RAGContextResult[],            // Context retrieved
  generated_tests: GeneratedTest[],           // All test files
  generated_code: GeneratedCode[],            // Implementation files
  test_results: TestExecutionResult[],        // Test pass/fail status
  healing_iterations: SelfHealingIteration[], // Debug attempts
  final_status: 'success' | 'partial' | 'failed',
  created_at: string,
  completed_at: string
}
```

## License & Attribution

Part of the Agentic Self-Optimizing Systems architecture.
Based on TGEN Framework and Test-Driven Development principles.
