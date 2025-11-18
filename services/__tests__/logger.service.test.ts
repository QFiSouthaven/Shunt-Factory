/**
 * Logger Service Tests
 * Comprehensive tests for production-ready logger with environment awareness
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the config module before importing Logger
vi.mock('../../config/environment', () => {
  const mockConfig = {
    env: 'development',
    isDevelopment: true,
    isStaging: false,
    isProduction: false,
    logging: {
      level: 'debug' as const,
      enableConsole: true,
    },
    features: {
      errorReporting: false,
      performanceMonitoring: true,
    },
    integrations: {
      sentryDsn: '',
    },
  };

  return {
    default: mockConfig,
  };
});

// Import logger after mock
import Logger, { logger } from '../logger.service';

describe('Logger Service', () => {
  // Store original console methods
  const originalConsole = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
    group: console.group,
    groupEnd: console.groupEnd,
    time: console.time,
    timeEnd: console.timeEnd,
    table: console.table,
  };

  // Mock console methods
  const mockConsole = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    group: vi.fn(),
    groupEnd: vi.fn(),
    time: vi.fn(),
    timeEnd: vi.fn(),
    table: vi.fn(),
  };

  beforeEach(() => {
    // Mock console methods
    console.debug = mockConsole.debug;
    console.info = mockConsole.info;
    console.warn = mockConsole.warn;
    console.error = mockConsole.error;
    console.group = mockConsole.group;
    console.groupEnd = mockConsole.groupEnd;
    console.time = mockConsole.time;
    console.timeEnd = mockConsole.timeEnd;
    console.table = mockConsole.table;

    // Clear history
    logger.clearHistory();

    // Clear all mock calls
    Object.values(mockConsole).forEach(mock => mock.mockClear());
  });

  afterEach(() => {
    // Restore original console
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.group = originalConsole.group;
    console.groupEnd = originalConsole.groupEnd;
    console.time = originalConsole.time;
    console.timeEnd = originalConsole.timeEnd;
    console.table = originalConsole.table;

    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = Logger.getInstance();
      const instance2 = Logger.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should export a singleton logger instance', () => {
      expect(logger).toBeDefined();
      expect(logger).toBe(Logger.getInstance());
    });
  });

  describe('Log Levels', () => {
    describe('debug()', () => {
      it('should log debug messages', () => {
        logger.debug('Debug message');

        expect(mockConsole.debug).toHaveBeenCalledTimes(1);
        expect(mockConsole.debug).toHaveBeenCalledWith(
          expect.stringContaining('[DEBUG]'),
          ''
        );
      });

      it('should log debug messages with data', () => {
        const data = { userId: 123, action: 'click' };
        logger.debug('User action', data);

        expect(mockConsole.debug).toHaveBeenCalledWith(
          expect.stringContaining('[DEBUG]'),
          data
        );
      });

      it('should add debug logs to history', () => {
        logger.debug('Debug message');
        const history = logger.getHistory();

        expect(history).toHaveLength(1);
        expect(history[0].level).toBe('debug');
        expect(history[0].message).toBe('Debug message');
        expect(history[0].timestamp).toBeDefined();
      });

      it('should include data in history', () => {
        const data = { test: 'value' };
        logger.debug('Debug with data', data);
        const history = logger.getHistory();

        expect(history[0].data).toEqual(data);
      });
    });

    describe('info()', () => {
      it('should log info messages', () => {
        logger.info('Info message');

        expect(mockConsole.info).toHaveBeenCalledTimes(1);
        expect(mockConsole.info).toHaveBeenCalledWith(
          expect.stringContaining('[INFO]'),
          ''
        );
      });

      it('should log info messages with data', () => {
        const data = { status: 'success' };
        logger.info('Operation completed', data);

        expect(mockConsole.info).toHaveBeenCalledWith(
          expect.stringContaining('[INFO]'),
          data
        );
      });

      it('should add info logs to history', () => {
        logger.info('Info message');
        const history = logger.getHistory();

        expect(history).toHaveLength(1);
        expect(history[0].level).toBe('info');
      });
    });

    describe('warn()', () => {
      it('should log warning messages', () => {
        logger.warn('Warning message');

        expect(mockConsole.warn).toHaveBeenCalledTimes(1);
        expect(mockConsole.warn).toHaveBeenCalledWith(
          expect.stringContaining('[WARN]'),
          ''
        );
      });

      it('should log warning messages with data', () => {
        const data = { code: 'DEPRECATED' };
        logger.warn('Deprecated API', data);

        expect(mockConsole.warn).toHaveBeenCalledWith(
          expect.stringContaining('[WARN]'),
          data
        );
      });

      it('should add warnings to history', () => {
        logger.warn('Warning message');
        const history = logger.getHistory();

        expect(history).toHaveLength(1);
        expect(history[0].level).toBe('warn');
      });
    });

    describe('error()', () => {
      it('should log error messages', () => {
        logger.error('Error message');

        expect(mockConsole.error).toHaveBeenCalledTimes(1);
        expect(mockConsole.error).toHaveBeenCalledWith(
          expect.stringContaining('[ERROR]'),
          expect.anything()
        );
      });

      it('should log error messages with Error object', () => {
        const error = new Error('Test error');
        logger.error('Operation failed', error);

        expect(mockConsole.error).toHaveBeenCalledWith(
          expect.stringContaining('[ERROR]'),
          expect.objectContaining({
            error: expect.objectContaining({
              message: 'Test error',
              stack: expect.any(String),
            }),
          })
        );
      });

      it('should log error messages with data object', () => {
        const data = { code: 500, details: 'Server error' };
        logger.error('HTTP error', data);

        expect(mockConsole.error).toHaveBeenCalledWith(
          expect.stringContaining('[ERROR]'),
          expect.objectContaining(data)
        );
      });

      it('should add errors to history', () => {
        logger.error('Error message');
        const history = logger.getHistory();

        expect(history).toHaveLength(1);
        expect(history[0].level).toBe('error');
      });

      it('should include error stack in history', () => {
        const error = new Error('Test error');
        logger.error('Operation failed', error);
        const history = logger.getHistory();

        expect(history[0].data).toHaveProperty('error');
        expect(history[0].data?.error).toHaveProperty('stack');
      });
    });
  });

  describe('Log History Management', () => {
    it('should track log history', () => {
      logger.debug('Debug 1');
      logger.info('Info 1');
      logger.warn('Warn 1');
      logger.error('Error 1');

      const history = logger.getHistory();
      expect(history).toHaveLength(4);
    });

    it('should maintain max history size', () => {
      // Add more than 100 logs
      for (let i = 0; i < 150; i++) {
        logger.info(`Log ${i}`);
      }

      const history = logger.getHistory();
      expect(history.length).toBeLessThanOrEqual(100);

      // Should keep the most recent logs
      expect(history[history.length - 1].message).toBe('Log 149');
    });

    it('should clear history', () => {
      logger.info('Test log');
      expect(logger.getHistory()).toHaveLength(1);

      logger.clearHistory();
      expect(logger.getHistory()).toHaveLength(0);
    });

    it('should return a copy of history (not reference)', () => {
      logger.info('Test');
      const history1 = logger.getHistory();
      const history2 = logger.getHistory();

      expect(history1).not.toBe(history2);
      expect(history1).toEqual(history2);
    });

    it('should include timestamps in history', () => {
      logger.info('Test');
      const history = logger.getHistory();

      expect(history[0].timestamp).toBeDefined();
      expect(new Date(history[0].timestamp).toISOString()).toBe(history[0].timestamp);
    });
  });

  describe('Log Export Functionality', () => {
    it('should export logs as JSON string', () => {
      logger.info('Test message', { key: 'value' });
      const exported = logger.exportLogs();

      expect(typeof exported).toBe('string');
      const parsed = JSON.parse(exported);
      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);
    });

    it('should export formatted JSON with indentation', () => {
      logger.info('Test');
      const exported = logger.exportLogs();

      // Should be pretty-printed (contains newlines and spaces)
      expect(exported).toContain('\n');
      expect(exported).toContain('  ');
    });

    it('should export all log data', () => {
      const testData = { userId: 123, action: 'test' };
      logger.info('Test message', testData);

      const exported = logger.exportLogs();
      const parsed = JSON.parse(exported);

      expect(parsed[0]).toMatchObject({
        level: 'info',
        message: 'Test message',
        data: testData,
      });
    });
  });

  describe('Message Formatting', () => {
    it('should format messages with timestamp', () => {
      logger.info('Test message');

      const call = mockConsole.info.mock.calls[0][0];
      expect(call).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should include environment in message', () => {
      logger.info('Test message');

      const call = mockConsole.info.mock.calls[0][0];
      expect(call).toContain('[DEVELOPMENT]');
    });

    it('should include log level in message', () => {
      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');

      expect(mockConsole.debug.mock.calls[0][0]).toContain('[DEBUG]');
      expect(mockConsole.info.mock.calls[0][0]).toContain('[INFO]');
      expect(mockConsole.warn.mock.calls[0][0]).toContain('[WARN]');
      expect(mockConsole.error.mock.calls[0][0]).toContain('[ERROR]');
    });

    it('should include the actual message', () => {
      logger.info('Custom message');

      const call = mockConsole.info.mock.calls[0][0];
      expect(call).toContain('Custom message');
    });
  });

  describe('Grouping Functionality', () => {
    it('should create console groups', () => {
      logger.group('Test Group');
      expect(mockConsole.group).toHaveBeenCalledWith('Test Group');
    });

    it('should end console groups', () => {
      logger.groupEnd();
      expect(mockConsole.groupEnd).toHaveBeenCalled();
    });
  });

  describe('Performance Timing', () => {
    it('should start performance timers', () => {
      logger.time('operation');
      expect(mockConsole.time).toHaveBeenCalledWith('operation');
    });

    it('should end performance timers', () => {
      logger.timeEnd('operation');
      expect(mockConsole.timeEnd).toHaveBeenCalledWith('operation');
    });
  });

  describe('Table Output', () => {
    it('should output tables for structured data', () => {
      const data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ];

      logger.table(data);
      expect(mockConsole.table).toHaveBeenCalledWith(data);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle typical development workflow', () => {
      logger.debug('Starting operation');
      logger.time('operation');
      logger.info('Processing data', { count: 100 });
      logger.warn('Deprecated method used');
      logger.timeEnd('operation');
      logger.info('Operation complete');

      const history = logger.getHistory();
      expect(history).toHaveLength(4); // time/timeEnd don't add to history
      expect(mockConsole.debug).toHaveBeenCalled();
      expect(mockConsole.info).toHaveBeenCalledTimes(2);
      expect(mockConsole.warn).toHaveBeenCalled();
    });

    it('should handle error scenarios with stack traces', () => {
      try {
        throw new Error('Something went wrong');
      } catch (error) {
        logger.error('Failed to process request', error as Error, {
          requestId: '123',
          userId: 'user-456',
        });
      }

      const history = logger.getHistory();
      expect(history[0].data).toHaveProperty('error.stack');
      expect(history[0].data).toHaveProperty('requestId', '123');
      expect(history[0].data).toHaveProperty('userId', 'user-456');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined data gracefully', () => {
      logger.info('Message with no data');
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.any(String),
        ''
      );
    });

    it('should handle empty strings', () => {
      logger.info('');
      const history = logger.getHistory();
      expect(history[0].message).toBe('');
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(10000);
      logger.info(longMessage);

      const history = logger.getHistory();
      expect(history[0].message).toBe(longMessage);
    });

    it('should handle complex nested data', () => {
      const complexData = {
        user: {
          id: 123,
          profile: {
            name: 'Test User',
            settings: {
              theme: 'dark',
              notifications: true,
            },
          },
        },
        metadata: [1, 2, 3],
      };

      logger.info('Complex data', complexData);
      const history = logger.getHistory();
      expect(history[0].data).toEqual(complexData);
    });

    it('should handle circular references in logging', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;

      // Should not throw when logging
      expect(() => {
        logger.info('Circular', circular);
      }).not.toThrow();
    });

    it('should handle rapid sequential logging', () => {
      const startTime = Date.now();

      for (let i = 0; i < 50; i++) {
        logger.info(`Log ${i}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (< 1 second)
      expect(duration).toBeLessThan(1000);
      expect(logger.getHistory()).toHaveLength(50);
    });
  });

  describe('downloadLogs() - DOM Manipulation', () => {
    it('should create and trigger download', () => {
      // Mock DOM elements
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };

      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      logger.info('Test log');
      logger.downloadLogs();

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(mockLink.click).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();

      // Cleanup
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });
  });
});
