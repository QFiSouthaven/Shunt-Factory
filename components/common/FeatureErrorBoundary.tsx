// components/common/FeatureErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logFrontendError, ErrorSeverity } from '../../utils/errorLogger';

interface FeatureErrorBoundaryProps {
  children: ReactNode;
  featureName: string;
  onReset?: () => void;
}

interface FeatureErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Specialized ErrorBoundary for feature tabs
 * Provides feature-specific error handling with recovery options
 */
class FeatureErrorBoundary extends Component<FeatureErrorBoundaryProps, FeatureErrorBoundaryState> {
  constructor(props: FeatureErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
    };
  }

  static getDerivedStateFromError(error: Error): FeatureErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[${this.props.featureName}] Feature error:`, error, errorInfo);
    logFrontendError(error, ErrorSeverity.High, {
      componentStack: errorInfo.componentStack,
      feature: this.props.featureName,
    });
  }

  handleReset = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: undefined });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="max-w-md w-full bg-white border border-orange-300 rounded-lg shadow-md p-6">
            <div className="flex items-start gap-3 mb-4">
              <svg className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-bold text-lg text-gray-900">
                  {this.props.featureName} Error
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  This feature encountered an error. You can try again or switch to another tab.
                </p>
              </div>
            </div>

            {this.state.error && (
              <details className="mb-4 bg-gray-50 border border-gray-200 rounded p-3 text-xs">
                <summary className="cursor-pointer font-medium text-gray-700">
                  Error Details
                </summary>
                <p className="mt-2 text-red-600 font-mono break-all">
                  {this.state.error.message}
                </p>
              </details>
            )}

            <button
              onClick={this.handleReset}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default FeatureErrorBoundary;
