import React from 'react';
import { motion } from 'framer-motion';
import { FiWifi, FiWifiOff, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

class ApiErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      retryCount: 0,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error) {
    // Only catch API-related errors
    if (this.isApiError(error)) {
      return { hasError: true };
    }
    return null;
  }

  static isApiError(error) {
    // Check if error is related to API calls
    return error.message?.includes('fetch') || 
           error.message?.includes('network') ||
           error.message?.includes('axios') ||
           error.name === 'TypeError' ||
           error.name === 'NetworkError';
  }

  componentDidCatch(error, errorInfo) {
    if (this.isApiError(error)) {
      console.error('API Error caught:', error);
      
      // Show user-friendly toast
      toast.error('Connection issue detected. Please check your internet connection.');
      
      this.setState({
        error: error,
        errorInfo: errorInfo
      });
    }
  }

  handleRetry = async () => {
    this.setState({ isRetrying: true });
    
    try {
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        isRetrying: false
      }));
      
      toast.success('Retrying connection...');
    } catch (error) {
      this.setState({ isRetrying: false });
      toast.error('Retry failed. Please try again.');
    }
  };

  render() {
    if (this.state.hasError) {
      return <ApiErrorFallback 
        error={this.state.error} 
        onRetry={this.handleRetry}
        retryCount={this.state.retryCount}
        isRetrying={this.state.isRetrying}
      />;
    }

    return this.props.children;
  }
}

const ApiErrorFallback = ({ error, onRetry, retryCount, isRetrying }) => {
  const isNetworkError = error?.message?.includes('network') || 
                        error?.message?.includes('fetch') ||
                        error?.name === 'NetworkError';

  return (
    <div className="min-h-[400px] bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-sm w-full bg-white rounded-xl shadow-lg p-6 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          {isNetworkError ? (
            <FiWifiOff className="w-6 h-6 text-blue-600" />
          ) : (
            <FiAlertCircle className="w-6 h-6 text-blue-600" />
          )}
        </motion.div>

        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {isNetworkError ? 'Connection Lost' : 'Service Unavailable'}
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          {isNetworkError 
            ? "We're having trouble connecting to our servers. Please check your internet connection."
            : "The service is temporarily unavailable. Please try again in a moment."
          }
        </p>

        {retryCount > 0 && (
          <p className="text-xs text-gray-500 mb-4">
            Retry attempt {retryCount}
          </p>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onRetry}
          disabled={isRetrying}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isRetrying ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <FiRefreshCw className="w-4 h-4" />
              </motion.div>
              Retrying...
            </>
          ) : (
            <>
              <FiRefreshCw className="w-4 h-4" />
              Try Again
            </>
          )}
        </motion.button>

        {/* Show error details in development */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
              Error Details
            </summary>
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono text-red-600">
              {error.toString()}
            </div>
          </details>
        )}
      </motion.div>
    </div>
  );
};

export default ApiErrorBoundary; 