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

export type MissionControlTabKey = 'shunt' | 'weaver' | 'foundry' | 'ui_builder' | 'chat' | 'orchestrator' | 'image_analysis' | 'terminal' | 'oraculum' | 'documentation' | 'settings' | 'anthropic_chat' | 'developers' | 'subscription' | 'serendipity_engine' | 'chronicle' | 'deploy' | 'tool_for_ai';

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


// New types for Foundry
export type AgentName = 'Architect' | 'Refactor' | 'Security' | 'QA' | 'UX';
export type AgentStatus = 'Idle' | 'Auditing' | 'Designing' | 'Reviewing' | 'Refining' | 'Done';
export interface FoundryAgent {
    name: AgentName;
    status: AgentStatus;
    designScore?: number;
    currentTask?: string;
    auditFindings?: string;
    design?: string;
}
export type FoundryPhase = 'Idle' | 'Audit' | 'Design' | 'Review' | 'Converged';
export type LogEntryType = 'PHASE' | 'SUCCESS' | 'DECISION' | 'INFO';

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