/**
 * Rate Limiting Middleware
 * Implements per-user rate limiting with Redis support for distributed systems
 */

import rateLimit from 'express-rate-limit';
import { createClient } from 'redis';
import { env } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import type { AuthenticatedRequest } from './auth.js';

// Redis client for distributed rate limiting (optional)
let redisClient: ReturnType<typeof createClient> | null = null;

if (env.REDIS_HOST) {
  redisClient = createClient({
    socket: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT || 6379,
    },
    password: env.REDIS_PASSWORD,
  });

  redisClient.on('error', (error) => {
    logger.error('Redis client error', { error });
  });

  redisClient.on('connect', () => {
    logger.info('Redis client connected for rate limiting');
  });

  redisClient.connect().catch((error) => {
    logger.error('Failed to connect to Redis', { error });
  });
}

/**
 * Custom key generator based on API key (per-user rate limiting)
 */
function keyGenerator(req: AuthenticatedRequest): string {
  return req.userId || req.apiKey || req.ip || 'anonymous';
}

/**
 * Simple in-memory store for rate limiting
 */
class MemoryStore {
  private hits: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(private windowMs: number, private max: number) {}

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date }> {
    const now = Date.now();
    const hit = this.hits.get(key);

    if (!hit || hit.resetTime < now) {
      const resetTime = now + this.windowMs;
      this.hits.set(key, { count: 1, resetTime });
      return { totalHits: 1, resetTime: new Date(resetTime) };
    }

    hit.count++;
    return { totalHits: hit.count, resetTime: new Date(hit.resetTime) };
  }

  async decrement(key: string): Promise<void> {
    const hit = this.hits.get(key);
    if (hit) {
      hit.count = Math.max(0, hit.count - 1);
    }
  }

  async resetKey(key: string): Promise<void> {
    this.hits.delete(key);
  }
}

/**
 * Redis-based store for distributed rate limiting
 */
class RedisStore {
  constructor(private client: ReturnType<typeof createClient>, private windowMs: number) {}

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date }> {
    const redisKey = `rate-limit:${key}`;
    const now = Date.now();
    const resetTime = now + this.windowMs;

    try {
      const count = await this.client.incr(redisKey);

      if (count === 1) {
        await this.client.pExpire(redisKey, this.windowMs);
      }

      return { totalHits: count, resetTime: new Date(resetTime) };
    } catch (error) {
      logger.error('Redis rate limit error', { error, key });
      // Fallback: Allow request if Redis fails
      return { totalHits: 0, resetTime: new Date(resetTime) };
    }
  }

  async decrement(key: string): Promise<void> {
    const redisKey = `rate-limit:${key}`;
    try {
      await this.client.decr(redisKey);
    } catch (error) {
      logger.error('Redis decrement error', { error, key });
    }
  }

  async resetKey(key: string): Promise<void> {
    const redisKey = `rate-limit:${key}`;
    try {
      await this.client.del(redisKey);
    } catch (error) {
      logger.error('Redis reset error', { error, key });
    }
  }
}

/**
 * Standard rate limiter (100 requests per minute by default)
 */
export const standardRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: 'Too Many Requests',
    message: `Rate limit exceeded. Maximum ${env.RATE_LIMIT_MAX_REQUESTS} requests per ${env.RATE_LIMIT_WINDOW_MS / 1000} seconds.`,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      userId: (req as AuthenticatedRequest).userId,
      endpoint: req.path,
      ip: req.ip,
    });
    res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Maximum ${env.RATE_LIMIT_MAX_REQUESTS} requests per ${env.RATE_LIMIT_WINDOW_MS / 1000} seconds.`,
    });
  },
});

/**
 * Strict rate limiter for expensive AI operations (20 requests per minute)
 */
export const aiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: Math.min(env.RATE_LIMIT_MAX_REQUESTS, 20), // Cap at 20 for AI endpoints
  message: {
    error: 'Too Many Requests',
    message: 'AI endpoint rate limit exceeded. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: (req, res) => {
    logger.warn('AI rate limit exceeded', {
      userId: (req as AuthenticatedRequest).userId,
      endpoint: req.path,
      ip: req.ip,
    });
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'AI endpoint rate limit exceeded. Please slow down.',
    });
  },
});

export { redisClient };
