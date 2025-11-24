/**
 * Vitest Setup File
 * Global test configuration and utilities
 */

import { expect, afterEach, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock console.error to avoid cluttering test output with expected errors
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Error: Uncaught')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Mock import.meta.env for tests
const mockEnv = {
  MODE: 'test',
  DEV: false,
  PROD: false,
  SSR: false,
  BASE_URL: '/',
};

// Set up global import.meta mock
globalThis.import = {
  meta: {
    env: mockEnv,
  },
} as any;

// Reset environment before each test
beforeEach(() => {
  // Reset import.meta.env to default values
  Object.keys(mockEnv).forEach(key => {
    delete (globalThis.import as any).meta.env[key];
  });

  (globalThis.import as any).meta.env = { ...mockEnv };

  // Clear all mocks
  vi.clearAllMocks();
});

// Extend expect with custom matchers if needed
expect.extend({
  toBeValidEnvironment(received: string) {
    const valid = ['development', 'staging', 'production'].includes(received);
    return {
      pass: valid,
      message: () => `Expected ${received} to be a valid environment (development, staging, or production)`,
    };
  },
});
