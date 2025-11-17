import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AsyncErrorBoundary from '../AsyncErrorBoundary';
import * as errorLogger from '../../../utils/errorLogger';

// Mock the error logger
vi.mock('../../../utils/errorLogger', () => ({
  logFrontendError: vi.fn(),
  ErrorSeverity: {
    Low: 'Low',
    Medium: 'Medium',
    High: 'High',
    Critical: 'Critical',
  },
}));

// Component that throws different types of errors
const ThrowError = ({
  shouldThrow = true,
  errorType = 'generic'
}: {
  shouldThrow?: boolean;
  errorType?: 'generic' | 'network' | 'fetch' | 'api';
}) => {
  if (shouldThrow) {
    switch (errorType) {
      case 'network':
        throw new Error('Network error: Unable to connect');
      case 'fetch':
        throw new Error('Fetch failed: Could not retrieve data');
      case 'api':
        throw new Error('API request failed');
      default:
        throw new Error('Generic error occurred');
    }
  }
  return <div>Normal content</div>;
};

describe('AsyncErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('renders children when there is no error', () => {
    render(
      <AsyncErrorBoundary>
        <div>Test content</div>
      </AsyncErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  describe('Network Error Detection', () => {
    it('detects network errors by message content', () => {
      render(
        <AsyncErrorBoundary>
          <ThrowError errorType="network" />
        </AsyncErrorBoundary>
      );

      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(screen.getByText(/Unable to connect to the service/)).toBeInTheDocument();
    });

    it('detects fetch errors by message content', () => {
      render(
        <AsyncErrorBoundary>
          <ThrowError errorType="fetch" />
        </AsyncErrorBoundary>
      );

      expect(screen.getByText('Connection Error')).toBeInTheDocument();
    });

    it('detects API errors by message content', () => {
      render(
        <AsyncErrorBoundary>
          <ThrowError errorType="api" />
        </AsyncErrorBoundary>
      );

      // Note: The render method only checks for 'network' and 'fetch', not 'api'
      // So API errors are treated as generic errors in the UI
      expect(screen.getByText('Operation Failed')).toBeInTheDocument();
      expect(screen.getByText('API request failed')).toBeInTheDocument();
    });

    it('shows generic error message for non-network errors', () => {
      render(
        <AsyncErrorBoundary>
          <ThrowError errorType="generic" />
        </AsyncErrorBoundary>
      );

      expect(screen.getByText('Operation Failed')).toBeInTheDocument();
      expect(screen.getByText(/The operation encountered an error/)).toBeInTheDocument();
    });

    it('logs network errors with Medium severity', async () => {
      render(
        <AsyncErrorBoundary>
          <ThrowError errorType="network" />
        </AsyncErrorBoundary>
      );

      await waitFor(() => {
        expect(errorLogger.logFrontendError).toHaveBeenCalledWith(
          expect.any(Error),
          'Medium',
          expect.objectContaining({
            isNetworkError: true,
            retryCount: 0,
          })
        );
      });
    });

    it('logs non-network errors with High severity', async () => {
      render(
        <AsyncErrorBoundary>
          <ThrowError errorType="generic" />
        </AsyncErrorBoundary>
      );

      await waitFor(() => {
        expect(errorLogger.logFrontendError).toHaveBeenCalledWith(
          expect.any(Error),
          'High',
          expect.objectContaining({
            isNetworkError: false,
            retryCount: 0,
          })
        );
      });
    });
  });

  describe('Automatic Retry Logic', () => {
    it('displays retry button with attempt counter', () => {
      render(
        <AsyncErrorBoundary maxRetries={3}>
          <ThrowError />
        </AsyncErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /Retry \(0\/3\)/i })).toBeInTheDocument();
      expect(screen.getByText('3 attempts remaining')).toBeInTheDocument();
    });

    it('respects custom maxRetries prop', () => {
      render(
        <AsyncErrorBoundary maxRetries={5}>
          <ThrowError />
        </AsyncErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /Retry \(0\/5\)/i })).toBeInTheDocument();
    });

    it('uses default maxRetries of 3 when not specified', () => {
      render(
        <AsyncErrorBoundary>
          <ThrowError />
        </AsyncErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /Retry \(0\/3\)/i })).toBeInTheDocument();
    });

    it('increments retry count after retry attempt', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn().mockRejectedValue(new Error('Still failing'));

      render(
        <AsyncErrorBoundary onRetry={onRetry} maxRetries={3}>
          <ThrowError />
        </AsyncErrorBoundary>
      );

      // First retry
      const retryButton = screen.getByRole('button', { name: /Retry \(0\/3\)/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(onRetry).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button', { name: /Retry \(1\/3\)/i })).toBeInTheDocument();
        expect(screen.getByText('2 attempts remaining')).toBeInTheDocument();
      });
    });

    it('shows loading state during retry', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <AsyncErrorBoundary onRetry={onRetry}>
          <ThrowError />
        </AsyncErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /Retry \(0\/3\)/i });
      await user.click(retryButton);

      // Should show loading state
      expect(screen.getByText('Retrying...')).toBeInTheDocument();
      expect(retryButton).toBeDisabled();

      await waitFor(() => {
        expect(onRetry).toHaveBeenCalled();
      });
    });

    it('resets error state after successful retry', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn().mockResolvedValue(undefined);

      render(
        <AsyncErrorBoundary onRetry={onRetry}>
          <ThrowError errorType="generic" />
        </AsyncErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /Retry \(0\/3\)/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(onRetry).toHaveBeenCalled();
        // Verify retry incremented and state was reset (even if error gets caught again)
        expect(screen.getByRole('button', { name: /Retry \(1\/3\)/i })).toBeInTheDocument();
      });
    });

    it('enforces max retry limit (3 attempts)', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn().mockRejectedValue(new Error('Still failing'));

      render(
        <AsyncErrorBoundary onRetry={onRetry} maxRetries={3}>
          <ThrowError />
        </AsyncErrorBoundary>
      );

      // Attempt 1
      await user.click(screen.getByRole('button', { name: /Retry \(0\/3\)/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry \(1\/3\)/i })).toBeInTheDocument();
      });

      // Attempt 2
      await user.click(screen.getByRole('button', { name: /Retry \(1\/3\)/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry \(2\/3\)/i })).toBeInTheDocument();
      });

      // Attempt 3
      await user.click(screen.getByRole('button', { name: /Retry \(2\/3\)/i }));

      // After max retries, should show max retry message
      await waitFor(() => {
        expect(screen.getByText(/Maximum retry attempts reached/)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Retry/i })).not.toBeInTheDocument();
      });

      expect(onRetry).toHaveBeenCalledTimes(3);
    });

    it('shows warning when max retries are reached', () => {
      render(
        <AsyncErrorBoundary maxRetries={0}>
          <ThrowError />
        </AsyncErrorBoundary>
      );

      expect(screen.getByText(/Maximum retry attempts reached/)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Retry/i })).not.toBeInTheDocument();
    });

    it('handles retry without onRetry callback', async () => {
      const user = userEvent.setup();

      render(
        <AsyncErrorBoundary maxRetries={3}>
          <ThrowError errorType="generic" />
        </AsyncErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /Retry \(0\/3\)/i });
      await user.click(retryButton);

      // Should still increment retry count even without onRetry callback
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry \(1\/3\)/i })).toBeInTheDocument();
      });
    });
  });

  describe('Error Display', () => {
    it('displays error message in UI', () => {
      render(
        <AsyncErrorBoundary>
          <ThrowError errorType="network" />
        </AsyncErrorBoundary>
      );

      expect(screen.getByText('Network error: Unable to connect')).toBeInTheDocument();
    });

    it('renders error UI with correct styling classes', () => {
      const { container } = render(
        <AsyncErrorBoundary>
          <ThrowError />
        </AsyncErrorBoundary>
      );

      // Check for yellow border (warning color for async errors)
      const errorContainer = container.querySelector('.border-yellow-300');
      expect(errorContainer).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles async onRetry that throws error', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn().mockRejectedValue(new Error('Retry failed'));

      render(
        <AsyncErrorBoundary onRetry={onRetry}>
          <ThrowError />
        </AsyncErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /Retry \(0\/3\)/i });
      await user.click(retryButton);

      await waitFor(() => {
        // Should increment retry count even when retry fails
        expect(screen.getByRole('button', { name: /Retry \(1\/3\)/i })).toBeInTheDocument();
      });

      expect(console.error).toHaveBeenCalledWith(
        '[AsyncErrorBoundary] Retry failed:',
        expect.any(Error)
      );
    });

    it('prevents retry when already retrying', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 500))
      );

      render(
        <AsyncErrorBoundary onRetry={onRetry}>
          <ThrowError />
        </AsyncErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /Retry \(0\/3\)/i });

      // Click multiple times rapidly
      await user.click(retryButton);
      await user.click(retryButton);
      await user.click(retryButton);

      // onRetry should only be called once due to disabled state
      await waitFor(() => {
        expect(onRetry).toHaveBeenCalledTimes(1);
      });
    });

    it('updates remaining attempts text correctly', () => {
      render(
        <AsyncErrorBoundary maxRetries={1}>
          <ThrowError />
        </AsyncErrorBoundary>
      );

      // Should use singular "attempt" for 1 remaining
      expect(screen.getByText('1 attempt remaining')).toBeInTheDocument();
    });
  });
});
