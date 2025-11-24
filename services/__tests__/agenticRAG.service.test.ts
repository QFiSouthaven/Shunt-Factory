import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AgenticRAGService, agenticRAG } from '../agenticRAG.service';
import * as geminiService from '../geminiService';
import { generateUniqueId } from '../../types/autonomous';

// Mock geminiService
vi.mock('../geminiService', () => ({
  generateContent: vi.fn()
}));

/**
 * Tests for AgenticRAGService
 *
 * Tests cover:
 * - Query planning and execution
 * - Multi-query parallel execution
 * - Synthesis strategies
 * - Codebase indexing
 * - Caching
 */

describe('AgenticRAGService', () => {
  let service: AgenticRAGService;
  const mockGenerateContent = vi.mocked(geminiService.generateContent);

  beforeEach(() => {
    service = new AgenticRAGService();
    vi.clearAllMocks();

    // Default mock responses
    mockGenerateContent.mockImplementation(async (prompt: string) => {
      if (prompt.includes('Agentic RAG planner')) {
        return JSON.stringify({
          plan_id: generateUniqueId(),
          original_intent: 'test intent',
          sub_queries: [
            {
              query_id: generateUniqueId(),
              query_text: 'test query 1',
              query_type: 'code_search',
              filters: { file_extensions: ['.ts'] }
            },
            {
              query_id: generateUniqueId(),
              query_text: 'test query 2',
              query_type: 'documentation'
            }
          ],
          synthesis_strategy: 'concatenate'
        });
      }
      if (prompt.includes('code search engine')) {
        return JSON.stringify([
          {
            file_path: 'src/utils/helper.ts',
            content: 'export const helper = () => {};',
            relevance: 0.9,
            dependencies: ['lodash'],
            exports: ['helper']
          }
        ]);
      }
      if (prompt.includes('code documentation AI') || prompt.includes('Summarize')) {
        return '## Summary\n\nThis code implements helper utilities.';
      }
      if (prompt.includes('code architecture AI')) {
        return '## Architecture\n\nModular design with clear separation of concerns.';
      }
      if (prompt.includes('hierarchical documentation')) {
        return '# Overview\n\n## Implementation\n\nDetails here.';
      }
      return '{}';
    });
  });

  afterEach(() => {
    service.clearCache();
  });

  describe('Singleton Instance', () => {
    it('should export a singleton instance', () => {
      // Assert
      expect(agenticRAG).toBeDefined();
      expect(agenticRAG).toBeInstanceOf(AgenticRAGService);
    });
  });

  describe('query', () => {
    it('should execute agentic RAG query and return result', async () => {
      // Arrange
      const intent = 'Find authentication patterns';

      // Act
      const result = await service.query(intent);

      // Assert
      expect(result).toBeDefined();
      expect(result.plan).toBeDefined();
      expect(result.query_results).toBeDefined();
      expect(result.synthesized_context).toBeDefined();
      expect(result.confidence_score).toBeDefined();
    });

    it('should generate query plan from intent', async () => {
      // Arrange
      const intent = 'Implement user login';

      // Act
      const result = await service.query(intent);

      // Assert
      expect(result.plan.original_intent).toBeDefined();
      expect(result.plan.sub_queries.length).toBeGreaterThan(0);
      expect(result.plan.synthesis_strategy).toBeDefined();
    });

    it('should execute sub-queries in parallel', async () => {
      // Arrange
      const intent = 'Search for API endpoints';
      const executionOrder: string[] = [];

      mockGenerateContent.mockImplementation(async (prompt: string) => {
        if (prompt.includes('Agentic RAG planner')) {
          return JSON.stringify({
            plan_id: generateUniqueId(),
            original_intent: intent,
            sub_queries: [
              { query_id: 'q1', query_text: 'query 1', query_type: 'code_search' },
              { query_id: 'q2', query_text: 'query 2', query_type: 'documentation' },
              { query_id: 'q3', query_text: 'query 3', query_type: 'api_reference' }
            ],
            synthesis_strategy: 'concatenate'
          });
        }
        if (prompt.includes('code search engine')) {
          executionOrder.push('executed');
          return JSON.stringify([{
            file_path: 'file.ts',
            content: 'code',
            relevance: 0.8,
            dependencies: [],
            exports: []
          }]);
        }
        return '{}';
      });

      // Act
      await service.query(intent);

      // Assert - all queries should execute
      expect(executionOrder.length).toBe(3);
    });

    it('should apply language filter from options', async () => {
      // Arrange
      const intent = 'Find patterns';
      const options = { language: 'typescript' };

      // Act
      const result = await service.query(intent, options);

      // Assert
      const subQuery = result.plan.sub_queries[0];
      expect(subQuery.filters?.file_extensions).toContain('.ts');
    });

    it('should apply directory filter from options', async () => {
      // Arrange
      const intent = 'Find patterns';
      const options = { directories: ['src/components'] };

      // Act
      const result = await service.query(intent, options);

      // Assert
      const subQuery = result.plan.sub_queries[0];
      expect(subQuery.filters?.directories).toContain('src/components');
    });

    it('should calculate confidence score', async () => {
      // Arrange
      const intent = 'Test query';

      // Act
      const result = await service.query(intent);

      // Assert
      expect(result.confidence_score).toBeGreaterThanOrEqual(0);
      expect(result.confidence_score).toBeLessThanOrEqual(1);
    });

    it('should handle plan generation failure with fallback', async () => {
      // Arrange
      const intent = 'Test query';
      let callCount = 0;

      mockGenerateContent.mockImplementation(async (prompt: string) => {
        if (prompt.includes('Agentic RAG planner')) {
          callCount++;
          throw new Error('Planning failed');
        }
        if (prompt.includes('code search engine')) {
          return JSON.stringify([{
            file_path: 'file.ts',
            content: 'code',
            relevance: 0.8,
            dependencies: [],
            exports: []
          }]);
        }
        return '{}';
      });

      // Act
      const result = await service.query(intent);

      // Assert - should use fallback plan
      expect(result.plan).toBeDefined();
      expect(result.plan.sub_queries.length).toBe(1);
      expect(result.plan.synthesis_strategy).toBe('concatenate');
    });

    it('should handle query execution failure gracefully', async () => {
      // Arrange
      const intent = 'Test query';

      mockGenerateContent.mockImplementation(async (prompt: string) => {
        if (prompt.includes('Agentic RAG planner')) {
          return JSON.stringify({
            plan_id: generateUniqueId(),
            original_intent: intent,
            sub_queries: [
              { query_id: 'q1', query_text: 'query', query_type: 'code_search' }
            ],
            synthesis_strategy: 'concatenate'
          });
        }
        if (prompt.includes('code search engine')) {
          throw new Error('Query failed');
        }
        return '{}';
      });

      // Act
      const result = await service.query(intent);

      // Assert - should return empty results for failed query
      expect(result.query_results.get('q1')).toEqual([]);
    });
  });

  describe('Synthesis Strategies', () => {
    describe('concatenate', () => {
      it('should concatenate results from all queries', async () => {
        // Arrange
        mockGenerateContent.mockImplementation(async (prompt: string) => {
          if (prompt.includes('Agentic RAG planner')) {
            return JSON.stringify({
              plan_id: generateUniqueId(),
              original_intent: 'test',
              sub_queries: [
                { query_id: 'q1', query_text: 'query', query_type: 'code_search' }
              ],
              synthesis_strategy: 'concatenate'
            });
          }
          if (prompt.includes('code search engine')) {
            return JSON.stringify([{
              file_path: 'file.ts',
              content: 'test code',
              relevance: 0.9,
              dependencies: [],
              exports: []
            }]);
          }
          return '{}';
        });

        // Act
        const result = await service.query('test');

        // Assert
        expect(result.synthesized_context).toContain('file.ts');
        expect(result.synthesized_context).toContain('test code');
      });
    });

    describe('summarize', () => {
      it('should summarize results', async () => {
        // Arrange
        mockGenerateContent.mockImplementation(async (prompt: string) => {
          if (prompt.includes('Agentic RAG planner')) {
            return JSON.stringify({
              plan_id: generateUniqueId(),
              original_intent: 'test',
              sub_queries: [
                { query_id: 'q1', query_text: 'query', query_type: 'code_search' }
              ],
              synthesis_strategy: 'summarize'
            });
          }
          if (prompt.includes('code search engine')) {
            return JSON.stringify([{
              file_path: 'file.ts',
              content: 'code',
              relevance: 0.8,
              dependencies: [],
              exports: []
            }]);
          }
          if (prompt.includes('Summarize')) {
            return '## Summary\n\nConcise summary of the code.';
          }
          return '{}';
        });

        // Act
        const result = await service.query('test');

        // Assert
        expect(result.synthesized_context).toContain('Summary');
      });
    });

    describe('graph_based', () => {
      it('should build dependency graph', async () => {
        // Arrange
        mockGenerateContent.mockImplementation(async (prompt: string) => {
          if (prompt.includes('Agentic RAG planner')) {
            return JSON.stringify({
              plan_id: generateUniqueId(),
              original_intent: 'test',
              sub_queries: [
                { query_id: 'q1', query_text: 'query', query_type: 'dependency_graph' }
              ],
              synthesis_strategy: 'graph_based'
            });
          }
          if (prompt.includes('code search engine')) {
            return JSON.stringify([{
              file_path: 'src/a.ts',
              content: 'import { b } from "./b"',
              relevance: 0.9,
              dependencies: ['./b'],
              exports: ['a']
            }]);
          }
          if (prompt.includes('code architecture AI')) {
            return '## Architecture\n\nGraph analysis of dependencies.';
          }
          return '{}';
        });

        // Act
        const result = await service.query('test');

        // Assert
        expect(result.synthesized_context).toContain('Architecture');
      });
    });

    describe('hierarchical', () => {
      it('should organize results hierarchically', async () => {
        // Arrange
        mockGenerateContent.mockImplementation(async (prompt: string) => {
          if (prompt.includes('Agentic RAG planner')) {
            return JSON.stringify({
              plan_id: generateUniqueId(),
              original_intent: 'test',
              sub_queries: [
                { query_id: 'q1', query_text: 'query', query_type: 'documentation' }
              ],
              synthesis_strategy: 'hierarchical'
            });
          }
          if (prompt.includes('code search engine')) {
            return JSON.stringify([{
              file_path: 'docs/readme.md',
              content: 'documentation',
              relevance: 0.9,
              dependencies: [],
              exports: []
            }]);
          }
          if (prompt.includes('hierarchical documentation')) {
            return '# Overview\n\n## Core Concepts\n\n### Details';
          }
          return '{}';
        });

        // Act
        const result = await service.query('test');

        // Assert
        expect(result.synthesized_context).toContain('Overview');
      });
    });
  });

  describe('Caching', () => {
    it('should cache query results', async () => {
      // Arrange
      let queryCount = 0;

      mockGenerateContent.mockImplementation(async (prompt: string) => {
        if (prompt.includes('Agentic RAG planner')) {
          return JSON.stringify({
            plan_id: generateUniqueId(),
            original_intent: 'test',
            sub_queries: [
              { query_id: 'cached-query', query_text: 'query', query_type: 'code_search' }
            ],
            synthesis_strategy: 'concatenate'
          });
        }
        if (prompt.includes('code search engine')) {
          queryCount++;
          return JSON.stringify([{
            file_path: 'file.ts',
            content: 'code',
            relevance: 0.8,
            dependencies: [],
            exports: []
          }]);
        }
        return '{}';
      });

      // Act - execute same query twice
      await service.query('test');
      await service.query('test');

      // Assert - query should only execute once due to caching
      expect(queryCount).toBe(1);
    });

    it('should clear cache', async () => {
      // Arrange
      let queryCount = 0;

      mockGenerateContent.mockImplementation(async (prompt: string) => {
        if (prompt.includes('Agentic RAG planner')) {
          return JSON.stringify({
            plan_id: generateUniqueId(),
            original_intent: 'test',
            sub_queries: [
              { query_id: 'q1', query_text: 'query', query_type: 'code_search' }
            ],
            synthesis_strategy: 'concatenate'
          });
        }
        if (prompt.includes('code search engine')) {
          queryCount++;
          return JSON.stringify([{
            file_path: 'file.ts',
            content: 'code',
            relevance: 0.8,
            dependencies: [],
            exports: []
          }]);
        }
        return '{}';
      });

      // Act
      await service.query('test');
      service.clearCache();
      await service.query('test');

      // Assert - query should execute twice after cache clear
      expect(queryCount).toBe(2);
    });
  });

  describe('indexCodebase', () => {
    it('should index files', async () => {
      // Arrange
      const files = [
        { path: 'src/a.ts', content: 'export const a = 1;' },
        { path: 'src/b.ts', content: 'import { a } from "./a"; export const b = a;' }
      ];

      // Act
      await service.indexCodebase(files);

      // Assert
      expect(service.getIndexSize()).toBe(2);
    });

    it('should extract dependencies from indexed files', async () => {
      // Arrange
      const files = [
        { path: 'src/test.ts', content: 'import lodash from "lodash";\nimport { util } from "./util";' }
      ];

      // Act
      await service.indexCodebase(files);

      // Assert
      expect(service.getIndexSize()).toBe(1);
    });

    it('should extract exports from indexed files', async () => {
      // Arrange
      const files = [
        { path: 'src/test.ts', content: 'export const foo = 1;\nexport function bar() {}\nexport class Baz {}' }
      ];

      // Act
      await service.indexCodebase(files);

      // Assert
      expect(service.getIndexSize()).toBe(1);
    });

    it('should truncate large file content', async () => {
      // Arrange
      const largeContent = 'x'.repeat(10000);
      const files = [
        { path: 'src/large.ts', content: largeContent }
      ];

      // Act
      await service.indexCodebase(files);

      // Assert
      expect(service.getIndexSize()).toBe(1);
    });
  });

  describe('getIndexSize', () => {
    it('should return 0 before indexing', () => {
      // Act
      const size = service.getIndexSize();

      // Assert
      expect(size).toBe(0);
    });

    it('should return correct size after indexing', async () => {
      // Arrange
      const files = [
        { path: 'a.ts', content: 'a' },
        { path: 'b.ts', content: 'b' },
        { path: 'c.ts', content: 'c' }
      ];

      // Act
      await service.indexCodebase(files);

      // Assert
      expect(service.getIndexSize()).toBe(3);
    });
  });

  describe('Language Extensions', () => {
    it('should map typescript to .ts and .tsx', async () => {
      // Arrange
      const intent = 'test';
      const options = { language: 'typescript' };

      // Act
      const result = await service.query(intent, options);

      // Assert
      const extensions = result.plan.sub_queries[0].filters?.file_extensions;
      expect(extensions).toContain('.ts');
      expect(extensions).toContain('.tsx');
    });

    it('should map javascript to .js and .jsx', async () => {
      // Arrange
      const intent = 'test';
      const options = { language: 'javascript' };

      // Act
      const result = await service.query(intent, options);

      // Assert
      const extensions = result.plan.sub_queries[0].filters?.file_extensions;
      expect(extensions).toContain('.js');
      expect(extensions).toContain('.jsx');
    });

    it('should map python to .py', async () => {
      // Arrange
      const intent = 'test';
      const options = { language: 'python' };

      // Act
      const result = await service.query(intent, options);

      // Assert
      const extensions = result.plan.sub_queries[0].filters?.file_extensions;
      expect(extensions).toContain('.py');
    });

    it('should handle unknown languages gracefully', async () => {
      // Arrange
      const intent = 'test';
      const options = { language: 'unknown_language' };

      // Act
      const result = await service.query(intent, options);

      // Assert
      const extensions = result.plan.sub_queries[0].filters?.file_extensions;
      expect(extensions).toEqual([]);
    });
  });

  describe('Query Types', () => {
    it('should handle code_search queries', async () => {
      // Arrange
      mockGenerateContent.mockImplementation(async (prompt: string) => {
        if (prompt.includes('Agentic RAG planner')) {
          return JSON.stringify({
            plan_id: generateUniqueId(),
            original_intent: 'test',
            sub_queries: [
              { query_id: 'q1', query_text: 'query', query_type: 'code_search' }
            ],
            synthesis_strategy: 'concatenate'
          });
        }
        return JSON.stringify([{ file_path: 'f.ts', content: 'c', relevance: 0.9, dependencies: [], exports: [] }]);
      });

      // Act
      const result = await service.query('test');

      // Assert
      expect(result.query_results.size).toBe(1);
    });

    it('should handle documentation queries', async () => {
      // Arrange
      mockGenerateContent.mockImplementation(async (prompt: string) => {
        if (prompt.includes('Agentic RAG planner')) {
          return JSON.stringify({
            plan_id: generateUniqueId(),
            original_intent: 'test',
            sub_queries: [
              { query_id: 'q1', query_text: 'query', query_type: 'documentation' }
            ],
            synthesis_strategy: 'concatenate'
          });
        }
        return JSON.stringify([{ file_path: 'doc.md', content: 'docs', relevance: 0.8, dependencies: [], exports: [] }]);
      });

      // Act
      const result = await service.query('test');

      // Assert
      expect(result.query_results.size).toBe(1);
    });

    it('should handle api_reference queries', async () => {
      // Arrange
      mockGenerateContent.mockImplementation(async (prompt: string) => {
        if (prompt.includes('Agentic RAG planner')) {
          return JSON.stringify({
            plan_id: generateUniqueId(),
            original_intent: 'test',
            sub_queries: [
              { query_id: 'q1', query_text: 'query', query_type: 'api_reference' }
            ],
            synthesis_strategy: 'concatenate'
          });
        }
        return JSON.stringify([{ file_path: 'api.ts', content: 'api', relevance: 0.85, dependencies: [], exports: [] }]);
      });

      // Act
      const result = await service.query('test');

      // Assert
      expect(result.query_results.size).toBe(1);
    });

    it('should handle pattern_search queries', async () => {
      // Arrange
      mockGenerateContent.mockImplementation(async (prompt: string) => {
        if (prompt.includes('Agentic RAG planner')) {
          return JSON.stringify({
            plan_id: generateUniqueId(),
            original_intent: 'test',
            sub_queries: [
              { query_id: 'q1', query_text: 'query', query_type: 'pattern_search' }
            ],
            synthesis_strategy: 'concatenate'
          });
        }
        return JSON.stringify([{ file_path: 'pat.ts', content: 'pattern', relevance: 0.7, dependencies: [], exports: [] }]);
      });

      // Act
      const result = await service.query('test');

      // Assert
      expect(result.query_results.size).toBe(1);
    });

    it('should handle dependency_graph queries', async () => {
      // Arrange
      mockGenerateContent.mockImplementation(async (prompt: string) => {
        if (prompt.includes('Agentic RAG planner')) {
          return JSON.stringify({
            plan_id: generateUniqueId(),
            original_intent: 'test',
            sub_queries: [
              { query_id: 'q1', query_text: 'query', query_type: 'dependency_graph' }
            ],
            synthesis_strategy: 'concatenate'
          });
        }
        return JSON.stringify([{ file_path: 'dep.ts', content: 'deps', relevance: 0.75, dependencies: ['a', 'b'], exports: [] }]);
      });

      // Act
      const result = await service.query('test');

      // Assert
      expect(result.query_results.size).toBe(1);
    });
  });

  describe('Confidence Calculation', () => {
    it('should return 0 for empty results', async () => {
      // Arrange
      mockGenerateContent.mockImplementation(async (prompt: string) => {
        if (prompt.includes('Agentic RAG planner')) {
          return JSON.stringify({
            plan_id: generateUniqueId(),
            original_intent: 'test',
            sub_queries: [
              { query_id: 'q1', query_text: 'query', query_type: 'code_search' }
            ],
            synthesis_strategy: 'concatenate'
          });
        }
        if (prompt.includes('code search engine')) {
          return '[]'; // Empty results
        }
        return '{}';
      });

      // Act
      const result = await service.query('test');

      // Assert
      expect(result.confidence_score).toBe(0);
    });

    it('should factor in synthesis length', async () => {
      // Arrange - results with good relevance but short synthesis
      mockGenerateContent.mockImplementation(async (prompt: string) => {
        if (prompt.includes('Agentic RAG planner')) {
          return JSON.stringify({
            plan_id: generateUniqueId(),
            original_intent: 'test',
            sub_queries: [
              { query_id: 'q1', query_text: 'query', query_type: 'code_search' }
            ],
            synthesis_strategy: 'concatenate'
          });
        }
        if (prompt.includes('code search engine')) {
          return JSON.stringify([{
            file_path: 'f.ts',
            content: 'x', // Very short
            relevance: 1.0,
            dependencies: [],
            exports: []
          }]);
        }
        return '{}';
      });

      // Act
      const result = await service.query('test');

      // Assert - confidence should be penalized for short synthesis
      expect(result.confidence_score).toBeLessThan(1.0);
    });
  });
});
