/**
 * Multi-Agent Container Service
 * Connects frontend Shunt buttons to the Dockerized multi-agent system
 * Replaces the simulated multi-agent orchestrator with real containerized agents
 */

import { ShuntAction, TokenUsage } from '../types';
import { logFrontendError, ErrorSeverity } from '../utils/errorLogger';

// Orchestrator endpoint (Docker container or local dev)
const ORCHESTRATOR_URL = import.meta.env.VITE_ORCHESTRATOR_URL || 'http://localhost:8090';

export interface MultiAgentWorkflowResult {
  workflowId: string;
  finalOutput: string;
  agreement: boolean;
  validationPassed: boolean;
  steps: number;
}

export interface WorkflowStep {
  id: string;
  stepNumber: number;
  agent: 'claude' | 'gemini-2-0' | 'gemini-2-5';
  stage: string;
  input: string;
  output: string;
  tokensUsed: number;
  createdAt: string;
}

export interface WorkflowDetails {
  workflow: {
    id: string;
    action: string;
    status: string;
    inputText: string;
    context: string | null;
    finalOutput: string | null;
    agreement: boolean | null;
    validationPassed: boolean | null;
    createdAt: string;
    updatedAt: string;
  };
  steps: WorkflowStep[];
}

/**
 * Execute multi-agent workflow based on Shunt action
 * This sends the task to Docker containers where Claude Code, Gemini 2.0, and Gemini 2.5 Pro
 * collaborate on the task
 */
export async function executeMultiAgentWorkflow(
  text: string,
  action: ShuntAction,
  context?: string
): Promise<MultiAgentWorkflowResult> {
  try {
    console.log(`[MultiAgent Container] Executing workflow for action: ${action}`);

    const response = await fetch(`${ORCHESTRATOR_URL}/api/workflow/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        text,
        context,
      }),
    });

    if (!response.ok) {
      throw new Error(`Orchestrator returned ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Workflow execution failed');
    }

    console.log(`[MultiAgent Container] Workflow ${result.workflowId} completed successfully`);

    return {
      workflowId: result.workflowId,
      finalOutput: result.finalOutput,
      agreement: result.agreement,
      validationPassed: result.validationPassed,
      steps: result.steps,
    };

  } catch (error) {
    logFrontendError(error, ErrorSeverity.High, {
      context: 'executeMultiAgentWorkflow',
      action,
    });
    throw error;
  }
}

/**
 * Get workflow details and all steps
 * Useful for debugging or showing the user the workflow progress
 */
export async function getWorkflowDetails(workflowId: string): Promise<WorkflowDetails> {
  try {
    const response = await fetch(`${ORCHESTRATOR_URL}/api/workflow/${workflowId}`);

    if (!response.ok) {
      throw new Error(`Failed to get workflow: ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    logFrontendError(error, ErrorSeverity.Medium, {
      context: 'getWorkflowDetails',
      workflowId,
    });
    throw error;
  }
}

/**
 * Check if the multi-agent orchestrator is healthy and ready
 */
export async function checkOrchestratorHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${ORCHESTRATOR_URL}/health`);
    const data = await response.json();
    return data.status === 'healthy' && data.database === 'connected';
  } catch (error) {
    console.warn('[MultiAgent Container] Orchestrator health check failed:', error);
    return false;
  }
}

/**
 * Map Shunt actions to appropriate workflow complexity
 */
function getWorkflowComplexity(action: ShuntAction): 'simple' | 'complex' {
  const complexActions = [
    ShuntAction.MAKE_ACTIONABLE,
    ShuntAction.BUILD_A_SKILL,
    ShuntAction.COMPREHENSIVE_ANALYSIS,
  ];

  return complexActions.includes(action) ? 'complex' : 'simple';
}

/**
 * Wrapper function that maintains TokenUsage interface for backwards compatibility
 */
export async function performMultiAgentShunt(
  text: string,
  action: ShuntAction,
  modelName: string, // Ignored - agents use their own models
  context?: string,
  priority?: string
): Promise<{ resultText: string; tokenUsage: TokenUsage }> {
  try {
    // Check if orchestrator is available
    const isHealthy = await checkOrchestratorHealth();

    if (!isHealthy) {
      throw new Error('Multi-agent orchestrator is not available. Please start the Docker containers.');
    }

    const result = await executeMultiAgentWorkflow(text, action, context);

    // Get detailed steps to calculate total token usage
    const details = await getWorkflowDetails(result.workflowId);

    const totalTokens = details.steps.reduce((sum, step) => sum + (step.tokensUsed || 0), 0);

    return {
      resultText: result.finalOutput,
      tokenUsage: {
        prompt_tokens: Math.floor(totalTokens * 0.4), // Approximate
        completion_tokens: Math.floor(totalTokens * 0.6),
        total_tokens: totalTokens,
        model: 'multi-agent (Claude + Gemini 2.0 + Gemini 2.5 Pro)',
      },
    };

  } catch (error) {
    logFrontendError(error, ErrorSeverity.Critical, {
      context: 'performMultiAgentShunt',
      action,
    });
    throw error;
  }
}

/**
 * Export for use in components
 */
export const multiAgentContainerService = {
  executeWorkflow: executeMultiAgentWorkflow,
  getWorkflowDetails,
  checkHealth: checkOrchestratorHealth,
  performShunt: performMultiAgentShunt,
};
