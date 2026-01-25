import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h1>Ups! Coś poszło nie tak</h1>
            <p>Wystąpił nieoczekiwany błąd. Przepraszamy za utrudnienia.</p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Szczegóły błędu (tylko w trybie deweloperskim)</summary>
                <pre>{this.state.error.toString()}</pre>
                <pre>{this.state.errorInfo?.componentStack}</pre>
              </details>
            )}
            <button className="btn-submit" onClick={this.handleReset}>
              Wróć do strony głównej
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
