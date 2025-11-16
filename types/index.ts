// types.ts
import React, { ReactNode } from 'react';
import { z } from 'zod';
import { 
    tokenUsageSchema, 
    implementationTaskSchema, 
    geminiDevelopmentPlanResponseSchema
} from './schemas';

export interface Tool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: {
      [key: string]: {
        type: string;
        description: string;
      };
    };
    required: string[];
  };
  cache_control?: { type: 'ephemeral' };
}


export enum ShuntAction {
  SUMMARIZE = 'Summarize',
  AMPLIFY = 'Amplify',
  AMPLIFY_X2 = 'Amplify x2',
  MAKE_ACTIONABLE = 'Make Actionable',
  BUILD_A_SKILL = 'Build a Skill',
  EXPLAIN_LIKE_IM_FIVE = 'Explain Like I\'m 5',
  EXPLAIN_LIKE_A_SENIOR = 'Explain Like a Senior',
  EXTRACT_KEYWORDS = 'Extract Keywords',
  EXTRACT_ENTITIES = 'Extract Entities',
  ENHANCE_WITH_KEYWORDS = 'Enhance with Keywords',
  CHANGE_TONE_FORMAL = 'Make More Formal',
  CHANGE_TONE_CASUAL = 'Make More Casual',
  PROOFREAD = 'Proofread & Fix',
  TRANSLATE_SPANISH = 'Translate to Spanish',
  FORMAT_JSON = 'Format as JSON',
  PARSE_JSON = 'Parse JSON to Text',
  INTERPRET_SVG = 'Interpret SVG',
  GENERATE_VAM_PRESET = 'Generate VAM Preset',
  MY_COMMAND = 'Analyze & Clarify',
  GENERATE_ORACLE_QUERY = 'Generate Oracle Query',
  REFINE_PROMPT = 'Refine Prompt',
  CALL_TOOL = 'Call System Tool',
}

export enum PromptModuleKey {
  CORE = 'CORE',
  COMPLEX_PROBLEM = 'COMPLEX_PROBLEM',
  AGENTIC = 'AGENTIC',
  CONSTRAINT = 'CONSTRAINT',
  META = 'META',
}

// Replaced interfaces with types inferred from Zod schemas for a single source of truth.
export type TokenUsage = z.infer<typeof tokenUsageSchema>;
export type ImplementationTask = z.infer<typeof implementationTaskSchema>;
export type GeminiResponse = z.infer<typeof geminiDevelopmentPlanResponseSchema> & {
  tokenUsage?: TokenUsage;
};

export interface HistoryEntry {
    id: string;
    prompt: string;
    output: string;
    score: number;
}

export type MissionControlTabKey = 'shunt' | 'weaver' | 'foundry' | 'ui_builder' | 'chat' | 'orchestrator' | 'image_analysis' | 'terminal' | 'oraculum' | 'documentation' | 'settings' | 'anthropic_chat' | 'developers' | 'subscription' | 'serendipity_engine' | 'chronicle' | 'deploy' | 'tool_for_ai' | 'framework';

export interface MissionControlTab {
    key: MissionControlTabKey;
    label: string;
    icon: ReactNode;
    component: React.FC;
}

export interface Documentation {
  geminiContext: string;
  progressLog: string;
  decisions: string;
  issuesAndFixes: string;
  featureTimeline: string;
}

export interface MailboxFile {
    id: string;
    path: string;
    content: string;
    timestamp: string;
    isRead: boolean;
    versionId: string;
}

// --- From features/mia/miaTypes.ts ---

export interface MiaMessage {
  id: string;
  sender: 'user' | 'mia' | 'system-error' | 'system-progress';
  text: string;
  timestamp: string;
  isHtml?: boolean; // For richer content
  action?: {
    type: 'suggest_refresh' | 'clear_cache' | 'link_to_docs' | 'run_automated_fix';
    payload?: any;
    label?: string;
  };
  diagnosableError?: MiaAlert;
  fixProposal?: GeminiResponse;
}

export interface MiaAlert {
  id: string;
  type: 'system_health' | 'predictive_bug' | 'onboarding_tip' | 'error_diagnosis' | string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  context?: Record<string, any>; // The full error log or telemetry event
  actions?: { label: string; actionType: string; payload?: any }[];
}


// TRUST ARCHITECTURE: Foundry Agent Types (CrewAI-Inspired Hierarchical Model)
//
// These types align with the CrewAI architectural pattern for Level 4 multi-agent systems.
// Strategic Importance:
// - Enables auditable, hierarchical agentic workflows (not "agent-washed" chatbots)
// - Supports RBAC tooling for "principle of least privilege"
// - Required for Foundry's "manager agent" self-review capability
//
export type AgentName = 'Architect' | 'Refactor' | 'Security' | 'QA' | 'UX' | 'DevOps' | 'Backend' | 'CodeAuditor' | 'CodeDeveloper' | 'Planner' | 'Manager';
export type AgentStatus = 'Idle' | 'Auditing' | 'Designing' | 'Reviewing' | 'Refining' | 'Executing' | 'Validating' | 'Done';

// Tool names for RBAC enforcement
export type ToolName = 'read_file' | 'write_file' | 'git.commit_changes' | 'execute_code' | 'search_codebase';

export interface FoundryAgent {
    // Original fields (backward compatibility)
    name: AgentName;
    status: AgentStatus;
    designScore?: number;
    currentTask?: string;
    auditFindings?: string;
    design?: string;

    // NEW: CrewAI-inspired fields for Level 4 agency
    /**
     * The agent's role - defines its persona and purpose
     * Example: "Senior Security Auditor", "Frontend Architect", "Code Reviewer"
     */
    role: string;

    /**
     * The agent's goal - what it's trying to achieve
     * Example: "Review the authentication module for security vulnerabilities"
     */
    goal: string;

    /**
     * The agent's backstory - provides context and expertise
     * Example: "You are a security expert with 10 years of experience in penetration testing..."
     */
    backstory: string;

    /**
     * Tools this agent is allowed to use (RBAC enforcement)
     * Example: ["read_file"] for CodeAuditor, ["read_file", "write_file", "git.commit_changes"] for CodeDeveloper
     */
    allowedTools: ToolName[];

    /**
     * Whether this agent is a "manager agent" (for hierarchical process)
     * Manager agents review outputs from subordinate agents
     */
    isManager?: boolean;
}

export type FoundryPhase = 'Idle' | 'Audit' | 'Design' | 'Review' | 'Execution' | 'Validation' | 'Converged';
export type FoundryProcessType = 'Sequential' | 'Hierarchical'; // Maps to CrewAI process types
export type LogEntryType = 'PHASE' | 'SUCCESS' | 'DECISION' | 'INFO' | 'RBAC_VIOLATION' | 'VALIDATION';

export interface LogEntry {
    id: string;
    timestamp: string;
    type: LogEntryType;
    message: string;
}

// --- New types for Tool for AI V3 ---
export interface JobLog {
    timestamp: string;
    message: string;
}

export type JobStatus = 'Pending' | 'Running' | 'Completed' | 'Failed' | 'Cancelled';

export interface Job {
    id: string;
    prompt: string;
    status: JobStatus;
    logs: JobLog[];
    result: string | null;
    startTime: number;
    endTime: number | null;
}

// --- New types for Evolve Workflow ---
export interface EvolveStep {
  id: string;
  action: ShuntAction;
}

export interface EvolveResult {
  stepId: string;
  action: ShuntAction;
  output: string;
  status: 'success' | 'error';
  error?: string;
}