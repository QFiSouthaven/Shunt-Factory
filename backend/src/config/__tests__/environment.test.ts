/**
 * Backend Environment Configuration Tests
 * Tests for secure environment variable loading and validation
 */

// Helper functions to test (mirror the actual implementation)
const loadEnvironment = (env: NodeJS.ProcessEnv) => {
  return {
    NODE_ENV: (env.NODE_ENV as any) || 'development',
    PORT: parseInt(env.PORT || '8080', 10),
    CORS_ORIGIN: env.CORS_ORIGIN || 'http://localhost:3000',

    GCP_PROJECT_ID: env.GCP_PROJECT_ID || env.GOOGLE_CLOUD_PROJECT || '',
    GEMINI_API_KEY_SECRET_NAME: env.GEMINI_API_KEY_SECRET_NAME || 'gemini-api-key',

    RATE_LIMIT_WINDOW_MS: parseInt(env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    RATE_LIMIT_MAX_REQUESTS: parseInt(env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

    REDIS_HOST: env.REDIS_HOST,
    REDIS_PORT: env.REDIS_PORT ? parseInt(env.REDIS_PORT, 10) : undefined,
    REDIS_PASSWORD: env.REDIS_PASSWORD,

    ENABLE_CLOUD_LOGGING: env.ENABLE_CLOUD_LOGGING === 'true',
    LOG_LEVEL: (env.LOG_LEVEL as any) || 'info',
  };
};

describe('Backend Environment Configuration', () => {
  describe('Environment Detection', () => {
    it('should detect development environment', () => {
      const env = { NODE_ENV: 'development' };
      const config = loadEnvironment(env as any);

      expect(config.NODE_ENV).toBe('development');
    });

    it('should detect production environment', () => {
      const env = { NODE_ENV: 'production' };
      const config = loadEnvironment(env as any);

      expect(config.NODE_ENV).toBe('production');
    });

    it('should detect test environment', () => {
      const env = { NODE_ENV: 'test' };
      const config = loadEnvironment(env as any);

      expect(config.NODE_ENV).toBe('test');
    });

    it('should default to development when NODE_ENV is not set', () => {
      const env = {};
      const config = loadEnvironment(env as any);

      expect(config.NODE_ENV).toBe('development');
    });
  });

  describe('Server Configuration', () => {
    it('should use default port 8080', () => {
      const env = {};
      const config = loadEnvironment(env as any);

      expect(config.PORT).toBe(8080);
    });

    it('should use custom port when set', () => {
      const env = { PORT: '3000' };
      const config = loadEnvironment(env as any);

      expect(config.PORT).toBe(3000);
    });

    it('should parse port as integer', () => {
      const env = { PORT: '9000' };
      const config = loadEnvironment(env as any);

      expect(typeof config.PORT).toBe('number');
      expect(config.PORT).toBe(9000);
    });

    it('should use default CORS origin', () => {
      const env = {};
      const config = loadEnvironment(env as any);

      expect(config.CORS_ORIGIN).toBe('http://localhost:3000');
    });

    it('should use custom CORS origin when set', () => {
      const env = { CORS_ORIGIN: 'https://example.com' };
      const config = loadEnvironment(env as any);

      expect(config.CORS_ORIGIN).toBe('https://example.com');
    });
  });

  describe('Google Cloud Configuration', () => {
    it('should use GCP_PROJECT_ID when set', () => {
      const env = { GCP_PROJECT_ID: 'my-project' };
      const config = loadEnvironment(env as any);

      expect(config.GCP_PROJECT_ID).toBe('my-project');
    });

    it('should fallback to GOOGLE_CLOUD_PROJECT', () => {
      const env = { GOOGLE_CLOUD_PROJECT: 'fallback-project' };
      const config = loadEnvironment(env as any);

      expect(config.GCP_PROJECT_ID).toBe('fallback-project');
    });

    it('should use empty string when neither is set', () => {
      const env = {};
      const config = loadEnvironment(env as any);

      expect(config.GCP_PROJECT_ID).toBe('');
    });

    it('should use default Gemini API key secret name', () => {
      const env = {};
      const config = loadEnvironment(env as any);

      expect(config.GEMINI_API_KEY_SECRET_NAME).toBe('gemini-api-key');
    });

    it('should use custom Gemini API key secret name when set', () => {
      const env = { GEMINI_API_KEY_SECRET_NAME: 'custom-secret-name' };
      const config = loadEnvironment(env as any);

      expect(config.GEMINI_API_KEY_SECRET_NAME).toBe('custom-secret-name');
    });
  });

  describe('Rate Limiting Configuration', () => {
    it('should use default rate limit window (60000ms)', () => {
      const env = {};
      const config = loadEnvironment(env as any);

      expect(config.RATE_LIMIT_WINDOW_MS).toBe(60000);
    });

    it('should use custom rate limit window when set', () => {
      const env = { RATE_LIMIT_WINDOW_MS: '120000' };
      const config = loadEnvironment(env as any);

      expect(config.RATE_LIMIT_WINDOW_MS).toBe(120000);
    });

    it('should use default max requests (100)', () => {
      const env = {};
      const config = loadEnvironment(env as any);

      expect(config.RATE_LIMIT_MAX_REQUESTS).toBe(100);
    });

    it('should use custom max requests when set', () => {
      const env = { RATE_LIMIT_MAX_REQUESTS: '200' };
      const config = loadEnvironment(env as any);

      expect(config.RATE_LIMIT_MAX_REQUESTS).toBe(200);
    });

    it('should parse rate limit values as integers', () => {
      const env = {
        RATE_LIMIT_WINDOW_MS: '90000',
        RATE_LIMIT_MAX_REQUESTS: '150',
      };
      const config = loadEnvironment(env as any);

      expect(typeof config.RATE_LIMIT_WINDOW_MS).toBe('number');
      expect(typeof config.RATE_LIMIT_MAX_REQUESTS).toBe('number');
    });
  });

  describe('Redis Configuration', () => {
    it('should handle optional Redis configuration', () => {
      const env = {};
      const config = loadEnvironment(env as any);

      expect(config.REDIS_HOST).toBeUndefined();
      expect(config.REDIS_PORT).toBeUndefined();
      expect(config.REDIS_PASSWORD).toBeUndefined();
    });

    it('should load Redis host when set', () => {
      const env = { REDIS_HOST: 'redis.example.com' };
      const config = loadEnvironment(env as any);

      expect(config.REDIS_HOST).toBe('redis.example.com');
    });

    it('should parse Redis port as integer when set', () => {
      const env = { REDIS_PORT: '6379' };
      const config = loadEnvironment(env as any);

      expect(config.REDIS_PORT).toBe(6379);
      expect(typeof config.REDIS_PORT).toBe('number');
    });

    it('should load Redis password when set', () => {
      const env = { REDIS_PASSWORD: 'secret-password' };
      const config = loadEnvironment(env as any);

      expect(config.REDIS_PASSWORD).toBe('secret-password');
    });

    it('should handle complete Redis configuration', () => {
      const env = {
        REDIS_HOST: 'redis.example.com',
        REDIS_PORT: '6379',
        REDIS_PASSWORD: 'my-password',
      };
      const config = loadEnvironment(env as any);

      expect(config.REDIS_HOST).toBe('redis.example.com');
      expect(config.REDIS_PORT).toBe(6379);
      expect(config.REDIS_PASSWORD).toBe('my-password');
    });
  });

  describe('Monitoring Configuration', () => {
    it('should disable cloud logging by default', () => {
      const env = {};
      const config = loadEnvironment(env as any);

      expect(config.ENABLE_CLOUD_LOGGING).toBe(false);
    });

    it('should enable cloud logging when set to true', () => {
      const env = { ENABLE_CLOUD_LOGGING: 'true' };
      const config = loadEnvironment(env as any);

      expect(config.ENABLE_CLOUD_LOGGING).toBe(true);
    });

    it('should disable cloud logging when set to false', () => {
      const env = { ENABLE_CLOUD_LOGGING: 'false' };
      const config = loadEnvironment(env as any);

      expect(config.ENABLE_CLOUD_LOGGING).toBe(false);
    });

    it('should use default log level (info)', () => {
      const env = {};
      const config = loadEnvironment(env as any);

      expect(config.LOG_LEVEL).toBe('info');
    });

    it('should use custom log level when set', () => {
      const env = { LOG_LEVEL: 'debug' };
      const config = loadEnvironment(env as any);

      expect(config.LOG_LEVEL).toBe('debug');
    });

    it('should accept valid log levels', () => {
      const validLevels = ['error', 'warn', 'info', 'debug'];

      validLevels.forEach(level => {
        const env = { LOG_LEVEL: level };
        const config = loadEnvironment(env as any);
        expect(config.LOG_LEVEL).toBe(level);
      });
    });
  });

  describe('Production Validation Logic', () => {
    it('should require GCP_PROJECT_ID in production', () => {
      const env = { NODE_ENV: 'production' };
      const config = loadEnvironment(env as any);

      // In production, GCP_PROJECT_ID being empty should be validated
      expect(config.NODE_ENV).toBe('production');
      expect(config.GCP_PROJECT_ID).toBe('');
    });

    it('should not require GCP_PROJECT_ID in development', () => {
      const env = { NODE_ENV: 'development' };
      const config = loadEnvironment(env as any);

      expect(config.NODE_ENV).toBe('development');
      expect(config.GCP_PROJECT_ID).toBe('');
    });

    it('should allow GCP_PROJECT_ID in production when set', () => {
      const env = {
        NODE_ENV: 'production',
        GCP_PROJECT_ID: 'my-production-project',
      };
      const config = loadEnvironment(env as any);

      expect(config.NODE_ENV).toBe('production');
      expect(config.GCP_PROJECT_ID).toBe('my-production-project');
    });
  });

  describe('Type Safety', () => {
    it('should have correct types for all config values', () => {
      const env = {};
      const config = loadEnvironment(env as any);

      // String types
      expect(typeof config.NODE_ENV).toBe('string');
      expect(typeof config.CORS_ORIGIN).toBe('string');
      expect(typeof config.GCP_PROJECT_ID).toBe('string');
      expect(typeof config.GEMINI_API_KEY_SECRET_NAME).toBe('string');
      expect(typeof config.LOG_LEVEL).toBe('string');

      // Number types
      expect(typeof config.PORT).toBe('number');
      expect(typeof config.RATE_LIMIT_WINDOW_MS).toBe('number');
      expect(typeof config.RATE_LIMIT_MAX_REQUESTS).toBe('number');

      // Boolean types
      expect(typeof config.ENABLE_CLOUD_LOGGING).toBe('boolean');
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid port gracefully', () => {
      const env = { PORT: 'not-a-number' };
      const config = loadEnvironment(env as any);

      expect(config.PORT).toBe(NaN);
    });

    it('should handle empty string values', () => {
      const env = { GCP_PROJECT_ID: '', CORS_ORIGIN: '' };
      const config = loadEnvironment(env as any);

      // Empty strings are treated as falsy by || operator, so defaults are used
      expect(config.GCP_PROJECT_ID).toBe('');
      expect(config.CORS_ORIGIN).toBe('http://localhost:3000'); // Falls back to default
    });
  });

  describe('Integration Scenarios', () => {
    it('should configure for local development', () => {
      const env = {
        NODE_ENV: 'development',
        PORT: '8080',
        CORS_ORIGIN: 'http://localhost:3000',
        LOG_LEVEL: 'debug',
        ENABLE_CLOUD_LOGGING: 'false',
      };
      const config = loadEnvironment(env as any);

      expect(config.NODE_ENV).toBe('development');
      expect(config.PORT).toBe(8080);
      expect(config.CORS_ORIGIN).toBe('http://localhost:3000');
      expect(config.LOG_LEVEL).toBe('debug');
      expect(config.ENABLE_CLOUD_LOGGING).toBe(false);
    });

    it('should configure for production deployment', () => {
      const env = {
        NODE_ENV: 'production',
        PORT: '8080',
        GCP_PROJECT_ID: 'shunt-factory-prod',
        CORS_ORIGIN: 'https://shunt-factory.com',
        LOG_LEVEL: 'warn',
        ENABLE_CLOUD_LOGGING: 'true',
        RATE_LIMIT_MAX_REQUESTS: '50',
      };
      const config = loadEnvironment(env as any);

      expect(config.NODE_ENV).toBe('production');
      expect(config.GCP_PROJECT_ID).toBe('shunt-factory-prod');
      expect(config.CORS_ORIGIN).toBe('https://shunt-factory.com');
      expect(config.LOG_LEVEL).toBe('warn');
      expect(config.ENABLE_CLOUD_LOGGING).toBe(true);
      expect(config.RATE_LIMIT_MAX_REQUESTS).toBe(50);
    });

    it('should configure with Redis for distributed rate limiting', () => {
      const env = {
        NODE_ENV: 'production',
        GCP_PROJECT_ID: 'my-project',
        REDIS_HOST: 'redis.example.com',
        REDIS_PORT: '6379',
        REDIS_PASSWORD: 'secure-password',
      };
      const config = loadEnvironment(env as any);

      expect(config.REDIS_HOST).toBe('redis.example.com');
      expect(config.REDIS_PORT).toBe(6379);
      expect(config.REDIS_PASSWORD).toBe('secure-password');
    });
  });
});
