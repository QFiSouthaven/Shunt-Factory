// services/flowTracking.service.ts
// FLOW VISUALIZATION: Tracks prompt → shunt → output and action → tool → result flows
// Transforms telemetry events into Draw.io-style diagram data

import { InteractionEvent } from '../types/telemetry';
import { appEventBus } from '../lib/eventBus';
import { Node, Edge } from 'reactflow';

export interface FlowNode extends Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    eventType: string;
    timestamp: string;
    details?: any;
  };
}

export interface FlowEdge extends Edge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

export interface FlowDiagramData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface FlowSession {
  sessionId: string;
  startTime: string;
  flows: FlowDiagramData;
}

/**
 * FlowTrackingService
 *
 * Subscribes to the event bus and transforms telemetry events into
 * visual flow diagrams showing:
 * 1. Prompt → Shunt Button → Output flow
 * 2. Action → Tool → Generated Output flow
 *
 * Uses auto-layout for Draw.io-style positioning.
 */
export class FlowTrackingService {
  private sessions: Map<string, FlowSession> = new Map();
  private currentSessionId: string | null = null;
  private nodeCounter: number = 0;
  private lastNodeId: string | null = null;

  // Layout configuration for Draw.io-style spacing
  private readonly HORIZONTAL_SPACING = 250;
  private readonly VERTICAL_SPACING = 150;
  private readonly START_X = 50;
  private readonly START_Y = 50;

  constructor() {
    this.initializeEventBusListener();
    this.loadPersistedFlows();
  }

  /**
   * Subscribe to telemetry events from the event bus
   */
  private initializeEventBusListener(): void {
    appEventBus.on('telemetry', (event: { type: string; data: InteractionEvent }) => {
      if (event.type === 'interaction_event') {
        this.processInteractionEvent(event.data);
      }
    });
    console.log('FlowTrackingService: Subscribed to telemetry event bus');
  }

  /**
   * Process an interaction event and add it to the flow diagram
   */
  private processInteractionEvent(event: InteractionEvent): void {
    if (!this.currentSessionId || this.currentSessionId !== event.sessionID) {
      this.startNewSession(event.sessionID);
    }

    const session = this.sessions.get(this.currentSessionId!);
    if (!session) return;

    // Transform event into flow nodes and edges based on event type
    if (event.eventType === 'ai_response' && event.interactionType === 'multi_agent_workflow') {
      this.addMultiAgentFlow(session, event);
    } else if (event.eventType === 'ai_response' && event.interactionType === 'shunt_action') {
      this.addShuntFlow(session, event);
    } else if (event.eventType === 'system_action' && event.interactionType === 'tool_call') {
      this.addToolFlow(session, event);
    } else if (event.eventType === 'ai_response' && event.interactionType?.includes('shunt_modular')) {
      this.addShuntFlow(session, event);
    }

    this.persistFlows();
  }

  /**
   * Add a Shunt flow: Input → Shunt Button → Output
   */
  private addShuntFlow(session: FlowSession, event: InteractionEvent): void {
    const flowId = `flow-${this.nodeCounter}`;

    // Node 1: User Input
    const inputNode: FlowNode = {
      id: `${flowId}-input`,
      type: 'input',
      position: this.calculatePosition('input'),
      data: {
        label: this.truncateText(event.userInput as string || 'User Input', 50),
        eventType: 'user_input',
        timestamp: event.timestamp,
        details: { fullText: event.userInput }
      }
    };

    // Node 2: Shunt Action
    const actionNode: FlowNode = {
      id: `${flowId}-action`,
      type: 'default',
      position: this.calculatePosition('action'),
      data: {
        label: `Shunt: ${event.customData?.action || event.interactionType}`,
        eventType: 'shunt_action',
        timestamp: event.timestamp,
        details: {
          model: event.modelUsed,
          tokenUsage: event.tokenUsage,
          priority: event.customData?.priority
        }
      }
    };

    // Node 3: AI Output
    const outputNode: FlowNode = {
      id: `${flowId}-output`,
      type: 'output',
      position: this.calculatePosition('output'),
      data: {
        label: this.truncateText(event.aiOutput as string || 'AI Output', 50),
        eventType: 'ai_output',
        timestamp: event.timestamp,
        details: {
          fullText: event.aiOutput,
          outcome: event.outcome,
          tokenUsage: event.tokenUsage
        }
      }
    };

    // Edges connecting the flow
    const edge1: FlowEdge = {
      id: `${flowId}-edge1`,
      source: inputNode.id,
      target: actionNode.id,
      animated: true,
      label: 'submit'
    };

    const edge2: FlowEdge = {
      id: `${flowId}-edge2`,
      source: actionNode.id,
      target: outputNode.id,
      animated: true,
      label: event.outcome || 'process'
    };

    // Add to session
    session.flows.nodes.push(inputNode, actionNode, outputNode);
    session.flows.edges.push(edge1, edge2);

    this.lastNodeId = outputNode.id;
    this.nodeCounter++;
  }

  /**
   * Add a Multi-Agent Workflow flow: showing orchestration stages
   */
  private addMultiAgentFlow(session: FlowSession, event: InteractionEvent): void {
    const flowId = `flow-${this.nodeCounter}`;
    const workflowSteps = event.customData?.workflowSteps || 12; // Default to 12 stages

    // Node 1: User Input
    const inputNode: FlowNode = {
      id: `${flowId}-input`,
      type: 'input',
      position: this.calculatePosition('input'),
      data: {
        label: this.truncateText(event.userInput as string || 'User Input', 40),
        eventType: 'user_input',
        timestamp: event.timestamp,
        details: { fullText: event.userInput }
      }
    };

    // Node 2: Multi-Agent Orchestrator
    const orchestratorNode: FlowNode = {
      id: `${flowId}-orchestrator`,
      type: 'default',
      position: this.calculatePosition('action'),
      data: {
        label: `Multi-Agent Workflow\n(${workflowSteps} stages)`,
        eventType: 'multi_agent_orchestrator',
        timestamp: event.timestamp,
        details: {
          workflowSteps,
          agreement: event.customData?.agreement,
          validationPassed: event.customData?.validationPassed
        }
      }
    };

    // Node 3: AI Output (with validation badges)
    const validationBadge = event.customData?.validationPassed ? '✓' : '✗';
    const agreementBadge = event.customData?.agreement ? '✓' : '✗';
    const outputNode: FlowNode = {
      id: `${flowId}-output`,
      type: 'output',
      position: this.calculatePosition('output'),
      data: {
        label: `Multi-Agent Output\nValidation: ${validationBadge} Agreement: ${agreementBadge}`,
        eventType: 'multi_agent_output',
        timestamp: event.timestamp,
        details: {
          fullText: event.aiOutput,
          outcome: event.outcome,
          tokenUsage: event.tokenUsage
        }
      }
    };

    // Edges
    const edge1: FlowEdge = {
      id: `${flowId}-edge1`,
      source: inputNode.id,
      target: orchestratorNode.id,
      animated: true,
      label: 'delegate'
    };

    const edge2: FlowEdge = {
      id: `${flowId}-edge2`,
      source: orchestratorNode.id,
      target: outputNode.id,
      animated: true,
      label: 'validated'
    };

    // Add to session
    session.flows.nodes.push(inputNode, orchestratorNode, outputNode);
    session.flows.edges.push(edge1, edge2);

    this.lastNodeId = outputNode.id;
    this.nodeCounter++;
  }

  /**
   * Add a Tool flow: Action → Tool → Result
   */
  private addToolFlow(session: FlowSession, event: InteractionEvent): void {
    const flowId = `flow-${this.nodeCounter}`;

    // Node 1: Action/Command
    const actionNode: FlowNode = {
      id: `${flowId}-action`,
      type: 'input',
      position: this.calculatePosition('input'),
      data: {
        label: `Tool Call: ${event.customData?.toolName || 'Tool'}`,
        eventType: 'tool_action',
        timestamp: event.timestamp,
        details: {
          toolName: event.customData?.toolName,
          args: event.customData?.args
        }
      }
    };

    // Node 2: Tool Execution
    const toolNode: FlowNode = {
      id: `${flowId}-tool`,
      type: 'default',
      position: this.calculatePosition('action'),
      data: {
        label: event.customData?.toolName || 'Execute Tool',
        eventType: 'tool_execution',
        timestamp: event.timestamp,
        details: { args: event.customData?.args }
      }
    };

    // Node 3: Tool Result
    const resultNode: FlowNode = {
      id: `${flowId}-result`,
      type: 'output',
      position: this.calculatePosition('output'),
      data: {
        label: `Result: ${event.outcome}`,
        eventType: 'tool_result',
        timestamp: event.timestamp,
        details: {
          output: event.aiOutput,
          outcome: event.outcome
        }
      }
    };

    // Edges
    const edge1: FlowEdge = {
      id: `${flowId}-edge1`,
      source: actionNode.id,
      target: toolNode.id,
      animated: true,
      label: 'execute'
    };

    const edge2: FlowEdge = {
      id: `${flowId}-edge2`,
      source: toolNode.id,
      target: resultNode.id,
      animated: true,
      label: event.outcome || 'complete'
    };

    // Add to session
    session.flows.nodes.push(actionNode, toolNode, resultNode);
    session.flows.edges.push(edge1, edge2);

    this.lastNodeId = resultNode.id;
    this.nodeCounter++;
  }

  /**
   * Calculate node position using auto-layout algorithm
   * This creates a left-to-right flow with vertical stacking
   */
  private calculatePosition(nodeType: 'input' | 'action' | 'output'): { x: number; y: number } {
    const row = Math.floor(this.nodeCounter / 3); // Stack rows after every 3 complete flows
    const baseY = this.START_Y + (row * this.VERTICAL_SPACING * 4); // 4x spacing for vertical separation

    switch (nodeType) {
      case 'input':
        return { x: this.START_X, y: baseY };
      case 'action':
        return { x: this.START_X + this.HORIZONTAL_SPACING, y: baseY };
      case 'output':
        return { x: this.START_X + (this.HORIZONTAL_SPACING * 2), y: baseY };
      default:
        return { x: this.START_X, y: baseY };
    }
  }

  /**
   * Start tracking a new session
   */
  private startNewSession(sessionId: string): void {
    this.currentSessionId = sessionId;

    if (!this.sessions.has(sessionId)) {
      const newSession: FlowSession = {
        sessionId,
        startTime: new Date().toISOString(),
        flows: { nodes: [], edges: [] }
      };
      this.sessions.set(sessionId, newSession);
      console.log(`FlowTrackingService: Started new session: ${sessionId}`);
    }

    // Reset counters for new session
    this.nodeCounter = 0;
    this.lastNodeId = null;
  }

  /**
   * Get flow data for the current session
   */
  public getCurrentFlows(): FlowDiagramData | null {
    if (!this.currentSessionId) return null;
    const session = this.sessions.get(this.currentSessionId);
    return session ? session.flows : null;
  }

  /**
   * Get flow data for a specific session
   */
  public getSessionFlows(sessionId: string): FlowDiagramData | null {
    const session = this.sessions.get(sessionId);
    return session ? session.flows : null;
  }

  /**
   * Get all sessions
   */
  public getAllSessions(): FlowSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Clear all flows
   */
  public clearAllFlows(): void {
    this.sessions.clear();
    this.currentSessionId = null;
    this.nodeCounter = 0;
    this.lastNodeId = null;
    localStorage.removeItem('flow_tracking_sessions');
    console.log('FlowTrackingService: All flows cleared');
  }

  /**
   * Clear flows for current session only
   */
  public clearCurrentSession(): void {
    if (this.currentSessionId) {
      this.sessions.delete(this.currentSessionId);
      this.currentSessionId = null;
      this.nodeCounter = 0;
      this.lastNodeId = null;
      this.persistFlows();
      console.log('FlowTrackingService: Current session flows cleared');
    }
  }

  /**
   * Persist flows to localStorage
   */
  private persistFlows(): void {
    try {
      const sessionsData = Array.from(this.sessions.entries()).map(([id, session]) => ({
        id,
        session
      }));
      localStorage.setItem('flow_tracking_sessions', JSON.stringify(sessionsData));
    } catch (error) {
      console.warn('FlowTrackingService: Failed to persist flows to localStorage', error);
    }
  }

  /**
   * Load persisted flows from localStorage
   */
  private loadPersistedFlows(): void {
    try {
      const stored = localStorage.getItem('flow_tracking_sessions');
      if (stored) {
        const sessionsData = JSON.parse(stored);
        sessionsData.forEach(({ id, session }: { id: string; session: FlowSession }) => {
          this.sessions.set(id, session);
        });
        console.log(`FlowTrackingService: Loaded ${this.sessions.size} persisted sessions`);
      }
    } catch (error) {
      console.warn('FlowTrackingService: Failed to load persisted flows', error);
    }
  }

  /**
   * Truncate text for display in nodes
   */
  private truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength) + '...';
  }
}

// Singleton instance
let flowTrackingServiceInstance: FlowTrackingService | null = null;

/**
 * Get the global FlowTrackingService instance
 */
export function getFlowTrackingService(): FlowTrackingService {
  if (!flowTrackingServiceInstance) {
    flowTrackingServiceInstance = new FlowTrackingService();
  }
  return flowTrackingServiceInstance;
}

/**
 * Reset the global FlowTrackingService instance (for testing)
 */
export function resetFlowTrackingService(): void {
  flowTrackingServiceInstance = null;
}
