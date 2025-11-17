// services/agenticRAG.service.ts
// Agentic RAG - Context-Aware Code Generation with Active Planning

import { generateContent } from './geminiService';
import {
  RAGQuery,
  RAGPlan,
  AgenticRAGResult,
  CodeContext,
  generateUniqueId
} from '../types/autonomous';

/**
 * ============================================================================
 * AGENTIC RAG SERVICE
 * ============================================================================
 *
 * Unlike traditional RAG (Retrieval-Augmented Generation), Agentic RAG:
 *
 * 1. ACTIVELY PLANS: Agent decides what queries to execute based on intent
 * 2. MULTI-QUERY EXECUTION: Decomposes complex queries into sub-queries
 * 3. SYNTHESIS: Combines results using graph-based or hierarchical strategies
 * 4. CONTEXT-AWARE: Understands code relationships, dependencies, and patterns
 *
 * This fuses RAG with TDD-as-Prompt to create autonomous developers that:
 * - Understand existing codebase structure
 * - Retrieve relevant APIs, patterns, and examples
 * - Generate contextually appropriate code
 */

export class AgenticRAGService {
  private codebaseIndex: Map<string, CodeContext> = new Map();
  private queryCache: Map<string, CodeContext[]> = new Map();

  /**
   * Main entry point: Execute agentic RAG workflow
   */
  async query(intent: string, options?: {
    language?: string;
    directories?: string[];
    max_depth?: number;
  }): Promise<AgenticRAGResult> {
    console.log(`[AgenticRAG] Processing intent: "${intent}"`);

    // Phase 1: Plan the query strategy
    const plan = await this.planQueryStrategy(intent, options);
    console.log(`[AgenticRAG] Generated plan with ${plan.sub_queries.length} sub-queries`);

    // Phase 2: Execute sub-queries in parallel
    const queryResults = await this.executeSubQueries(plan.sub_queries);

    // Phase 3: Synthesize results
    const synthesizedContext = await this.synthesizeResults(plan, queryResults);

    // Phase 4: Calculate confidence
    const confidenceScore = this.calculateConfidence(queryResults, synthesizedContext);

    const result: AgenticRAGResult = {
      plan,
      query_results: queryResults,
      synthesized_context: synthesizedContext,
      confidence_score: confidenceScore
    };

    console.log(`[AgenticRAG] Query complete. Confidence: ${confidenceScore.toFixed(2)}`);
    return result;
  }

  /**
   * PHASE 1: Plan the query strategy using LLM reasoning
   */
  private async planQueryStrategy(
    intent: string,
    options?: {
      language?: string;
      directories?: string[];
      max_depth?: number;
    }
  ): Promise<RAGPlan> {
    const prompt = `You are an Agentic RAG planner. Your task is to decompose a user's intent into optimal sub-queries for code search.

USER INTENT:
"${intent}"

OPTIONS:
${options ? JSON.stringify(options, null, 2) : 'None'}

PLANNING STRATEGY:

1. DECOMPOSE INTENT:
   - What are the key entities/concepts involved?
   - What code patterns or APIs are likely needed?
   - What dependencies or related modules should we search?

2. GENERATE SUB-QUERIES:
   - Create 2-5 specific sub-queries
   - Each sub-query should target a different aspect of the intent
   - Types: code_search, documentation, api_reference, pattern_search, dependency_graph

3. CHOOSE SYNTHESIS STRATEGY:
   - concatenate: Simple combination for independent results
   - summarize: Extract key information from large results
   - graph_based: Build dependency graph for related code
   - hierarchical: Organize by abstraction level

EXAMPLES:

Intent: "How to implement user authentication with JWT?"
Sub-queries:
1. code_search: "JWT authentication middleware implementation"
2. api_reference: "JWT library API and usage"
3. pattern_search: "authentication flow patterns"
4. documentation: "JWT security best practices"
Synthesis: hierarchical (overview → implementation → security)

Intent: "Find all API endpoints that modify user data"
Sub-queries:
1. code_search: "API routes with user update operations"
2. pattern_search: "database write operations on user table"
3. dependency_graph: "modules that import user model"
Synthesis: graph_based (build call graph)

OUTPUT FORMAT (JSON):
{
  "plan_id": "unique-id",
  "original_intent": "${intent}",
  "sub_queries": [
    {
      "query_id": "query-1",
      "query_text": "specific search query",
      "query_type": "code_search | documentation | api_reference | pattern_search | dependency_graph",
      "filters": {
        "file_extensions": [".ts", ".js"],
        "directories": ["src/auth"],
        "max_results": 10
      }
    }
  ],
  "synthesis_strategy": "concatenate | summarize | graph_based | hierarchical"
}

Generate the RAG plan now.`;

    try {
      const responseJson = await generateContent(prompt, {
        temperature: 0.5,
        response_mime_type: 'application/json'
      });

      const plan: RAGPlan = JSON.parse(responseJson);

      // Apply user-provided options as filters
      if (options) {
        plan.sub_queries = plan.sub_queries.map(q => ({
          ...q,
          filters: {
            ...q.filters,
            ...(options.language && { file_extensions: this.getExtensions(options.language) }),
            ...(options.directories && { directories: options.directories })
          }
        }));
      }

      return plan;
    } catch (error) {
      console.error('[AgenticRAG] Plan generation failed:', error);
      // Fallback to simple query
      return this.createFallbackPlan(intent);
    }
  }

  /**
   * PHASE 2: Execute sub-queries in parallel
   */
  private async executeSubQueries(
    subQueries: RAGQuery[]
  ): Promise<Map<string, CodeContext[]>> {
    const results = new Map<string, CodeContext[]>();

    // Execute queries in parallel
    const promises = subQueries.map(async (query) => {
      const cachedResult = this.queryCache.get(query.query_id);
      if (cachedResult) {
        console.log(`[AgenticRAG] Using cached result for: ${query.query_text}`);
        return { query_id: query.query_id, results: cachedResult };
      }

      const queryResults = await this.executeQuery(query);
      this.queryCache.set(query.query_id, queryResults);

      return { query_id: query.query_id, results: queryResults };
    });

    const resolvedResults = await Promise.all(promises);

    resolvedResults.forEach(({ query_id, results: queryResults }) => {
      results.set(query_id, queryResults);
    });

    return results;
  }

  /**
   * Execute a single RAG query
   */
  private async executeQuery(query: RAGQuery): Promise<CodeContext[]> {
    console.log(`[AgenticRAG] Executing ${query.query_type}: "${query.query_text}"`);

    // In production, this would use:
    // - Vector database (Pinecone, Weaviate, ChromaDB)
    // - Code search engines (Sourcegraph, grep.app)
    // - AST parsers (tree-sitter)
    // - Dependency analyzers

    // For now, simulate with LLM-based search
    const simulatedResults = await this.simulateCodeSearch(query);
    return simulatedResults;
  }

  /**
   * Simulate code search using LLM (placeholder for real search engine)
   */
  private async simulateCodeSearch(query: RAGQuery): Promise<CodeContext[]> {
    const prompt = `You are a code search engine. Find relevant code snippets for this query.

QUERY: "${query.query_text}"
TYPE: ${query.query_type}
FILTERS: ${JSON.stringify(query.filters || {})}

Generate 3-5 relevant code examples that would exist in a real codebase.

OUTPUT FORMAT (JSON array):
[
  {
    "file_path": "src/path/to/file.ts",
    "content": "// Code snippet (10-30 lines)",
    "relevance": 0.95,
    "dependencies": ["dep1", "dep2"],
    "exports": ["export1", "export2"]
  }
]`;

    try {
      const responseJson = await generateContent(prompt, {
        temperature: 0.6,
        response_mime_type: 'application/json'
      });

      const results: CodeContext[] = JSON.parse(responseJson);
      return results;
    } catch (error) {
      console.warn(`[AgenticRAG] Query execution failed: ${query.query_text}`, error);
      return [];
    }
  }

  /**
   * PHASE 3: Synthesize results based on strategy
   */
  private async synthesizeResults(
    plan: RAGPlan,
    queryResults: Map<string, CodeContext[]>
  ): Promise<string> {
    console.log(`[AgenticRAG] Synthesizing results using strategy: ${plan.synthesis_strategy}`);

    switch (plan.synthesis_strategy) {
      case 'concatenate':
        return this.synthesizeConcatenate(queryResults);

      case 'summarize':
        return await this.synthesizeSummarize(plan, queryResults);

      case 'graph_based':
        return await this.synthesizeGraphBased(plan, queryResults);

      case 'hierarchical':
        return await this.synthesizeHierarchical(plan, queryResults);

      default:
        return this.synthesizeConcatenate(queryResults);
    }
  }

  /**
   * Simple concatenation synthesis
   */
  private synthesizeConcatenate(queryResults: Map<string, CodeContext[]>): string {
    let synthesis = '';

    queryResults.forEach((contexts, queryId) => {
      synthesis += `\n\n### Query: ${queryId}\n`;
      contexts.forEach(ctx => {
        synthesis += `\nFile: ${ctx.file_path} (relevance: ${ctx.relevance})\n`;
        synthesis += `\`\`\`\n${ctx.content}\n\`\`\`\n`;
      });
    });

    return synthesis;
  }

  /**
   * Summarize and extract key information
   */
  private async synthesizeSummarize(
    plan: RAGPlan,
    queryResults: Map<string, CodeContext[]>
  ): Promise<string> {
    const concatenated = this.synthesizeConcatenate(queryResults);

    const prompt = `You are a code documentation AI. Summarize the following code search results.

ORIGINAL INTENT: ${plan.original_intent}

CODE SEARCH RESULTS:
${concatenated}

TASK: Create a concise summary that:
1. Explains how to accomplish the original intent
2. References specific code patterns found
3. Highlights key APIs and dependencies
4. Provides a step-by-step approach

OUTPUT: Markdown-formatted summary (max 500 words)`;

    return await generateContent(prompt, { temperature: 0.4 });
  }

  /**
   * Build dependency graph from results
   */
  private async synthesizeGraphBased(
    plan: RAGPlan,
    queryResults: Map<string, CodeContext[]>
  ): Promise<string> {
    // Extract all code contexts
    const allContexts: CodeContext[] = [];
    queryResults.forEach(contexts => allContexts.push(...contexts));

    // Build dependency graph
    const graph: Record<string, string[]> = {};
    allContexts.forEach(ctx => {
      graph[ctx.file_path] = ctx.dependencies;
    });

    const prompt = `You are a code architecture AI. Analyze this dependency graph and explain the architecture.

ORIGINAL INTENT: ${plan.original_intent}

DEPENDENCY GRAPH:
${JSON.stringify(graph, null, 2)}

CODE CONTEXTS:
${allContexts.map(ctx => `
File: ${ctx.file_path}
Exports: ${ctx.exports.join(', ')}
Dependencies: ${ctx.dependencies.join(', ')}
`).join('\n')}

TASK: Explain:
1. The overall architecture revealed by the dependencies
2. Key modules and their roles
3. How data/control flows through the system
4. How to accomplish the original intent within this architecture

OUTPUT: Markdown-formatted architectural analysis`;

    return await generateContent(prompt, { temperature: 0.4 });
  }

  /**
   * Organize results hierarchically
   */
  private async synthesizeHierarchical(
    plan: RAGPlan,
    queryResults: Map<string, CodeContext[]>
  ): Promise<string> {
    const concatenated = this.synthesizeConcatenate(queryResults);

    const prompt = `You are a code documentation AI. Organize the code search results hierarchically.

ORIGINAL INTENT: ${plan.original_intent}

CODE SEARCH RESULTS:
${concatenated}

TASK: Create a hierarchical documentation structure:

# Overview
High-level explanation of the solution

## Core Concepts
Key abstractions and entities

## Implementation Details
Step-by-step breakdown with code examples

### Specific APIs
Detailed API usage

## Best Practices
Security, performance, maintainability considerations

OUTPUT: Complete hierarchical markdown documentation`;

    return await generateContent(prompt, { temperature: 0.5 });
  }

  /**
   * PHASE 4: Calculate confidence score
   */
  private calculateConfidence(
    queryResults: Map<string, CodeContext[]>,
    synthesizedContext: string
  ): number {
    let totalRelevance = 0;
    let contextCount = 0;

    queryResults.forEach(contexts => {
      contexts.forEach(ctx => {
        totalRelevance += ctx.relevance;
        contextCount++;
      });
    });

    if (contextCount === 0) return 0;

    const avgRelevance = totalRelevance / contextCount;

    // Penalize if synthesis is too short (likely failed)
    const lengthFactor = Math.min(1, synthesizedContext.length / 500);

    return avgRelevance * lengthFactor;
  }

  /**
   * ============================================================================
   * HELPER METHODS
   * ============================================================================
   */

  private getExtensions(language: string): string[] {
    const extensionMap: Record<string, string[]> = {
      typescript: ['.ts', '.tsx'],
      javascript: ['.js', '.jsx'],
      python: ['.py'],
      java: ['.java'],
      rust: ['.rs'],
      go: ['.go'],
      cpp: ['.cpp', '.hpp', '.h'],
      csharp: ['.cs']
    };
    return extensionMap[language.toLowerCase()] || [];
  }

  private createFallbackPlan(intent: string): RAGPlan {
    return {
      plan_id: generateUniqueId(),
      original_intent: intent,
      sub_queries: [
        {
          query_id: generateUniqueId(),
          query_text: intent,
          query_type: 'code_search'
        }
      ],
      synthesis_strategy: 'concatenate'
    };
  }

  /**
   * ============================================================================
   * CODEBASE INDEXING (for production use)
   * ============================================================================
   */

  /**
   * Index a codebase for faster RAG queries
   * In production, this would use vector embeddings
   */
  async indexCodebase(files: { path: string; content: string }[]): Promise<void> {
    console.log(`[AgenticRAG] Indexing ${files.length} files`);

    for (const file of files) {
      const context = await this.createCodeContext(file.path, file.content);
      this.codebaseIndex.set(file.path, context);
    }

    console.log(`[AgenticRAG] Indexing complete. ${this.codebaseIndex.size} files indexed.`);
  }

  private async createCodeContext(filePath: string, content: string): Promise<CodeContext> {
    // Extract dependencies and exports using simple regex (in production, use AST)
    const dependencies = this.extractDependencies(content);
    const exports = this.extractExports(content);

    return {
      file_path: filePath,
      content: content.substring(0, 5000), // Limit context size
      relevance: 1.0,
      dependencies,
      exports
    };
  }

  private extractDependencies(content: string): string[] {
    const importRegex = /(?:import|require)\s*\(?['"]([^'"]+)['"]/g;
    const dependencies: string[] = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      dependencies.push(match[1]);
    }

    return [...new Set(dependencies)];
  }

  private extractExports(content: string): string[] {
    const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g;
    const exports: string[] = [];
    let match;

    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    return [...new Set(exports)];
  }

  /**
   * ============================================================================
   * PUBLIC API
   * ============================================================================
   */

  clearCache(): void {
    this.queryCache.clear();
  }

  getIndexSize(): number {
    return this.codebaseIndex.size;
  }
}

/**
 * Singleton instance for global access
 */
export const agenticRAG = new AgenticRAGService();
