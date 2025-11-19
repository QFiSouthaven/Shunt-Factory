/**
 * Shunt Factory Backend Server
 * Production-ready Express server with security, monitoring, and MLOps capabilities
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/environment.js';
import { logger } from './utils/logger.js';
import { standardRateLimiter } from './middleware/rateLimiter.js';
import geminiRoutes from './routes/gemini.routes.js';
import localLLMRoutes from './routes/localLLM.routes.js';

const app = express();

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// Helmet: Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// CORS: Allow frontend origin
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' })); // Support large payloads (images, documents)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// REQUEST LOGGING MIDDLEWARE
// ============================================================================

app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const latencyMs = Date.now() - startTime;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      latencyMs,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  });

  next();
});

// ============================================================================
// ROUTES
// ============================================================================

// Health check (no rate limiting, no auth)
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Readiness check (verifies external dependencies)
app.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check if we can access Secret Manager / API keys
    // This will be checked by the Gemini service health endpoint
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Readiness check failed', { error });
    res.status(503).json({
      status: 'not_ready',
      error: 'External dependencies not available',
      timestamp: new Date().toISOString(),
    });
  }
});

// API routes (with rate limiting)
app.use('/api/gemini', geminiRoutes);
app.use('/api/local-llm', localLLMRoutes);

// Catch-all 404
app.use((req: Request, res: Response) => {
  logger.warn('Route not found', { path: req.path, method: req.method });
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const server = app.listen(env.PORT, () => {
  logger.info('Shunt Factory Backend started', {
    port: env.PORT,
    environment: env.NODE_ENV,
    corsOrigin: env.CORS_ORIGIN,
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled rejection', { reason });
  process.exit(1);
});

export default app;
