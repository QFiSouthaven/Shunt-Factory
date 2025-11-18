// services/contentFlowTracker.ts

import { v4 as uuidv4 } from 'uuid';

/**
 * Represents a single input→component→output transformation
 */
export interface TransformationNode {
  id: string;
  sourceInputHash: string;      // Hash of the INPUT (to group same-input transformations)
  componentName: string;        // e.g., "Shunt-Amplify", "DeepResearch"
  actionName?: string;          // e.g., "Amplify", "Summarize" (for Shunt actions)
  attemptNumber: number;        // 1, 2, 3, 4... for same input+component
  inputPreview: string;         // First 200 chars of input
  outputPreview: string;        // First 200 chars of output
  fullOutputRef?: string;       // Reference to full content in Chronicle
  timestamp: string;
  tokenUsage?: number;
  modelUsed?: string;           // e.g., "gemini-2.5-pro"
}

/**
 * Groups all transformations of the SAME input
 */
export interface TransformationGroup {
  inputHash: string;
  inputPreview: string;
  transformations: TransformationNode[];
  componentCounts: Record<string, number>;  // How many times each component was used
}

/**
 * A complete workflow session showing all transformation experiments
 */
export interface WorkflowSession {
  sessionId: string;
  startTime: string;
  endTime: string;
  transformationGroups: TransformationGroup[];
  allTransformations: TransformationNode[];
}

/**
 * Service to track transformation experiments - same input through multiple components/attempts
 */
export class ContentFlowTracker {
  private transformations: TransformationNode[] = [];
  private attemptCounts: Map<string, number> = new Map(); // Key: "inputHash-componentName"

  /**
   * Simple hash function for content fingerprinting
   */
  private hashContent(text: string): string {
    // Use first 1000 chars to create a fingerprint
    const sample = text.substring(0, 1000).toLowerCase().trim();

    // Simple hash (in production, use crypto.subtle.digest)
    let hash = 0;
    for (let i = 0; i < sample.length; i++) {
      const char = sample.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  /**
   * Record a transformation: input → component → output
   * Automatically tracks attempt number for same input+component combinations
   */
  recordTransformation(
    componentName: string,
    input: string,
    output: string,
    metadata?: {
      actionName?: string;
      tokenUsage?: number;
      modelUsed?: string;
      contentRef?: string;
    }
  ): TransformationNode {
    const inputHash = this.hashContent(input);
    const key = `${inputHash}-${componentName}${metadata?.actionName ? `-${metadata.actionName}` : ''}`;

    // Increment attempt counter for this input+component combination
    const currentCount = this.attemptCounts.get(key) || 0;
    const attemptNumber = currentCount + 1;
    this.attemptCounts.set(key, attemptNumber);

    const transformation: TransformationNode = {
      id: uuidv4(),
      sourceInputHash: inputHash,
      componentName,
      actionName: metadata?.actionName,
      attemptNumber,
      inputPreview: input.substring(0, 200).trim() + (input.length > 200 ? '...' : ''),
      outputPreview: output.substring(0, 200).trim() + (output.length > 200 ? '...' : ''),
      fullOutputRef: metadata?.contentRef,
      timestamp: new Date().toISOString(),
      tokenUsage: metadata?.tokenUsage,
      modelUsed: metadata?.modelUsed,
    };

    this.transformations.push(transformation);

    // Keep only last 200 transformations to prevent memory bloat
    if (this.transformations.length > 200) {
      this.transformations = this.transformations.slice(-200);
    }

    return transformation;
  }

  /**
   * Group transformations by their source input
   */
  groupByInput(): TransformationGroup[] {
    const groups: Map<string, TransformationGroup> = new Map();

    this.transformations.forEach(t => {
      if (!groups.has(t.sourceInputHash)) {
        groups.set(t.sourceInputHash, {
          inputHash: t.sourceInputHash,
          inputPreview: t.inputPreview,
          transformations: [],
          componentCounts: {},
        });
      }

      const group = groups.get(t.sourceInputHash)!;
      group.transformations.push(t);

      // Update component counts
      const compKey = t.actionName ? `${t.componentName}-${t.actionName}` : t.componentName;
      group.componentCounts[compKey] = (group.componentCounts[compKey] || 0) + 1;
    });

    return Array.from(groups.values());
  }

  /**
   * Build a workflow session from current history
   */
  buildWorkflowSession(sessionId: string): WorkflowSession {
    const transformationGroups = this.groupByInput();

    return {
      sessionId,
      startTime: this.transformations[0]?.timestamp || new Date().toISOString(),
      endTime: this.transformations[this.transformations.length - 1]?.timestamp || new Date().toISOString(),
      transformationGroups,
      allTransformations: [...this.transformations],
    };
  }

  /**
   * Get all transformations for a specific input
   */
  getTransformationsForInput(inputHash: string): TransformationNode[] {
    return this.transformations.filter(t => t.sourceInputHash === inputHash);
  }

  /**
   * Get all transformations for a specific component
   */
  getTransformationsForComponent(componentName: string): TransformationNode[] {
    return this.transformations.filter(t => t.componentName === componentName);
  }

  /**
   * Find the most experimented inputs (most transformations tried)
   */
  getMostExperimentedInputs(limit: number = 5): TransformationGroup[] {
    return this.groupByInput()
      .sort((a, b) => b.transformations.length - a.transformations.length)
      .slice(0, limit);
  }

  /**
   * Clear history (useful for starting fresh session)
   */
  clearHistory(): void {
    this.transformations = [];
    this.attemptCounts.clear();
  }

  /**
   * Get current transformation history
   */
  getHistory(): TransformationNode[] {
    return [...this.transformations];
  }

  /**
   * Export history for persistence
   */
  exportHistory(): string {
    return JSON.stringify({
      transformations: this.transformations,
      attemptCounts: Array.from(this.attemptCounts.entries()),
    }, null, 2);
  }

  /**
   * Import previously saved history
   */
  importHistory(json: string): void {
    try {
      const data = JSON.parse(json);
      if (Array.isArray(data.transformations)) {
        this.transformations = data.transformations;
      }
      if (Array.isArray(data.attemptCounts)) {
        this.attemptCounts = new Map(data.attemptCounts);
      }
    } catch (error) {
      console.error('Failed to import content flow history:', error);
    }
  }
}

// Singleton instance
export const contentFlowTracker = new ContentFlowTracker();
