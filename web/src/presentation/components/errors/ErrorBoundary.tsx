import { Component, type ErrorInfo, type ReactNode } from "react";

import { reportError } from "../../../lib/errors/errorLogger";
import ErrorFallback from "./ErrorFallback";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    reportError(error, {
      source: "ErrorBoundary",
      componentStack: errorInfo?.componentStack,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null }, () => {
      window.location.reload();
    });
  };

  render() {
    const { hasError } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <ErrorFallback
          title="Hubo un problema al cargar el sitio"
          message="Recargá la página o intentá nuevamente en unos minutos. Si el problema persiste, contactá al equipo."
          onRetry={this.handleRetry}
          retryLabel="Volver a intentar"
        />
      );
    }

    return children;
  }
}

export default ErrorBoundary;
