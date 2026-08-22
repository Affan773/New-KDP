import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900 text-white">
          <div className="max-w-md w-full p-8 rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl text-center">
            <div className="inline-flex p-4 rounded-2xl bg-rose-500/10 text-rose-400 mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Something unexpected happened</h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              The studio encountered an unexpected UI rendering state. Your local document data is preserved.
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Studio Workspace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

