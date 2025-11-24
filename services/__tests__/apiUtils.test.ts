import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiServiceError, withRetries, handleApiError } from '../apiUtils';

describe('ApiServiceError', () => {
  it('creates an error with message', () => {
    const error = new ApiServiceError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('ApiServiceError');
  });

  it('creates an error with status code', () => {
    const error = new ApiServiceError('Not found', 404);
    expect(error.message).toBe('Not found');
    expect(error.status).toBe(404);
  });

  it('is an instance of Error', () => {
    const error = new ApiServiceError('Test error');
    expect(error instanceof Error).toBe(true);
    expect(error instanceof ApiServiceError).toBe(true);
  });
});

describe('withRetries', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('returns result on successful API call', async () => {
    const apiCall = vi.fn().mockResolvedValue({ data: 'success' });

    const promise = withRetries(apiCall);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual({ data: 'success' });
    expect(apiCall).toHaveBeenCalledTimes(1);
  });

  it('retries on rate limit error (429)', async () => {
    const apiCall = vi
      .fn()
      .mockRejectedValueOnce(new Error('Error 429: Too Many Requests'))
      .mockRejectedValueOnce(new Error('Error 429: Too Many Requests'))
      .mockResolvedValue({ data: 'success' });

    const promise = withRetries(apiCall);

    // First retry - wait 1s
    await vi.advanceTimersByTimeAsync(1000);
    expect(apiCall).toHaveBeenCalledTimes(2);

    // Second retry - wait 2s
    await vi.advanceTimersByTimeAsync(2000);
    expect(apiCall).toHaveBeenCalledTimes(3);

    const result = await promise;
    expect(result).toEqual({ data: 'success' });
  });

  it('detects rate limit error by "resource_exhausted" keyword', async () => {
    const apiCall = vi
      .fn()
      .mockRejectedValueOnce(new Error('resource_exhausted: quota exceeded'))
      .mockResolvedValue({ data: 'success' });

    const promise = withRetries(apiCall);
    await vi.advanceTimersByTimeAsync(1000);
    const result = await promise;

    expect(result).toEqual({ data: 'success' });
    expect(apiCall).toHaveBeenCalledTimes(2);
  });

  it('detects rate limit error by "rate limit" keyword', async () => {
    const apiCall = vi
      .fn()
      .mockRejectedValueOnce(new Error('Rate limit exceeded'))
      .mockResolvedValue({ data: 'success' });

    const promise = withRetries(apiCall);
    await vi.advanceTimersByTimeAsync(1000);
    const result = await promise;

    expect(result).toEqual({ data: 'success' });
    expect(apiCall).toHaveBeenCalledTimes(2);
  });

  it('uses exponential backoff (1s, 2s, 4s)', async () => {
    const apiCall = vi
      .fn()
      .mockRejectedValueOnce(new Error('429'))
      .mockRejectedValueOnce(new Error('429'))
      .mockRejectedValue(new Error('429'));

    const promise = withRetries(apiCall).catch(err => err);

    // First retry - 1000ms delay
    await vi.advanceTimersByTimeAsync(1000);
    expect(apiCall).toHaveBeenCalledTimes(2);

    // Second retry - 2000ms delay
    await vi.advanceTimersByTimeAsync(2000);
    expect(apiCall).toHaveBeenCalledTimes(3);

    // Third attempt (no more retries) - should have the error
    const result = await promise;
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toContain('429');
  });

  it('enforces max retries of 3 attempts', async () => {
    const apiCall = vi.fn()
      .mockRejectedValueOnce(new Error('429: Rate limited'))
      .mockRejectedValueOnce(new Error('429: Rate limited'))
      .mockRejectedValueOnce(new Error('429: Rate limited'));

    const promise = withRetries(apiCall).catch(err => err);

    // Attempt 1 (initial)
    expect(apiCall).toHaveBeenCalledTimes(1);

    // Retry 1 - wait 1s
    await vi.advanceTimersByTimeAsync(1000);
    expect(apiCall).toHaveBeenCalledTimes(2);

    // Retry 2 - wait 2s
    await vi.advanceTimersByTimeAsync(2000);
    expect(apiCall).toHaveBeenCalledTimes(3);

    // Should throw after max retries
    const result = await promise;
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toContain('429: Rate limited');
  });

  it('does not retry non-rate-limit errors', async () => {
    const apiCall = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    const promise = withRetries(apiCall).catch(err => err);
    await vi.runAllTimersAsync();

    const result = await promise;
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toContain('Network error');
    expect(apiCall).toHaveBeenCalledTimes(1);
  });

  it('throws immediately on non-rate-limit error', async () => {
    const apiCall = vi.fn().mockRejectedValueOnce(new Error('Authentication failed'));

    const promise = withRetries(apiCall).catch(err => err);
    await vi.runAllTimersAsync();

    const result = await promise;
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toContain('Authentication failed');
    expect(apiCall).toHaveBeenCalledTimes(1);
  });

  it('logs retry attempts with delay information', async () => {
    const apiCall = vi
      .fn()
      .mockRejectedValueOnce(new Error('429'))
      .mockResolvedValue({ data: 'success' });

    const promise = withRetries(apiCall);
    await vi.advanceTimersByTimeAsync(1000);
    await promise;

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Rate limit hit. Retrying in 1000ms... (Attempt 1/3)')
    );
  });

  it('is case-insensitive when detecting rate limit errors', async () => {
    const apiCall = vi
      .fn()
      .mockRejectedValueOnce(new Error('ERROR 429: RATE LIMIT'))
      .mockResolvedValue({ data: 'success' });

    const promise = withRetries(apiCall);
    await vi.advanceTimersByTimeAsync(1000);
    const result = await promise;

    expect(result).toEqual({ data: 'success' });
    expect(apiCall).toHaveBeenCalledTimes(2);
  });
});

describe('handleApiError', () => {
  it('handles Response object with 401 status', () => {
    const response = new Response(null, { status: 401 });
    const message = handleApiError(response);

    expect(message).toBe('Authentication failed. Please check your credentials.');
  });

  it('handles Response object with 429 status', () => {
    const response = new Response(null, { status: 429 });
    const message = handleApiError(response);

    expect(message).toBe('Too Many Requests. Please wait a moment and try again.');
  });

  it('handles Response object with 500 status', () => {
    const response = new Response(null, { status: 500 });
    const message = handleApiError(response);

    expect(message).toBe('Internal Server Error. The server encountered a problem.');
  });

  it('handles Response object with unknown status code', () => {
    const response = new Response(null, { status: 418 });
    const message = handleApiError(response);

    expect(message).toBe('An unexpected network error occurred (Status: 418).');
  });

  it('handles ApiServiceError instance', () => {
    const error = new ApiServiceError('Custom API error', 404);
    const message = handleApiError(error);

    expect(message).toBe('Custom API error');
  });

  it('handles generic Error instance', () => {
    const error = new Error('Something went wrong');
    const message = handleApiError(error);

    expect(message).toBe('Something went wrong');
  });

  it('handles non-Error objects', () => {
    const message1 = handleApiError('string error');
    const message2 = handleApiError({ error: 'object error' });
    const message3 = handleApiError(null);
    const message4 = handleApiError(undefined);

    expect(message1).toBe('An unexpected error occurred. Please try again.');
    expect(message2).toBe('An unexpected error occurred. Please try again.');
    expect(message3).toBe('An unexpected error occurred. Please try again.');
    expect(message4).toBe('An unexpected error occurred. Please try again.');
  });

  it('provides user-friendly messages for common HTTP errors', () => {
    const errors = [
      { status: 401, expected: 'Authentication failed. Please check your credentials.' },
      { status: 429, expected: 'Too Many Requests. Please wait a moment and try again.' },
      { status: 500, expected: 'Internal Server Error. The server encountered a problem.' },
    ];

    errors.forEach(({ status, expected }) => {
      const response = new Response(null, { status });
      expect(handleApiError(response)).toBe(expected);
    });
  });

  describe('Network Error Detection', () => {
    it('identifies network-related errors from Response status codes', () => {
      const networkStatuses = [401, 429, 500, 502, 503, 504];

      networkStatuses.forEach(status => {
        const response = new Response(null, { status });
        const message = handleApiError(response);
        // All should return specific error messages indicating network/server issues
        expect(message).toBeTruthy();
        expect(message.length).toBeGreaterThan(0);
      });
    });

    it('provides actionable error messages', () => {
      const response429 = new Response(null, { status: 429 });
      const message = handleApiError(response429);

      // Should include actionable advice
      expect(message).toContain('wait');
      expect(message).toContain('try again');
    });
  });
});

describe('Integration: withRetries + handleApiError', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('works together for complete error handling flow', async () => {
    // Simulate API that fails with rate limit then succeeds
    const apiCall = vi
      .fn()
      .mockRejectedValueOnce(new ApiServiceError('Rate limited', 429))
      .mockResolvedValue({ data: 'success' });

    const promise = withRetries(apiCall);
    await vi.advanceTimersByTimeAsync(1000);
    const result = await promise;

    expect(result).toEqual({ data: 'success' });

    // If it had failed, handleApiError would provide user-friendly message
    const errorMessage = handleApiError(new Response(null, { status: 429 }));
    expect(errorMessage).toBe('Too Many Requests. Please wait a moment and try again.');
  });

  it('provides helpful error messages after retry exhaustion', async () => {
    const apiCall = vi.fn()
      .mockRejectedValueOnce(new Error('429: Rate limit exceeded'))
      .mockRejectedValueOnce(new Error('429: Rate limit exceeded'))
      .mockRejectedValueOnce(new Error('429: Rate limit exceeded'));

    const promise = withRetries(apiCall).catch(err => err);

    // Exhaust all retries
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);

    const error = await promise;
    expect(error).toBeInstanceOf(Error);
    const userMessage = handleApiError(error);
    expect(userMessage).toBe('429: Rate limit exceeded');
  });
});
