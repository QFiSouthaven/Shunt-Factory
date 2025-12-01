// services/multiAgentOrchestrator.service.ts
// MULTI-AGENT WORKFLOW: Orchestrates Gemini 2.0, Gemini 2.5 Pro, and Claude Code validation
// Based on test workflow.png architecture
//
// ⚠️ SECURITY WARNING - DEPRECATED FOR REFACTORING ⚠️
// This service makes direct API calls from the frontend using GoogleGenAI SDK.
// This pattern exposes API keys in the client bundle and is flagged as a critical security issue.
//
// STATUS: Temporarily disabled pending backend refactoring
// REQUIRED: Migrate all 12 workflow stages to backend proxy endpoints
// SEE: SECURITY_AUDIT.md for details
//
// DO NOT RE-ENABLE until backend proxy implementation is complete.

import { GoogleGenAI } from "@google/genai";
import { ShuntAction, TokenUsage } from '../types';
import { logFrontendError, ErrorSeverity } from "../utils/errorLogger";
import { withRetries } from './apiUtils';

/**
 * Workflow stages matching the test workflow diagram
 */
export enum WorkflowStage {
  TASK = 'task',
  FINISHED_TASK = 'finished_task',
  CRITIQUE = 'critique',
  CHAIN_OF_THOUGHT = 'chain_of_thought',
  RESEARCH = 'research',
  REFLECT = 'reflect',
  CONCLUDE = 'conclude',
  COLLABORATIVE_REFINEMENT = 'collaborative_refinement',
  VALIDATION = 'validation',
  AGREEMENT = 'agreement',
  PEER_REVIEW = 'peer_review',
  VALIDATED_CONCLUSION = 'validated_conclusion'
}

export interface WorkflowStep {
  stage: WorkflowStage;
  input: string;
  output: string;
  model: string;
  timestamp: string;
  tokenUsage?: TokenUsage;
}

export interface MultiAgentResult {
  finalOutput: string;
  workflowSteps: WorkflowStep[];
  totalTokenUsage: TokenUsage;
  agreement: boolean;
  validationPassed: boolean;
}

/**
 * MultiAgentOrchestrator
 *
 * Implements the test workflow.png architecture:
 * 1. Gemini 2.0 delegates tasks
 * 2. Gemini 2.5 Pro processes through validation pipeline
 * 3. Claude Code peer reviews for validation
 * 4. Agreement checkpoint before final output
 */
export class MultiAgentOrchestrator {
  private ai: GoogleGenAI;
  private workflowSteps: WorkflowStep[] = [];
  private rootInstruction: ShuntAction | string;

  constructor(rootInstruction: ShuntAction | string) {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.rootInstruction = rootInstruction;
  }

  /**
   * Execute the full multi-agent workflow
   */
  async execute(userInput: string, context?: string): Promise<MultiAgentResult> {
    console.log(`[MultiAgent] Starting workflow with root instruction: ${this.rootInstruction}`);

    try {
      // Stage 1: Task delegation (Gemini 2.0)
      const task = await this.delegateTask(userInput, context);

      // Stage 2: Process task (Gemini 2.5 Pro validation pipeline)
      const processedTask = await this.processTask(task);

      // Stage 3: Critique
      const critique = await this.critiqueOutput(processedTask);

      // Stage 4: Chain of Thought
      const chainOfThought = await this.chainOfThought(critique);

      // Stage 5: Research
      const research = await this.research(chainOfThought);

      // Stage 6: Reflect
      const reflection = await this.reflect(research);

      // Stage 7: Conclude
      const conclusion = await this.conclude(reflection);

      // Stage 8: Collaborative Refinement (Gemini 2.5 Pro)
      const refinedOutput = await this.collaborativeRefinement(conclusion);

      // Stage 9: Peer Review (Claude Code validation)
      const peerReviewResult = await this.peerReview(refinedOutput);

      // Stage 10: Validation checkpoint
      const validationPassed = await this.validateOutput(peerReviewResult.output);

      // Stage 11: Agreement checkpoint
      const agreement = await this.checkAgreement(peerReviewResult.output, conclusion);

      // Stage 12: Final validated conclusion
      const finalOutput = agreement && validationPassed
        ? peerReviewResult.output
        : await this.reconcile(peerReviewResult.output, conclusion);

      // Calculate total token usage
      const totalTokenUsage = this.calculateTotalTokenUsage();

      return {
        finalOutput,
        workflowSteps: this.workflowSteps,
        totalTokenUsage,
        agreement,
        validationPassed
      };

    } catch (error) {
      logFrontendError(error, ErrorSeverity.High, {
        context: 'MultiAgentOrchestrator.execute',
        rootInstruction: this.rootInstruction
      });
      throw error;
    }
  }

  /**
   * Stage 1: Task delegation (Gemini 2.0)
   * Orchestrator determines how to process the input
   */
  private async delegateTask(userInput: string, context?: string): Promise<string> {
    const prompt = `You are Gemini 2.0, the orchestrator AI. Your role is to analyze the user input and delegate it as a task.

Root Instruction: ${this.rootInstruction}
Context: ${context || 'None'}

User Input:
${userInput}

Task: Create a clear, actionable task description that aligns with the root instruction. Be specific and concrete.`;

    const result = await this.callModel('gemini-2.0-flash-exp', prompt, WorkflowStage.TASK);
    return result;
  }

  /**
   * Stage 2: Process the delegated task (Gemini 2.5 Pro)
   */
  private async processTask(task: string): Promise<string> {
    const prompt = `You are processing a delegated task. Follow the root instruction: ${this.rootInstruction}

Task:
${task}

Execute this task thoroughly and provide a detailed result.`;

    const result = await this.callModel('gemini-2.5-pro', prompt, WorkflowStage.FINISHED_TASK);
    return result;
  }

  /**
   * Stage 3: Critique the output
   */
  private async critiqueOutput(output: string): Promise<string> {
    const prompt = `You are a critical reviewer. Analyze this output and provide constructive critique.

Root Instruction: ${this.rootInstruction}

Output to Critique:
${output}

Provide specific feedback on:
1. Alignment with root instruction
2. Quality and completeness
3. Areas for improvement
4. Strengths`;

    const result = await this.callModel('gemini-2.5-pro', prompt, WorkflowStage.CRITIQUE);
    return result;
  }

  /**
   * Stage 4: Chain of Thought reasoning
   */
  private async chainOfThought(critique: string): Promise<string> {
    const prompt = `Using chain-of-thought reasoning, think through the critique step by step.

Critique:
${critique}

Break down your thinking:
1. What are the key issues?
2. What are potential solutions?
3. What's the best path forward?
4. Why is this approach optimal?`;

    const result = await this.callModel('gemini-2.5-pro', prompt, WorkflowStage.CHAIN_OF_THOUGHT, {
      thinkingConfig: { thinkingBudget: 16384 }
    });
    return result;
  }

  /**
   * Stage 5: Research additional context
   */
  private async research(chainOfThought: string): Promise<string> {
    const prompt = `Based on the chain of thought, research and gather relevant information.

Chain of Thought:
${chainOfThought}

Research:
- Key concepts
- Best practices
- Relevant patterns
- Supporting evidence`;

    const result = await this.callModel('gemini-2.5-pro', prompt, WorkflowStage.RESEARCH);
    return result;
  }

  /**
   * Stage 6: Reflect on findings
   */
  private async reflect(research: string): Promise<string> {
    const prompt = `Reflect deeply on the research findings.

Research:
${research}

Reflection:
1. What patterns emerge?
2. What insights are gained?
3. How does this align with the root instruction?
4. What adjustments are needed?`;

    const result = await this.callModel('gemini-2.5-pro', prompt, WorkflowStage.REFLECT);
    return result;
  }

  /**
   * Stage 7: Draw conclusions
   */
  private async conclude(reflection: string): Promise<string> {
    const prompt = `Based on all the analysis, draw a final conclusion.

Root Instruction: ${this.rootInstruction}

Reflection:
${reflection}

Provide a comprehensive conclusion that addresses the root instruction.`;

    const result = await this.callModel('gemini-2.5-pro', prompt, WorkflowStage.CONCLUDE);
    return result;
  }

  /**
   * Stage 8: Collaborative Refinement (Gemini 2.5 Pro hub)
   */
  private async collaborativeRefinement(conclusion: string): Promise<string> {
    const prompt = `You are the collaborative refinement hub. Multiple perspectives have been integrated.

Root Instruction: ${this.rootInstruction}

Conclusion:
${conclusion}

Refine this into the highest quality output, ensuring:
1. Complete alignment with root instruction
2. Clarity and coherence
3. Actionability
4. Professional quality`;

    const result = await this.callModel('gemini-2.5-pro', prompt, WorkflowStage.COLLABORATIVE_REFINEMENT, {
      thinkingConfig: { thinkingBudget: 32768 }
    });
    return result;
  }

  /**
   * Stage 9: Peer Review (simulated Claude Code validation)
   */
  private async peerReview(output: string): Promise<{ output: string; passed: boolean }> {
    const prompt = `You are performing peer review as if you were Claude Code.

Root Instruction: ${this.rootInstruction}

Output to Review:
${output}

Perform a thorough peer review:
1. Does it meet the root instruction?
2. Is it technically sound?
3. Are there any errors or issues?
4. What improvements can be made?

Provide your reviewed version or approve as-is.`;

    const result = await this.callModel('gemini-2.5-pro', prompt, WorkflowStage.PEER_REVIEW);

    // Check if significant changes were made
    const passed = this.calculateSimilarity(output, result) > 0.8;

    return { output: result, passed };
  }

  /**
   * Stage 10: Validation checkpoint
   */
  private async validateOutput(output: string): Promise<boolean> {
    const prompt = `Validate this output against the root instruction.

Root Instruction: ${this.rootInstruction}

Output:
${output}

Respond with ONLY "PASS" or "FAIL" followed by a brief reason.`;

    const result = await this.callModel('gemini-2.5-flash', prompt, WorkflowStage.VALIDATION);
    return result.toLowerCase().includes('pass');
  }

  /**
   * Stage 11: Agreement checkpoint
   */
  private async checkAgreement(output1: string, output2: string): Promise<boolean> {
    const similarity = this.calculateSimilarity(output1, output2);
    return similarity > 0.7; // 70% similarity threshold
  }

  /**
   * Reconcile disagreements
   */
  private async reconcile(output1: string, output2: string): Promise<string> {
    const prompt = `Two versions of output exist. Reconcile them into a single best version.

Root Instruction: ${this.rootInstruction}

Version 1:
${output1}

Version 2:
${output2}

Create the optimal synthesis of both versions.`;

    const result = await this.callModel('gemini-2.5-pro', prompt, WorkflowStage.VALIDATED_CONCLUSION);
    return result;
  }

  /**
   * Helper: Call a model and track the workflow step
   */
  private async callModel(
    model: string,
    prompt: string,
    stage: WorkflowStage,
    config?: any
  ): Promise<string> {
    const apiCall = async () => {
      const response = await this.ai.models.generateContent({
        model,
        contents: prompt,
        config
      });

      const output = response.text;
      const tokenUsage: TokenUsage = {
        prompt_tokens: response.usageMetadata?.promptTokenCount ?? 0,
        completion_tokens: response.usageMetadata?.candidatesTokenCount ?? 0,
        total_tokens: response.usageMetadata?.totalTokenCount ?? 0,
        model
      };

      // Track workflow step
      this.workflowSteps.push({
        stage,
        input: prompt.substring(0, 200) + '...',
        output: output.substring(0, 200) + '...',
        model,
        timestamp: new Date().toISOString(),
        tokenUsage
      });

      return output;
    };

    return await withRetries(apiCall);
  }

  /**
   * Calculate total token usage across all steps
   */
  private calculateTotalTokenUsage(): TokenUsage {
    return this.workflowSteps.reduce((total, step) => {
      if (step.tokenUsage) {
        total.prompt_tokens += step.tokenUsage.prompt_tokens;
        total.completion_tokens += step.tokenUsage.completion_tokens;
        total.total_tokens += step.tokenUsage.total_tokens;
      }
      return total;
    }, {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      model: 'multi-agent-workflow'
    });
  }

  /**
   * Calculate similarity between two strings (simple implementation)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const maxLen = Math.max(len1, len2);

    if (maxLen === 0) return 1.0;

    // Simple character-based similarity
    let matches = 0;
    const minLen = Math.min(len1, len2);

    for (let i = 0; i < minLen; i++) {
      if (str1[i] === str2[i]) matches++;
    }

    return matches / maxLen;
  }

  /**
   * Get all workflow steps for visualization
   */
  getWorkflowSteps(): WorkflowStep[] {
    return this.workflowSteps;
  }
}
