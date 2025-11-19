import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateUniqueId,
  TDAPhase,
  CognitivePrinciple,
  ReasoningPattern,
  UserTelemetryEvent,
  AutonomousDirective,
  ClientInferredState,
  AcceptanceCriterion,
  UserStoryMetaprompt,
  CAIMetaprompt,
  ErrorContext,
  RAGQuery,
  RAGPlan
} from '../autonomous';

/**
 * Tests for types/autonomous.ts
 *
 * Tests cover:
 * - Utility functions (generateUniqueId)
 * - Enum values
 * - Type structure validation
 * - Edge cases
 */

describe('Autonomous Types', () => {
  describe('generateUniqueId', () => {
    it('should generate a valid UUID v4 string', () => {
      // Arrange & Act
      const id = generateUniqueId();

      // Assert
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs on each call', () => {
      // Arrange & Act
      const ids = Array.from({ length: 100 }, () => generateUniqueId());
      const uniqueIds = new Set(ids);

      // Assert
      expect(uniqueIds.size).toBe(100);
    });

    it('should generate IDs with consistent length', () => {
      // Arrange & Act
      const ids = Array.from({ length: 10 }, () => generateUniqueId());

      // Assert
      ids.forEach(id => {
        expect(id.length).toBe(36); // UUID length with hyphens
      });
    });
  });

  describe('TDAPhase Enum', () => {
    it('should have all required phases', () => {
      // Assert
      expect(TDAPhase.USER_STORY).toBe('user_story');
      expect(TDAPhase.RAG_CONTEXT).toBe('rag_context');
      expect(TDAPhase.TEST_GENERATION).toBe('test_generation');
      expect(TDAPhase.CODE_GENERATION).toBe('code_generation');
      expect(TDAPhase.SELF_HEALING).toBe('self_healing');
      expect(TDAPhase.COMPLETE).toBe('complete');
    });

    it('should have exactly 6 phases', () => {
      // Arrange
      const phases = Object.values(TDAPhase);

      // Assert
      expect(phases.length).toBe(6);
    });
  });

  describe('CognitivePrinciple Enum', () => {
    it('should have all cognitive principles', () => {
      // Assert
      expect(CognitivePrinciple.COGNITIVE_LOAD).toBe('cognitive_load');
      expect(CognitivePrinciple.HICKS_LAW).toBe('hicks_law');
      expect(CognitivePrinciple.FITTS_LAW).toBe('fitts_law');
      expect(CognitivePrinciple.MILLER_LAW).toBe('miller_law');
      expect(CognitivePrinciple.GESTALT_PROXIMITY).toBe('gestalt_proximity');
      expect(CognitivePrinciple.PEAK_END_RULE).toBe('peak_end_rule');
      expect(CognitivePrinciple.SERIAL_POSITION).toBe('serial_position');
      expect(CognitivePrinciple.RECOGNITION_VS_RECALL).toBe('recognition_vs_recall');
    });

    it('should have exactly 8 principles', () => {
      // Arrange
      const principles = Object.values(CognitivePrinciple);

      // Assert
      expect(principles.length).toBe(8);
    });
  });

  describe('ReasoningPattern Enum', () => {
    it('should have all reasoning patterns', () => {
      // Assert
      expect(ReasoningPattern.REACT).toBe('react');
      expect(ReasoningPattern.TREE_OF_THOUGHTS).toBe('tree_of_thoughts');
      expect(ReasoningPattern.GRAPH_OF_THOUGHTS).toBe('graph_of_thoughts');
      expect(ReasoningPattern.CHAIN_OF_THOUGHT).toBe('chain_of_thought');
    });

    it('should have exactly 4 patterns', () => {
      // Arrange
      const patterns = Object.values(ReasoningPattern);

      // Assert
      expect(patterns.length).toBe(4);
    });
  });

  describe('Type Structure Validation', () => {
    describe('UserTelemetryEvent', () => {
      it('should accept valid telemetry event structure', () => {
        // Arrange
        const event: UserTelemetryEvent = {
          id: generateUniqueId(),
          timestamp: new Date().toISOString(),
          eventType: 'click',
          pagePath: '/home',
          sessionId: generateUniqueId(),
          sequenceNumber: 1
        };

        // Assert
        expect(event.id).toBeDefined();
        expect(event.timestamp).toBeDefined();
        expect(event.eventType).toBe('click');
        expect(event.pagePath).toBe('/home');
        expect(event.sessionId).toBeDefined();
        expect(event.sequenceNumber).toBe(1);
      });

      it('should accept event with all optional fields', () => {
        // Arrange
        const event: UserTelemetryEvent = {
          id: generateUniqueId(),
          timestamp: new Date().toISOString(),
          eventType: 'hover',
          elementId: 'btn-submit',
          elementName: 'Submit Button',
          elementType: 'button',
          pagePath: '/checkout',
          userId: 'user-123',
          sessionId: generateUniqueId(),
          duration: 1500,
          value: 'submitted',
          coords: { x: 100, y: 200 },
          sequenceNumber: 5,
          previousEventId: generateUniqueId(),
          context: { formState: 'valid' }
        };

        // Assert
        expect(event.elementId).toBe('btn-submit');
        expect(event.duration).toBe(1500);
        expect(event.coords).toEqual({ x: 100, y: 200 });
        expect(event.context).toEqual({ formState: 'valid' });
      });
    });

    describe('AutonomousDirective', () => {
      it('should accept valid directive types', () => {
        // Arrange
        const directiveTypes = [
          'SUGGESTION',
          'UI_RECONFIGURATION',
          'PRE_FETCH',
          'CONTEXT_UPDATE',
          'ALERT',
          'OPTIMIZATION'
        ];

        // Assert
        directiveTypes.forEach(type => {
          const directive: AutonomousDirective = {
            id: generateUniqueId(),
            type: type as AutonomousDirective['type'],
            payload: {},
            creationTimestamp: new Date().toISOString()
          };
          expect(directive.type).toBe(type);
        });
      });
    });

    describe('ClientInferredState', () => {
      it('should accept valid intent values', () => {
        // Arrange
        const intents: ClientInferredState['intent'][] = [
          'UNKNOWN',
          'NAVIGATE',
          'SEARCH',
          'COMPLETE_FORM',
          'TROUBLESHOOT'
        ];

        // Assert
        intents.forEach(intent => {
          const state: ClientInferredState = {
            intent,
            confidence: 0.85
          };
          expect(state.intent).toBe(intent);
          expect(state.confidence).toBe(0.85);
        });
      });

      it('should accept confidence between 0 and 1', () => {
        // Arrange & Act
        const lowConfidence: ClientInferredState = {
          intent: 'UNKNOWN',
          confidence: 0
        };
        const highConfidence: ClientInferredState = {
          intent: 'NAVIGATE',
          confidence: 1
        };

        // Assert
        expect(lowConfidence.confidence).toBe(0);
        expect(highConfidence.confidence).toBe(1);
      });
    });

    describe('AcceptanceCriterion', () => {
      it('should accept valid Gherkin-style criterion', () => {
        // Arrange
        const criterion: AcceptanceCriterion = {
          id: generateUniqueId(),
          given: 'A user is logged in',
          when: 'The user clicks logout',
          then: 'The user is redirected to login page',
          priority: 1
        };

        // Assert
        expect(criterion.given).toContain('logged in');
        expect(criterion.when).toContain('clicks');
        expect(criterion.then).toContain('redirected');
        expect(criterion.priority).toBe(1);
      });
    });

    describe('UserStoryMetaprompt', () => {
      it('should accept valid user story metaprompt', () => {
        // Arrange
        const metaprompt: UserStoryMetaprompt = {
          system_role: 'test_driven_agent',
          timestamp: new Date().toISOString(),
          id: generateUniqueId(),
          task_id: 'task-001',
          source_trigger: 'manual',
          user_story: {
            title: 'Implement feature X',
            description: 'As a user, I want feature X',
            acceptance_criteria: [
              {
                id: generateUniqueId(),
                given: 'condition',
                when: 'action',
                then: 'result',
                priority: 1
              }
            ],
            priority: 'high'
          },
          rag_context_queries: ['query1', 'query2']
        };

        // Assert
        expect(metaprompt.system_role).toBe('test_driven_agent');
        expect(metaprompt.source_trigger).toBe('manual');
        expect(metaprompt.user_story.priority).toBe('high');
        expect(metaprompt.rag_context_queries.length).toBe(2);
      });

      it('should accept all source trigger types', () => {
        // Arrange
        const triggers: UserStoryMetaprompt['source_trigger'][] = [
          'manual',
          'feedback_agent',
          'scheduled'
        ];

        // Assert
        triggers.forEach(trigger => {
          const metaprompt: UserStoryMetaprompt = {
            system_role: 'test_driven_agent',
            timestamp: new Date().toISOString(),
            id: generateUniqueId(),
            task_id: 'task-001',
            source_trigger: trigger,
            user_story: {
              title: 'Test',
              description: 'Test',
              acceptance_criteria: [],
              priority: 'low'
            },
            rag_context_queries: []
          };
          expect(metaprompt.source_trigger).toBe(trigger);
        });
      });

      it('should accept all priority levels', () => {
        // Arrange
        const priorities: UserStoryMetaprompt['user_story']['priority'][] = [
          'low',
          'medium',
          'high',
          'critical'
        ];

        // Assert
        priorities.forEach(priority => {
          const metaprompt: UserStoryMetaprompt = {
            system_role: 'test_driven_agent',
            timestamp: new Date().toISOString(),
            id: generateUniqueId(),
            task_id: 'task-001',
            source_trigger: 'manual',
            user_story: {
              title: 'Test',
              description: 'Test',
              acceptance_criteria: [],
              priority
            },
            rag_context_queries: []
          };
          expect(metaprompt.user_story.priority).toBe(priority);
        });
      });
    });

    describe('CAIMetaprompt', () => {
      it('should accept valid CAI metaprompt', () => {
        // Arrange
        const metaprompt: CAIMetaprompt = {
          system_role: 'cognitive_adaptive_interface',
          timestamp: new Date().toISOString(),
          id: generateUniqueId(),
          objective: 'maximize_conversion',
          target_persona: {
            id: generateUniqueId(),
            name: 'Test User',
            demographics: {},
            pain_points: [],
            motivations: [],
            goals: []
          },
          business_objective: 'Increase signups',
          technical_constraints: {
            wcag_compliance: 'WCAG_2_2_AA',
            semantic_html: true,
            keyboard_accessible: true,
            aria_required: true
          },
          cognitive_fitness_function: {
            principles: []
          }
        };

        // Assert
        expect(metaprompt.system_role).toBe('cognitive_adaptive_interface');
        expect(metaprompt.objective).toBe('maximize_conversion');
        expect(metaprompt.technical_constraints.wcag_compliance).toBe('WCAG_2_2_AA');
      });

      it('should accept all objective types', () => {
        // Arrange
        const objectives: CAIMetaprompt['objective'][] = [
          'maximize_conversion',
          'minimize_friction',
          'maximize_engagement',
          'maximize_delight'
        ];

        // Assert
        objectives.forEach(objective => {
          const metaprompt: CAIMetaprompt = {
            system_role: 'cognitive_adaptive_interface',
            timestamp: new Date().toISOString(),
            id: generateUniqueId(),
            objective,
            target_persona: 'path/to/persona',
            business_objective: 'Test',
            technical_constraints: {
              wcag_compliance: 'WCAG_2_2_AA',
              semantic_html: true,
              keyboard_accessible: true,
              aria_required: true
            },
            cognitive_fitness_function: { principles: [] }
          };
          expect(metaprompt.objective).toBe(objective);
        });
      });
    });

    describe('ErrorContext', () => {
      it('should accept valid error context', () => {
        // Arrange
        const errorContext: ErrorContext = {
          error_message: 'TypeError: Cannot read property x of undefined',
          stack_trace: 'at Object.<anonymous> (file.ts:10:5)',
          error_type: 'runtime',
          file_path: 'src/services/api.ts'
        };

        // Assert
        expect(errorContext.error_message).toContain('TypeError');
        expect(errorContext.error_type).toBe('runtime');
        expect(errorContext.file_path).toContain('.ts');
      });

      it('should accept all error types', () => {
        // Arrange
        const errorTypes: ErrorContext['error_type'][] = [
          'syntax',
          'runtime',
          'logical',
          'test_failure',
          'type_error'
        ];

        // Assert
        errorTypes.forEach(errorType => {
          const context: ErrorContext = {
            error_message: 'Error',
            stack_trace: 'stack',
            error_type: errorType,
            file_path: 'file.ts'
          };
          expect(context.error_type).toBe(errorType);
        });
      });
    });

    describe('RAGQuery', () => {
      it('should accept valid RAG query', () => {
        // Arrange
        const query: RAGQuery = {
          query_id: generateUniqueId(),
          query_text: 'Find authentication patterns',
          query_type: 'code_search'
        };

        // Assert
        expect(query.query_text).toContain('authentication');
        expect(query.query_type).toBe('code_search');
      });

      it('should accept all query types', () => {
        // Arrange
        const queryTypes: RAGQuery['query_type'][] = [
          'code_search',
          'documentation',
          'api_reference',
          'pattern_search',
          'dependency_graph'
        ];

        // Assert
        queryTypes.forEach(queryType => {
          const query: RAGQuery = {
            query_id: generateUniqueId(),
            query_text: 'test query',
            query_type: queryType
          };
          expect(query.query_type).toBe(queryType);
        });
      });
    });

    describe('RAGPlan', () => {
      it('should accept valid RAG plan', () => {
        // Arrange
        const plan: RAGPlan = {
          plan_id: generateUniqueId(),
          original_intent: 'Implement user authentication',
          sub_queries: [
            {
              query_id: generateUniqueId(),
              query_text: 'auth patterns',
              query_type: 'code_search'
            }
          ],
          synthesis_strategy: 'hierarchical'
        };

        // Assert
        expect(plan.original_intent).toContain('authentication');
        expect(plan.sub_queries.length).toBe(1);
        expect(plan.synthesis_strategy).toBe('hierarchical');
      });

      it('should accept all synthesis strategies', () => {
        // Arrange
        const strategies: RAGPlan['synthesis_strategy'][] = [
          'concatenate',
          'summarize',
          'graph_based',
          'hierarchical'
        ];

        // Assert
        strategies.forEach(strategy => {
          const plan: RAGPlan = {
            plan_id: generateUniqueId(),
            original_intent: 'test',
            sub_queries: [],
            synthesis_strategy: strategy
          };
          expect(plan.synthesis_strategy).toBe(strategy);
        });
      });
    });
  });
});
