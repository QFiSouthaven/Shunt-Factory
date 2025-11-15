// services/testDrivenAgent.service.ts
// Test-Driven Agent (TDA) Framework - Autonomous Code Generation with Self-Healing

import { generateContent } from './geminiService';
import {
  TDAWorkflowState,
  TDAPhase,
  UserStoryMetaprompt,
  RAGContextResult,
  GeneratedTest,
  GeneratedCode,
  TestExecutionResult,
  SelfHealingIteration,
  generateUniqueId,
  AcceptanceCriterion,
  CodeContext,
  RAGQuery
} from '../types/autonomous';

/**
 * ============================================================================
 * TEST-DRIVEN AGENT (TDA) - MAIN ORCHESTRATOR
 * ============================================================================
 *
 * The TDA implements a fully autonomous TDD workflow:
 * Phase 1: USER_STORY - Parse and understand the user story metaprompt
 * Phase 2: RAG_CONTEXT - Query codebase for relevant context
 * Phase 3: TEST_GENERATION - Generate failing tests from acceptance criteria
 * Phase 4: CODE_GENERATION - Generate code to make tests pass
 * Phase 5: SELF_HEALING - Iteratively fix failing tests with error-forward prompting
 */

export class TestDrivenAgentService {
  private workflowState: TDAWorkflowState | null = null;
  private maxHealingIterations = 5;

  /**
   * Executes the complete TDA workflow from a user story metaprompt
   */
  async executeWorkflow(metaprompt: UserStoryMetaprompt): Promise<TDAWorkflowState> {
    this.workflowState = {
      metaprompt,
      current_phase: TDAPhase.USER_STORY,
      final_status: 'pending',
      created_at: new Date().toISOString()
    };

    try {
      // Phase 1: Understand the user story
      await this.phaseUserStory();

      // Phase 2: Gather context via Agentic RAG
      await this.phaseRAGContext();

      // Phase 3: Generate tests
      await this.phaseTestGeneration();

      // Phase 4: Generate code
      await this.phaseCodeGeneration();

      // Phase 5: Self-healing loop
      await this.phaseSelfHealing();

      this.workflowState.final_status = 'success';
      this.workflowState.completed_at = new Date().toISOString();
    } catch (error) {
      console.error('TDA Workflow failed:', error);
      this.workflowState.final_status = 'failed';
      this.workflowState.completed_at = new Date().toISOString();
    }

    return this.workflowState;
  }

  /**
   * PHASE 1: USER_STORY
   * Parse and validate the user story metaprompt
   */
  private async phaseUserStory(): Promise<void> {
    console.log('[TDA] Phase 1: Analyzing User Story');
    this.workflowState!.current_phase = TDAPhase.USER_STORY;

    // Validate user story structure
    const { user_story } = this.workflowState!.metaprompt;
    if (!user_story.acceptance_criteria || user_story.acceptance_criteria.length === 0) {
      throw new Error('User story must have at least one acceptance criterion');
    }

    // Log analysis
    console.log(`[TDA] User Story: ${user_story.title}`);
    console.log(`[TDA] Acceptance Criteria: ${user_story.acceptance_criteria.length}`);
  }

  /**
   * PHASE 2: RAG_CONTEXT
   * Use Agentic RAG to query the codebase for relevant context
   */
  private async phaseRAGContext(): Promise<void> {
    console.log('[TDA] Phase 2: Gathering Context via Agentic RAG');
    this.workflowState!.current_phase = TDAPhase.RAG_CONTEXT;

    const { rag_context_queries } = this.workflowState!.metaprompt;
    const ragResults: RAGContextResult[] = [];

    for (const queryText of rag_context_queries) {
      const query: RAGQuery = {
        query_id: generateUniqueId(),
        query_text: queryText,
        query_type: 'code_search',
        filters: this.workflowState!.metaprompt.technical_constraints?.language
          ? {
              file_extensions: this.getFileExtensionsForLanguage(
                this.workflowState!.metaprompt.technical_constraints.language
              )
            }
          : undefined
      };

      const results = await this.executeRAGQuery(query);
      ragResults.push({
        query: queryText,
        results,
        relevance_score: this.calculateRelevanceScore(results)
      });
    }

    this.workflowState!.rag_results = ragResults;
    console.log(`[TDA] Retrieved ${ragResults.length} context results`);
  }

  /**
   * PHASE 3: TEST_GENERATION
   * Generate failing tests from acceptance criteria
   */
  private async phaseTestGeneration(): Promise<void> {
    console.log('[TDA] Phase 3: Generating Tests');
    this.workflowState!.current_phase = TDAPhase.TEST_GENERATION;

    const { user_story, technical_constraints } = this.workflowState!.metaprompt;
    const generatedTests: GeneratedTest[] = [];

    for (const criterion of user_story.acceptance_criteria) {
      const testPrompt = this.buildTestGenerationPrompt(criterion, technical_constraints);
      const testCode = await this.generateTestCode(testPrompt);

      generatedTests.push({
        id: generateUniqueId(),
        acceptance_criterion_id: criterion.id,
        test_framework: technical_constraints?.test_framework || 'jest',
        file_path: this.generateTestFilePath(user_story.title, technical_constraints),
        test_code: testCode,
        description: `Test for: ${criterion.then}`,
        status: 'generated'
      });
    }

    this.workflowState!.generated_tests = generatedTests;
    console.log(`[TDA] Generated ${generatedTests.length} tests`);
  }

  /**
   * PHASE 4: CODE_GENERATION
   * Generate minimal implementation code to make tests pass
   */
  private async phaseCodeGeneration(): Promise<void> {
    console.log('[TDA] Phase 4: Generating Code');
    this.workflowState!.current_phase = TDAPhase.CODE_GENERATION;

    const { user_story, technical_constraints } = this.workflowState!.metaprompt;
    const codePrompt = this.buildCodeGenerationPrompt(
      user_story,
      this.workflowState!.generated_tests!,
      this.workflowState!.rag_results!,
      technical_constraints
    );

    const generatedCodeContent = await this.generateImplementationCode(codePrompt);

    this.workflowState!.generated_code = [{
      id: generateUniqueId(),
      file_path: this.generateCodeFilePath(user_story.title, technical_constraints),
      content: generatedCodeContent,
      tests_satisfied: this.workflowState!.generated_tests!.map(t => t.id),
      dependencies: this.extractDependencies(generatedCodeContent)
    }];

    console.log(`[TDA] Generated implementation code`);
  }

  /**
   * PHASE 5: SELF_HEALING
   * Execute tests and iteratively fix failures using error-forward prompting
   */
  private async phaseSelfHealing(): Promise<void> {
    console.log('[TDA] Phase 5: Self-Healing Loop');
    this.workflowState!.current_phase = TDAPhase.SELF_HEALING;

    const healingIterations: SelfHealingIteration[] = [];
    let iteration = 0;

    while (iteration < this.maxHealingIterations) {
      // Execute tests
      const testResults = await this.executeTests(
        this.workflowState!.generated_tests!,
        this.workflowState!.generated_code!
      );

      this.workflowState!.test_results = testResults;

      const failingTests = testResults.filter(r => !r.passed);

      if (failingTests.length === 0) {
        console.log('[TDA] All tests passing! Self-healing complete.');
        break;
      }

      iteration++;
      console.log(`[TDA] Healing iteration ${iteration}: ${failingTests.length} failing tests`);

      // Use error-forward prompting to analyze and fix
      const errorAnalysis = await this.analyzeErrors(failingTests);
      const proposedFixes = await this.generateFixes(
        failingTests,
        errorAnalysis,
        this.workflowState!.generated_code!
      );

      const healingIteration: SelfHealingIteration = {
        iteration,
        failing_tests: failingTests,
        error_analysis: errorAnalysis,
        proposed_fix: proposedFixes,
        applied: true
      };

      // Apply fixes
      this.workflowState!.generated_code = proposedFixes;

      healingIterations.push(healingIteration);
    }

    this.workflowState!.healing_iterations = healingIterations;
    this.workflowState!.current_phase = TDAPhase.COMPLETE;

    const finalTestResults = this.workflowState!.test_results || [];
    const allPassing = finalTestResults.every(r => r.passed);

    if (!allPassing) {
      this.workflowState!.final_status = 'partial';
      console.log('[TDA] Some tests still failing after max iterations');
    }
  }

  /**
   * ============================================================================
   * HELPER METHODS - RAG & Code Analysis
   * ============================================================================
   */

  private async executeRAGQuery(query: RAGQuery): Promise<CodeContext[]> {
    // Placeholder: In production, this would use a vector DB or code search engine
    // For now, we simulate with a basic search
    const prompt = `You are a code search engine. Given this query:
"${query.query_text}"

Search for relevant code patterns, APIs, and modules that would be useful context for implementing this feature.

Return a JSON array of code contexts with this structure:
{
  "file_path": "path/to/file",
  "content": "code snippet",
  "relevance": 0.95,
  "dependencies": ["dep1", "dep2"],
  "exports": ["export1", "export2"]
}`;

    try {
      const response = await generateContent(prompt, {
        temperature: 0.3,
        response_mime_type: 'application/json'
      });

      const contexts = JSON.parse(response);
      return Array.isArray(contexts) ? contexts : [contexts];
    } catch (error) {
      console.warn('[TDA] RAG query failed, using empty context:', error);
      return [];
    }
  }

  private calculateRelevanceScore(results: CodeContext[]): number {
    if (results.length === 0) return 0;
    const avgRelevance = results.reduce((sum, r) => sum + r.relevance, 0) / results.length;
    return avgRelevance;
  }

  private getFileExtensionsForLanguage(language: string): string[] {
    const extensionMap: Record<string, string[]> = {
      typescript: ['.ts', '.tsx'],
      javascript: ['.js', '.jsx'],
      python: ['.py'],
      java: ['.java'],
      rust: ['.rs'],
      go: ['.go']
    };
    return extensionMap[language.toLowerCase()] || [];
  }

  /**
   * ============================================================================
   * HELPER METHODS - Test Generation
   * ============================================================================
   */

  private buildTestGenerationPrompt(
    criterion: AcceptanceCriterion,
    constraints?: UserStoryMetaprompt['technical_constraints']
  ): string {
    const framework = constraints?.test_framework || 'jest';
    const language = constraints?.language || 'typescript';

    return `You are an expert test engineer implementing TDD best practices.

TASK: Generate a comprehensive test for the following acceptance criterion.

ACCEPTANCE CRITERION:
- Given: ${criterion.given}
- When: ${criterion.when}
- Then: ${criterion.then}

REQUIREMENTS:
1. Language: ${language}
2. Test Framework: ${framework}
3. The test MUST fail initially (Red phase of TDD)
4. Include edge cases and error scenarios
5. Use clear, descriptive test names
6. Follow ${framework} best practices
7. Include setup/teardown if needed

OUTPUT FORMAT:
Return ONLY the complete test code, no explanations or markdown.`;
  }

  private async generateTestCode(prompt: string): Promise<string> {
    const response = await generateContent(prompt, {
      temperature: 0.4
    });
    return response.trim();
  }

  private generateTestFilePath(
    storyTitle: string,
    constraints?: UserStoryMetaprompt['technical_constraints']
  ): string {
    const ext = constraints?.language === 'python' ? '.py' : '.test.ts';
    const filename = storyTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `tests/${filename}${ext}`;
  }

  /**
   * ============================================================================
   * HELPER METHODS - Code Generation
   * ============================================================================
   */

  private buildCodeGenerationPrompt(
    user_story: UserStoryMetaprompt['user_story'],
    tests: GeneratedTest[],
    ragResults: RAGContextResult[],
    constraints?: UserStoryMetaprompt['technical_constraints']
  ): string {
    const language = constraints?.language || 'typescript';
    const contextSection = ragResults.length > 0
      ? `\n\nRELEVANT CODEBASE CONTEXT:\n${ragResults.map(r =>
          r.results.map(c => `File: ${c.file_path}\n${c.content}`).join('\n')
        ).join('\n')}`
      : '';

    return `You are an expert software engineer implementing features using TDD.

TASK: Write minimal implementation code to make ALL the following tests pass.

USER STORY: ${user_story.title}
${user_story.description}

GENERATED TESTS:
${tests.map(t => `\`\`\`${language}\n${t.test_code}\n\`\`\``).join('\n\n')}
${contextSection}

REQUIREMENTS:
1. Language: ${language}
2. Framework: ${constraints?.framework || 'N/A'}
3. Write MINIMAL code to make tests pass (Green phase of TDD)
4. Follow ${language} best practices
5. Include proper error handling
6. Add type safety (if applicable)
7. Include JSDoc/docstrings for public APIs
${constraints?.coding_standards ? `8. Follow these standards: ${constraints.coding_standards.join(', ')}` : ''}

OUTPUT FORMAT:
Return ONLY the complete implementation code, no explanations or markdown.`;
  }

  private async generateImplementationCode(prompt: string): Promise<string> {
    const response = await generateContent(prompt, {
      temperature: 0.3
    });
    return response.trim();
  }

  private generateCodeFilePath(
    storyTitle: string,
    constraints?: UserStoryMetaprompt['technical_constraints']
  ): string {
    const ext = constraints?.language === 'python' ? '.py' : '.ts';
    const filename = storyTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `src/${filename}${ext}`;
  }

  private extractDependencies(code: string): string[] {
    // Extract import/require statements
    const importRegex = /(?:import|require)\s*\(?['"]([^'"]+)['"]/g;
    const dependencies: string[] = [];
    let match;

    while ((match = importRegex.exec(code)) !== null) {
      dependencies.push(match[1]);
    }

    return [...new Set(dependencies)];
  }

  /**
   * ============================================================================
   * HELPER METHODS - Test Execution & Self-Healing
   * ============================================================================
   */

  private async executeTests(
    tests: GeneratedTest[],
    code: GeneratedCode[]
  ): Promise<TestExecutionResult[]> {
    // Placeholder: In production, this would execute tests in a sandboxed environment
    // For now, we simulate test execution using LLM evaluation
    const results: TestExecutionResult[] = [];

    for (const test of tests) {
      const result = await this.simulateTestExecution(test, code);
      results.push(result);
    }

    return results;
  }

  private async simulateTestExecution(
    test: GeneratedTest,
    code: GeneratedCode[]
  ): Promise<TestExecutionResult> {
    const prompt = `You are a test execution simulator. Analyze if this test would pass with the given implementation.

TEST CODE:
\`\`\`
${test.test_code}
\`\`\`

IMPLEMENTATION CODE:
${code.map(c => `\`\`\`\n${c.content}\n\`\`\``).join('\n')}

TASK: Determine if the test would pass or fail. If it would fail, provide the error message and stack trace.

OUTPUT FORMAT (JSON):
{
  "passed": boolean,
  "error_message": "error if failed" | null,
  "stack_trace": "stack trace if failed" | null,
  "execution_time_ms": number
}`;

    try {
      const response = await generateContent(prompt, {
        temperature: 0.2,
        response_mime_type: 'application/json'
      });

      const result = JSON.parse(response);
      return {
        test_id: test.id,
        ...result
      };
    } catch (error) {
      console.error('[TDA] Test execution simulation failed:', error);
      return {
        test_id: test.id,
        passed: false,
        error_message: 'Simulation error',
        execution_time_ms: 0
      };
    }
  }

  private async analyzeErrors(failingTests: TestExecutionResult[]): Promise<string> {
    const prompt = `You are an expert debugging AI. Analyze these failing test results and identify root causes.

FAILING TESTS:
${failingTests.map(t => `
Test ID: ${t.test_id}
Error: ${t.error_message}
Stack Trace:
${t.stack_trace || 'N/A'}
`).join('\n---\n')}

TASK: Provide a concise root cause analysis. Identify common patterns across failures.

OUTPUT: 2-3 sentences explaining the root cause.`;

    return await generateContent(prompt, { temperature: 0.3 });
  }

  private async generateFixes(
    failingTests: TestExecutionResult[],
    errorAnalysis: string,
    currentCode: GeneratedCode[]
  ): Promise<GeneratedCode[]> {
    const prompt = `You are an expert debugging AI implementing error-forward prompting for self-healing code.

CURRENT IMPLEMENTATION:
${currentCode.map(c => `File: ${c.file_path}\n\`\`\`\n${c.content}\n\`\`\``).join('\n\n')}

ERROR ANALYSIS:
${errorAnalysis}

FAILING TESTS:
${failingTests.map(t => `
Test ID: ${t.test_id}
Error: ${t.error_message}
Stack: ${t.stack_trace || 'N/A'}
`).join('\n---\n')}

TASK: Generate FIXED implementation code that resolves all errors.

REQUIREMENTS:
1. Fix the root cause identified in the analysis
2. Ensure ALL failing tests will pass
3. Do NOT break previously passing tests
4. Maintain code quality and best practices

OUTPUT FORMAT (JSON):
{
  "files": [
    {
      "file_path": "path/to/file",
      "content": "complete fixed code",
      "changes_made": "brief description of fix"
    }
  ]
}`;

    try {
      const response = await generateContent(prompt, {
        temperature: 0.4,
        response_mime_type: 'application/json'
      });

      const parsed = JSON.parse(response);
      return parsed.files.map((f: any) => ({
        id: generateUniqueId(),
        file_path: f.file_path,
        content: f.content,
        tests_satisfied: currentCode[0].tests_satisfied,
        dependencies: this.extractDependencies(f.content)
      }));
    } catch (error) {
      console.error('[TDA] Fix generation failed:', error);
      return currentCode; // Return unchanged if fix generation fails
    }
  }

  /**
   * ============================================================================
   * PUBLIC API - Workflow State Management
   * ============================================================================
   */

  getWorkflowState(): TDAWorkflowState | null {
    return this.workflowState;
  }

  resetWorkflow(): void {
    this.workflowState = null;
  }
}

/**
 * Singleton instance for global access
 */
export const tdaService = new TestDrivenAgentService();
