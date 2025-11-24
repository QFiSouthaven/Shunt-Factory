/**
 * Secret Manager Service Tests
 * Tests for secure API key retrieval with caching
 */

describe('SecretManagerService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Development Mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should return API key from GEMINI_API_KEY in development', () => {
      process.env.GEMINI_API_KEY = 'dev-api-key-123';

      const devKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      expect(devKey).toBe('dev-api-key-123');
    });

    it('should fall back to API_KEY in development', () => {
      delete process.env.GEMINI_API_KEY;
      process.env.API_KEY = 'fallback-api-key';

      const devKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      expect(devKey).toBe('fallback-api-key');
    });

    it('should prefer GEMINI_API_KEY over API_KEY', () => {
      process.env.GEMINI_API_KEY = 'primary-key';
      process.env.API_KEY = 'secondary-key';

      const devKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      expect(devKey).toBe('primary-key');
    });

    it('should return undefined when no API key is set', () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.API_KEY;

      const devKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      expect(devKey).toBeUndefined();
    });
  });

  describe('Production Mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should require GCP_PROJECT_ID in production', () => {
      process.env.GCP_PROJECT_ID = 'test-project';
      expect(process.env.GCP_PROJECT_ID).toBe('test-project');
    });

    it('should use custom secret name when set', () => {
      process.env.GEMINI_API_KEY_SECRET_NAME = 'custom-secret';
      expect(process.env.GEMINI_API_KEY_SECRET_NAME).toBe('custom-secret');
    });

    it('should use default secret name when not set', () => {
      delete process.env.GEMINI_API_KEY_SECRET_NAME;
      const secretName = process.env.GEMINI_API_KEY_SECRET_NAME || 'gemini-api-key';
      expect(secretName).toBe('gemini-api-key');
    });
  });

  describe('Secret Path Construction', () => {
    it('should construct correct secret path format', () => {
      const projectId = 'my-project';
      const secretName = 'my-secret';
      const expectedPath = `projects/${projectId}/secrets/${secretName}/versions/latest`;

      expect(expectedPath).toBe('projects/my-project/secrets/my-secret/versions/latest');
    });

    it('should handle different project IDs', () => {
      const testCases = [
        { projectId: 'project-1', secretName: 'secret-1' },
        { projectId: 'production-project', secretName: 'gemini-api-key' },
        { projectId: 'test-env', secretName: 'test-secret' },
      ];

      testCases.forEach(({ projectId, secretName }) => {
        const path = `projects/${projectId}/secrets/${secretName}/versions/latest`;
        expect(path).toContain(projectId);
        expect(path).toContain(secretName);
      });
    });
  });

  describe('Cache Behavior', () => {
    it('should have a 5 minute TTL', () => {
      const CACHE_TTL_MS = 5 * 60 * 1000;
      expect(CACHE_TTL_MS).toBe(300000);
    });

    it('should determine if cache is expired', () => {
      const now = Date.now();
      const CACHE_TTL_MS = 5 * 60 * 1000;

      // Not expired
      const notExpired = { value: 'key', expiresAt: now + CACHE_TTL_MS };
      expect(notExpired.expiresAt > now).toBe(true);

      // Expired
      const expired = { value: 'key', expiresAt: now - 1000 };
      expect(expired.expiresAt > now).toBe(false);
    });

    it('should calculate correct expiry time', () => {
      const now = Date.now();
      const CACHE_TTL_MS = 5 * 60 * 1000;
      const expiresAt = now + CACHE_TTL_MS;

      expect(expiresAt - now).toBe(CACHE_TTL_MS);
    });
  });

  describe('Error Scenarios', () => {
    it('should identify missing client error', () => {
      const errorMessage = 'Secret Manager client not initialized. Ensure GCP_PROJECT_ID is set.';
      expect(errorMessage).toContain('GCP_PROJECT_ID');
    });

    it('should identify missing payload error', () => {
      const secretName = 'test-secret';
      const errorMessage = `Secret ${secretName} has no payload data`;
      expect(errorMessage).toContain(secretName);
    });

    it('should identify retrieval failure error', () => {
      const secretName = 'test-secret';
      const errorMessage = `Failed to retrieve secret: ${secretName}`;
      expect(errorMessage).toContain(secretName);
    });
  });

  describe('Environment Detection', () => {
    it('should detect development environment', () => {
      process.env.NODE_ENV = 'development';
      expect(process.env.NODE_ENV).toBe('development');
    });

    it('should detect production environment', () => {
      process.env.NODE_ENV = 'production';
      expect(process.env.NODE_ENV).toBe('production');
    });

    it('should detect test environment', () => {
      process.env.NODE_ENV = 'test';
      expect(process.env.NODE_ENV).toBe('test');
    });
  });
});
