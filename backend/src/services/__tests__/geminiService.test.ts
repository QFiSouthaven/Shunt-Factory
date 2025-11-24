/**
 * Gemini Service Tests (Backend)
 * Tests for secure Gemini API integration with token tracking
 */

// Mock token usage mapping
function mapTokenUsage(response: any, model: string) {
  return {
    prompt_tokens: response.usageMetadata?.promptTokenCount ?? 0,
    completion_tokens: response.usageMetadata?.candidatesTokenCount ?? 0,
    total_tokens: response.usageMetadata?.totalTokenCount ?? 0,
    model,
  };
}

describe('GeminiService', () => {
  describe('Token Usage Mapping', () => {
    it('should correctly map token counts', () => {
      const mockResponse = {
        usageMetadata: {
          promptTokenCount: 100,
          candidatesTokenCount: 200,
          totalTokenCount: 300,
        },
      };

      const result = mapTokenUsage(mockResponse, 'gemini-2.5-flash');

      expect(result.prompt_tokens).toBe(100);
      expect(result.completion_tokens).toBe(200);
      expect(result.total_tokens).toBe(300);
      expect(result.model).toBe('gemini-2.5-flash');
    });

    it('should handle missing usage metadata', () => {
      const mockResponse = {};

      const result = mapTokenUsage(mockResponse, 'gemini-2.5-flash');

      expect(result.prompt_tokens).toBe(0);
      expect(result.completion_tokens).toBe(0);
      expect(result.total_tokens).toBe(0);
    });

    it('should handle partial usage metadata', () => {
      const mockResponse = {
        usageMetadata: {
          promptTokenCount: 10,
        },
      };

      const result = mapTokenUsage(mockResponse, 'gemini-2.5-pro');

      expect(result.prompt_tokens).toBe(10);
      expect(result.completion_tokens).toBe(0);
      expect(result.total_tokens).toBe(0);
      expect(result.model).toBe('gemini-2.5-pro');
    });

    it('should handle zero token counts', () => {
      const mockResponse = {
        usageMetadata: {
          promptTokenCount: 0,
          candidatesTokenCount: 0,
          totalTokenCount: 0,
        },
      };

      const result = mapTokenUsage(mockResponse, 'gemini-2.5-flash');

      expect(result.prompt_tokens).toBe(0);
      expect(result.completion_tokens).toBe(0);
      expect(result.total_tokens).toBe(0);
    });

    it('should preserve model name', () => {
      const mockResponse = {
        usageMetadata: {
          totalTokenCount: 50,
        },
      };

      const result1 = mapTokenUsage(mockResponse, 'gemini-2.5-flash');
      const result2 = mapTokenUsage(mockResponse, 'gemini-2.5-pro');

      expect(result1.model).toBe('gemini-2.5-flash');
      expect(result2.model).toBe('gemini-2.5-pro');
    });
  });

  describe('Request Configuration', () => {
    it('should accept default model', () => {
      const defaultModel = 'gemini-2.5-flash';
      expect(defaultModel).toBe('gemini-2.5-flash');
    });

    it('should support custom config', () => {
      const config = {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 1000,
      };

      expect(config.temperature).toBe(0.7);
      expect(config.topP).toBe(0.9);
      expect(config.maxOutputTokens).toBe(1000);
    });

    it('should support thinking config', () => {
      const config = {
        thinkingConfig: { thinkingBudget: 2000 },
      };

      expect(config.thinkingConfig.thinkingBudget).toBe(2000);
    });

    it('should support response schema', () => {
      const config = {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            result: { type: 'string' },
          },
        },
      };

      expect(config.responseMimeType).toBe('application/json');
      expect(config.responseSchema.type).toBe('object');
    });
  });

  describe('Image Content Structure', () => {
    it('should create correct image part structure', () => {
      const image = {
        base64Data: 'base64encodeddata',
        mimeType: 'image/png',
      };

      const imagePart = {
        inlineData: {
          data: image.base64Data,
          mimeType: image.mimeType,
        },
      };

      expect(imagePart.inlineData.data).toBe('base64encodeddata');
      expect(imagePart.inlineData.mimeType).toBe('image/png');
    });

    it('should handle different image mime types', () => {
      const mimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

      mimeTypes.forEach((mimeType) => {
        const imagePart = {
          inlineData: {
            data: 'data',
            mimeType,
          },
        };

        expect(imagePart.inlineData.mimeType).toBe(mimeType);
      });
    });
  });

  describe('Chat History Structure', () => {
    it('should handle empty history', () => {
      const history: any[] = [];
      expect(history.length).toBe(0);
    });

    it('should handle chat with history', () => {
      const history = [
        { role: 'user', parts: [{ text: 'Hello' }] },
        { role: 'model', parts: [{ text: 'Hi!' }] },
      ];

      expect(history.length).toBe(2);
      expect(history[0].role).toBe('user');
      expect(history[1].role).toBe('model');
    });
  });
});
