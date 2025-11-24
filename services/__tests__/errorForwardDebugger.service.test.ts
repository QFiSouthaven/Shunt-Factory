import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorForwardDebuggerService, errorDebugger } from '../errorForwardDebugger.service';
import * as geminiService from '../geminiService';
import { ErrorContext, generateUniqueId } from '../../types/autonomous';

// Mock geminiService
vi.mock('../geminiService', () => ({
  generateContent: vi.fn()
}));

/**
 * Tests for ErrorForwardDebuggerService
 *
 * Tests cover:
 * - Error debugging with reflection
 * - Self-validation
 * - Error context extraction
 * - Iterative debugging
 */

describe('ErrorForwardDebuggerService', () => {
  let service: ErrorForwardDebuggerService;
  const mockGenerateContent = vi.mocked(geminiService.generateContent);

  // Helper to create valid error context
  const createErrorContext = (overrides?: Partial<ErrorContext>): ErrorContext => ({
    error_message: 'TypeError: Cannot read property "x" of undefined',
    stack_trace: `TypeError: Cannot read property "x" of undefined
    at Object.<anonymous> (src/utils/helper.ts:25:15)
    at Module._compile (node:internal/modules/cjs/loader:1159:14)`,
    error_type: 'runtime',
    file_path: 'src/utils/helper.ts',
    line_number: 25,
    surrounding_code: `const obj = undefined;
const value = obj.x; // Error here`,
    related_files: ['src/types/index.ts'],
    ...overrides
  });

  beforeEach(() => {
    service = new ErrorForwardDebuggerService();
    vi.clearAllMocks();

    // Default mock responses
    mockGenerateContent.mockImplementation(async (prompt: string) => {
      if (prompt.includes('expert debugging AI')) {
        return JSON.stringify({
          analysis: 'The error occurs because obj is undefined before accessing property x',
          root_cause_hypothesis: 'Variable obj is not initialized before use',
          proposed_fixes: [
            {
              fix_id: 'fix-1',
              description: 'Add null check before accessing property',
              confidence: 0.9,
              code_changes: [
                {
                  id: generateUniqueId(),
                  file_path: 'src/utils/helper.ts',
                  content: 'const value = obj?.x ?? defaultValue;',
                  tests_satisfied: [],
                  dependencies: []
                }
              ]
            }
          ],
          learning: 'Always check for null/undefined before accessing properties'
        });
      }
      if (prompt.includes('code execution simulator')) {
        return JSON.stringify({
          outcome: 'resolved',
          reasoning: 'The fix properly handles the undefined case'
        });
      }
      if (prompt.includes('code validation AI')) {
        return JSON.stringify({
          valid: true,
          issues: []
        });
      }
      return '{}';
    });
  });

  afterEach(() => {
    service.clearHistory();
  });

  describe('Singleton Instance', () => {
    it('should export a singleton instance', () => {
      // Assert
      expect(errorDebugger).toBeDefined();
      expect(errorDebugger).toBeInstanceOf(ErrorForwardDebuggerService);
    });
  });

  describe('debug', () => {
    it('should debug error and return reflection result', async () => {
      // Arrange
      const errorContext = createErrorContext();

      // Act
      const result = await service.debug(errorContext);

      // Assert
      expect(result).toBeDefined();
      expect(result.analysis).toBeDefined();
      expect(result.root_cause_hypothesis).toBeDefined();
      expect(result.proposed_fixes).toBeDefined();
      expect(result.learning).toBeDefined();
    });

    it('should return proposed fixes with confidence scores', async () => {
      // Arrange
      const errorContext = createErrorContext();

      // Act
      const result = await service.debug(errorContext);

      // Assert
      expect(result.proposed_fixes.length).toBeGreaterThan(0);
      expect(result.proposed_fixes[0].confidence).toBeGreaterThanOrEqual(0);
      expect(result.proposed_fixes[0].confidence).toBeLessThanOrEqual(1);
    });

    it('should return code changes for each fix', async () => {
      // Arrange
      const errorContext = createErrorContext();

      // Act
      const result = await service.debug(errorContext);

      // Assert
      expect(result.proposed_fixes[0].code_changes).toBeDefined();
      expect(result.proposed_fixes[0].code_changes.length).toBeGreaterThan(0);
      expect(result.proposed_fixes[0].code_changes[0].file_path).toBeDefined();
      expect(result.proposed_fixes[0].code_changes[0].content).toBeDefined();
    });

    it('should accept custom max attempts', async () => {
      // Arrange
      const errorContext = createErrorContext();

      // Act
      const result = await service.debug(errorContext, 3);

      // Assert
      expect(result).toBeDefined();
    });

    it('should store debug history', async () => {
      // Arrange
      const errorContext = createErrorContext();

      // Act
      await service.debug(errorContext);
      const history = service.getDebugHistory();

      // Assert
      expect(history.size).toBe(1);
    });

    it('should stop early on high-confidence fix', async () => {
      // Arrange
      const errorContext = createErrorContext();
      let callCount = 0;

      mockGenerateContent.mockImplementation(async () => {
        callCount++;
        return JSON.stringify({
          analysis: 'Analysis',
          root_cause_hypothesis: 'Root cause',
          proposed_fixes: [
            {
              fix_id: 'fix-1',
              description: 'High confidence fix',
              confidence: 0.95, // High confidence
              code_changes: [{
                id: generateUniqueId(),
                file_path: 'file.ts',
                content: 'fixed',
                tests_satisfied: [],
                dependencies: []
              }]
            }
          ],
          learning: 'Learned'
        });
      });

      // Act
      await service.debug(errorContext);

      // Assert - should only call once due to high confidence
      expect(callCount).toBe(1);
    });

    it('should perform multiple iterations for low-confidence fixes', async () => {
      // Arrange
      const errorContext = createErrorContext();
      let callCount = 0;

      mockGenerateContent.mockImplementation(async (prompt: string) => {
        if (prompt.includes('expert debugging AI')) {
          callCount++;
          // Return low confidence until last attempt
          const confidence = callCount >= 3 ? 0.9 : 0.5;
          return JSON.stringify({
            analysis: `Analysis ${callCount}`,
            root_cause_hypothesis: 'Root cause',
            proposed_fixes: [{
              fix_id: `fix-${callCount}`,
              description: 'Fix',
              confidence,
              code_changes: [{
                id: generateUniqueId(),
                file_path: 'file.ts',
                content: 'fixed',
                tests_satisfied: [],
                dependencies: []
              }]
            }],
            learning: 'Learned'
          });
        }
        if (prompt.includes('code execution simulator')) {
          return JSON.stringify({
            outcome: callCount >= 3 ? 'resolved' : 'persisted',
            reasoning: 'Test'
          });
        }
        return '{}';
      });

      // Act
      await service.debug(errorContext, 3);

      // Assert - should iterate
      expect(callCount).toBeGreaterThan(1);
    });

    it('should handle all error types', async () => {
      // Arrange
      const errorTypes: ErrorContext['error_type'][] = [
        'syntax',
        'runtime',
        'logical',
        'test_failure',
        'type_error'
      ];

      // Act & Assert
      for (const errorType of errorTypes) {
        const errorContext = createErrorContext({ error_type: errorType });
        const result = await service.debug(errorContext);
        expect(result).toBeDefined();
      }
    });
  });

  describe('selfValidate', () => {
    it('should validate code against expected behavior', async () => {
      // Arrange
      const code = `function add(a: number, b: number): number {
  return a + b;
}`;
      const expectedBehavior = 'Add two numbers and return the sum';

      // Act
      const result = await service.selfValidate(code, expectedBehavior);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.valid).toBe('boolean');
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should accept test cases for validation', async () => {
      // Arrange
      const code = 'const sum = (a, b) => a + b;';
      const expectedBehavior = 'Sum two numbers';
      const testCases = [
        'sum(1, 2) should return 3',
        'sum(-1, 1) should return 0'
      ];

      // Act
      const result = await service.selfValidate(code, expectedBehavior, testCases);

      // Assert
      expect(result).toBeDefined();
    });

    it('should return issues for invalid code', async () => {
      // Arrange
      mockGenerateContent.mockResolvedValueOnce(JSON.stringify({
        valid: false,
        issues: ['Missing return statement', 'Type mismatch']
      }));

      const code = 'function broken() { }';
      const expectedBehavior = 'Return a value';

      // Act
      const result = await service.selfValidate(code, expectedBehavior);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should handle validation failures gracefully', async () => {
      // Arrange
      mockGenerateContent.mockRejectedValueOnce(new Error('API Error'));

      const code = 'test code';
      const expectedBehavior = 'test behavior';

      // Act
      const result = await service.selfValidate(code, expectedBehavior);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Validation system error');
    });
  });

  describe('extractErrorContext (static)', () => {
    it('should extract error context from Error object', () => {
      // Arrange
      const error = new Error('Test error');
      error.stack = `Error: Test error
    at testFunction (src/test.ts:10:5)`;

      // Act
      const context = ErrorForwardDebuggerService.extractErrorContext(
        error,
        'src/test.ts'
      );

      // Assert
      expect(context.error_message).toBe('Test error');
      expect(context.stack_trace).toContain('testFunction');
      expect(context.file_path).toBe('src/test.ts');
    });

    it('should extract line number from stack trace', () => {
      // Arrange
      const error = new Error('Test error');
      error.stack = `Error: Test error
    at testFunction (src/test.ts:25:10)`;

      // Act
      const context = ErrorForwardDebuggerService.extractErrorContext(
        error,
        'src/test.ts'
      );

      // Assert
      expect(context.line_number).toBe(25);
    });

    it('should include surrounding code when provided', () => {
      // Arrange
      const error = new Error('Test');
      const surroundingCode = 'const x = 1;\nconst y = x.undefined;';

      // Act
      const context = ErrorForwardDebuggerService.extractErrorContext(
        error,
        'file.ts',
        surroundingCode
      );

      // Assert
      expect(context.surrounding_code).toBe(surroundingCode);
    });

    it('should include related files when provided', () => {
      // Arrange
      const error = new Error('Test');
      const relatedFiles = ['types.ts', 'utils.ts'];

      // Act
      const context = ErrorForwardDebuggerService.extractErrorContext(
        error,
        'file.ts',
        undefined,
        relatedFiles
      );

      // Assert
      expect(context.related_files).toEqual(relatedFiles);
    });

    it('should classify syntax errors', () => {
      // Arrange
      const error = new SyntaxError('Unexpected token');

      // Act
      const context = ErrorForwardDebuggerService.extractErrorContext(
        error,
        'file.ts'
      );

      // Assert
      expect(context.error_type).toBe('syntax');
    });

    it('should classify type errors', () => {
      // Arrange
      const error = new TypeError('undefined is not a function');

      // Act
      const context = ErrorForwardDebuggerService.extractErrorContext(
        error,
        'file.ts'
      );

      // Assert
      expect(context.error_type).toBe('type_error');
    });

    it('should classify test failures', () => {
      // Arrange
      const error = new Error('Expected true but received false');

      // Act
      const context = ErrorForwardDebuggerService.extractErrorContext(
        error,
        'file.test.ts'
      );

      // Assert
      expect(context.error_type).toBe('test_failure');
    });

    it('should default to runtime for unclassified errors', () => {
      // Arrange
      const error = new Error('Unknown error');

      // Act
      const context = ErrorForwardDebuggerService.extractErrorContext(
        error,
        'file.ts'
      );

      // Assert
      expect(context.error_type).toBe('runtime');
    });

    it('should handle missing stack trace', () => {
      // Arrange
      const error = new Error('No stack');
      error.stack = undefined;

      // Act
      const context = ErrorForwardDebuggerService.extractErrorContext(
        error,
        'file.ts'
      );

      // Assert
      expect(context.stack_trace).toBe('');
      expect(context.line_number).toBeUndefined();
    });
  });

  describe('getDebugHistory', () => {
    it('should return empty map initially', () => {
      // Act
      const history = service.getDebugHistory();

      // Assert
      expect(history.size).toBe(0);
    });

    it('should contain debug prompts after debugging', async () => {
      // Arrange
      const errorContext = createErrorContext();
      await service.debug(errorContext);

      // Act
      const history = service.getDebugHistory();

      // Assert
      expect(history.size).toBe(1);
      const firstEntry = Array.from(history.values())[0];
      expect(firstEntry.error_context).toEqual(errorContext);
    });
  });

  describe('clearHistory', () => {
    it('should clear all debug history', async () => {
      // Arrange
      await service.debug(createErrorContext());
      await service.debug(createErrorContext({ error_message: 'Another error' }));
      expect(service.getDebugHistory().size).toBe(2);

      // Act
      service.clearHistory();

      // Assert
      expect(service.getDebugHistory().size).toBe(0);
    });
  });

  describe('Iterative Debugging', () => {
    it('should include previous attempts in subsequent iterations', async () => {
      // Arrange
      const errorContext = createErrorContext();
      const prompts: string[] = [];

      mockGenerateContent.mockImplementation(async (prompt: string) => {
        prompts.push(prompt);

        if (prompt.includes('expert debugging AI')) {
          return JSON.stringify({
            analysis: 'Analysis',
            root_cause_hypothesis: 'Root cause',
            proposed_fixes: [{
              fix_id: 'fix',
              description: 'Fix',
              confidence: 0.5, // Low confidence to trigger iteration
              code_changes: [{
                id: generateUniqueId(),
                file_path: 'file.ts',
                content: 'code',
                tests_satisfied: [],
                dependencies: []
              }]
            }],
            learning: 'Learning'
          });
        }
        if (prompt.includes('code execution simulator')) {
          return JSON.stringify({
            outcome: 'persisted',
            reasoning: 'Still failing'
          });
        }
        return '{}';
      });

      // Act
      await service.debug(errorContext, 2);

      // Assert - later prompts should reference previous attempts
      const debugPrompts = prompts.filter(p => p.includes('expert debugging AI'));
      expect(debugPrompts.length).toBe(2);
    });

    it('should update instruction based on outcome', async () => {
      // Arrange
      const errorContext = createErrorContext();
      const prompts: string[] = [];

      mockGenerateContent.mockImplementation(async (prompt: string) => {
        prompts.push(prompt);

        if (prompt.includes('expert debugging AI')) {
          return JSON.stringify({
            analysis: 'Analysis',
            root_cause_hypothesis: 'Root cause',
            proposed_fixes: [{
              fix_id: 'fix',
              description: 'Fix',
              confidence: 0.6,
              code_changes: [{
                id: generateUniqueId(),
                file_path: 'file.ts',
                content: 'code',
                tests_satisfied: [],
                dependencies: []
              }]
            }],
            learning: 'Learning'
          });
        }
        if (prompt.includes('code execution simulator')) {
          return JSON.stringify({
            outcome: 'new_error',
            reasoning: 'Caused a new error'
          });
        }
        return '{}';
      });

      // Act
      await service.debug(errorContext, 2);

      // Assert - should have iterations
      expect(prompts.length).toBeGreaterThan(2);
    });
  });
});
