/**
 * Structured Logging Service
 * Supports both local development (Winston) and Cloud Logging
 */

import winston from 'winston';
import { Logging } from '@google-cloud/logging';
import { env } from '../config/environment.js';

// Winston logger for local development
const winstonLogger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...metadata }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          if (Object.keys(metadata).length > 0) {
            msg += ` ${JSON.stringify(metadata)}`;
          }
          return msg;
        })
      ),
    }),
  ],
});

// Cloud Logging client (only in production)
let cloudLogging: Logging | null = null;
let cloudLog: any = null;

if (env.ENABLE_CLOUD_LOGGING && env.GCP_PROJECT_ID) {
  try {
    cloudLogging = new Logging({ projectId: env.GCP_PROJECT_ID });
    cloudLog = cloudLogging.log('shunt-factory-backend');
    winstonLogger.info('Cloud Logging initialized');
  } catch (error) {
    winstonLogger.warn('Failed to initialize Cloud Logging, falling back to Winston', { error });
  }
}

export interface LogMetadata {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  latencyMs?: number;
  tokenCount?: number;
  cost?: number;
  [key: string]: any;
}

class Logger {
  private logToCloud(severity: string, message: string, metadata?: LogMetadata) {
    if (!cloudLog) return;

    const entry = cloudLog.entry(
      {
        severity: severity.toUpperCase(),
        resource: { type: 'cloud_run_revision' },
      },
      {
        message,
        ...metadata,
      }
    );

    cloudLog.write(entry).catch((error: Error) => {
      winstonLogger.error('Failed to write to Cloud Logging', { error });
    });
  }

  info(message: string, metadata?: LogMetadata) {
    winstonLogger.info(message, metadata);
    this.logToCloud('info', message, metadata);
  }

  warn(message: string, metadata?: LogMetadata) {
    winstonLogger.warn(message, metadata);
    this.logToCloud('warning', message, metadata);
  }

  error(message: string, metadata?: LogMetadata) {
    winstonLogger.error(message, metadata);
    this.logToCloud('error', message, metadata);
  }

  debug(message: string, metadata?: LogMetadata) {
    winstonLogger.debug(message, metadata);
    this.logToCloud('debug', message, metadata);
  }
}

export const logger = new Logger();
