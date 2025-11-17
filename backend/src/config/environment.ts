/**
 * Environment Configuration
 * Loads and validates environment variables with secure defaults
 */

export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  CORS_ORIGIN: string;

  // Google Cloud
  GCP_PROJECT_ID: string;
  GEMINI_API_KEY_SECRET_NAME: string;

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;

  // Redis (optional, for distributed rate limiting)
  REDIS_HOST?: string;
  REDIS_PORT?: number;
  REDIS_PASSWORD?: string;

  // Monitoring
  ENABLE_CLOUD_LOGGING: boolean;
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
}

function loadEnvironment(): EnvironmentConfig {
  return {
    NODE_ENV: (process.env.NODE_ENV as any) || 'development',
    PORT: parseInt(process.env.PORT || '8080', 10),
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',

    GCP_PROJECT_ID: process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || '',
    GEMINI_API_KEY_SECRET_NAME: process.env.GEMINI_API_KEY_SECRET_NAME || 'gemini-api-key',

    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : undefined,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,

    ENABLE_CLOUD_LOGGING: process.env.ENABLE_CLOUD_LOGGING === 'true',
    LOG_LEVEL: (process.env.LOG_LEVEL as any) || 'info',
  };
}

export const env = loadEnvironment();

// Validation
if (env.NODE_ENV === 'production' && !env.GCP_PROJECT_ID) {
  throw new Error('GCP_PROJECT_ID is required in production');
}
