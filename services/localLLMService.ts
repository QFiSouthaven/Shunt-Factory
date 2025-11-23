/**
 * Local LLM Service (Frontend)
 * Client for LM Studio and Ollama via backend API
 */

import { withRetries, handleApiError } from './apiUtils';
import { logFrontendError, ErrorSeverity } from '@/utils/errorLogger';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

export type LocalLLMProvider = 'lmstudio' | 'ollama';

export interface LocalLLMHealthStatus {
  lmstudio: {
    available: boolean;
    url: string;
  };
  ollama: {
    available: boolean;
    url: string;
  };
}

export interface LocalLLMModels {
  lmstudio: string[];
  ollama: string[];
}

export interface LocalLLMResponse {
  text: string;
  model: string;
  provider: LocalLLMProvider;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

/**
 * Check health of local LLM providers
 */
export async function checkLocalLLMHealth(): Promise<LocalLLMHealthStatus> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/local-llm/health`, {
      method: 'GET',
      headers: {
        'x-api-key': import.meta.env.VITE_API_KEY || '',
      },
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logFrontendError(error, ErrorSeverity.Medium, {
      context: 'checkLocalLLMHealth',
    });
    return {
      lmstudio: { available: false, url: 'http://localhost:1234/v1' },
      ollama: { available: false, url: 'http://localhost:11434' },
    };
  }
}

/**
 * Get available models from local LLM providers
 */
export async function getLocalLLMModels(provider?: LocalLLMProvider): Promise<LocalLLMModels | string[]> {
  try {
    const url = provider
      ? `${BACKEND_URL}/api/local-llm/models?provider=${provider}`
      : `${BACKEND_URL}/api/local-llm/models`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': import.meta.env.VITE_API_KEY || '',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get models: ${response.status}`);
    }

    const data = await response.json();

    if (provider) {
      return data.models || [];
    }

    return data;
  } catch (error) {
    logFrontendError(error, ErrorSeverity.Medium, {
      context: 'getLocalLLMModels',
      provider,
    });

    if (provider) {
      return [];
    }

    return { lmstudio: [], ollama: [] };
  }
}

/**
 * Generate text using local LLM
 */
export async function generateWithLocalLLM(
  prompt: string,
  options: {
    systemPrompt?: string;
    provider?: LocalLLMProvider;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<{ resultText: string; tokenUsage: TokenUsage }> {
  const {
    systemPrompt,
    provider = 'lmstudio',
    model,
    temperature = 0.7,
    maxTokens = 2048,
  } = options;

  const apiCall = async () => {
    const response = await fetch(`${BACKEND_URL}/api/local-llm/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_API_KEY || '',
      },
      body: JSON.stringify({
        prompt,
        systemPrompt,
        provider,
        model,
        temperature,
        maxTokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Request failed: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  };

  try {
    const result = await withRetries(apiCall);

    return {
      resultText: result.text,
      tokenUsage: {
        inputTokens: result.tokenUsage?.promptTokens || 0,
        outputTokens: result.tokenUsage?.completionTokens || 0,
        totalTokens: result.tokenUsage?.totalTokens || 0,
      },
    };
  } catch (error) {
    logFrontendError(error, ErrorSeverity.High, {
      context: 'generateWithLocalLLM',
      provider,
    });
    throw error;
  }
}

/**
 * Perform Shunt action using local LLM
 */
export async function performLocalShunt(
  text: string,
  action: string,
  systemPrompt: string,
  options: {
    provider?: LocalLLMProvider;
    model?: string;
  } = {}
): Promise<{ resultText: string; tokenUsage: TokenUsage }> {
  const { provider = 'lmstudio', model } = options;

  const apiCall = async () => {
    const response = await fetch(`${BACKEND_URL}/api/local-llm/shunt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_API_KEY || '',
      },
      body: JSON.stringify({
        text,
        action,
        systemPrompt,
        provider,
        model,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Request failed: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  };

  try {
    const result = await withRetries(apiCall);

    return {
      resultText: result.resultText,
      tokenUsage: {
        inputTokens: result.tokenUsage?.promptTokens || 0,
        outputTokens: result.tokenUsage?.completionTokens || 0,
        totalTokens: result.tokenUsage?.totalTokens || 0,
      },
    };
  } catch (error) {
    logFrontendError(error, ErrorSeverity.High, {
      context: 'performLocalShunt',
      action,
      provider,
    });
    throw error;
  }
}

/**
 * Chat with local LLM (multi-turn conversation)
 */
export async function chatWithLocalLLM(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: {
    provider?: LocalLLMProvider;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<{ resultText: string; tokenUsage: TokenUsage }> {
  const {
    provider = 'lmstudio',
    model,
    temperature = 0.7,
    maxTokens = 2048,
  } = options;

  const apiCall = async () => {
    const response = await fetch(`${BACKEND_URL}/api/local-llm/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_API_KEY || '',
      },
      body: JSON.stringify({
        messages,
        provider,
        model,
        temperature,
        maxTokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Request failed: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  };

  try {
    const result = await withRetries(apiCall);

    return {
      resultText: result.text,
      tokenUsage: {
        inputTokens: result.tokenUsage?.promptTokens || 0,
        outputTokens: result.tokenUsage?.completionTokens || 0,
        totalTokens: result.tokenUsage?.totalTokens || 0,
      },
    };
  } catch (error) {
    logFrontendError(error, ErrorSeverity.High, {
      context: 'chatWithLocalLLM',
      provider,
    });
    throw error;
  }
}

/**
 * Helper to check if local LLM is available before using
 */
export async function isLocalLLMAvailable(provider: LocalLLMProvider = 'lmstudio'): Promise<boolean> {
  const health = await checkLocalLLMHealth();
  return health[provider]?.available || false;
}
