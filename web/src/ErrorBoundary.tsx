import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackBody?: string;
  retryText?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Global ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = "/";
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main className="shell setup-shell" role="alert">
          <p className="brand">Prooffolio</p>
          <div className="mic-help error-boundary-box">
            <h1>{this.props.fallbackTitle ?? "Something went wrong"}</h1>
            <p className="lede">{this.props.fallbackBody ?? "An unexpected error occurred. Please try again."}</p>
            {this.state.error && (
              <details className="error-details">
                <summary>Technical details</summary>
                <pre>{this.state.error.message}</pre>
              </details>
            )}
            <button className="primary" onClick={this.handleRetry}>
              {this.props.retryText ?? "Try again"}
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
