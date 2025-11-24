// services/logger.service.ts
/**
 * Production-Ready Logger Service
 * Environment-aware logging with levels and external integrations
 */

import config, { LogLevel } from '../config/environment';

type LogData = Record<string, any>;

enum LogLevelPriority {
  debug = 0,
  info = 1,
  warn = 2,
  error = 3,
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private enableConsole: boolean;
  private logHistory: Array<{ level: LogLevel; message: string; data?: LogData; timestamp: string }> = [];
  private maxHistorySize = 100;

  private constructor() {
    this.logLevel = config.logging.level;
    this.enableConsole = config.logging.enableConsole;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const currentPriority = LogLevelPriority[this.logLevel];
    const messagePriority = LogLevelPriority[level];
    return messagePriority >= currentPriority;
  }

  /**
   * Add log entry to history
   */
  private addToHistory(level: LogLevel, message: string, data?: LogData) {
    this.logHistory.push({
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    });

    // Maintain max history size
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  /**
   * Send log to external services (Sentry, LogRocket, etc.)
   */
  private sendToExternalServices(level: LogLevel, message: string, data?: LogData) {
    // Only send errors/warns to external services in production
    if (!config.isProduction || !config.features.errorReporting) {
      return;
    }

    // Send to Sentry if configured
    if (config.integrations.sentryDsn && (level === 'error' || level === 'warn')) {
      // Sentry integration will be added when Sentry is set up
      // window.Sentry?.captureMessage(message, { level, extra: data });
    }
  }

  /**
   * Format log message with metadata
   */
  private formatMessage(level: LogLevel, message: string, data?: LogData): string {
    const timestamp = new Date().toISOString();
    const env = config.env.toUpperCase();
    return `[${timestamp}] [${env}] [${level.toUpperCase()}] ${message}`;
  }

  /**
   * Debug level logging
   */
  debug(message: string, data?: LogData) {
    if (!this.shouldLog('debug')) return;

    this.addToHistory('debug', message, data);

    if (this.enableConsole) {
      const formatted = this.formatMessage('debug', message);
      console.debug(formatted, data || '');
    }
  }

  /**
   * Info level logging
   */
  info(message: string, data?: LogData) {
    if (!this.shouldLog('info')) return;

    this.addToHistory('info', message, data);

    if (this.enableConsole) {
      const formatted = this.formatMessage('info', message);
      console.info(formatted, data || '');
    }
  }

  /**
   * Warning level logging
   */
  warn(message: string, data?: LogData) {
    if (!this.shouldLog('warn')) return;

    this.addToHistory('warn', message, data);
    this.sendToExternalServices('warn', message, data);

    if (this.enableConsole) {
      const formatted = this.formatMessage('warn', message);
      console.warn(formatted, data || '');
    }
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error | LogData, data?: LogData) {
    if (!this.shouldLog('error')) return;

    const errorData = error instanceof Error
      ? { ...data, error: { message: error.message, stack: error.stack } }
      : { ...data, ...error };

    this.addToHistory('error', message, errorData);
    this.sendToExternalServices('error', message, errorData);

    if (this.enableConsole) {
      const formatted = this.formatMessage('error', message);
      console.error(formatted, errorData || '');
    }
  }

  /**
   * Get log history
   */
  getHistory() {
    return [...this.logHistory];
  }

  /**
   * Clear log history
   */
  clearHistory() {
    this.logHistory = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2);
  }

  /**
   * Download logs as file
   */
  downloadLogs() {
    const logs = this.exportLogs();
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aether-shunt-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Group logs (for nested logging)
   */
  group(label: string) {
    if (this.enableConsole) {
      console.group(label);
    }
  }

  /**
   * End log group
   */
  groupEnd() {
    if (this.enableConsole) {
      console.groupEnd();
    }
  }

  /**
   * Performance timing
   */
  time(label: string) {
    if (this.enableConsole && config.features.performanceMonitoring) {
      console.time(label);
    }
  }

  /**
   * End performance timing
   */
  timeEnd(label: string) {
    if (this.enableConsole && config.features.performanceMonitoring) {
      console.timeEnd(label);
    }
  }

  /**
   * Table output (for structured data)
   */
  table(data: any) {
    if (this.enableConsole && this.shouldLog('debug')) {
      console.table(data);
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export class for testing
export default Logger;
