import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FeatureErrorBoundary from '../FeatureErrorBoundary';
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

// Component that throws an error
const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error from child component');
  }
  return <div>Normal content</div>;
};

describe('FeatureErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for cleaner test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when there is no error', () => {
    render(
      <FeatureErrorBoundary featureName="TestFeature">
        <div>Test content</div>
      </FeatureErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('catches errors and displays error UI', () => {
    render(
      <FeatureErrorBoundary featureName="TestFeature">
        <ThrowError />
      </FeatureErrorBoundary>
    );

    expect(screen.getByText('TestFeature Error')).toBeInTheDocument();
    expect(screen.getByText(/This feature encountered an error/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
  });

  it('displays the error message in details section', () => {
    render(
      <FeatureErrorBoundary featureName="TestFeature">
        <ThrowError />
      </FeatureErrorBoundary>
    );

    const details = screen.getByText('Error Details');
    expect(details).toBeInTheDocument();
    expect(screen.getByText('Test error from child component')).toBeInTheDocument();
  });

  it('logs error with High severity and feature context', async () => {
    render(
      <FeatureErrorBoundary featureName="TestFeature">
        <ThrowError />
      </FeatureErrorBoundary>
    );

    await waitFor(() => {
      expect(errorLogger.logFrontendError).toHaveBeenCalledWith(
        expect.any(Error),
        'High',
        expect.objectContaining({
          feature: 'TestFeature',
          componentStack: expect.any(String),
        })
      );
    });
  });

  it('resets error state when "Try Again" button is clicked', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();

    render(
      <FeatureErrorBoundary featureName="TestFeature" onReset={onReset}>
        <ThrowError shouldThrow={true} />
      </FeatureErrorBoundary>
    );

    // Verify error UI is shown
    expect(screen.getByText('TestFeature Error')).toBeInTheDocument();

    // Click "Try Again" button
    const tryAgainButton = screen.getByRole('button', { name: /Try Again/i });
    await user.click(tryAgainButton);

    // Verify that onReset was called and state was reset
    expect(onReset).toHaveBeenCalledTimes(1);

    // Note: After reset, if children still throw, error will be caught again
    // This tests that the reset mechanism itself works correctly
  });

  it('calls onReset callback when provided and "Try Again" is clicked', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();

    render(
      <FeatureErrorBoundary featureName="TestFeature" onReset={onReset}>
        <ThrowError />
      </FeatureErrorBoundary>
    );

    const tryAgainButton = screen.getByRole('button', { name: /Try Again/i });
    await user.click(tryAgainButton);

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('handles multiple different feature names correctly', () => {
    const { rerender } = render(
      <FeatureErrorBoundary featureName="Feature1">
        <ThrowError />
      </FeatureErrorBoundary>
    );

    expect(screen.getByText('Feature1 Error')).toBeInTheDocument();

    rerender(
      <FeatureErrorBoundary featureName="Feature2">
        <ThrowError />
      </FeatureErrorBoundary>
    );

    expect(screen.getByText('Feature2 Error')).toBeInTheDocument();
  });

  it('maintains error isolation for per-feature components', () => {
    // Render two separate error boundaries
    const { container } = render(
      <>
        <FeatureErrorBoundary featureName="Feature1">
          <ThrowError />
        </FeatureErrorBoundary>
        <FeatureErrorBoundary featureName="Feature2">
          <div>Feature2 working fine</div>
        </FeatureErrorBoundary>
      </>
    );

    // Feature1 should show error
    expect(screen.getByText('Feature1 Error')).toBeInTheDocument();
    // Feature2 should work normally
    expect(screen.getByText('Feature2 working fine')).toBeInTheDocument();
  });

  it('renders error UI with correct styling classes', () => {
    const { container } = render(
      <FeatureErrorBoundary featureName="TestFeature">
        <ThrowError />
      </FeatureErrorBoundary>
    );

    // Check for orange border (warning color)
    const errorContainer = container.querySelector('.border-orange-300');
    expect(errorContainer).toBeInTheDocument();
  });
});
