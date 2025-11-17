/**
 * Backend API Service
 * Replaces direct Gemini API calls with secure backend API calls
 */

import { ShuntAction, TokenUsage } from '../types';

// Backend API configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
const API_KEY = import.meta.env.VITE_API_KEY || 'dev-test-key';

interface BackendResponse<T = any> {
  resultText?: string;
  tokenUsage?: TokenUsage;
  latencyMs?: number;
  error?: string;
  message?: string;
  data?: T;
}

/**
 * Base fetch function with error handling
 */
async function fetchBackend<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<BackendResponse<T>> {
  const url = `${BACKEND_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Backend request failed');
  }

  return data;
}

/**
 * Perform shunt action via backend
 */
export async function performShuntViaBackend(
  text: string,
  action: ShuntAction,
  modelName: string,
  context?: string,
  priority?: string,
  promptInjectionGuardEnabled?: boolean
): Promise<{ resultText: string; tokenUsage: TokenUsage }> {
  const response = await fetchBackend('/api/gemini/shunt', {
    method: 'POST',
    body: JSON.stringify({
      text,
      action,
      modelName,
      context,
      priority,
      promptInjectionGuardEnabled,
    }),
  });

  return {
    resultText: response.resultText!,
    tokenUsage: response.tokenUsage!,
  };
}

/**
 * Execute modular prompt via backend
 */
export async function executeModularPromptViaBackend(
  text: string,
  modules: string[],
  context?: string,
  priority?: string,
  promptInjectionGuardEnabled?: boolean
): Promise<{ resultText: string; tokenUsage: TokenUsage }> {
  const response = await fetchBackend('/api/gemini/modular-prompt', {
    method: 'POST',
    body: JSON.stringify({
      text,
      modules,
      context,
      priority,
      promptInjectionGuardEnabled,
    }),
  });

  return {
    resultText: response.resultText!,
    tokenUsage: response.tokenUsage!,
  };
}

/**
 * Analyze image via backend
 */
export async function analyzeImageViaBackend(
  prompt: string,
  image: { base64Data: string; mimeType: string },
  modelName: string = 'gemini-2.5-flash'
): Promise<{ resultText: string; tokenUsage: TokenUsage }> {
  const response = await fetchBackend('/api/gemini/analyze-image', {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      image,
      modelName,
    }),
  });

  return {
    resultText: response.resultText!,
    tokenUsage: response.tokenUsage!,
  };
}

/**
 * Generate content via backend
 */
export async function generateContentViaBackend(
  prompt: string,
  modelName: string = 'gemini-2.5-flash',
  config?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
    responseSchema?: any;
  }
): Promise<{ resultText: string; tokenUsage: TokenUsage }> {
  const response = await fetchBackend('/api/gemini/generate', {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      modelName,
      config,
    }),
  });

  return {
    resultText: response.resultText!,
    tokenUsage: response.tokenUsage!,
  };
}

/**
 * Check backend health
 */
export async function checkBackendHealth(): Promise<{
  status: string;
  environment?: string;
  timestamp: string;
}> {
  const response = await fetch(`${BACKEND_URL}/health`);
  return response.json();
}

/**
 * Check if backend is ready
 */
export async function checkBackendReady(): Promise<{
  status: string;
  timestamp: string;
}> {
  const response = await fetch(`${BACKEND_URL}/ready`);
  return response.json();
}

/**
 * Check Gemini service health
 */
export async function checkGeminiHealth(): Promise<{
  status: string;
  service: string;
  timestamp: string;
}> {
  const response = await fetchBackend('/api/gemini/health');
  return response.data;
}
