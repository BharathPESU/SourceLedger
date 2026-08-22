import React, { ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    (this as any).state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught React ErrorBoundary error:', error, errorInfo);
  }

  private handleReset = () => {
    (this as any).setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    const { hasError, error } = (this as any).state || {};
    const { children, fallback } = (this as any).props || {};

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className="min-h-[400px] w-full flex flex-col items-center justify-center p-8 my-8 bg-white/70 backdrop-blur-2xl rounded-3xl border border-white/80 ring-1 ring-white/50 shadow-lg text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#FFF0ED] text-[#D45320] flex items-center justify-center mb-4 border border-[#D45320]/20 shadow-xs">
            <AlertTriangle className="w-8 h-8" />
          </div>
          
          <h2 className="font-didone font-bold text-2xl text-[#191715]">
            Dashboard Component Error
          </h2>
          
          <p className="text-xs text-[#5C554D] max-w-md mt-2 leading-relaxed">
            A rendering issue occurred while displaying live catalog telemetry.
          </p>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-[#191715] text-[#FAF4EB] text-[11px] font-mono max-w-lg text-left overflow-x-auto border border-white/10">
              {error.toString()}
            </div>
          )}

          <button
            onClick={this.handleReset}
            className="mt-6 px-6 py-2.5 rounded-full bg-[#E8622C] hover:bg-[#D45320] text-white text-xs font-bold transition-all shadow-md shadow-[#E8622C]/25 flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Application</span>
          </button>
        </div>
      );
    }

    return children;
  }
}
