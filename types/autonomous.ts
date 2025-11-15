// types/autonomous.ts
import { v4 as uuidv4 } from 'uuid';

/**
 * Represents a user interaction event to be sent to the telemetry system.
 * This is the raw input for the temporally-aware cognitive architecture.
 */
export type UserTelemetryEvent = {
  id: string; // Unique event ID
  timestamp: string; // ISO 8601 format
  eventType: string; // e.g., 'click', 'hover', 'scroll', 'inputChange', 'pageView'
  elementId?: string; // ID of the interacted element
  elementName?: string; // Name/label of the element
  elementType?: string; // e.g., 'button', 'input', 'link', 'div'
  pagePath: string; // Current URL path
  userId?: string; // User identifier
  sessionId: string; // Current session identifier
  duration?: number; // Duration of an interaction (e.g., hover time, focus time)
  value?: string | number | boolean; // Value associated with input fields or selections
  coords?: { x: number; y: number }; // Coordinates of click/hover
  // Additional context for temporal awareness
  sequenceNumber: number; // Order of event within session
  previousEventId?: string; // Link to the preceding event
  context?: Record<string, any>; // Arbitrary context data (e.g., current form state, visible items)
};

/**
 * Represents a directive from the autonomous backend.
 * These drive the dynamic adaptation of the UI.
 */
export type AutonomousDirective = {
  id: string; // Unique directive ID
  type:
    | 'SUGGESTION' // Proactive help, next step suggestion
    | 'UI_RECONFIGURATION' // Change layout, add/remove components, modify props
    | 'PRE_FETCH' // Pre-load data or modules
    | 'CONTEXT_UPDATE' // Update client-side state/context for future interactions
    | 'ALERT' // Display an urgent alert
    | 'OPTIMIZATION'; // Generic optimization (e.g., offer a shortcut)
  targetElementId?: string; // The ID of the UI element this directive applies to
  payload: Record<string, any>; // Arbitrary data for the directive (e.g., new content, component props, URL for pre-fetch)
  priority?: number; // Lower number means higher priority
  ttl?: number; // Time-to-live for the directive in milliseconds
  creationTimestamp: string; // ISO 8601 timestamp for when the directive was created
  originEventId?: string; // The telemetry event that triggered this directive
};

/**
 * Client-side inferred intent or state based on basic heuristics.
 * This is for the lightweight client-side proactive engine.
 */
export type ClientInferredState = {
  intent: 'UNKNOWN' | 'NAVIGATE' | 'SEARCH' | 'COMPLETE_FORM' | 'TROUBLESHOOT';
  confidence: number; // 0-1
  context?: Record<string, any>;
};

/**
 * Type for the autonomous governance model's response.
 */
export type GovernanceResponse = {
  directives: AutonomousDirective[];
  clientInferenceUpdate?: ClientInferredState; // Optionally update client-side inference model
};

/**
 * Defines the structure for a client-side behavioral rule.
 * Part of the 'algorithmic governance model' on the frontend for immediate responses.
 */
export type ClientBehavioralRule = {
  id: string;
  trigger: (event: UserTelemetryEvent, history: UserTelemetryEvent[]) => boolean;
  // FIX: Changed event parameter type from 'any' to 'UserTelemetryEvent' for type safety.
  action: (event: UserTelemetryEvent) => AutonomousDirective | null;
  priority: number;
};

// --- Utils ---

/**
 * Generates a unique ID (UUID v4 style) using the 'uuid' library.
 */
export const generateUniqueId = (): string => {
  return uuidv4();
};

/**
 * ============================================================================
 * AGENTIC SELF-OPTIMIZING SYSTEMS - EXTENDED TYPES
 * Implements TDA, CAI, and SOP architectures from the strategic plan
 * ============================================================================
 */

/**
 * ============================================================================
 * TEST-DRIVEN AGENT (TDA) FRAMEWORK TYPES
 * ============================================================================
 */

export enum TDAPhase {
  USER_STORY = 'user_story',
  RAG_CONTEXT = 'rag_context',
  TEST_GENERATION = 'test_generation',
  CODE_GENERATION = 'code_generation',
  SELF_HEALING = 'self_healing',
  COMPLETE = 'complete'
}

export interface BaseMetaprompt {
  system_role: string;
  timestamp: string;
  id: string;
}

export interface UserStoryMetaprompt extends BaseMetaprompt {
  system_role: 'test_driven_agent';
  task_id: string;
  source_trigger: 'manual' | 'feedback_agent' | 'scheduled';
  user_story: {
    title: string;
    description: string;
    acceptance_criteria: AcceptanceCriterion[];
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
  rag_context_queries: string[];
  technical_constraints?: {
    language?: string;
    framework?: string;
    test_framework?: string;
    coding_standards?: string[];
  };
}

export interface AcceptanceCriterion {
  id: string;
  given: string;
  when: string;
  then: string;
  priority: number;
}

export interface RAGContextResult {
  query: string;
  results: CodeContext[];
  relevance_score: number;
}

export interface CodeContext {
  file_path: string;
  content: string;
  relevance: number;
  dependencies: string[];
  exports: string[];
}

export interface GeneratedTest {
  id: string;
  acceptance_criterion_id: string;
  test_framework: string;
  file_path: string;
  test_code: string;
  description: string;
  status: 'generated' | 'passing' | 'failing' | 'error';
}

export interface GeneratedCode {
  id: string;
  file_path: string;
  content: string;
  tests_satisfied: string[];
  dependencies: string[];
}

export interface TestExecutionResult {
  test_id: string;
  passed: boolean;
  error_message?: string;
  stack_trace?: string;
  execution_time_ms: number;
}

export interface SelfHealingIteration {
  iteration: number;
  failing_tests: TestExecutionResult[];
  error_analysis: string;
  proposed_fix: GeneratedCode[];
  applied: boolean;
  new_test_results?: TestExecutionResult[];
}

export interface TDAWorkflowState {
  metaprompt: UserStoryMetaprompt;
  current_phase: TDAPhase;
  rag_results?: RAGContextResult[];
  generated_tests?: GeneratedTest[];
  generated_code?: GeneratedCode[];
  test_results?: TestExecutionResult[];
  healing_iterations?: SelfHealingIteration[];
  final_status: 'pending' | 'success' | 'partial' | 'failed';
  created_at: string;
  completed_at?: string;
}

/**
 * ============================================================================
 * COGNITIVE-ADAPTIVE INTERFACE (CAI) ENGINE TYPES
 * ============================================================================
 */

export enum CognitivePrinciple {
  COGNITIVE_LOAD = 'cognitive_load',
  HICKS_LAW = 'hicks_law',
  FITTS_LAW = 'fitts_law',
  MILLER_LAW = 'miller_law',
  GESTALT_PROXIMITY = 'gestalt_proximity',
  PEAK_END_RULE = 'peak_end_rule',
  SERIAL_POSITION = 'serial_position',
  RECOGNITION_VS_RECALL = 'recognition_vs_recall'
}

export interface CognitiveFitnessFunction {
  principles: {
    principle: CognitivePrinciple;
    weight: number;
    target_metric: string;
    current_value?: number;
    target_value: number;
  }[];
  composite_score?: number;
}

export interface CAIMetaprompt extends BaseMetaprompt {
  system_role: 'cognitive_adaptive_interface';
  objective: 'maximize_conversion' | 'minimize_friction' | 'maximize_engagement' | 'maximize_delight';
  target_persona: PersonaDefinition | string; // string = file path
  business_objective: string;
  technical_constraints: {
    wcag_compliance: 'WCAG_2_2_AA' | 'WCAG_2_2_AAA';
    semantic_html: boolean;
    keyboard_accessible: boolean;
    aria_required: boolean;
    frameworks?: string[];
  };
  cognitive_fitness_function: CognitiveFitnessFunction;
  initial_generation?: boolean;
}

export interface PersonaDefinition {
  id: string;
  name: string;
  demographics: {
    age_range?: string;
    occupation?: string;
    tech_savviness?: 'low' | 'medium' | 'high';
  };
  pain_points: string[];
  motivations: string[];
  goals: string[];
  behavioral_patterns?: {
    typical_device?: 'mobile' | 'desktop' | 'tablet';
    attention_span?: 'low' | 'medium' | 'high';
    preferred_interaction?: 'visual' | 'textual' | 'mixed';
  };
}

export interface UIComponentTree {
  id: string;
  component_type: string;
  props: Record<string, any>;
  children?: UIComponentTree[];
  cognitive_annotations?: {
    principle: CognitivePrinciple;
    reasoning: string;
  }[];
}

export interface TelemetryAnalysis {
  session_id: string;
  persona_match?: string;
  behavioral_patterns: {
    hesitation_points: { elementId: string; avgDwellTime: number }[];
    rage_clicks: { elementId: string; clickCount: number }[];
    drop_off_points: { pagePath: string; dropOffRate: number }[];
    successful_conversions: { goal: string; completionRate: number }[];
  };
  cognitive_fitness_violations: {
    principle: CognitivePrinciple;
    elementId: string;
    violation_description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }[];
  recommended_changes: UIOptimizationRecommendation[];
}

export interface UIOptimizationRecommendation {
  id: string;
  priority: number;
  element_id: string;
  change_type: 'reposition' | 'resize' | 'remove' | 'simplify' | 'reword' | 'add_affordance';
  rationale: string;
  expected_improvement: {
    principle: CognitivePrinciple;
    estimated_score_delta: number;
  }[];
}

export interface CAIWorkflowState {
  metaprompt: CAIMetaprompt;
  current_ui: UIComponentTree;
  telemetry_sessions: string[];
  telemetry_analysis?: TelemetryAnalysis;
  optimization_history: {
    iteration: number;
    timestamp: string;
    recommendations_applied: UIOptimizationRecommendation[];
    fitness_before: number;
    fitness_after: number;
    ab_test_results?: ABTestResult;
  }[];
  current_fitness_score: number;
  status: 'generating' | 'deployed' | 'monitoring' | 'optimizing';
}

export interface ABTestResult {
  variant_a: { ui: UIComponentTree; fitness_score: number; session_count: number };
  variant_b: { ui: UIComponentTree; fitness_score: number; session_count: number };
  winner: 'a' | 'b' | 'inconclusive';
  confidence_level: number;
}

/**
 * ============================================================================
 * ERROR-FORWARD DEBUGGING TYPES
 * ============================================================================
 */

export interface ErrorContext {
  error_message: string;
  stack_trace: string;
  error_type: 'syntax' | 'runtime' | 'logical' | 'test_failure' | 'type_error';
  file_path: string;
  line_number?: number;
  surrounding_code?: string;
  related_files?: string[];
}

export interface ErrorForwardPrompt {
  system_role: 'error_debugger';
  error_context: ErrorContext;
  previous_attempts?: {
    attempt_number: number;
    fix_applied: string;
    outcome: 'resolved' | 'persisted' | 'new_error';
  }[];
  instruction: string;
}

export interface ReflectionResult {
  analysis: string;
  root_cause_hypothesis: string;
  proposed_fixes: {
    fix_id: string;
    description: string;
    confidence: number;
    code_changes: GeneratedCode[];
  }[];
  learning: string;
}

/**
 * ============================================================================
 * MULTI-AGENT ORCHESTRATION TYPES
 * ============================================================================
 */

export enum ReasoningPattern {
  REACT = 'react',
  TREE_OF_THOUGHTS = 'tree_of_thoughts',
  GRAPH_OF_THOUGHTS = 'graph_of_thoughts',
  CHAIN_OF_THOUGHT = 'chain_of_thought'
}

export interface AgentRole {
  role_id: string;
  role_name: 'product_manager' | 'architect' | 'developer' | 'qa_engineer' | 'ux_designer' | 'feedback_analyst';
  reasoning_pattern: ReasoningPattern;
  capabilities: string[];
  sop?: string; // Standard Operating Procedure
}

export interface AgentMessage {
  from: string;
  to: string;
  message_type: 'task' | 'question' | 'result' | 'feedback';
  content: any;
  timestamp: string;
}

export interface MultiAgentWorkflow {
  workflow_id: string;
  agents: AgentRole[];
  communication_graph: { from: string; to: string; condition?: string }[];
  current_state: Record<string, any>;
  message_history: AgentMessage[];
  workflow_status: 'initializing' | 'running' | 'completed' | 'failed';
}

/**
 * ============================================================================
 * SELF-OPTIMIZING PRODUCT (SOP) LOOP TYPES
 * ============================================================================
 */

export interface FeedbackAgentAnalysis {
  telemetry_summary: TelemetryAnalysis;
  identified_issues: {
    issue_id: string;
    issue_type: 'user_friction' | 'performance' | 'accessibility' | 'cognitive_overload' | 'conversion_blocker';
    severity: 'low' | 'medium' | 'high' | 'critical';
    affected_users: number;
    evidence: UserTelemetryEvent[];
  }[];
  generated_user_story?: UserStoryMetaprompt;
  reasoning_graph?: any; // GoT reasoning structure
}

export interface SOPLoopState {
  loop_iteration: number;
  tda_state?: TDAWorkflowState;
  cai_state?: CAIWorkflowState;
  feedback_analysis?: FeedbackAgentAnalysis;
  deployment_status: 'development' | 'staging' | 'production' | 'rollback';
  product_metrics: {
    user_delight_score: number;
    conversion_rate: number;
    error_rate: number;
    performance_score: number;
  };
  evolution_history: {
    iteration: number;
    timestamp: string;
    changes_made: string[];
    metrics_before: Record<string, number>;
    metrics_after: Record<string, number>;
  }[];
}

/**
 * ============================================================================
 * AGENTIC RAG TYPES
 * ============================================================================
 */

export interface RAGQuery {
  query_id: string;
  query_text: string;
  query_type: 'code_search' | 'documentation' | 'api_reference' | 'pattern_search' | 'dependency_graph';
  filters?: {
    file_extensions?: string[];
    directories?: string[];
    max_results?: number;
  };
}

export interface RAGPlan {
  plan_id: string;
  original_intent: string;
  sub_queries: RAGQuery[];
  synthesis_strategy: 'concatenate' | 'summarize' | 'graph_based' | 'hierarchical';
}

export interface AgenticRAGResult {
  plan: RAGPlan;
  query_results: Map<string, CodeContext[]>;
  synthesized_context: string;
  confidence_score: number;
}

/**
 * ============================================================================
 * METAPROMPT SCHEMAS (for validation)
 * ============================================================================
 */

export type MetapromptType =
  | UserStoryMetaprompt
  | CAIMetaprompt
  | ErrorForwardPrompt;

export interface MetapromptRegistry {
  tda: UserStoryMetaprompt;
  cai: CAIMetaprompt;
  error_debugger: ErrorForwardPrompt;
}
