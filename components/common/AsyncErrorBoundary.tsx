// components/common/AsyncErrorBoundary.tsx
// @ts-nocheck - Legacy React class component pattern
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logFrontendError, ErrorSeverity } from '../../utils/errorLogger';

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  onRetry?: () => void | Promise<void>;
  maxRetries?: number;
}

interface AsyncErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  retryCount: number;
  isRetrying: boolean;
}

/**
 * ErrorBoundary with automatic retry logic for async operations
 * Useful for components that make API calls
 */
class AsyncErrorBoundary extends Component<AsyncErrorBoundaryProps, AsyncErrorBoundaryState> {
  constructor(props: AsyncErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
      retryCount: 0,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AsyncErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const isNetworkError = error.message.toLowerCase().includes('network') ||
                           error.message.toLowerCase().includes('fetch') ||
                           error.message.toLowerCase().includes('api');

    console.error('[AsyncErrorBoundary] Async operation error:', error, errorInfo);

    logFrontendError(error, isNetworkError ? ErrorSeverity.Medium : ErrorSeverity.High, {
      componentStack: errorInfo.componentStack,
      isNetworkError,
      retryCount: this.state.retryCount,
    });
  }

  handleRetry = async () => {
    const { maxRetries = 3, onRetry } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      console.warn('[AsyncErrorBoundary] Max retries reached');
      return;
    }

    this.setState({ isRetrying: true });

    try {
      if (onRetry) {
        await onRetry();
      }

      // Reset error state after successful retry
      this.setState({
        hasError: false,
        error: undefined,
        retryCount: retryCount + 1,
        isRetrying: false,
      });
    } catch (retryError) {
      console.error('[AsyncErrorBoundary] Retry failed:', retryError);
      this.setState({
        isRetrying: false,
        retryCount: retryCount + 1,
      });
    }
  };

  render(): ReactNode {
    const { hasError, error, retryCount, isRetrying } = this.state;
    const { maxRetries = 3 } = this.props;

    if (hasError) {
      const canRetry = retryCount < maxRetries;
      const isNetworkError = error?.message.toLowerCase().includes('network') ||
                              error?.message.toLowerCase().includes('fetch');

      return (
        <div className="flex items-center justify-center h-full p-4">
          <div className="max-w-md w-full bg-white border border-yellow-300 rounded-lg shadow p-6">
            <div className="flex items-start gap-3 mb-4">
              <svg className="w-6 h-6 text-yellow-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">
                  {isNetworkError ? 'Connection Error' : 'Operation Failed'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {isNetworkError
                    ? 'Unable to connect to the service. Please check your internet connection.'
                    : 'The operation encountered an error.'}
                </p>
                {error && (
                  <p className="text-xs text-gray-500 mt-2 font-mono break-all">
                    {error.message}
                  </p>
                )}
              </div>
            </div>

            {canRetry ? (
              <div className="space-y-2">
                <button
                  onClick={this.handleRetry}
                  disabled={isRetrying}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
                >
                  {isRetrying ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Retrying...
                    </>
                  ) : (
                    `Retry (${retryCount}/${maxRetries})`
                  )}
                </button>
                <p className="text-xs text-center text-gray-500">
                  {maxRetries - retryCount} {maxRetries - retryCount === 1 ? 'attempt' : 'attempts'} remaining
                </p>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-sm text-red-800">
                  Maximum retry attempts reached. Please reload the page or contact support if the issue persists.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AsyncErrorBoundary;
