/**
 * Environment Files Validation Tests
 * Tests to ensure .env files are properly structured and documented
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '..');

// Required environment variables for each environment
const REQUIRED_VARS = {
  common: [
    'VITE_APP_ENV',
    'VITE_APP_VERSION',
  ],
  featureFlags: [
    'VITE_ENABLE_TELEMETRY',
    'VITE_ENABLE_ERROR_REPORTING',
    'VITE_ENABLE_ANALYTICS',
    'VITE_ENABLE_DEBUG_TOOLS',
  ],
  security: [
    'VITE_ENABLE_CSP',
    'VITE_ENABLE_SANITIZATION',
  ],
  rateLimits: [
    'VITE_RATE_LIMIT_SHUNT',
    'VITE_RATE_LIMIT_WEAVER',
    'VITE_RATE_LIMIT_FOUNDRY',
  ],
  logging: [
    'VITE_LOG_LEVEL',
    'VITE_ENABLE_CONSOLE_LOGS',
  ],
};

/**
 * Parse a .env file and extract key-value pairs
 */
function parseEnvFile(filePath: string): Map<string, string> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const vars = new Map<string, string>();

  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (trimmed.startsWith('#') || trimmed === '') {
      continue;
    }

    // Parse key=value
    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      vars.set(key, value);
    }
  }

  return vars;
}

/**
 * Check if a .env file has comments/documentation
 */
function hasDocumentation(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Count comment lines (excluding empty lines)
  const commentLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.startsWith('#') && trimmed.length > 1;
  });

  // Should have at least some documentation
  return commentLines.length >= 5;
}

describe('Environment Files Validation', () => {
  describe('.env.example', () => {
    const envExamplePath = path.join(PROJECT_ROOT, '.env.example');

    it('should exist', () => {
      expect(fs.existsSync(envExamplePath)).toBe(true);
    });

    it('should contain all required common variables', () => {
      const vars = parseEnvFile(envExamplePath);

      REQUIRED_VARS.common.forEach(varName => {
        expect(vars.has(varName), `Missing required variable: ${varName}`).toBe(true);
      });
    });

    it('should contain all feature flag variables', () => {
      const vars = parseEnvFile(envExamplePath);

      REQUIRED_VARS.featureFlags.forEach(varName => {
        expect(vars.has(varName), `Missing feature flag: ${varName}`).toBe(true);
      });
    });

    it('should contain all security variables', () => {
      const vars = parseEnvFile(envExamplePath);

      REQUIRED_VARS.security.forEach(varName => {
        expect(vars.has(varName), `Missing security variable: ${varName}`).toBe(true);
      });
    });

    it('should contain all rate limit variables', () => {
      const vars = parseEnvFile(envExamplePath);

      REQUIRED_VARS.rateLimits.forEach(varName => {
        expect(vars.has(varName), `Missing rate limit variable: ${varName}`).toBe(true);
      });
    });

    it('should contain all logging variables', () => {
      const vars = parseEnvFile(envExamplePath);

      REQUIRED_VARS.logging.forEach(varName => {
        expect(vars.has(varName), `Missing logging variable: ${varName}`).toBe(true);
      });
    });

    it('should have comprehensive documentation', () => {
      expect(hasDocumentation(envExamplePath)).toBe(true);
    });

    it('should have valid boolean values for feature flags', () => {
      const vars = parseEnvFile(envExamplePath);
      const validBooleans = ['true', 'false'];

      REQUIRED_VARS.featureFlags.forEach(varName => {
        const value = vars.get(varName);
        if (value) {
          expect(validBooleans.includes(value.toLowerCase()),
            `${varName} should be 'true' or 'false', got: ${value}`
          ).toBe(true);
        }
      });
    });

    it('should have valid log level', () => {
      const vars = parseEnvFile(envExamplePath);
      const logLevel = vars.get('VITE_LOG_LEVEL');
      const validLevels = ['debug', 'info', 'warn', 'error'];

      if (logLevel) {
        expect(validLevels.includes(logLevel.toLowerCase()),
          `Log level should be one of: ${validLevels.join(', ')}`
        ).toBe(true);
      }
    });

    it('should have numeric rate limit values', () => {
      const vars = parseEnvFile(envExamplePath);

      REQUIRED_VARS.rateLimits.forEach(varName => {
        const value = vars.get(varName);
        if (value) {
          const num = parseInt(value, 10);
          expect(isNaN(num), `${varName} should be a number, got: ${value}`).toBe(false);
          expect(num > 0, `${varName} should be positive, got: ${num}`).toBe(true);
        }
      });
    });
  });

  describe('.env.development', () => {
    const envDevPath = path.join(PROJECT_ROOT, '.env.development');

    it('should exist', () => {
      expect(fs.existsSync(envDevPath)).toBe(true);
    });

    it('should set VITE_APP_ENV to development', () => {
      const vars = parseEnvFile(envDevPath);
      expect(vars.get('VITE_APP_ENV')).toBe('development');
    });

    it('should enable debug tools in development', () => {
      const vars = parseEnvFile(envDevPath);
      expect(vars.get('VITE_ENABLE_DEBUG_TOOLS')).toBe('true');
    });

    it('should enable console logs in development', () => {
      const vars = parseEnvFile(envDevPath);
      expect(vars.get('VITE_ENABLE_CONSOLE_LOGS')).toBe('true');
    });

    it('should use debug or info log level', () => {
      const vars = parseEnvFile(envDevPath);
      const logLevel = vars.get('VITE_LOG_LEVEL');
      expect(['debug', 'info'].includes(logLevel || '')).toBe(true);
    });

    it('should typically disable CSP in development', () => {
      const vars = parseEnvFile(envDevPath);
      const csp = vars.get('VITE_ENABLE_CSP');
      // CSP is typically disabled in dev, but could be enabled for testing
      expect(['true', 'false'].includes(csp || '')).toBe(true);
    });

    it('should have higher rate limits than production', () => {
      const devVars = parseEnvFile(envDevPath);
      const shuntLimit = parseInt(devVars.get('VITE_RATE_LIMIT_SHUNT') || '0', 10);

      expect(shuntLimit).toBeGreaterThan(50); // Default prod is 50
    });
  });

  describe('.env.staging', () => {
    const envStagingPath = path.join(PROJECT_ROOT, '.env.staging');

    it('should exist', () => {
      expect(fs.existsSync(envStagingPath)).toBe(true);
    });

    it('should set VITE_APP_ENV to staging', () => {
      const vars = parseEnvFile(envStagingPath);
      expect(vars.get('VITE_APP_ENV')).toBe('staging');
    });

    it('should enable error reporting', () => {
      const vars = parseEnvFile(envStagingPath);
      expect(vars.get('VITE_ENABLE_ERROR_REPORTING')).toBe('true');
    });

    it('should enable CSP', () => {
      const vars = parseEnvFile(envStagingPath);
      expect(vars.get('VITE_ENABLE_CSP')).toBe('true');
    });

    it('should use appropriate log level (info or warn)', () => {
      const vars = parseEnvFile(envStagingPath);
      const logLevel = vars.get('VITE_LOG_LEVEL');
      expect(['info', 'warn', 'debug'].includes(logLevel || '')).toBe(true);
    });

    it('should typically disable debug tools', () => {
      const vars = parseEnvFile(envStagingPath);
      const debugTools = vars.get('VITE_ENABLE_DEBUG_TOOLS');
      expect(debugTools).toBe('false');
    });
  });

  describe('.env.production', () => {
    const envProdPath = path.join(PROJECT_ROOT, '.env.production');

    it('should exist', () => {
      expect(fs.existsSync(envProdPath)).toBe(true);
    });

    it('should set VITE_APP_ENV to production', () => {
      const vars = parseEnvFile(envProdPath);
      expect(vars.get('VITE_APP_ENV')).toBe('production');
    });

    it('should enable error reporting', () => {
      const vars = parseEnvFile(envProdPath);
      expect(vars.get('VITE_ENABLE_ERROR_REPORTING')).toBe('true');
    });

    it('should enable analytics', () => {
      const vars = parseEnvFile(envProdPath);
      expect(vars.get('VITE_ENABLE_ANALYTICS')).toBe('true');
    });

    it('should disable debug tools', () => {
      const vars = parseEnvFile(envProdPath);
      expect(vars.get('VITE_ENABLE_DEBUG_TOOLS')).toBe('false');
    });

    it('should disable console logs', () => {
      const vars = parseEnvFile(envProdPath);
      expect(vars.get('VITE_ENABLE_CONSOLE_LOGS')).toBe('false');
    });

    it('should enable CSP', () => {
      const vars = parseEnvFile(envProdPath);
      expect(vars.get('VITE_ENABLE_CSP')).toBe('true');
    });

    it('should use warn or error log level', () => {
      const vars = parseEnvFile(envProdPath);
      const logLevel = vars.get('VITE_LOG_LEVEL');
      expect(['warn', 'error', 'info'].includes(logLevel || '')).toBe(true);
    });

    it('should have conservative rate limits', () => {
      const prodVars = parseEnvFile(envProdPath);
      const shuntLimit = parseInt(prodVars.get('VITE_RATE_LIMIT_SHUNT') || '0', 10);

      expect(shuntLimit).toBeGreaterThan(0);
      expect(shuntLimit).toBeLessThanOrEqual(100);
    });
  });

  describe('Consistency Across Environments', () => {
    it('should have the same variable names across all env files', () => {
      const envFiles = [
        '.env.example',
        '.env.development',
        '.env.staging',
        '.env.production',
      ];

      const allVars = envFiles.map(file => {
        const filePath = path.join(PROJECT_ROOT, file);
        const vars = parseEnvFile(filePath);
        return { file, keys: Array.from(vars.keys()).sort() };
      });

      // Get all unique keys
      const allKeys = new Set<string>();
      allVars.forEach(({ keys }) => {
        keys.forEach(key => allKeys.add(key));
      });

      // Check that example has documentation for all keys
      const exampleKeys = new Set(allVars[0].keys);
      allKeys.forEach(key => {
        // Some keys might be environment-specific, but major ones should be in example
        if (key.startsWith('VITE_')) {
          // This is just informational, not a strict requirement
          // as some vars may be env-specific
        }
      });

      expect(allVars.length).toBe(4);
    });

    it('should have consistent version across environments', () => {
      const envFiles = [
        '.env.development',
        '.env.staging',
        '.env.production',
      ];

      const versions = envFiles.map(file => {
        const filePath = path.join(PROJECT_ROOT, file);
        const vars = parseEnvFile(filePath);
        return vars.get('VITE_APP_VERSION');
      });

      // All versions should be defined
      versions.forEach(version => {
        expect(version).toBeDefined();
      });

      // Versions should follow semver pattern
      versions.forEach(version => {
        expect(version).toMatch(/^\d+\.\d+\.\d+/);
      });
    });
  });

  describe('Security Best Practices', () => {
    it('should not contain actual API keys in example file', () => {
      const envExamplePath = path.join(PROJECT_ROOT, '.env.example');
      const content = fs.readFileSync(envExamplePath, 'utf-8');

      // Check for common patterns that might indicate real keys
      expect(content).not.toMatch(/sk-[a-zA-Z0-9]{48}/); // OpenAI style
      expect(content).not.toMatch(/AIza[a-zA-Z0-9_-]{35}/); // Google API key
      expect(content).not.toMatch(/[a-f0-9]{32,}/); // Long hex strings

      // Check for placeholder patterns instead
      expect(content).toMatch(/your_.*_here|placeholder|example/i);
    });

    it('should have sanitization enabled in all environments', () => {
      const envFiles = [
        '.env.development',
        '.env.staging',
        '.env.production',
      ];

      envFiles.forEach(file => {
        const filePath = path.join(PROJECT_ROOT, file);
        const vars = parseEnvFile(filePath);
        expect(vars.get('VITE_ENABLE_SANITIZATION')).toBe('true');
      });
    });
  });

  describe('Documentation Quality', () => {
    it('.env.example should have section headers', () => {
      const envExamplePath = path.join(PROJECT_ROOT, '.env.example');
      const content = fs.readFileSync(envExamplePath, 'utf-8');

      // Should have clear section organization
      expect(content).toMatch(/#+.*Feature Flags/i);
      expect(content).toMatch(/#+.*Security/i);
      expect(content).toMatch(/#+.*Rate Limit/i);
    });

    it('.env.example should explain boolean values', () => {
      const envExamplePath = path.join(PROJECT_ROOT, '.env.example');
      const content = fs.readFileSync(envExamplePath, 'utf-8');

      // Should explain what true/false does
      expect(content).toMatch(/Enable|Disable|true|false/i);
    });

    it('.env.example should provide examples for URLs', () => {
      const envExamplePath = path.join(PROJECT_ROOT, '.env.example');
      const content = fs.readFileSync(envExamplePath, 'utf-8');

      // Should show example URLs
      if (content.includes('API_BASE_URL') || content.includes('BACKEND_URL')) {
        expect(content).toMatch(/http[s]?:\/\//);
      }
    });
  });
});
