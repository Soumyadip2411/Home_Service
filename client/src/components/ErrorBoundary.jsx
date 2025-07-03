import React from 'react';
import { motion } from 'framer-motion';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    // Log error to your error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // You can integrate with services like Sentry, LogRocket, etc.
      console.error('Production error:', error);
    }

    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback 
        error={this.state.error} 
        errorInfo={this.state.errorInfo}
        onRetry={this.handleRetry}
        retryCount={this.state.retryCount}
      />;
    }

    return this.props.children;
  }
}

// Functional component for the fallback UI
const ErrorFallback = ({ error, errorInfo, onRetry, retryCount }) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <FiAlertTriangle className="w-8 h-8 text-red-600" />
        </motion.div>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Oops! Something went wrong
        </h2>
        
        <p className="text-gray-600 mb-6">
          {retryCount > 0 
            ? `We're having trouble loading this page. This is attempt ${retryCount + 1}.`
            : "We encountered an unexpected error. Don't worry, we're working to fix it."
          }
        </p>

        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRetry}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <FiRefreshCw className="w-4 h-4" />
            Try Again
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoHome}
            className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <FiHome className="w-4 h-4" />
            Go to Home
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRefresh}
            className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Refresh Page
          </motion.button>
        </div>

        {/* Show error details in development */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Error Details (Development)
            </summary>
            <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-red-600 overflow-auto max-h-40">
              <div className="mb-2">
                <strong>Error:</strong> {error.toString()}
              </div>
              {errorInfo && (
                <div>
                  <strong>Component Stack:</strong>
                  <pre className="whitespace-pre-wrap mt-1">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}
      </motion.div>
    </div>
  );
};

export default ErrorBoundary; 