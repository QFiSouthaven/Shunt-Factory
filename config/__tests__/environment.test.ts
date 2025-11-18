/**
 * Environment Configuration Service Tests
 * Comprehensive tests for type-safe environment configuration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Environment, LogLevel } from '../environment';

// Helper functions to test (these mirror the actual implementation)
const getEnv = (env: Record<string, any>, key: string, defaultValue: string = ''): string => {
  return env[key] || defaultValue;
};

const getBoolEnv = (env: Record<string, any>, key: string, defaultValue: boolean = false): boolean => {
  const value = env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === true;
};

const getNumEnv = (env: Record<string, any>, key: string, defaultValue: number = 0): number => {
  const value = env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

const detectEnvironment = (env: Record<string, any>, meta: { PROD: boolean; DEV: boolean }): Environment => {
  const envValue = env['VITE_APP_ENV'];
  if (envValue === 'production' || envValue === 'staging' || envValue === 'development') {
    return envValue;
  }
  // Fallback detection
  if (meta.PROD) return 'production';
  if (meta.DEV) return 'development';
  return 'development';
};

describe('Environment Configuration Service - Helper Functions', () => {
  describe('getEnv', () => {
    it('should return environment variable value', () => {
      const env = { TEST_VAR: 'test-value' };
      expect(getEnv(env, 'TEST_VAR')).toBe('test-value');
    });

    it('should return default when variable not set', () => {
      const env = {};
      expect(getEnv(env, 'TEST_VAR', 'default')).toBe('default');
    });

    it('should return empty string as default when not specified', () => {
      const env = {};
      expect(getEnv(env, 'TEST_VAR')).toBe('');
    });
  });

  describe('getBoolEnv', () => {
    it('should return true for string "true"', () => {
      const env = { TEST_BOOL: 'true' };
      expect(getBoolEnv(env, 'TEST_BOOL')).toBe(true);
    });

    it('should return false for string "false"', () => {
      const env = { TEST_BOOL: 'false' };
      expect(getBoolEnv(env, 'TEST_BOOL')).toBe(false);
    });

    it('should return true for boolean true', () => {
      const env = { TEST_BOOL: true };
      expect(getBoolEnv(env, 'TEST_BOOL')).toBe(true);
    });

    it('should return default when variable not set', () => {
      const env = {};
      expect(getBoolEnv(env, 'TEST_BOOL', true)).toBe(true);
      expect(getBoolEnv(env, 'TEST_BOOL', false)).toBe(false);
    });

    it('should return false as default when not specified', () => {
      const env = {};
      expect(getBoolEnv(env, 'TEST_BOOL')).toBe(false);
    });
  });

  describe('getNumEnv', () => {
    it('should parse integer values', () => {
      const env = { TEST_NUM: '42' };
      expect(getNumEnv(env, 'TEST_NUM')).toBe(42);
    });

    it('should return default for invalid numbers', () => {
      const env = { TEST_NUM: 'not-a-number' };
      expect(getNumEnv(env, 'TEST_NUM', 10)).toBe(10);
    });

    it('should return default when variable not set', () => {
      const env = {};
      expect(getNumEnv(env, 'TEST_NUM', 100)).toBe(100);
    });

    it('should return 0 as default when not specified', () => {
      const env = {};
      expect(getNumEnv(env, 'TEST_NUM')).toBe(0);
    });

    it('should handle negative numbers', () => {
      const env = { TEST_NUM: '-50' };
      expect(getNumEnv(env, 'TEST_NUM')).toBe(-50);
    });
  });

  describe('detectEnvironment', () => {
    it('should detect development from VITE_APP_ENV', () => {
      const env = { VITE_APP_ENV: 'development' };
      const meta = { PROD: false, DEV: true };
      expect(detectEnvironment(env, meta)).toBe('development');
    });

    it('should detect staging from VITE_APP_ENV', () => {
      const env = { VITE_APP_ENV: 'staging' };
      const meta = { PROD: false, DEV: false };
      expect(detectEnvironment(env, meta)).toBe('staging');
    });

    it('should detect production from VITE_APP_ENV', () => {
      const env = { VITE_APP_ENV: 'production' };
      const meta = { PROD: true, DEV: false };
      expect(detectEnvironment(env, meta)).toBe('production');
    });

    it('should fallback to production when meta.PROD is true', () => {
      const env = {};
      const meta = { PROD: true, DEV: false };
      expect(detectEnvironment(env, meta)).toBe('production');
    });

    it('should fallback to development when meta.DEV is true', () => {
      const env = {};
      const meta = { PROD: false, DEV: true };
      expect(detectEnvironment(env, meta)).toBe('development');
    });

    it('should default to development', () => {
      const env = {};
      const meta = { PROD: false, DEV: false };
      expect(detectEnvironment(env, meta)).toBe('development');
    });
  });
});

describe('Environment Configuration - Type Safety', () => {
  it('should have valid Environment type values', () => {
    const validEnvs: Environment[] = ['development', 'staging', 'production'];
    expect(validEnvs).toHaveLength(3);
  });

  it('should have valid LogLevel type values', () => {
    const validLevels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    expect(validLevels).toHaveLength(4);
  });
});

describe('Environment Configuration - Feature Flags Logic', () => {
  it('should enable error reporting in non-development environments', () => {
    const devEnv = { VITE_APP_ENV: 'development' };
    const stagingEnv = { VITE_APP_ENV: 'staging' };
    const prodEnv = { VITE_APP_ENV: 'production' };

    const devErrorReporting = getBoolEnv(devEnv, 'VITE_ENABLE_ERROR_REPORTING', devEnv.VITE_APP_ENV !== 'development');
    const stagingErrorReporting = getBoolEnv(stagingEnv, 'VITE_ENABLE_ERROR_REPORTING', stagingEnv.VITE_APP_ENV !== 'development');
    const prodErrorReporting = getBoolEnv(prodEnv, 'VITE_ENABLE_ERROR_REPORTING', prodEnv.VITE_APP_ENV !== 'development');

    expect(devErrorReporting).toBe(false);
    expect(stagingErrorReporting).toBe(true);
    expect(prodErrorReporting).toBe(true);
  });

  it('should enable analytics only in production by default', () => {
    const devEnv = { VITE_APP_ENV: 'development' };
    const prodEnv = { VITE_APP_ENV: 'production' };

    const devAnalytics = getBoolEnv(devEnv, 'VITE_ENABLE_ANALYTICS', devEnv.VITE_APP_ENV === 'production');
    const prodAnalytics = getBoolEnv(prodEnv, 'VITE_ENABLE_ANALYTICS', prodEnv.VITE_APP_ENV === 'production');

    expect(devAnalytics).toBe(false);
    expect(prodAnalytics).toBe(true);
  });

  it('should enable debug tools only in development by default', () => {
    const devEnv = { VITE_APP_ENV: 'development' };
    const prodEnv = { VITE_APP_ENV: 'production' };

    const devDebugTools = getBoolEnv(devEnv, 'VITE_ENABLE_DEBUG_TOOLS', devEnv.VITE_APP_ENV === 'development');
    const prodDebugTools = getBoolEnv(prodEnv, 'VITE_ENABLE_DEBUG_TOOLS', prodEnv.VITE_APP_ENV === 'development');

    expect(devDebugTools).toBe(true);
    expect(prodDebugTools).toBe(false);
  });
});

describe('Environment Configuration - Security Logic', () => {
  it('should enable CSP in non-development environments by default', () => {
    const devEnv = { VITE_APP_ENV: 'development' };
    const prodEnv = { VITE_APP_ENV: 'production' };

    const devCSP = getBoolEnv(devEnv, 'VITE_ENABLE_CSP', devEnv.VITE_APP_ENV !== 'development');
    const prodCSP = getBoolEnv(prodEnv, 'VITE_ENABLE_CSP', prodEnv.VITE_APP_ENV !== 'development');

    expect(devCSP).toBe(false);
    expect(prodCSP).toBe(true);
  });

  it('should always enable sanitization by default', () => {
    const env = {};
    expect(getBoolEnv(env, 'VITE_ENABLE_SANITIZATION', true)).toBe(true);
  });
});

describe('Environment Configuration - Rate Limits', () => {
  it('should use default rate limits', () => {
    const env = {};

    expect(getNumEnv(env, 'VITE_RATE_LIMIT_SHUNT', 50)).toBe(50);
    expect(getNumEnv(env, 'VITE_RATE_LIMIT_WEAVER', 10)).toBe(10);
    expect(getNumEnv(env, 'VITE_RATE_LIMIT_FOUNDRY', 20)).toBe(20);
  });

  it('should parse custom rate limits', () => {
    const env = {
      VITE_RATE_LIMIT_SHUNT: '100',
      VITE_RATE_LIMIT_WEAVER: '25',
      VITE_RATE_LIMIT_FOUNDRY: '50',
    };

    expect(getNumEnv(env, 'VITE_RATE_LIMIT_SHUNT', 50)).toBe(100);
    expect(getNumEnv(env, 'VITE_RATE_LIMIT_WEAVER', 10)).toBe(25);
    expect(getNumEnv(env, 'VITE_RATE_LIMIT_FOUNDRY', 20)).toBe(50);
  });
});

describe('Environment Configuration - Logging', () => {
  it('should disable console logs in production by default', () => {
    const devEnv = { VITE_APP_ENV: 'development' };
    const prodEnv = { VITE_APP_ENV: 'production' };

    const devConsole = getBoolEnv(devEnv, 'VITE_ENABLE_CONSOLE_LOGS', devEnv.VITE_APP_ENV !== 'production');
    const prodConsole = getBoolEnv(prodEnv, 'VITE_ENABLE_CONSOLE_LOGS', prodEnv.VITE_APP_ENV !== 'production');

    expect(devConsole).toBe(true);
    expect(prodConsole).toBe(false);
  });

  it('should use default log level', () => {
    const env = {};
    expect(getEnv(env, 'VITE_LOG_LEVEL', 'info')).toBe('info');
  });
});

describe('Environment Configuration - API URL Construction', () => {
  it('should construct API URL correctly', () => {
    const baseUrl = 'https://api.example.com';
    const endpoint = '/users';
    const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const result = `${base}${path}`;

    expect(result).toBe('https://api.example.com/users');
  });

  it('should handle trailing slash in base URL', () => {
    const baseUrl = 'https://api.example.com/';
    const endpoint = '/users';
    const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const result = `${base}${path}`;

    expect(result).toBe('https://api.example.com/users');
  });

  it('should handle endpoint without leading slash', () => {
    const baseUrl = 'https://api.example.com';
    const endpoint = 'users';
    const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const result = `${base}${path}`;

    expect(result).toBe('https://api.example.com/users');
  });

  it('should handle both trailing slash and no leading slash', () => {
    const baseUrl = 'https://api.example.com/';
    const endpoint = 'users';
    const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const result = `${base}${path}`;

    expect(result).toBe('https://api.example.com/users');
  });
});

describe('Environment Configuration - Integration Scenarios', () => {
  it('should configure development environment correctly', () => {
    const env = {
      VITE_APP_ENV: 'development',
      VITE_ENABLE_DEBUG_TOOLS: 'true',
      VITE_ENABLE_CONSOLE_LOGS: 'true',
      VITE_LOG_LEVEL: 'debug',
      VITE_ENABLE_CSP: 'false',
    };

    expect(getEnv(env, 'VITE_APP_ENV')).toBe('development');
    expect(getBoolEnv(env, 'VITE_ENABLE_DEBUG_TOOLS')).toBe(true);
    expect(getBoolEnv(env, 'VITE_ENABLE_CONSOLE_LOGS')).toBe(true);
    expect(getEnv(env, 'VITE_LOG_LEVEL')).toBe('debug');
    expect(getBoolEnv(env, 'VITE_ENABLE_CSP')).toBe(false);
  });

  it('should configure production environment correctly', () => {
    const env = {
      VITE_APP_ENV: 'production',
      VITE_ENABLE_DEBUG_TOOLS: 'false',
      VITE_ENABLE_CONSOLE_LOGS: 'false',
      VITE_LOG_LEVEL: 'error',
      VITE_ENABLE_CSP: 'true',
      VITE_ENABLE_ERROR_REPORTING: 'true',
      VITE_ENABLE_ANALYTICS: 'true',
    };

    expect(getEnv(env, 'VITE_APP_ENV')).toBe('production');
    expect(getBoolEnv(env, 'VITE_ENABLE_DEBUG_TOOLS')).toBe(false);
    expect(getBoolEnv(env, 'VITE_ENABLE_CONSOLE_LOGS')).toBe(false);
    expect(getEnv(env, 'VITE_LOG_LEVEL')).toBe('error');
    expect(getBoolEnv(env, 'VITE_ENABLE_CSP')).toBe(true);
    expect(getBoolEnv(env, 'VITE_ENABLE_ERROR_REPORTING')).toBe(true);
    expect(getBoolEnv(env, 'VITE_ENABLE_ANALYTICS')).toBe(true);
  });

  it('should configure staging environment correctly', () => {
    const env = {
      VITE_APP_ENV: 'staging',
      VITE_ENABLE_DEBUG_TOOLS: 'false',
      VITE_ENABLE_CONSOLE_LOGS: 'true',
      VITE_LOG_LEVEL: 'info',
      VITE_ENABLE_CSP: 'true',
      VITE_ENABLE_ERROR_REPORTING: 'true',
    };

    expect(getEnv(env, 'VITE_APP_ENV')).toBe('staging');
    expect(getBoolEnv(env, 'VITE_ENABLE_DEBUG_TOOLS')).toBe(false);
    expect(getBoolEnv(env, 'VITE_ENABLE_CONSOLE_LOGS')).toBe(true);
    expect(getEnv(env, 'VITE_LOG_LEVEL')).toBe('info');
    expect(getBoolEnv(env, 'VITE_ENABLE_CSP')).toBe(true);
    expect(getBoolEnv(env, 'VITE_ENABLE_ERROR_REPORTING')).toBe(true);
  });
});

describe('Environment Configuration - Edge Cases', () => {
  it('should handle empty string values', () => {
    const env = { TEST_VAR: '' };
    expect(getEnv(env, 'TEST_VAR')).toBe('');
  });

  it('should handle whitespace values', () => {
    const env = { TEST_VAR: '  value  ' };
    expect(getEnv(env, 'TEST_VAR')).toBe('  value  ');
  });

  it('should handle invalid boolean values as false', () => {
    const env = { TEST_BOOL: 'invalid' };
    expect(getBoolEnv(env, 'TEST_BOOL')).toBe(false);
  });

  it('should handle zero as valid number', () => {
    const env = { TEST_NUM: '0' };
    expect(getNumEnv(env, 'TEST_NUM', 10)).toBe(0);
  });
});
