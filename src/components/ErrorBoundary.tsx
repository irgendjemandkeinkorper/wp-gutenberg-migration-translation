import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Keeps an unexpected result-panel render failure from taking down the app shell. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  private reset = (): void => {
    this.props.onReset?.();
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <section className="panel error-box" role="alert">
        <strong>The conversion result could not be displayed.</strong>
        <p>Reset the result view and try the conversion again.</p>
        <button type="button" className="secondary" onClick={this.reset}>
          Reset result view
        </button>
      </section>
    );
  }
}
