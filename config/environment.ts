// config/environment.ts
/**
 * Environment Configuration Service
 * Provides type-safe access to environment variables across the application
 */

export type Environment = 'development' | 'staging' | 'production';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface EnvironmentConfig {
  // Environment
  env: Environment;
  version: string;
  isDevelopment: boolean;
  isStaging: boolean;
  isProduction: boolean;

  // API Configuration
  apiBaseUrl: string;
  apiTimeout: number;

  // Feature Flags
  features: {
    telemetry: boolean;
    errorReporting: boolean;
    analytics: boolean;
    debugTools: boolean;
    performanceMonitoring: boolean;
  };

  // Security
  security: {
    enableCSP: boolean;
    enableSanitization: boolean;
  };

  // Rate Limiting
  rateLimits: {
    shunt: number;
    weaver: number;
    foundry: number;
  };

  // Logging
  logging: {
    level: LogLevel;
    enableConsole: boolean;
  };

  // Third-Party
  integrations: {
    sentryDsn: string;
    gaTrackingId: string;
    posthogKey: string;
    posthogHost: string;
  };
}

/**
 * Get environment variable with type safety
 */
const getEnv = (key: string, defaultValue: string = ''): string => {
  return import.meta.env[key] || defaultValue;
};

/**
 * Get boolean environment variable
 */
const getBoolEnv = (key: string, defaultValue: boolean = false): boolean => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === true;
};

/**
 * Get number environment variable
 */
const getNumEnv = (key: string, defaultValue: number = 0): number => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Detect current environment
 */
const detectEnvironment = (): Environment => {
  const env = getEnv('VITE_APP_ENV', 'development');
  if (env === 'production' || env === 'staging' || env === 'development') {
    return env;
  }
  // Fallback detection
  if (import.meta.env.PROD) return 'production';
  if (import.meta.env.DEV) return 'development';
  return 'development';
};

/**
 * Build environment configuration object
 */
const buildConfig = (): EnvironmentConfig => {
  const env = detectEnvironment();

  return {
    // Environment
    env,
    version: getEnv('VITE_APP_VERSION', '2.0.0-professional'),
    isDevelopment: env === 'development',
    isStaging: env === 'staging',
    isProduction: env === 'production',

    // API Configuration
    apiBaseUrl: getEnv('VITE_API_BASE_URL', ''),
    apiTimeout: getNumEnv('VITE_API_TIMEOUT', 30000),

    // Feature Flags
    features: {
      telemetry: getBoolEnv('VITE_ENABLE_TELEMETRY', true),
      errorReporting: getBoolEnv('VITE_ENABLE_ERROR_REPORTING', env !== 'development'),
      analytics: getBoolEnv('VITE_ENABLE_ANALYTICS', env === 'production'),
      debugTools: getBoolEnv('VITE_ENABLE_DEBUG_TOOLS', env === 'development'),
      performanceMonitoring: getBoolEnv('VITE_ENABLE_PERFORMANCE_MONITORING', true),
    },

    // Security
    security: {
      enableCSP: getBoolEnv('VITE_ENABLE_CSP', env !== 'development'),
      enableSanitization: getBoolEnv('VITE_ENABLE_SANITIZATION', true),
    },

    // Rate Limiting
    rateLimits: {
      shunt: getNumEnv('VITE_RATE_LIMIT_SHUNT', 50),
      weaver: getNumEnv('VITE_RATE_LIMIT_WEAVER', 10),
      foundry: getNumEnv('VITE_RATE_LIMIT_FOUNDRY', 20),
    },

    // Logging
    logging: {
      level: (getEnv('VITE_LOG_LEVEL', 'info') as LogLevel),
      enableConsole: getBoolEnv('VITE_ENABLE_CONSOLE_LOGS', env !== 'production'),
    },

    // Third-Party Integrations
    integrations: {
      sentryDsn: getEnv('VITE_SENTRY_DSN', ''),
      gaTrackingId: getEnv('VITE_GA_TRACKING_ID', ''),
      posthogKey: getEnv('VITE_POSTHOG_KEY', ''),
      posthogHost: getEnv('VITE_POSTHOG_HOST', ''),
    },
  };
};

/**
 * Singleton configuration instance
 */
export const config: EnvironmentConfig = buildConfig();

/**
 * Log configuration on startup (development only)
 */
if (config.isDevelopment && config.logging.enableConsole) {
  console.log('[Environment] Configuration loaded:', {
    env: config.env,
    version: config.version,
    features: config.features,
    apiBaseUrl: config.apiBaseUrl,
  });
}

/**
 * Validate critical configuration
 */
const validateConfig = () => {
  const warnings: string[] = [];

  // Check for production without error reporting
  if (config.isProduction && !config.features.errorReporting) {
    warnings.push('Error reporting is disabled in production');
  }

  // Check for production with console logs
  if (config.isProduction && config.logging.enableConsole) {
    warnings.push('Console logs are enabled in production');
  }

  // Check for missing API base URL in staging/production
  if ((config.isStaging || config.isProduction) && !config.apiBaseUrl) {
    warnings.push('API base URL is not configured');
  }

  // Log warnings
  if (warnings.length > 0 && config.isDevelopment) {
    console.warn('[Environment] Configuration warnings:', warnings);
  }
};

validateConfig();

/**
 * Helper function to check if a feature is enabled
 */
export const isFeatureEnabled = (feature: keyof EnvironmentConfig['features']): boolean => {
  return config.features[feature];
};

/**
 * Helper to get API URL with endpoint
 */
export const getApiUrl = (endpoint: string): string => {
  if (!config.apiBaseUrl) {
    throw new Error('API base URL is not configured');
  }
  const base = config.apiBaseUrl.endsWith('/') ? config.apiBaseUrl.slice(0, -1) : config.apiBaseUrl;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
};

/**
 * Export types and config
 */
export default config;
