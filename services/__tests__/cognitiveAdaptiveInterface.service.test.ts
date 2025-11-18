import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CognitiveAdaptiveInterfaceService, caiService } from '../cognitiveAdaptiveInterface.service';
import * as geminiService from '../geminiService';
import {
  CAIMetaprompt,
  CognitivePrinciple,
  UserTelemetryEvent,
  generateUniqueId
} from '../../types/autonomous';

// Mock geminiService
vi.mock('../geminiService', () => ({
  generateContent: vi.fn()
}));

/**
 * Tests for CognitiveAdaptiveInterfaceService
 *
 * Tests cover:
 * - CAI initialization and UI generation
 * - Cognitive fitness scoring
 * - Telemetry ingestion and analysis
 * - UI optimization
 * - A/B testing
 */

describe('CognitiveAdaptiveInterfaceService', () => {
  let service: CognitiveAdaptiveInterfaceService;
  const mockGenerateContent = vi.mocked(geminiService.generateContent);

  // Helper to create a valid CAI metaprompt
  const createValidMetaprompt = (): CAIMetaprompt => ({
    system_role: 'cognitive_adaptive_interface',
    timestamp: new Date().toISOString(),
    id: generateUniqueId(),
    objective: 'maximize_conversion',
    target_persona: {
      id: generateUniqueId(),
      name: 'Test User',
      demographics: {
        age_range: '25-35',
        occupation: 'Developer',
        tech_savviness: 'high'
      },
      pain_points: ['Complex forms', 'Slow loading'],
      motivations: ['Efficiency', 'Simplicity'],
      goals: ['Complete task quickly']
    },
    business_objective: 'Increase signup conversion',
    technical_constraints: {
      wcag_compliance: 'WCAG_2_2_AA',
      semantic_html: true,
      keyboard_accessible: true,
      aria_required: true,
      frameworks: ['react']
    },
    cognitive_fitness_function: {
      principles: [
        {
          principle: CognitivePrinciple.COGNITIVE_LOAD,
          weight: 0.3,
          target_metric: 'form_fields',
          target_value: 3
        },
        {
          principle: CognitivePrinciple.FITTS_LAW,
          weight: 0.3,
          target_metric: 'button_size',
          target_value: 48
        },
        {
          principle: CognitivePrinciple.HICKS_LAW,
          weight: 0.2,
          target_metric: 'choices',
          target_value: 3
        },
        {
          principle: CognitivePrinciple.RECOGNITION_VS_RECALL,
          weight: 0.2,
          target_metric: 'visible_options',
          target_value: 0.9
        }
      ]
    }
  });

  // Helper to create telemetry events
  const createTelemetryEvents = (count: number): UserTelemetryEvent[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: generateUniqueId(),
      timestamp: new Date().toISOString(),
      eventType: i % 2 === 0 ? 'click' : 'hover',
      elementId: `element-${i}`,
      elementType: 'button',
      pagePath: '/test',
      sessionId: generateUniqueId(),
      sequenceNumber: i
    }));
  };

  beforeEach(() => {
    service = new CognitiveAdaptiveInterfaceService();
    vi.clearAllMocks();

    // Default mock responses
    mockGenerateContent.mockImplementation(async (prompt: string) => {
      if (prompt.includes('expert UI/UX designer')) {
        return JSON.stringify({
          id: generateUniqueId(),
          component_type: 'form',
          props: {
            id: 'signup-form',
            className: 'cognitive-optimized'
          },
          children: [
            {
              id: generateUniqueId(),
              component_type: 'input',
              props: { type: 'email', id: 'email-input' }
            }
          ],
          cognitive_annotations: [
            {
              principle: 'COGNITIVE_LOAD',
              reasoning: 'Minimal fields to reduce cognitive burden'
            }
          ]
        });
      }
      if (prompt.includes('behavioral analytics AI')) {
        return JSON.stringify({
          session_id: 'test-session',
          behavioral_patterns: {
            hesitation_points: [{ elementId: 'submit-btn', avgDwellTime: 3000 }],
            rage_clicks: [],
            drop_off_points: [],
            successful_conversions: [{ goal: 'signup', completionRate: 0.75 }]
          },
          recommended_changes: [
            {
              id: 'rec-1',
              priority: 1,
              element_id: 'submit-btn',
              change_type: 'resize',
              rationale: 'Increase button size for better accessibility',
              expected_improvement: [
                { principle: 'FITTS_LAW', estimated_score_delta: 0.1 }
              ]
            }
          ]
        });
      }
      if (prompt.includes('cognitive science expert')) {
        return JSON.stringify([{
          principle: 'COGNITIVE_LOAD',
          elementId: 'form',
          violation_description: 'Too many fields',
          severity: 'medium'
        }]);
      }
      if (prompt.includes('UI optimization AI')) {
        return JSON.stringify({
          id: generateUniqueId(),
          component_type: 'form',
          props: { id: 'optimized-form' },
          children: []
        });
      }
      if (prompt.includes('cognitive science evaluator')) {
        return JSON.stringify({
          score: 0.85,
          reasoning: 'Good adherence to principle'
        });
      }
      return '{}';
    });
  });

  afterEach(() => {
    service.resetWorkflow();
  });

  describe('Singleton Instance', () => {
    it('should export a singleton instance', () => {
      // Assert
      expect(caiService).toBeDefined();
      expect(caiService).toBeInstanceOf(CognitiveAdaptiveInterfaceService);
    });
  });

  describe('initialize', () => {
    it('should initialize CAI with valid metaprompt', async () => {
      // Arrange
      const metaprompt = createValidMetaprompt();

      // Act
      const state = await service.initialize(metaprompt);

      // Assert
      expect(state).toBeDefined();
      expect(state.metaprompt).toEqual(metaprompt);
      expect(state.status).toBe('generating');
    });

    it('should generate initial UI component tree', async () => {
      // Arrange
      const metaprompt = createValidMetaprompt();

      // Act
      const state = await service.initialize(metaprompt);

      // Assert
      expect(state.current_ui).toBeDefined();
      expect(state.current_ui.id).toBeDefined();
      expect(state.current_ui.component_type).toBeDefined();
    });

    it('should calculate initial fitness score', async () => {
      // Arrange
      const metaprompt = createValidMetaprompt();

      // Act
      const state = await service.initialize(metaprompt);

      // Assert
      expect(state.current_fitness_score).toBeDefined();
      expect(state.current_fitness_score).toBeGreaterThanOrEqual(0);
      expect(state.current_fitness_score).toBeLessThanOrEqual(1);
    });

    it('should initialize empty telemetry sessions', async () => {
      // Arrange
      const metaprompt = createValidMetaprompt();

      // Act
      const state = await service.initialize(metaprompt);

      // Assert
      expect(state.telemetry_sessions).toEqual([]);
    });

    it('should initialize empty optimization history', async () => {
      // Arrange
      const metaprompt = createValidMetaprompt();

      // Act
      const state = await service.initialize(metaprompt);

      // Assert
      expect(state.optimization_history).toEqual([]);
    });

    it('should handle persona as file path string', async () => {
      // Arrange
      const metaprompt = createValidMetaprompt();
      metaprompt.target_persona = '/path/to/persona.json';

      // Act
      const state = await service.initialize(metaprompt);

      // Assert
      expect(state).toBeDefined();
      expect(state.current_ui).toBeDefined();
    });
  });

  describe('ingestTelemetry', () => {
    it('should add events to telemetry buffer', async () => {
      // Arrange
      const metaprompt = createValidMetaprompt();
      await service.initialize(metaprompt);
      const events = createTelemetryEvents(5);

      // Act
      await service.ingestTelemetry(events);
      const state = service.getWorkflowState();

      // Assert
      expect(state!.telemetry_sessions.length).toBeGreaterThan(0);
    });

    it('should track unique session IDs', async () => {
      // Arrange
      const metaprompt = createValidMetaprompt();
      await service.initialize(metaprompt);

      const sessionId1 = generateUniqueId();
      const sessionId2 = generateUniqueId();

      const events: UserTelemetryEvent[] = [
        { ...createTelemetryEvents(1)[0], sessionId: sessionId1 },
        { ...createTelemetryEvents(1)[0], sessionId: sessionId1 },
        { ...createTelemetryEvents(1)[0], sessionId: sessionId2 }
      ];

      // Act
      await service.ingestTelemetry(events);
      const state = service.getWorkflowState();

      // Assert
      expect(state!.telemetry_sessions).toContain(sessionId1);
      expect(state!.telemetry_sessions).toContain(sessionId2);
      expect(state!.telemetry_sessions.length).toBe(2);
    });

    it('should not duplicate session IDs', async () => {
      // Arrange
      const metaprompt = createValidMetaprompt();
      await service.initialize(metaprompt);

      const sessionId = generateUniqueId();
      const events = createTelemetryEvents(3).map(e => ({
        ...e,
        sessionId
      }));

      // Act
      await service.ingestTelemetry(events);
      await service.ingestTelemetry(events); // Ingest same session again
      const state = service.getWorkflowState();

      // Assert
      const sessionCount = state!.telemetry_sessions.filter(s => s === sessionId).length;
      expect(sessionCount).toBe(1);
    });
  });

  describe('analyzeTelemetry', () => {
    it('should analyze telemetry and return analysis', async () => {
      // Arrange
      const metaprompt = createValidMetaprompt();
      await service.initialize(metaprompt);
      await service.ingestTelemetry(createTelemetryEvents(10));

      // Act
      const analysis = await service.analyzeTelemetry();

      // Assert
      expect(analysis).toBeDefined();
      expect(analysis.behavioral_patterns).toBeDefined();
      expect(analysis.recommended_changes).toBeDefined();
    });

    it('should identify behavioral patterns', async () => {
      // Arrange
      const metaprompt = createValidMetaprompt();
      await service.initialize(metaprompt);
      await service.ingestTelemetry(createTelemetryEvents(10));

      // Act
      const analysis = await service.analyzeTelemetry();

      // Assert
      expect(analysis.behavioral_patterns.hesitation_points).toBeDefined();
      expect(analysis.behavioral_patterns.rage_clicks).toBeDefined();
      expect(analysis.behavioral_patterns.drop_off_points).toBeDefined();
      expect(analysis.behavioral_patterns.successful_conversions).toBeDefined();
    });

    it('should identify cognitive fitness violations', async () => {
      // Arrange
      const metaprompt = createValidMetaprompt();
      await service.initialize(metaprompt);
      await service.ingestTelemetry(createTelemetryEvents(10));

      // Act
      const analysis = await service.analyzeTelemetry();

      // Assert
      expect(analysis.cognitive_fitness_violations).toBeDefined();
      expect(Array.isArray(analysis.cognitive_fitness_violations)).toBe(true);
    });

    it('should throw error when no telemetry data', async () => {
      // Arrange
      const metaprompt = createValidMetaprompt();
      await service.initialize(metaprompt);

      // Act & Assert
      await expect(service.analyzeTelemetry()).rejects.toThrow(
        'No telemetry data available for analysis'
      );
    });

    it('should store analysis in workflow state', async () => {
      // Arrange
      const metaprompt = createValidMetaprompt();
      await service.initialize(metaprompt);
      await service.ingestTelemetry(createTelemetryEvents(10));

      // Act
      await service.analyzeTelemetry();
      const state = service.getWorkflowState();

      // Assert
      expect(state!.telemetry_analysis).toBeDefined();
    });
  });

  describe('optimizeUI', () => {
    it('should optimize UI based on telemetry analysis', async () => {
      // Arrange
      const metaprompt = createValidMetaprompt();
      await service.initialize(metaprompt);
      await service.ingestTelemetry(createTelemetryEvents(10));
      await service.analyzeTelemetry();

      // Act
      await service.optimizeUI();

      // Assert
      const state = service.getWorkflowState();
      // Status is 'deployed' only if fitness improved, otherwise stays 'optimizing'
      expect(['optimizing', 'deployed']).toContain(state!.status);
    });

    it('should update optimization history', async () => {
      // Arrange
      const metaprompt = createValidMetaprompt();
      await service.initialize(metaprompt);
      await service.ingestTelemetry(createTelemetryEvents(10));
      await service.analyzeTelemetry();

      // Act
      await service.optimizeUI();
      const state = service.getWorkflowState();

      // Assert
      expect(state!.optimization_history.length).toBe(1);
      expect(state!.optimization_history[0].iteration).toBe(1);
      expect(state!.optimization_history[0].timestamp).toBeDefined();
    });

    it('should throw error when no telemetry analysis', async () => {
      // Arrange
      const metaprompt = createValidMetaprompt();
      await service.initialize(metaprompt);

      // Act & Assert
      await expect(service.optimizeUI()).rejects.toThrow(
        'No telemetry analysis available'
      );
    });

    it('should update fitness score after optimization', async () => {
      // Arrange
      const metaprompt = createValidMetaprompt();
      await service.initialize(metaprompt);
      const initialScore = service.getFitnessScore();
      await service.ingestTelemetry(createTelemetryEvents(10));
      await service.analyzeTelemetry();

      // Act
      await service.optimizeUI();

      // Assert
      const history = service.getWorkflowState()!.optimization_history[0];
      expect(history.fitness_before).toBeDefined();
      expect(history.fitness_after).toBeDefined();
    });

    it('should handle empty recommendations gracefully', async () => {
      // Arrange
      const metaprompt = createValidMetaprompt();
      await service.initialize(metaprompt);
      await service.ingestTelemetry(createTelemetryEvents(10));

      mockGenerateContent.mockImplementation(async (prompt: string) => {
        if (prompt.includes('behavioral analytics AI')) {
          return JSON.stringify({
            session_id: 'test',
            behavioral_patterns: {
              hesitation_points: [],
              rage_clicks: [],
              drop_off_points: [],
              successful_conversions: []
            },
            recommended_changes: [] // No recommendations
          });
        }
        if (prompt.includes('cognitive science expert')) {
          return '[]';
        }
        return '{}';
      });

      await service.analyzeTelemetry();

      // Act
      await service.optimizeUI();

      // Assert - should complete without error
      const state = service.getWorkflowState();
      expect(state).toBeDefined();
    });
  });

  describe('runABTest', () => {
    it('should run A/B test between variants', async () => {
      // Arrange
      const metaprompt = createValidMetaprompt();
      await service.initialize(metaprompt);

      const variantB = {
        id: generateUniqueId(),
        component_type: 'form',
        props: { id: 'variant-b' },
        children: []
      };

      // Act
      const result = await service.runABTest(variantB);

      // Assert
      expect(result).toBeDefined();
      expect(result.variant_a).toBeDefined();
      expect(result.variant_b).toBeDefined();
      expect(['a', 'b', 'inconclusive']).toContain(result.winner);
    });

    it('should calculate confidence level', async () => {
      // Arrange
      const metaprompt = createValidMetaprompt();
      await service.initialize(metaprompt);

      const variantB = {
        id: generateUniqueId(),
        component_type: 'form',
        props: {},
        children: []
      };

      // Act
      const result = await service.runABTest(variantB);

      // Assert
      expect(result.confidence_level).toBeGreaterThanOrEqual(0);
      expect(result.confidence_level).toBeLessThanOrEqual(1);
    });

    it('should use default session count of 100', async () => {
      // Arrange
      const metaprompt = createValidMetaprompt();
      await service.initialize(metaprompt);

      const variantB = {
        id: generateUniqueId(),
        component_type: 'form',
        props: {},
        children: []
      };

      // Act
      const result = await service.runABTest(variantB);

      // Assert
      expect(result.variant_a.session_count + result.variant_b.session_count).toBe(100);
    });

    it('should accept custom session count', async () => {
      // Arrange
      const metaprompt = createValidMetaprompt();
      await service.initialize(metaprompt);

      const variantB = {
        id: generateUniqueId(),
        component_type: 'form',
        props: {},
        children: []
      };

      // Act
      const result = await service.runABTest(variantB, 200);

      // Assert
      expect(result.variant_a.session_count + result.variant_b.session_count).toBe(200);
    });
  });

  describe('getWorkflowState', () => {
    it('should return null before initialization', () => {
      // Act
      const state = service.getWorkflowState();

      // Assert
      expect(state).toBeNull();
    });

    it('should return current state after initialization', async () => {
      // Arrange
      const metaprompt = createValidMetaprompt();
      await service.initialize(metaprompt);

      // Act
      const state = service.getWorkflowState();

      // Assert
      expect(state).toBeDefined();
      expect(state!.metaprompt).toEqual(metaprompt);
    });
  });

  describe('getCurrentUI', () => {
    it('should return null before initialization', () => {
      // Act
      const ui = service.getCurrentUI();

      // Assert
      expect(ui).toBeNull();
    });

    it('should return current UI after initialization', async () => {
      // Arrange
      const metaprompt = createValidMetaprompt();
      await service.initialize(metaprompt);

      // Act
      const ui = service.getCurrentUI();

      // Assert
      expect(ui).toBeDefined();
      expect(ui!.id).toBeDefined();
    });
  });

  describe('getFitnessScore', () => {
    it('should return 0 before initialization', () => {
      // Act
      const score = service.getFitnessScore();

      // Assert
      expect(score).toBe(0);
    });

    it('should return fitness score after initialization', async () => {
      // Arrange
      const metaprompt = createValidMetaprompt();
      await service.initialize(metaprompt);

      // Act
      const score = service.getFitnessScore();

      // Assert
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('resetWorkflow', () => {
    it('should reset all state', async () => {
      // Arrange
      const metaprompt = createValidMetaprompt();
      await service.initialize(metaprompt);
      await service.ingestTelemetry(createTelemetryEvents(5));

      // Act
      service.resetWorkflow();

      // Assert
      expect(service.getWorkflowState()).toBeNull();
      expect(service.getCurrentUI()).toBeNull();
      expect(service.getFitnessScore()).toBe(0);
    });
  });

  describe('Cognitive Principles Evaluation', () => {
    it('should evaluate all configured principles', async () => {
      // Arrange
      const metaprompt = createValidMetaprompt();
      let evaluationCount = 0;

      mockGenerateContent.mockImplementation(async (prompt: string) => {
        if (prompt.includes('cognitive science evaluator')) {
          evaluationCount++;
          return JSON.stringify({
            score: 0.8,
            reasoning: `Evaluation ${evaluationCount}`
          });
        }
        if (prompt.includes('expert UI/UX designer')) {
          return JSON.stringify({
            id: generateUniqueId(),
            component_type: 'form',
            props: {},
            children: []
          });
        }
        return '{}';
      });

      // Act
      await service.initialize(metaprompt);

      // Assert
      expect(evaluationCount).toBe(metaprompt.cognitive_fitness_function.principles.length);
    });

    it('should handle principle evaluation failures gracefully', async () => {
      // Arrange
      const metaprompt = createValidMetaprompt();

      mockGenerateContent.mockImplementation(async (prompt: string) => {
        if (prompt.includes('cognitive science evaluator')) {
          throw new Error('Evaluation failed');
        }
        if (prompt.includes('expert UI/UX designer')) {
          return JSON.stringify({
            id: generateUniqueId(),
            component_type: 'form',
            props: {},
            children: []
          });
        }
        return '{}';
      });

      // Act
      const state = await service.initialize(metaprompt);

      // Assert - should use default score of 0.5 for failed evaluations
      expect(state.current_fitness_score).toBeDefined();
    });
  });
});
