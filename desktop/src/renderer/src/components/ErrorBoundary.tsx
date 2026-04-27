import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center h-screen w-screen bg-[#191919] text-white p-8">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <pre className="bg-red-900/20 p-4 rounded border border-red-500/50 text-sm overflow-auto max-w-full">
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2 bg-pplx-accent rounded-full text-white hover:opacity-90 transition-opacity"
            >
              Reload Application
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
