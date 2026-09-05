import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught runtime error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.href = "/dashboard";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 font-outfit">
          <div className="max-w-lg w-full card-soft text-center space-y-6 p-8 sm:p-10 border-destructive/20 bg-destructive/5 rounded-3xl shadow-xl">
            <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto text-destructive">
              <AlertTriangle size={36} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Something went wrong</h2>
              <p className="text-sm text-muted-foreground">
                We've encountered an unexpected error. Don't worry, your clinical data is safe.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 py-3.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <RefreshCw size={16} /> Go to Dashboard
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="flex-1 py-3.5 bg-muted text-foreground rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-muted/80 transition-colors cursor-pointer"
              >
                <Home size={16} /> Go to Welcome
              </button>
            </div>

            {/* Error Diagnostics Toggle */}
            <div className="pt-2 text-left">
              <button
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto cursor-pointer"
              >
                {this.state.showDetails ? (
                  <>
                    <ChevronUp size={14} /> Hide Technical Details
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} /> View Technical Details
                  </>
                )}
              </button>

              {this.state.showDetails && (
                <div className="mt-3 p-3 bg-card rounded-xl border text-[11px] font-mono text-destructive overflow-auto max-h-48 text-left">
                  <p className="font-bold">{this.state.error?.toString()}</p>
                  <pre className="mt-2 text-[10px] text-muted-foreground whitespace-pre-wrap">
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
