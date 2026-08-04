"use client";
import { Component, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// ErrorBoundary catches render-time exceptions in a single playground so a
// broken widget doesn't take down the entire concept page.
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (typeof console !== "undefined") {
      console.error("[playground] render error", error, info);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="bg-card border border-warn/30 rounded-xl p-6 text-center">
          <AlertTriangle
            size={20}
            className="mx-auto text-warn mb-2"
            aria-hidden="true"
          />
          <div className="text-sm text-warn font-medium mb-1">
            {this.props.fallbackTitle ?? "This playground crashed"}
          </div>
          <p className="text-xs text-dim mb-3">
            Try refreshing the page. Your progress is safe.
          </p>
          <button
            onClick={this.reset}
            className="text-xs px-3 py-1.5 rounded border border-line hover:bg-elev transition"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}