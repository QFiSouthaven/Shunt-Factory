/**
 * Local LLM Service
 * Supports LM Studio (OpenAI-compatible API) and Ollama
 */

import { logger } from '../utils/logger';

export interface LocalLLMConfig {
  provider: 'lmstudio' | 'ollama';
  baseUrl: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LocalLLMRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface LocalLLMResponse {
  text: string;
  model: string;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Default configurations
const LM_STUDIO_DEFAULT: LocalLLMConfig = {
  provider: 'lmstudio',
  baseUrl: 'http://localhost:1234/v1',
  model: 'local-model',
  temperature: 0.7,
  maxTokens: 2048,
};

const OLLAMA_DEFAULT: LocalLLMConfig = {
  provider: 'ollama',
  baseUrl: 'http://localhost:11434',
  model: 'llama2',
  temperature: 0.7,
  maxTokens: 2048,
};

/**
 * Call LM Studio API (OpenAI-compatible)
 */
async function callLMStudio(
  config: LocalLLMConfig,
  request: LocalLLMRequest
): Promise<LocalLLMResponse> {
  const url = `${config.baseUrl}/chat/completions`;

  const messages = [];

  if (request.systemPrompt) {
    messages.push({
      role: 'system',
      content: request.systemPrompt,
    });
  }

  messages.push({
    role: 'user',
    content: request.prompt,
  });

  const body = {
    model: request.model || config.model,
    messages,
    temperature: request.temperature ?? config.temperature,
    max_tokens: request.maxTokens ?? config.maxTokens,
    stream: false,
  };

  logger.info('Calling LM Studio', { url, model: body.model });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('LM Studio API error', { status: response.status, error: errorText });
    throw new Error(`LM Studio API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  return {
    text: data.choices[0]?.message?.content || '',
    model: data.model || config.model,
    tokenUsage: data.usage ? {
      promptTokens: data.usage.prompt_tokens || 0,
      completionTokens: data.usage.completion_tokens || 0,
      totalTokens: data.usage.total_tokens || 0,
    } : undefined,
  };
}

/**
 * Call Ollama API
 */
async function callOllama(
  config: LocalLLMConfig,
  request: LocalLLMRequest
): Promise<LocalLLMResponse> {
  const url = `${config.baseUrl}/api/generate`;

  // Combine system prompt and user prompt for Ollama
  let fullPrompt = request.prompt;
  if (request.systemPrompt) {
    fullPrompt = `${request.systemPrompt}\n\n${request.prompt}`;
  }

  const body = {
    model: request.model || config.model,
    prompt: fullPrompt,
    stream: false,
    options: {
      temperature: request.temperature ?? config.temperature,
      num_predict: request.maxTokens ?? config.maxTokens,
    },
  };

  logger.info('Calling Ollama', { url, model: body.model });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Ollama API error', { status: response.status, error: errorText });
    throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  return {
    text: data.response || '',
    model: data.model || config.model,
    tokenUsage: {
      promptTokens: data.prompt_eval_count || 0,
      completionTokens: data.eval_count || 0,
      totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
    },
  };
}

/**
 * Check if LM Studio is available
 */
export async function checkLMStudioHealth(baseUrl?: string): Promise<boolean> {
  const url = baseUrl || LM_STUDIO_DEFAULT.baseUrl;
  try {
    const response = await fetch(`${url}/models`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch (error) {
    logger.warn('LM Studio health check failed', { url, error });
    return false;
  }
}

/**
 * Check if Ollama is available
 */
export async function checkOllamaHealth(baseUrl?: string): Promise<boolean> {
  const url = baseUrl || OLLAMA_DEFAULT.baseUrl;
  try {
    const response = await fetch(`${url}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch (error) {
    logger.warn('Ollama health check failed', { url, error });
    return false;
  }
}

/**
 * Get available models from LM Studio
 */
export async function getLMStudioModels(baseUrl?: string): Promise<string[]> {
  const url = baseUrl || LM_STUDIO_DEFAULT.baseUrl;
  try {
    const response = await fetch(`${url}/models`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.data?.map((m: any) => m.id) || [];
  } catch (error) {
    logger.error('Failed to get LM Studio models', { error });
    return [];
  }
}

/**
 * Get available models from Ollama
 */
export async function getOllamaModels(baseUrl?: string): Promise<string[]> {
  const url = baseUrl || OLLAMA_DEFAULT.baseUrl;
  try {
    const response = await fetch(`${url}/api/tags`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.models?.map((m: any) => m.name) || [];
  } catch (error) {
    logger.error('Failed to get Ollama models', { error });
    return [];
  }
}

/**
 * Main function to call local LLM
 */
export async function callLocalLLM(
  request: LocalLLMRequest,
  provider: 'lmstudio' | 'ollama' = 'lmstudio',
  customConfig?: Partial<LocalLLMConfig>
): Promise<LocalLLMResponse> {
  const baseConfig = provider === 'lmstudio' ? LM_STUDIO_DEFAULT : OLLAMA_DEFAULT;

  const config: LocalLLMConfig = {
    ...baseConfig,
    ...customConfig,
    provider,
  };

  // Override from environment variables
  if (provider === 'lmstudio') {
    config.baseUrl = process.env.LM_STUDIO_URL || config.baseUrl;
    config.model = process.env.LM_STUDIO_MODEL || config.model;
  } else {
    config.baseUrl = process.env.OLLAMA_URL || config.baseUrl;
    config.model = process.env.OLLAMA_MODEL || config.model;
  }

  logger.info('Calling local LLM', {
    provider,
    baseUrl: config.baseUrl,
    model: config.model
  });

  try {
    if (provider === 'lmstudio') {
      return await callLMStudio(config, request);
    } else {
      return await callOllama(config, request);
    }
  } catch (error) {
    logger.error('Local LLM call failed', { provider, error });
    throw error;
  }
}

/**
 * Perform a Shunt action using local LLM
 */
export async function performLocalShunt(
  text: string,
  action: string,
  systemPrompt: string,
  provider: 'lmstudio' | 'ollama' = 'lmstudio',
  model?: string
): Promise<LocalLLMResponse> {
  const request: LocalLLMRequest = {
    prompt: text,
    systemPrompt,
    model,
    temperature: 0.7,
    maxTokens: 4096,
  };

  return callLocalLLM(request, provider);
}
