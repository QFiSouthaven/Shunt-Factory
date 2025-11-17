/**
 * Authentication Middleware
 * Validates API keys from request headers
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

// In production, these should be stored in a database or Secret Manager
// For now, we'll use environment variables
const VALID_API_KEYS = new Set(
  (process.env.CLIENT_API_KEYS || '').split(',').filter(Boolean)
);

export interface AuthenticatedRequest extends Request {
  apiKey?: string;
  userId?: string;
}

/**
 * Middleware to validate API key from request header
 */
export function authenticateApiKey(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    logger.warn('Request missing x-api-key header', {
      endpoint: req.path,
      ip: req.ip,
    });
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing x-api-key header',
    });
    return;
  }

  // Development mode: Accept any non-empty key
  if (process.env.NODE_ENV === 'development') {
    req.apiKey = apiKey;
    req.userId = `dev-user-${apiKey.substring(0, 8)}`;
    next();
    return;
  }

  // Production mode: Validate against configured keys
  if (!VALID_API_KEYS.has(apiKey)) {
    logger.warn('Invalid API key attempted', {
      endpoint: req.path,
      ip: req.ip,
      keyPrefix: apiKey.substring(0, 8),
    });
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key',
    });
    return;
  }

  // Attach API key and user ID to request
  req.apiKey = apiKey;
  req.userId = `user-${Buffer.from(apiKey).toString('base64').substring(0, 16)}`;

  logger.debug('API key validated successfully', {
    userId: req.userId,
    endpoint: req.path,
  });

  next();
}

/**
 * Optional authentication (doesn't block requests without API key)
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const apiKey = req.headers['x-api-key'] as string;

  if (apiKey && VALID_API_KEYS.has(apiKey)) {
    req.apiKey = apiKey;
    req.userId = `user-${Buffer.from(apiKey).toString('base64').substring(0, 16)}`;
  }

  next();
}
