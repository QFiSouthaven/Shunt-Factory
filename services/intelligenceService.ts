/**
 * COMPETITIVE MOAT: Shared Codebase Intelligence Layer
 *
 * This is Aether Shunt's answer to Qodo's proprietary "codebase intelligence layer".
 * Uses RAG (Retrieval-Augmented Generation) to provide full-repository context
 * to all AI modules (Mia, Foundry, Weaver).
 *
 * Strategic Importance:
 * - Elevates platform from "file-centric" to "context-aware"
 * - Enables Mia to find root causes across the entire codebase
 * - Enables Foundry agents to discover existing patterns and reusable components
 * - Enables Weaver to identify existing services for architectural proposals
 *
 * Current Implementation: Client-side vector store (in-memory)
 * Future: Backend integration with Vertex AI Vector Search or Pinecone
 */

import { logFrontendError, ErrorSeverity } from "../utils/errorLogger";

// Types
export interface CodebaseDocument {
  id: string;
  filePath: string;
  content: string;
  type: 'code' | 'documentation' | 'config' | 'test';
  language?: string;
  lastModified: Date;
  metadata?: Record<string, any>;
}

export interface VectorEmbedding {
  documentId: string;
  embedding: number[];
  content: string;
  filePath: string;
}

export interface SearchResult {
  documentId: string;
  filePath: string;
  content: string;
  relevanceScore: number;
  snippet: string;
}

export interface IntelligenceQuery {
  query: string;
  topK?: number; // Number of results to return
  filters?: {
    fileType?: CodebaseDocument['type'][];
    language?: string[];
    filePath?: string; // Regex pattern
  };
}

/**
 * IntelligenceService: RAG-based codebase intelligence
 *
 * Provides semantic search across the entire codebase using vector embeddings.
 */
export class IntelligenceService {
  private documents: Map<string, CodebaseDocument> = new Map();
  private embeddings: Map<string, VectorEmbedding> = new Map();
  private isIndexed: boolean = false;

  // SECURITY: No API keys needed - uses Xenova Transformers for client-side embeddings
  constructor() {
    // Embedding pipeline initialized lazily in generateEmbedding()
  }

  /**
   * Index a codebase document
   *
   * Generates vector embedding and stores it for semantic search.
   *
   * @param document - The code/doc file to index
   */
  async indexDocument(document: CodebaseDocument): Promise<void> {
    try {
      // Store document
      this.documents.set(document.id, document);

      // Generate embedding using Gemini's embedding model
      // Note: In production, use a dedicated embedding model (e.g., text-embedding-004)
      const embedding = await this.generateEmbedding(document.content);

      // Store embedding
      this.embeddings.set(document.id, {
        documentId: document.id,
        embedding,
        content: document.content,
        filePath: document.filePath,
      });

      this.isIndexed = true;
    } catch (error) {
      logFrontendError(error, ErrorSeverity.High, {
        context: 'IntelligenceService.indexDocument',
        documentId: document.id,
      });
      throw error;
    }
  }

  /**
   * Index multiple documents in batch
   *
   * @param documents - Array of documents to index
   */
  async indexDocuments(documents: CodebaseDocument[]): Promise<void> {
    const promises = documents.map(doc => this.indexDocument(doc));
    await Promise.all(promises);
  }

  /**
   * Query the intelligence layer
   *
   * Performs semantic search and returns the most relevant code/docs.
   *
   * @param query - The intelligence query
   * @returns Search results ranked by relevance
   */
  async query(query: IntelligenceQuery): Promise<SearchResult[]> {
    try {
      if (!this.isIndexed || this.embeddings.size === 0) {
        logFrontendError(
          new Error('Intelligence layer not indexed. Call indexDocuments() first.'),
          ErrorSeverity.Medium,
          { context: 'IntelligenceService.query' }
        );
        return [];
      }

      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query.query);

      // Calculate cosine similarity for all documents
      const results: SearchResult[] = [];

      for (const [docId, vecEmbed] of this.embeddings.entries()) {
        const document = this.documents.get(docId);
        if (!document) continue;

        // Apply filters
        if (query.filters) {
          if (query.filters.fileType && !query.filters.fileType.includes(document.type)) {
            continue;
          }
          if (query.filters.language && document.language && !query.filters.language.includes(document.language)) {
            continue;
          }
          if (query.filters.filePath && !new RegExp(query.filters.filePath).test(document.filePath)) {
            continue;
          }
        }

        // Calculate cosine similarity
        const similarity = this.cosineSimilarity(queryEmbedding, vecEmbed.embedding);

        // Extract relevant snippet (first 300 chars for now)
        const snippet = this.extractSnippet(vecEmbed.content, query.query);

        results.push({
          documentId: docId,
          filePath: vecEmbed.filePath,
          content: vecEmbed.content,
          relevanceScore: similarity,
          snippet,
        });
      }

      // Sort by relevance and return top K
      const topK = query.topK || 5;
      return results
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, topK);
    } catch (error) {
      logFrontendError(error, ErrorSeverity.High, {
        context: 'IntelligenceService.query',
        query: query.query,
      });
      throw error;
    }
  }

  /**
   * Find root cause of an error (for Mia)
   *
   * Searches for related code that might be causing the error.
   *
   * @param errorMessage - The error message
   * @param stackTrace - Optional stack trace
   * @returns Relevant code files and their relevance scores
   */
  async findRootCause(errorMessage: string, stackTrace?: string): Promise<SearchResult[]> {
    const query = stackTrace
      ? `${errorMessage}\n\nStack trace:\n${stackTrace}`
      : errorMessage;

    return this.query({
      query,
      topK: 3,
      filters: { fileType: ['code'] },
    });
  }

  /**
   * Find existing patterns (for Foundry agents)
   *
   * Searches for similar code patterns to reuse.
   *
   * @param description - Description of the pattern to find
   * @returns Similar code snippets
   */
  async findExistingPatterns(description: string): Promise<SearchResult[]> {
    return this.query({
      query: description,
      topK: 5,
      filters: { fileType: ['code'] },
    });
  }

  /**
   * Find relevant documentation (for Weaver)
   *
   * Searches for architectural docs and API references.
   *
   * @param topic - The topic to search for
   * @returns Relevant documentation
   */
  async findDocumentation(topic: string): Promise<SearchResult[]> {
    return this.query({
      query: topic,
      topK: 3,
      filters: { fileType: ['documentation'] },
    });
  }

  /**
   * Clear the index
   */
  clearIndex(): void {
    this.documents.clear();
    this.embeddings.clear();
    this.isIndexed = false;
  }

  /**
   * Get index statistics
   */
  getIndexStats(): { documentCount: number; embeddingCount: number; isIndexed: boolean } {
    return {
      documentCount: this.documents.size,
      embeddingCount: this.embeddings.size,
      isIndexed: this.isIndexed,
    };
  }

  // ===== PRIVATE METHODS =====

  /**
   * Generate vector embedding for text
   *
   * TRUST ARCHITECTURE: Real semantic embeddings using Xenova Transformers
   * Runs entirely in the browser - no backend required!
   *
   * Model: all-MiniLM-L6-v2 (384 dimensions, fast, accurate)
   * Performance: ~50ms per embedding on modern browsers
   */
  private embeddingPipeline: any = null;

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Lazy-load the embedding model
      if (!this.embeddingPipeline) {
        const { pipeline } = await import('@xenova/transformers');
        this.embeddingPipeline = await pipeline(
          'feature-extraction',
          'Xenova/all-MiniLM-L6-v2'
        );
      }

      // Truncate text to model's token limit (~512 tokens ≈ 2000 chars)
      const truncatedText = text.slice(0, 2000);

      // Generate embedding
      const output = await this.embeddingPipeline(truncatedText, {
        pooling: 'mean',
        normalize: true,
      });

      // Convert tensor to array
      return Array.from(output.data);
    } catch (error) {
      logFrontendError(error, ErrorSeverity.High, {
        context: 'IntelligenceService.generateEmbedding (Transformers)',
      });

      // Fallback to simple hash-based embedding if transformers fail
      return this.generateFallbackEmbedding(text);
    }
  }

  /**
   * Fallback embedding (hash-based) if transformers fail to load
   */
  private generateFallbackEmbedding(text: string): number[] {
    const embedding: number[] = new Array(384).fill(0); // Match model dimension

    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const index = (charCode + i) % 384;
      embedding[index] += charCode / 1000;
    }

    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / (magnitude || 1));
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      magnitudeA += vecA[i] * vecA[i];
      magnitudeB += vecB[i] * vecB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Extract relevant snippet from content
   */
  private extractSnippet(content: string, query: string, maxLength: number = 300): string {
    // Simple snippet extraction: find first occurrence of query term
    const queryTerms = query.toLowerCase().split(' ');
    const contentLower = content.toLowerCase();

    let bestIndex = 0;
    let maxMatches = 0;

    // Find the position with most query term matches in a window
    for (let i = 0; i < content.length - maxLength; i += 50) {
      const window = contentLower.slice(i, i + maxLength);
      const matches = queryTerms.filter(term => window.includes(term)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestIndex = i;
      }
    }

    let snippet = content.slice(bestIndex, bestIndex + maxLength);

    // Add ellipsis if truncated
    if (bestIndex > 0) snippet = '...' + snippet;
    if (bestIndex + maxLength < content.length) snippet = snippet + '...';

    return snippet.trim();
  }
}

// Singleton instance
let intelligenceServiceInstance: IntelligenceService | null = null;

/**
 * Get the global IntelligenceService instance
 */
export function getIntelligenceService(): IntelligenceService {
  if (!intelligenceServiceInstance) {
    intelligenceServiceInstance = new IntelligenceService();
  }
  return intelligenceServiceInstance;
}

/**
 * Reset the global IntelligenceService instance (for testing)
 */
export function resetIntelligenceService(): void {
  intelligenceServiceInstance = null;
}
