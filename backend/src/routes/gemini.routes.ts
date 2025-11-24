/**
 * Gemini API Routes
 * All frontend-facing endpoints for AI operations
 */

import { Router, Request, Response } from 'express';
import { geminiService } from '../services/geminiService.js';
import { logger } from '../utils/logger.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import { authenticateApiKey, type AuthenticatedRequest } from '../middleware/auth.js';
import {
  validateRequest,
  shuntActionSchema,
  modularPromptSchema,
  imageAnalysisSchema,
  chatMessageSchema,
  developmentPlanSchema,
  textGenerationSchema,
  checkPromptInjection,
} from '../middleware/validation.js';

const router = Router();

// Apply authentication and rate limiting to all routes
router.use(authenticateApiKey);
router.use(aiRateLimiter);

/**
 * POST /api/gemini/shunt
 * Perform a shunt action (main Gemini operation from frontend)
 */
router.post(
  '/shunt',
  validateRequest(shuntActionSchema),
  checkPromptInjection,
  async (req: AuthenticatedRequest, res: Response) => {
    const { text, action, modelName, context, priority } = req.body;
    const startTime = Date.now();

    try {
      logger.info('Shunt request received', {
        userId: req.userId,
        action,
        model: modelName,
        textLength: text.length,
      });

      // Build prompt based on action (simplified - you'll need to port the full prompt logic)
      const prompt = context
        ? `Action: ${action}\n\nContext: ${context}\n\nPriority: ${priority || 'normal'}\n\nText: ${text}`
        : `Action: ${action}\n\nText: ${text}`;

      const config =
        modelName.includes('pro') && (action === 'make_actionable' || action === 'build_skill')
          ? { thinkingConfig: { thinkingBudget: 32768 } }
          : undefined;

      const result = await geminiService.generateContent(prompt, modelName, config);

      // Clean JSON responses if needed
      let resultText = result.text;
      if (action === 'format_json' || action === 'make_actionable') {
        resultText = resultText.trim();
        if (resultText.startsWith('```')) {
          const firstNewLine = resultText.indexOf('\n');
          resultText = firstNewLine !== -1 ? resultText.substring(firstNewLine + 1) : resultText.substring(3);
        }
        if (resultText.endsWith('```')) {
          resultText = resultText.substring(0, resultText.length - 3);
        }
        resultText = resultText.trim();
      }

      const latencyMs = Date.now() - startTime;

      logger.info('Shunt request completed', {
        userId: req.userId,
        action,
        latencyMs,
        totalTokens: result.tokenUsage.total_tokens,
      });

      res.json({
        resultText,
        tokenUsage: result.tokenUsage,
        latencyMs,
      });
    } catch (error) {
      logger.error('Shunt request failed', {
        userId: req.userId,
        action,
        error,
        latencyMs: Date.now() - startTime,
      });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to process shunt request',
      });
    }
  }
);

/**
 * POST /api/gemini/modular-prompt
 * Execute modular prompt
 */
router.post(
  '/modular-prompt',
  validateRequest(modularPromptSchema),
  checkPromptInjection,
  async (req: AuthenticatedRequest, res: Response) => {
    const { text, modules, context, priority } = req.body;
    const startTime = Date.now();

    try {
      logger.info('Modular prompt request received', {
        userId: req.userId,
        modules: modules.length,
        textLength: text.length,
      });

      // Build modular prompt (you'll need to port the full logic from frontend)
      const prompt = `Modules: ${modules.join(', ')}\n\nText: ${text}\n\nContext: ${context || 'none'}`;

      const result = await geminiService.generateContent(prompt, 'gemini-2.5-pro', {
        thinkingConfig: { thinkingBudget: 32768 },
      });

      const latencyMs = Date.now() - startTime;

      logger.info('Modular prompt completed', {
        userId: req.userId,
        latencyMs,
        totalTokens: result.tokenUsage.total_tokens,
      });

      res.json({
        resultText: result.text,
        tokenUsage: result.tokenUsage,
        latencyMs,
      });
    } catch (error) {
      logger.error('Modular prompt failed', {
        userId: req.userId,
        error,
        latencyMs: Date.now() - startTime,
      });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to process modular prompt',
      });
    }
  }
);

/**
 * POST /api/gemini/analyze-image
 * Analyze image with Gemini
 */
router.post(
  '/analyze-image',
  validateRequest(imageAnalysisSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    const { prompt, image, modelName } = req.body;
    const startTime = Date.now();

    try {
      logger.info('Image analysis request received', {
        userId: req.userId,
        model: modelName,
        mimeType: image.mimeType,
      });

      const result = await geminiService.generateContentWithImage(prompt, image, modelName);

      const latencyMs = Date.now() - startTime;

      logger.info('Image analysis completed', {
        userId: req.userId,
        latencyMs,
        totalTokens: result.tokenUsage.total_tokens,
      });

      res.json({
        resultText: result.text,
        tokenUsage: result.tokenUsage,
        latencyMs,
      });
    } catch (error) {
      logger.error('Image analysis failed', {
        userId: req.userId,
        error,
        latencyMs: Date.now() - startTime,
      });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to analyze image',
      });
    }
  }
);

/**
 * POST /api/gemini/generate
 * Generic text generation endpoint
 */
router.post(
  '/generate',
  validateRequest(textGenerationSchema),
  checkPromptInjection,
  async (req: AuthenticatedRequest, res: Response) => {
    const { prompt, modelName, config } = req.body;
    const startTime = Date.now();

    try {
      logger.info('Generation request received', {
        userId: req.userId,
        model: modelName,
        promptLength: prompt.length,
      });

      const result = await geminiService.generateContent(prompt, modelName, config);

      const latencyMs = Date.now() - startTime;

      logger.info('Generation completed', {
        userId: req.userId,
        latencyMs,
        totalTokens: result.tokenUsage.total_tokens,
      });

      res.json({
        resultText: result.text,
        tokenUsage: result.tokenUsage,
        latencyMs,
      });
    } catch (error) {
      logger.error('Generation failed', {
        userId: req.userId,
        error,
        latencyMs: Date.now() - startTime,
      });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to generate content',
      });
    }
  }
);

/**
 * GET /api/gemini/health
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Check if Gemini service is initialized
    await geminiService.initialize();
    res.json({
      status: 'healthy',
      service: 'gemini',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      service: 'gemini',
      error: 'Failed to initialize Gemini service',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
