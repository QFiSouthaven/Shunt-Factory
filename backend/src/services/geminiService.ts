/**
 * Gemini API Service (Backend)
 * Securely handles all Gemini API calls with proper error handling and token tracking
 */

import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { secretManager } from './secretManager.js';
import { logger } from '../utils/logger.js';

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  model: string;
}

export interface GeminiRequestConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
  responseSchema?: any;
  thinkingConfig?: { thinkingBudget: number };
}

class GeminiService {
  private apiKey: string | null = null;
  private client: GoogleGenAI | null = null;

  /**
   * Initialize the Gemini client with API key from Secret Manager
   */
  async initialize(): Promise<void> {
    if (this.client) {
      return; // Already initialized
    }

    try {
      this.apiKey = await secretManager.getGeminiApiKey();
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
      logger.info('Gemini service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Gemini service', { error });
      throw new Error('Failed to initialize Gemini service');
    }
  }

  /**
   * Ensure client is initialized before making requests
   */
  private async ensureInitialized(): Promise<GoogleGenAI> {
    if (!this.client) {
      await this.initialize();
    }
    if (!this.client) {
      throw new Error('Gemini client not initialized');
    }
    return this.client;
  }

  /**
   * Map Gemini response to token usage
   */
  private mapTokenUsage(response: GenerateContentResponse, model: string): TokenUsage {
    return {
      prompt_tokens: response.usageMetadata?.promptTokenCount ?? 0,
      completion_tokens: response.usageMetadata?.candidatesTokenCount ?? 0,
      total_tokens: response.usageMetadata?.totalTokenCount ?? 0,
      model,
    };
  }

  /**
   * Generate content with Gemini
   */
  async generateContent(
    prompt: string,
    model: string = 'gemini-2.5-flash',
    config?: GeminiRequestConfig
  ): Promise<{ text: string; tokenUsage: TokenUsage }> {
    const client = await this.ensureInitialized();
    const startTime = Date.now();

    try {
      logger.debug('Generating content with Gemini', { model, configKeys: Object.keys(config || {}) });

      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: config || {},
      });

      const latencyMs = Date.now() - startTime;
      const tokenUsage = this.mapTokenUsage(response, model);

      logger.info('Gemini content generated', {
        model,
        latencyMs,
        totalTokens: tokenUsage.total_tokens,
      });

      return {
        text: response.text ?? '',
        tokenUsage,
      };
    } catch (error) {
      logger.error('Gemini API error', { error, model, latencyMs: Date.now() - startTime });
      throw error;
    }
  }

  /**
   * Generate content with image
   */
  async generateContentWithImage(
    prompt: string,
    image: { base64Data: string; mimeType: string },
    model: string = 'gemini-2.5-flash'
  ): Promise<{ text: string; tokenUsage: TokenUsage }> {
    const client = await this.ensureInitialized();
    const startTime = Date.now();

    try {
      logger.debug('Generating content with image', { model });

      const imagePart = {
        inlineData: {
          data: image.base64Data,
          mimeType: image.mimeType,
        },
      };

      const textPart = { text: prompt };

      const response = await client.models.generateContent({
        model,
        contents: { parts: [imagePart, textPart] },
      });

      const latencyMs = Date.now() - startTime;
      const tokenUsage = this.mapTokenUsage(response, model);

      logger.info('Gemini image content generated', {
        model,
        latencyMs,
        totalTokens: tokenUsage.total_tokens,
      });

      return {
        text: response.text ?? '',
        tokenUsage,
      };
    } catch (error) {
      logger.error('Gemini API error (with image)', { error, model, latencyMs: Date.now() - startTime });
      throw error;
    }
  }

  /**
   * Create a chat session
   */
  async createChat(history?: Array<{ role: string; parts: Array<{ text: string }> }>) {
    const client = await this.ensureInitialized();

    return client.chats.create({
      model: 'gemini-2.5-flash',
      history: history || [],
    });
  }
}

export const geminiService = new GeminiService();
