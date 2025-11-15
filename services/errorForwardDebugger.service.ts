// services/errorForwardDebugger.service.ts
// Error-Forward Debugging System - Self-Validation and Recovery

import { generateContent } from './geminiService';
import {
  ErrorContext,
  ErrorForwardPrompt,
  ReflectionResult,
  GeneratedCode,
  generateUniqueId
} from '../types/autonomous';

/**
 * ============================================================================
 * ERROR-FORWARD DEBUGGING SERVICE
 * ============================================================================
 *
 * Implements "Error-Forward Prompting" - treating errors as data and using them
 * to guide autonomous debugging and self-healing. This extends the TDD loop with:
 *
 * 1. Agentic Self-Validation: Regular verification of progress
 * 2. Error Context Collection: Automatic gathering of error messages, stack traces, code
 * 3. Reflective Analysis: Learning from actions to improve debugging strategies
 * 4. Iterative Healing: Multiple attempts with reflection between iterations
 */

export class ErrorForwardDebuggerService {
  private maxAttempts = 5;
  private debugHistory: Map<string, ErrorForwardPrompt> = new Map();

  /**
   * Main entry point: Debug an error using error-forward prompting
   */
  async debug(errorContext: ErrorContext, maxAttempts?: number): Promise<ReflectionResult> {
    if (maxAttempts) {
      this.maxAttempts = maxAttempts;
    }

    console.log(`[ErrorDebugger] Starting error-forward debugging for: ${errorContext.error_message}`);

    const errorPrompt: ErrorForwardPrompt = {
      system_role: 'error_debugger',
      error_context: errorContext,
      previous_attempts: [],
      instruction: this.buildInitialInstruction(errorContext)
    };

    // Store in history
    const errorId = generateUniqueId();
    this.debugHistory.set(errorId, errorPrompt);

    // Perform iterative debugging with reflection
    const result = await this.iterativeDebugWithReflection(errorPrompt);

    console.log(`[ErrorDebugger] Debugging complete. Root cause: ${result.root_cause_hypothesis}`);
    return result;
  }

  /**
   * Iterative debugging loop with reflection between attempts
   */
  private async iterativeDebugWithReflection(
    errorPrompt: ErrorForwardPrompt
  ): Promise<ReflectionResult> {
    let currentPrompt = errorPrompt;
    let attempt = 0;

    while (attempt < this.maxAttempts) {
      attempt++;
      console.log(`[ErrorDebugger] Attempt ${attempt}/${this.maxAttempts}`);

      // Analyze the error
      const reflection = await this.analyzeAndReflect(currentPrompt);

      // If we have a high-confidence fix, return it
      const bestFix = reflection.proposed_fixes.sort((a, b) => b.confidence - a.confidence)[0];
      if (bestFix && bestFix.confidence > 0.8) {
        console.log(`[ErrorDebugger] High-confidence fix found (confidence: ${bestFix.confidence})`);
        return reflection;
      }

      // If not the last attempt, prepare for next iteration
      if (attempt < this.maxAttempts) {
        // In a real system, we would apply the fix and check if the error persists
        // For now, we simulate this with LLM evaluation
        const outcome = await this.evaluateFixOutcome(
          currentPrompt.error_context,
          bestFix.code_changes
        );

        currentPrompt = {
          ...currentPrompt,
          previous_attempts: [
            ...(currentPrompt.previous_attempts || []),
            {
              attempt_number: attempt,
              fix_applied: bestFix.description,
              outcome
            }
          ],
          instruction: this.buildIterativeInstruction(currentPrompt, outcome, reflection)
        };

        if (outcome === 'resolved') {
          console.log(`[ErrorDebugger] Error resolved at attempt ${attempt}`);
          return reflection;
        }
      } else {
        // Last attempt - return best effort
        return reflection;
      }
    }

    // Should never reach here, but return last reflection if we do
    return await this.analyzeAndReflect(currentPrompt);
  }

  /**
   * Analyze error and generate reflective insights and proposed fixes
   */
  private async analyzeAndReflect(errorPrompt: ErrorForwardPrompt): Promise<ReflectionResult> {
    const prompt = this.buildReflectionPrompt(errorPrompt);

    const responseJson = await generateContent(prompt, {
      temperature: 0.4,
      response_mime_type: 'application/json'
    });

    const reflection: ReflectionResult = JSON.parse(responseJson);
    return reflection;
  }

  /**
   * Build the reflection prompt using error-forward methodology
   */
  private buildReflectionPrompt(errorPrompt: ErrorForwardPrompt): string {
    const { error_context, previous_attempts } = errorPrompt;

    const previousAttemptsSection = previous_attempts && previous_attempts.length > 0
      ? `
PREVIOUS DEBUG ATTEMPTS:
${previous_attempts.map(a => `
Attempt ${a.attempt_number}:
- Fix Applied: ${a.fix_applied}
- Outcome: ${a.outcome}
`).join('\n')}

IMPORTANT: Learn from previous failed attempts. Do NOT repeat the same approach.
`
      : '';

    return `You are an expert debugging AI implementing "Error-Forward Prompting" and "Reflective Learning".

Your task is to analyze this error, hypothesize the root cause, propose fixes, and LEARN from the debugging process.

ERROR CONTEXT:
- Type: ${error_context.error_type}
- Message: ${error_context.error_message}
- File: ${error_context.file_path}${error_context.line_number ? ` (line ${error_context.line_number})` : ''}

STACK TRACE:
${error_context.stack_trace}

${error_context.surrounding_code ? `
CODE CONTEXT:
\`\`\`
${error_context.surrounding_code}
\`\`\`
` : ''}

${error_context.related_files && error_context.related_files.length > 0 ? `
RELATED FILES: ${error_context.related_files.join(', ')}
` : ''}
${previousAttemptsSection}

DEBUGGING METHODOLOGY:

1. FIRST-PRINCIPLES ANALYSIS:
   - Deconstruct the error to its root cause
   - Question all assumptions
   - Identify what MUST be true for this error to occur

2. ERROR-FORWARD REASONING:
   - Treat the error message as data, not just a problem
   - What is the error telling us about the system state?
   - What invariants were violated?

3. REFLECTIVE LEARNING:
   - If previous attempts failed, WHY did they fail?
   - What did we learn about the system from each failure?
   - What new hypothesis emerges from accumulated knowledge?

4. MULTI-HYPOTHESIS GENERATION:
   - Generate 2-3 distinct hypotheses for the root cause
   - For each, propose a fix and estimate confidence
   - Rank by likelihood based on error evidence

OUTPUT FORMAT (JSON):
{
  "analysis": "Detailed analysis of the error using first-principles thinking",
  "root_cause_hypothesis": "Most likely root cause based on evidence",
  "proposed_fixes": [
    {
      "fix_id": "fix-1",
      "description": "Clear description of the fix",
      "confidence": 0.85,
      "code_changes": [
        {
          "id": "unique-id",
          "file_path": "path/to/file",
          "content": "complete corrected code",
          "tests_satisfied": [],
          "dependencies": []
        }
      ]
    }
  ],
  "learning": "What we learned from this debugging session that can improve future debugging"
}

Generate your reflective debugging analysis now.`;
  }

  /**
   * Evaluate if a proposed fix would resolve the error
   */
  private async evaluateFixOutcome(
    errorContext: ErrorContext,
    codeChanges: GeneratedCode[]
  ): Promise<'resolved' | 'persisted' | 'new_error'> {
    const prompt = `You are a code execution simulator. Evaluate if this fix would resolve the error.

ORIGINAL ERROR:
- Type: ${errorContext.error_type}
- Message: ${errorContext.error_message}
- File: ${errorContext.file_path}

STACK TRACE:
${errorContext.stack_trace}

PROPOSED FIX:
${codeChanges.map(c => `
File: ${c.file_path}
\`\`\`
${c.content}
\`\`\`
`).join('\n')}

TASK: Determine if applying this fix would:
1. RESOLVE the error completely
2. PERSIST - error would still occur
3. NEW_ERROR - fix would cause a different error

OUTPUT FORMAT (JSON):
{
  "outcome": "resolved" | "persisted" | "new_error",
  "reasoning": "Brief explanation of why"
}`;

    try {
      const responseJson = await generateContent(prompt, {
        temperature: 0.2,
        response_mime_type: 'application/json'
      });
      const result = JSON.parse(responseJson);
      return result.outcome;
    } catch (error) {
      console.warn('[ErrorDebugger] Fix evaluation failed:', error);
      return 'persisted'; // Conservative default
    }
  }

  /**
   * Build initial debugging instruction
   */
  private buildInitialInstruction(errorContext: ErrorContext): string {
    return `Analyze this ${errorContext.error_type} error and propose fixes using error-forward prompting. This is the first attempt.`;
  }

  /**
   * Build instruction for subsequent iterations
   */
  private buildIterativeInstruction(
    currentPrompt: ErrorForwardPrompt,
    lastOutcome: 'resolved' | 'persisted' | 'new_error',
    lastReflection: ReflectionResult
  ): string {
    if (lastOutcome === 'persisted') {
      return `The previous fix did not resolve the error. The error persists. Reflect on why the previous approach failed and try a fundamentally different approach. Root cause from last attempt: ${lastReflection.root_cause_hypothesis}`;
    } else if (lastOutcome === 'new_error') {
      return `The previous fix caused a NEW error. This means we're affecting the system but in the wrong way. Adjust your hypothesis and try a more conservative fix.`;
    }
    return `Continue debugging with a new approach.`;
  }

  /**
   * ============================================================================
   * SELF-VALIDATION UTILITIES
   * ============================================================================
   */

  /**
   * Validate code correctness using self-assessment
   */
  async selfValidate(
    code: string,
    expectedBehavior: string,
    testCases?: string[]
  ): Promise<{ valid: boolean; issues: string[] }> {
    const prompt = `You are a code validation AI. Assess if this code correctly implements the expected behavior.

CODE TO VALIDATE:
\`\`\`
${code}
\`\`\`

EXPECTED BEHAVIOR:
${expectedBehavior}

${testCases && testCases.length > 0 ? `
TEST CASES:
${testCases.map((tc, i) => `${i + 1}. ${tc}`).join('\n')}
` : ''}

VALIDATION CRITERIA:
1. Does the code implement the expected behavior correctly?
2. Are there any logical errors?
3. Are edge cases handled?
4. Is error handling adequate?
5. Are there potential runtime errors?

OUTPUT FORMAT (JSON):
{
  "valid": boolean,
  "issues": ["issue 1", "issue 2", ...]
}`;

    try {
      const responseJson = await generateContent(prompt, {
        temperature: 0.2,
        response_mime_type: 'application/json'
      });
      return JSON.parse(responseJson);
    } catch (error) {
      console.error('[ErrorDebugger] Self-validation failed:', error);
      return { valid: false, issues: ['Validation system error'] };
    }
  }

  /**
   * Extract error context from a caught exception
   */
  static extractErrorContext(
    error: Error,
    filePath: string,
    surroundingCode?: string,
    relatedFiles?: string[]
  ): ErrorContext {
    const errorType = this.classifyErrorType(error);

    return {
      error_message: error.message,
      stack_trace: error.stack || '',
      error_type: errorType,
      file_path: filePath,
      line_number: this.extractLineNumber(error.stack),
      surrounding_code: surroundingCode,
      related_files: relatedFiles
    };
  }

  /**
   * Classify error type based on error characteristics
   */
  private static classifyErrorType(error: Error): ErrorContext['error_type'] {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (name.includes('syntax') || message.includes('unexpected token')) {
      return 'syntax';
    } else if (name.includes('type') || message.includes('is not a function') || message.includes('undefined')) {
      return 'type_error';
    } else if (message.includes('assertion') || message.includes('expected')) {
      return 'test_failure';
    } else if (message.includes('logic') || message.includes('incorrect')) {
      return 'logical';
    } else {
      return 'runtime';
    }
  }

  /**
   * Extract line number from stack trace
   */
  private static extractLineNumber(stackTrace?: string): number | undefined {
    if (!stackTrace) return undefined;

    const lineMatch = stackTrace.match(/:(\d+):\d+/);
    return lineMatch ? parseInt(lineMatch[1], 10) : undefined;
  }

  /**
   * ============================================================================
   * PUBLIC API
   * ============================================================================
   */

  getDebugHistory(): Map<string, ErrorForwardPrompt> {
    return this.debugHistory;
  }

  clearHistory(): void {
    this.debugHistory.clear();
  }
}

/**
 * Singleton instance for global access
 */
export const errorDebugger = new ErrorForwardDebuggerService();
