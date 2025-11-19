/**
 * Local LLM Routes
 * Endpoints for LM Studio and Ollama integration
 */

import { Router, Request, Response } from 'express';
import {
  callLocalLLM,
  performLocalShunt,
  checkLMStudioHealth,
  checkOllamaHealth,
  getLMStudioModels,
  getOllamaModels,
} from '../services/localLLMService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Health check for local LLM providers
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const [lmStudioAvailable, ollamaAvailable] = await Promise.all([
      checkLMStudioHealth(req.query.lmStudioUrl as string),
      checkOllamaHealth(req.query.ollamaUrl as string),
    ]);

    res.json({
      lmstudio: {
        available: lmStudioAvailable,
        url: process.env.LM_STUDIO_URL || 'http://localhost:1234/v1',
      },
      ollama: {
        available: ollamaAvailable,
        url: process.env.OLLAMA_URL || 'http://localhost:11434',
      },
    });
  } catch (error) {
    logger.error('Local LLM health check failed', { error });
    res.status(500).json({ error: 'Health check failed' });
  }
});

/**
 * Get available models from local LLM providers
 */
router.get('/models', async (req: Request, res: Response) => {
  try {
    const provider = req.query.provider as string;

    if (provider === 'lmstudio') {
      const models = await getLMStudioModels(req.query.url as string);
      res.json({ provider: 'lmstudio', models });
    } else if (provider === 'ollama') {
      const models = await getOllamaModels(req.query.url as string);
      res.json({ provider: 'ollama', models });
    } else {
      // Return both
      const [lmStudioModels, ollamaModels] = await Promise.all([
        getLMStudioModels(),
        getOllamaModels(),
      ]);

      res.json({
        lmstudio: lmStudioModels,
        ollama: ollamaModels,
      });
    }
  } catch (error) {
    logger.error('Failed to get local LLM models', { error });
    res.status(500).json({ error: 'Failed to get models' });
  }
});

/**
 * Generate text using local LLM
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      systemPrompt,
      provider = 'lmstudio',
      model,
      temperature,
      maxTokens,
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await callLocalLLM(
      {
        prompt,
        systemPrompt,
        temperature,
        maxTokens,
        model,
      },
      provider
    );

    res.json({
      text: response.text,
      model: response.model,
      tokenUsage: response.tokenUsage,
      provider,
    });
  } catch (error: any) {
    logger.error('Local LLM generate failed', { error: error.message });

    // Check for connection errors
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
      return res.status(503).json({
        error: `Local LLM service unavailable. Make sure ${req.body.provider || 'LM Studio'} is running.`,
        details: error.message,
      });
    }

    res.status(500).json({
      error: 'Local LLM generation failed',
      details: error.message,
    });
  }
});

/**
 * Perform Shunt action using local LLM
 */
router.post('/shunt', async (req: Request, res: Response) => {
  try {
    const {
      text,
      action,
      systemPrompt,
      provider = 'lmstudio',
      model,
    } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!systemPrompt) {
      return res.status(400).json({ error: 'System prompt is required' });
    }

    const response = await performLocalShunt(
      text,
      action,
      systemPrompt,
      provider,
      model
    );

    res.json({
      resultText: response.text,
      model: response.model,
      tokenUsage: response.tokenUsage,
      provider,
    });
  } catch (error: any) {
    logger.error('Local LLM shunt failed', { error: error.message });

    // Check for connection errors
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
      return res.status(503).json({
        error: `Local LLM service unavailable. Make sure ${req.body.provider || 'LM Studio'} is running.`,
        details: error.message,
      });
    }

    res.status(500).json({
      error: 'Local LLM shunt failed',
      details: error.message,
    });
  }
});

/**
 * Chat completion using local LLM (multi-turn conversation)
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const {
      messages,
      provider = 'lmstudio',
      model,
      temperature,
      maxTokens,
    } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // For LM Studio, we can use the native chat format
    // For Ollama, we need to convert to a single prompt
    let systemPrompt = '';
    let userPrompt = '';

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemPrompt += msg.content + '\n';
      } else if (msg.role === 'user') {
        userPrompt += `User: ${msg.content}\n`;
      } else if (msg.role === 'assistant') {
        userPrompt += `Assistant: ${msg.content}\n`;
      }
    }

    // Add final prompt indicator
    userPrompt += 'Assistant:';

    const response = await callLocalLLM(
      {
        prompt: userPrompt.trim(),
        systemPrompt: systemPrompt.trim() || undefined,
        temperature,
        maxTokens,
        model,
      },
      provider
    );

    res.json({
      text: response.text,
      model: response.model,
      tokenUsage: response.tokenUsage,
      provider,
    });
  } catch (error: any) {
    logger.error('Local LLM chat failed', { error: error.message });

    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
      return res.status(503).json({
        error: `Local LLM service unavailable. Make sure ${req.body.provider || 'LM Studio'} is running.`,
        details: error.message,
      });
    }

    res.status(500).json({
      error: 'Local LLM chat failed',
      details: error.message,
    });
  }
});

export default router;
