// services/cognitiveAdaptiveInterface.service.ts
// Cognitive-Adaptive Interface (CAI) Engine - Self-Optimizing UI System

import { generateContent } from './geminiService';
import {
  CAIWorkflowState,
  CAIMetaprompt,
  UIComponentTree,
  CognitivePrinciple,
  CognitiveFitnessFunction,
  TelemetryAnalysis,
  UIOptimizationRecommendation,
  UserTelemetryEvent,
  ABTestResult,
  PersonaDefinition,
  generateUniqueId
} from '../types/autonomous';

/**
 * ============================================================================
 * COGNITIVE-ADAPTIVE INTERFACE (CAI) ENGINE
 * ============================================================================
 *
 * The CAI implements a self-optimizing UI system driven by cognitive science:
 * Phase 1: COGNITIVE METAPROMPT - Define goals and cognitive fitness function
 * Phase 2: INITIAL GENERATION - Generate UI hypothesis to satisfy fitness function
 * Phase 3: TELEMETRY LOOP - Collect and analyze real-time user behavior
 * Phase 4: AUTONOMOUS OPTIMIZATION - Adapt UI based on telemetry and run A/B tests
 */

export class CognitiveAdaptiveInterfaceService {
  private workflowState: CAIWorkflowState | null = null;
  private telemetryBuffer: UserTelemetryEvent[] = [];

  /**
   * Initialize CAI with a cognitive metaprompt
   */
  async initialize(metaprompt: CAIMetaprompt): Promise<CAIWorkflowState> {
    console.log('[CAI] Initializing Cognitive-Adaptive Interface Engine');

    // Phase 1 & 2: Generate initial UI based on cognitive constraints
    const initialUI = await this.generateCognitiveUI(metaprompt);

    this.workflowState = {
      metaprompt,
      current_ui: initialUI,
      telemetry_sessions: [],
      optimization_history: [],
      current_fitness_score: 0,
      status: 'generating'
    };

    // Calculate initial fitness score
    this.workflowState.current_fitness_score = await this.calculateFitnessScore(
      initialUI,
      metaprompt.cognitive_fitness_function
    );

    console.log(`[CAI] Initial UI generated with fitness score: ${this.workflowState.current_fitness_score}`);
    return this.workflowState;
  }

  /**
   * PHASE 2: INITIAL GENERATION
   * Generate UI component tree based on cognitive constraints
   */
  private async generateCognitiveUI(metaprompt: CAIMetaprompt): Promise<UIComponentTree> {
    const persona = typeof metaprompt.target_persona === 'string'
      ? await this.loadPersona(metaprompt.target_persona)
      : metaprompt.target_persona;

    const prompt = this.buildCognitiveUIPrompt(metaprompt, persona);
    const uiTreeJson = await generateContent(prompt, {
      temperature: 0.6,
      response_mime_type: 'application/json'
    });

    const uiTree = JSON.parse(uiTreeJson);
    return this.annotateUIWithCognitivePrinciples(uiTree, metaprompt.cognitive_fitness_function);
  }

  private buildCognitiveUIPrompt(metaprompt: CAIMetaprompt, persona: PersonaDefinition): string {
    const principlesDescription = metaprompt.cognitive_fitness_function.principles
      .map(p => `- ${p.principle}: weight ${p.weight}, target ${p.target_metric} = ${p.target_value}`)
      .join('\n');

    return `You are an expert UI/UX designer specialized in cognitive science and accessibility.

OBJECTIVE: ${metaprompt.objective}
BUSINESS GOAL: ${metaprompt.business_objective}

TARGET PERSONA:
- Name: ${persona.name}
- Demographics: ${JSON.stringify(persona.demographics)}
- Pain Points: ${persona.pain_points.join(', ')}
- Motivations: ${persona.motivations.join(', ')}
- Goals: ${persona.goals.join(', ')}
${persona.behavioral_patterns ? `- Behavioral Patterns: ${JSON.stringify(persona.behavioral_patterns)}` : ''}

COGNITIVE FITNESS FUNCTION (weighted principles to optimize):
${principlesDescription}

TECHNICAL CONSTRAINTS:
- WCAG Compliance: ${metaprompt.technical_constraints.wcag_compliance}
- Semantic HTML: ${metaprompt.technical_constraints.semantic_html}
- Keyboard Accessible: ${metaprompt.technical_constraints.keyboard_accessible}
- ARIA Required: ${metaprompt.technical_constraints.aria_required}
${metaprompt.technical_constraints.frameworks ? `- Frameworks: ${metaprompt.technical_constraints.frameworks.join(', ')}` : ''}

COGNITIVE PRINCIPLES TO APPLY:

1. COGNITIVE LOAD: Minimize working memory burden. Chunk information (Miller's Law: 7±2 items). Progressive disclosure.

2. HICK'S LAW: Minimize choice complexity. Reduce decision time by limiting options. T = b * log2(n+1) where n = number of choices.

3. FITTS'S LAW: Optimize target size and distance. T = a + b * log2(D/W + 1). Larger, closer buttons for primary actions.

4. MILLER'S LAW: Group related items into chunks of 5-9 items maximum.

5. GESTALT PROXIMITY: Group related elements visually. Use whitespace to create clear boundaries.

6. PEAK-END RULE: Optimize the most intense moment and the final moment of the user journey.

7. SERIAL POSITION: Place critical items first or last (primacy and recency effects).

8. RECOGNITION VS RECALL: Minimize recall; maximize recognition. Use visible options, not hidden menus.

TASK:
Generate a complete UI component tree that maximizes the cognitive fitness function for the target persona.

OUTPUT FORMAT (JSON):
{
  "id": "unique-id",
  "component_type": "div | button | input | form | nav | etc.",
  "props": {
    "id": "element-id",
    "className": "css-classes",
    "aria-label": "accessibility label",
    "role": "aria-role",
    "...": "other props"
  },
  "children": [ /* recursive UIComponentTree objects */ ],
  "cognitive_annotations": [
    {
      "principle": "COGNITIVE_LOAD | HICKS_LAW | FITTS_LAW | etc.",
      "reasoning": "Why this design choice optimizes this principle"
    }
  ]
}

Generate the COMPLETE UI hierarchy with proper cognitive annotations for each design decision.`;
  }

  private annotateUIWithCognitivePrinciples(
    ui: UIComponentTree,
    fitnessFunction: CognitiveFitnessFunction
  ): UIComponentTree {
    // Recursively add cognitive annotations
    // This would normally use more sophisticated analysis
    // For now, we trust the LLM has annotated correctly
    if (ui.children) {
      ui.children = ui.children.map(child =>
        this.annotateUIWithCognitivePrinciples(child, fitnessFunction)
      );
    }
    return ui;
  }

  private async loadPersona(personaPath: string): Promise<PersonaDefinition> {
    // Placeholder: Load persona from file system or database
    // For now, return a default persona
    return {
      id: generateUniqueId(),
      name: 'Default User',
      demographics: {
        age_range: '25-45',
        occupation: 'Knowledge Worker',
        tech_savviness: 'medium'
      },
      pain_points: ['Too many steps', 'Unclear navigation'],
      motivations: ['Efficiency', 'Simplicity'],
      goals: ['Complete task quickly', 'Understand the system']
    };
  }

  /**
   * PHASE 3: TELEMETRY LOOP
   * Ingest telemetry events and analyze user behavior
   */
  async ingestTelemetry(events: UserTelemetryEvent[]): Promise<void> {
    this.telemetryBuffer.push(...events);

    // Track unique sessions
    const uniqueSessions = new Set(events.map(e => e.sessionId));
    uniqueSessions.forEach(sessionId => {
      if (!this.workflowState!.telemetry_sessions.includes(sessionId)) {
        this.workflowState!.telemetry_sessions.push(sessionId);
      }
    });

    console.log(`[CAI] Ingested ${events.length} telemetry events from ${uniqueSessions.size} sessions`);
  }

  async analyzeTelemetry(): Promise<TelemetryAnalysis> {
    console.log('[CAI] Analyzing telemetry data');

    if (this.telemetryBuffer.length === 0) {
      throw new Error('No telemetry data available for analysis');
    }

    const analysisPrompt = this.buildTelemetryAnalysisPrompt(this.telemetryBuffer);
    const analysisJson = await generateContent(analysisPrompt, {
      temperature: 0.3,
      response_mime_type: 'application/json'
    });

    const analysis: TelemetryAnalysis = JSON.parse(analysisJson);

    // Enhance with cognitive fitness violations
    analysis.cognitive_fitness_violations = await this.identifyCognitiveFitnessViolations(
      this.telemetryBuffer,
      this.workflowState!.current_ui,
      this.workflowState!.metaprompt.cognitive_fitness_function
    );

    this.workflowState!.telemetry_analysis = analysis;
    return analysis;
  }

  private buildTelemetryAnalysisPrompt(events: UserTelemetryEvent[]): string {
    const eventSummary = this.summarizeEvents(events);

    return `You are a behavioral analytics AI specialized in UX research.

TASK: Analyze user telemetry data to identify behavioral patterns and UX issues.

TELEMETRY DATA SUMMARY:
${eventSummary}

RAW EVENTS (sample):
${JSON.stringify(events.slice(0, 100), null, 2)}

ANALYZE FOR:
1. Hesitation Points: Elements where users dwell unusually long before interacting
2. Rage Clicks: Elements clicked repeatedly in frustration
3. Drop-off Points: Pages/steps where users abandon the flow
4. Successful Conversions: Patterns of users who complete goals

OUTPUT FORMAT (JSON):
{
  "session_id": "aggregate or representative session",
  "behavioral_patterns": {
    "hesitation_points": [{ "elementId": "...", "avgDwellTime": 5000 }],
    "rage_clicks": [{ "elementId": "...", "clickCount": 8 }],
    "drop_off_points": [{ "pagePath": "/checkout", "dropOffRate": 0.45 }],
    "successful_conversions": [{ "goal": "signup", "completionRate": 0.65 }]
  },
  "recommended_changes": [
    {
      "id": "rec-1",
      "priority": 1,
      "element_id": "...",
      "change_type": "reposition | resize | remove | simplify | reword | add_affordance",
      "rationale": "Why this change will help",
      "expected_improvement": [
        { "principle": "FITTS_LAW", "estimated_score_delta": 0.15 }
      ]
    }
  ]
}`;
  }

  private summarizeEvents(events: UserTelemetryEvent[]): string {
    const eventTypes = events.reduce((acc, e) => {
      acc[e.eventType] = (acc[e.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const uniqueElements = new Set(events.map(e => e.elementId).filter(Boolean));
    const uniquePages = new Set(events.map(e => e.pagePath));

    return `
Total Events: ${events.length}
Event Types: ${JSON.stringify(eventTypes)}
Unique Elements: ${uniqueElements.size}
Unique Pages: ${uniquePages.size}
Time Span: ${events[0]?.timestamp} to ${events[events.length - 1]?.timestamp}
`;
  }

  private async identifyCognitiveFitnessViolations(
    events: UserTelemetryEvent[],
    ui: UIComponentTree,
    fitnessFunction: CognitiveFitnessFunction
  ): Promise<TelemetryAnalysis['cognitive_fitness_violations']> {
    const prompt = `You are a cognitive science expert analyzing UI for violations of cognitive principles.

CURRENT UI STRUCTURE:
${JSON.stringify(ui, null, 2)}

COGNITIVE FITNESS FUNCTION:
${JSON.stringify(fitnessFunction, null, 2)}

USER TELEMETRY EVIDENCE:
${JSON.stringify(events.slice(0, 50), null, 2)}

TASK: Identify specific violations of cognitive principles based on the telemetry evidence.

For example:
- COGNITIVE_LOAD violation: Too many form fields causing drop-off
- HICKS_LAW violation: Navigation with 15 options causing decision paralysis
- FITTS_LAW violation: Small buttons far from frequent actions

OUTPUT FORMAT (JSON array):
[
  {
    "principle": "COGNITIVE_LOAD",
    "elementId": "signup-form",
    "violation_description": "Form has 12 fields causing cognitive overload (Miller's Law: max 7±2)",
    "severity": "high"
  }
]`;

    try {
      const response = await generateContent(prompt, {
        temperature: 0.4,
        response_mime_type: 'application/json'
      });
      return JSON.parse(response);
    } catch (error) {
      console.warn('[CAI] Cognitive fitness violation analysis failed:', error);
      return [];
    }
  }

  /**
   * PHASE 4: AUTONOMOUS OPTIMIZATION
   * Apply recommendations and run A/B tests
   */
  async optimizeUI(): Promise<void> {
    if (!this.workflowState!.telemetry_analysis) {
      throw new Error('No telemetry analysis available. Run analyzeTelemetry() first.');
    }

    console.log('[CAI] Starting autonomous optimization');
    this.workflowState!.status = 'optimizing';

    const analysis = this.workflowState!.telemetry_analysis;
    const recommendations = analysis.recommended_changes
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 3); // Top 3 recommendations

    if (recommendations.length === 0) {
      console.log('[CAI] No optimization recommendations found');
      return;
    }

    const fitnessBefore = this.workflowState!.current_fitness_score;

    // Generate optimized UI variant
    const optimizedUI = await this.applyRecommendations(
      this.workflowState!.current_ui,
      recommendations
    );

    // Calculate new fitness score
    const fitnessAfter = await this.calculateFitnessScore(
      optimizedUI,
      this.workflowState!.metaprompt.cognitive_fitness_function
    );

    // Update workflow state
    this.workflowState!.optimization_history.push({
      iteration: this.workflowState!.optimization_history.length + 1,
      timestamp: new Date().toISOString(),
      recommendations_applied: recommendations,
      fitness_before: fitnessBefore,
      fitness_after: fitnessAfter
    });

    // If fitness improved, deploy the new UI
    if (fitnessAfter > fitnessBefore) {
      console.log(`[CAI] Fitness improved: ${fitnessBefore.toFixed(3)} → ${fitnessAfter.toFixed(3)}`);
      this.workflowState!.current_ui = optimizedUI;
      this.workflowState!.current_fitness_score = fitnessAfter;
      this.workflowState!.status = 'deployed';
    } else {
      console.log(`[CAI] Fitness did not improve. Keeping current UI.`);
    }
  }

  private async applyRecommendations(
    currentUI: UIComponentTree,
    recommendations: UIOptimizationRecommendation[]
  ): Promise<UIComponentTree> {
    const prompt = `You are a UI optimization AI. Apply these recommendations to improve the UI.

CURRENT UI:
${JSON.stringify(currentUI, null, 2)}

RECOMMENDATIONS TO APPLY:
${recommendations.map(r => `
- Element: ${r.element_id}
- Change Type: ${r.change_type}
- Rationale: ${r.rationale}
- Expected Improvement: ${r.expected_improvement.map(ei => `${ei.principle}: +${ei.estimated_score_delta}`).join(', ')}
`).join('\n')}

TASK: Generate the optimized UI component tree with all recommendations applied.

REQUIREMENTS:
1. Maintain the same structure and component types where possible
2. Apply changes precisely as recommended
3. Preserve all cognitive annotations
4. Ensure WCAG compliance is maintained

OUTPUT FORMAT (JSON):
Return the complete optimized UIComponentTree structure.`;

    const response = await generateContent(prompt, {
      temperature: 0.5,
      response_mime_type: 'application/json'
    });

    return JSON.parse(response);
  }

  /**
   * Calculate cognitive fitness score based on weighted principles
   */
  private async calculateFitnessScore(
    ui: UIComponentTree,
    fitnessFunction: CognitiveFitnessFunction
  ): Promise<number> {
    const scores: number[] = [];

    for (const principle of fitnessFunction.principles) {
      const score = await this.evaluatePrinciple(ui, principle.principle, principle.target_metric);
      const weightedScore = score * principle.weight;
      scores.push(weightedScore);
    }

    const compositeScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    return Math.min(1.0, Math.max(0.0, compositeScore));
  }

  private async evaluatePrinciple(
    ui: UIComponentTree,
    principle: CognitivePrinciple,
    targetMetric: string
  ): Promise<number> {
    const prompt = `You are a cognitive science evaluator. Evaluate how well this UI adheres to ${principle}.

UI STRUCTURE:
${JSON.stringify(ui, null, 2)}

PRINCIPLE: ${principle}
TARGET METRIC: ${targetMetric}

EVALUATION CRITERIA:
${this.getPrincipleEvaluationCriteria(principle)}

TASK: Assign a score from 0.0 (worst) to 1.0 (perfect) for how well the UI satisfies this cognitive principle.

OUTPUT FORMAT (JSON):
{
  "score": 0.85,
  "reasoning": "Brief explanation of the score"
}`;

    try {
      const response = await generateContent(prompt, {
        temperature: 0.2,
        response_mime_type: 'application/json'
      });
      const result = JSON.parse(response);
      return result.score;
    } catch (error) {
      console.warn(`[CAI] Failed to evaluate principle ${principle}:`, error);
      return 0.5; // Default to neutral score
    }
  }

  private getPrincipleEvaluationCriteria(principle: CognitivePrinciple): string {
    const criteria: Record<CognitivePrinciple, string> = {
      [CognitivePrinciple.COGNITIVE_LOAD]: 'Minimize working memory burden. Max 7±2 items per group. Progressive disclosure for complex flows.',
      [CognitivePrinciple.HICKS_LAW]: 'Minimize decision time. Reduce number of choices. Critical actions should have <5 options.',
      [CognitivePrinciple.FITTS_LAW]: 'Primary actions should be large (min 44x44px) and close to frequent interaction points.',
      [CognitivePrinciple.MILLER_LAW]: 'Group related items into chunks of 5-9 items maximum.',
      [CognitivePrinciple.GESTALT_PROXIMITY]: 'Related elements should be visually grouped. Clear whitespace boundaries.',
      [CognitivePrinciple.PEAK_END_RULE]: 'Most intense moment and final moment should be optimized for delight.',
      [CognitivePrinciple.SERIAL_POSITION]: 'Critical items placed first or last in lists/menus.',
      [CognitivePrinciple.RECOGNITION_VS_RECALL]: 'Minimize recall burden. Use visible options, icons with labels, not hidden menus.'
    };
    return criteria[principle] || 'Evaluate based on general UX best practices.';
  }

  /**
   * Run A/B test between current UI and optimized variant
   */
  async runABTest(variantB: UIComponentTree, sessionCount: number = 100): Promise<ABTestResult> {
    console.log('[CAI] Running A/B test');

    const fitnessA = this.workflowState!.current_fitness_score;
    const fitnessB = await this.calculateFitnessScore(
      variantB,
      this.workflowState!.metaprompt.cognitive_fitness_function
    );

    // Simulate A/B test (in production, this would use real user sessions)
    const result: ABTestResult = {
      variant_a: {
        ui: this.workflowState!.current_ui,
        fitness_score: fitnessA,
        session_count: Math.floor(sessionCount / 2)
      },
      variant_b: {
        ui: variantB,
        fitness_score: fitnessB,
        session_count: Math.floor(sessionCount / 2)
      },
      winner: fitnessB > fitnessA ? 'b' : (fitnessB < fitnessA ? 'a' : 'inconclusive'),
      confidence_level: Math.abs(fitnessB - fitnessA) / Math.max(fitnessA, fitnessB)
    };

    console.log(`[CAI] A/B Test Result: Variant ${result.winner.toUpperCase()} wins (confidence: ${(result.confidence_level * 100).toFixed(1)}%)`);
    return result;
  }

  /**
   * ============================================================================
   * PUBLIC API - Workflow State Management
   * ============================================================================
   */

  getWorkflowState(): CAIWorkflowState | null {
    return this.workflowState;
  }

  getCurrentUI(): UIComponentTree | null {
    return this.workflowState?.current_ui || null;
  }

  getFitnessScore(): number {
    return this.workflowState?.current_fitness_score || 0;
  }

  resetWorkflow(): void {
    this.workflowState = null;
    this.telemetryBuffer = [];
  }
}

/**
 * Singleton instance for global access
 */
export const caiService = new CognitiveAdaptiveInterfaceService();
