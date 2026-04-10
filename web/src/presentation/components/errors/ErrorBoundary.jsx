import { Component } from "react";
import ErrorFallback from "./ErrorFallback";
import { reportError } from "../../../lib/errors/errorLogger";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    reportError(error, {
      source: "ErrorBoundary",
      componentStack: errorInfo?.componentStack,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { hasError } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <ErrorFallback
          title="Se produjo un error al renderizar la aplicación"
          message="Recargá o intentá nuevamente. Si persiste, avisá al equipo técnico."
          onRetry={this.handleRetry}
          retryLabel="Volver a intentar"
        />
      );
    }

    return children;
  }
}

export default ErrorBoundary;
