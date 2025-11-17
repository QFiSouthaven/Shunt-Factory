/**
 * Input Validation Middleware
 * Validates and sanitizes request inputs to prevent injection attacks
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger.js';

/**
 * Generic validation middleware factory
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[source];
      const validated = schema.parse(data);
      req[source] = validated; // Replace with validated data
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Validation error', {
          endpoint: req.path,
          errors: error.errors,
        });
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid request data',
          details: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      } else {
        logger.error('Unexpected validation error', { error });
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to validate request',
        });
      }
    }
  };
}

/**
 * Common validation schemas
 */

// Shunt action schema
export const shuntActionSchema = z.object({
  text: z.string().min(1).max(100000),
  action: z.string().min(1),
  modelName: z.string().optional().default('gemini-2.5-flash'),
  context: z.string().optional(),
  priority: z.string().optional(),
  promptInjectionGuardEnabled: z.boolean().optional().default(false),
});

// Modular prompt schema
export const modularPromptSchema = z.object({
  text: z.string().min(1).max(100000),
  modules: z.array(z.string()).min(1),
  context: z.string().optional(),
  priority: z.string().optional(),
  promptInjectionGuardEnabled: z.boolean().optional().default(false),
});

// Image analysis schema
export const imageAnalysisSchema = z.object({
  prompt: z.string().min(1),
  image: z.object({
    base64Data: z.string().min(1),
    mimeType: z.string().regex(/^image\/(png|jpeg|jpg|gif|webp)$/),
  }),
  modelName: z.string().optional().default('gemini-2.5-flash'),
});

// Chat message schema
export const chatMessageSchema = z.object({
  prompt: z.string().min(1).max(50000),
  history: z
    .array(
      z.object({
        role: z.string(),
        parts: z.array(z.object({ text: z.string() })),
      })
    )
    .optional(),
});

// Development plan schema
export const developmentPlanSchema = z.object({
  goal: z.string().min(1).max(10000),
  context: z.string().min(1).max(500000),
});

// Generic text generation schema
export const textGenerationSchema = z.object({
  prompt: z.string().min(1).max(100000),
  modelName: z.string().optional().default('gemini-2.5-flash'),
  config: z
    .object({
      temperature: z.number().min(0).max(2).optional(),
      topP: z.number().min(0).max(1).optional(),
      topK: z.number().min(1).max(100).optional(),
      maxOutputTokens: z.number().min(1).max(8192).optional(),
      responseMimeType: z.string().optional(),
      responseSchema: z.any().optional(),
    })
    .optional(),
});

/**
 * Sanitize text input to prevent basic injection attacks
 */
export function sanitizeText(text: string): string {
  // Remove null bytes
  let sanitized = text.replace(/\0/g, '');

  // Limit consecutive whitespace
  sanitized = sanitized.replace(/\s{10,}/g, ' '.repeat(10));

  return sanitized;
}

/**
 * Check for potential prompt injection patterns
 */
export function detectPromptInjection(text: string): boolean {
  const injectionPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /disregard\s+(all\s+)?previous\s+instructions/i,
    /you\s+are\s+now/i,
    /new\s+instructions:/i,
    /system\s*:\s*ignore/i,
    /<\|.*?\|>/g, // Special tokens
  ];

  return injectionPatterns.some((pattern) => pattern.test(text));
}

/**
 * Middleware to check for prompt injection
 */
export function checkPromptInjection(req: Request, res: Response, next: NextFunction): void {
  const text = req.body.text || req.body.prompt || '';

  if (detectPromptInjection(text)) {
    logger.warn('Potential prompt injection detected', {
      endpoint: req.path,
      textPreview: text.substring(0, 100),
    });
    res.status(400).json({
      error: 'Invalid Input',
      message: 'Potential prompt injection detected. Please rephrase your request.',
    });
    return;
  }

  next();
}
