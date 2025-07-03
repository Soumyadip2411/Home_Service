// Error logging utility for centralized error handling
class ErrorLogger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  // Log different types of errors
  logError(error, context = {}) {
    const errorInfo = {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      name: error?.name,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      context
    };

    // Development logging
    if (this.isDevelopment) {
      console.group('🚨 Error Logged');
      console.error('Error:', error);
      console.log('Context:', context);
      console.log('Error Info:', errorInfo);
      console.groupEnd();
    }

    // Production logging
    if (this.isProduction) {
      // Here you can integrate with error reporting services like:
      // - Sentry
      // - LogRocket
      // - Bugsnag
      // - Rollbar
      
      // For now, we'll just log to console
      console.error('Production Error:', errorInfo);
      
      // Example Sentry integration:
      // if (window.Sentry) {
      //   window.Sentry.captureException(error, {
      //     extra: context,
      //     tags: {
      //       component: context.component,
      //       action: context.action
      //   }
      // });
    }

    return errorInfo;
  }

  // Log API errors specifically
  logApiError(error, endpoint, method, requestData = null) {
    const context = {
      type: 'API_ERROR',
      endpoint,
      method,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      requestData,
      responseData: error?.response?.data
    };

    return this.logError(error, context);
  }

  // Log form validation errors
  logValidationError(errors, formName, fieldName = null) {
    const context = {
      type: 'VALIDATION_ERROR',
      formName,
      fieldName,
      errors
    };

    return this.logError(new Error('Validation failed'), context);
  }

  // Log navigation errors
  logNavigationError(error, from, to) {
    const context = {
      type: 'NAVIGATION_ERROR',
      from,
      to
    };

    return this.logError(error, context);
  }

  // Log component errors
  logComponentError(error, componentName, props = {}) {
    const context = {
      type: 'COMPONENT_ERROR',
      componentName,
      props: this.sanitizeProps(props)
    };

    return this.logError(error, context);
  }

  // Sanitize props to remove sensitive data
  sanitizeProps(props) {
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];
    const sanitized = { ...props };

    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  // Log performance issues
  logPerformanceIssue(issue, duration, threshold) {
    const context = {
      type: 'PERFORMANCE_ISSUE',
      issue,
      duration,
      threshold
    };

    return this.logError(new Error(`Performance issue: ${issue}`), context);
  }

  // Log user interactions that might be related to errors
  logUserInteraction(action, details = {}) {
    const context = {
      type: 'USER_INTERACTION',
      action,
      details,
      timestamp: new Date().toISOString()
    };

    if (this.isDevelopment) {
      console.log('👤 User Interaction:', context);
    }

    return context;
  }

  // Get error statistics (useful for monitoring)
  getErrorStats() {
    // This could be implemented to track error frequency
    // and provide insights for debugging
    return {
      totalErrors: 0, // Would be tracked in a real implementation
      errorsByType: {},
      errorsByComponent: {},
      lastErrorTime: null
    };
  }
}

// Create a singleton instance
const errorLogger = new ErrorLogger();

export default errorLogger;

// Export individual methods for convenience
export const {
  logError,
  logApiError,
  logValidationError,
  logNavigationError,
  logComponentError,
  logPerformanceIssue,
  logUserInteraction
} = errorLogger; 