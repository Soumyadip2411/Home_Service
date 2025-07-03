# Error Handling System

This document describes the comprehensive error handling system implemented in the Home Service application.

## Overview

The error handling system consists of multiple layers to provide robust error management:

1. **Error Boundaries** - React components that catch JavaScript errors
2. **Custom Hooks** - Reusable error handling logic
3. **Error Logging** - Centralized error tracking and reporting
4. **API Error Handling** - Specific handling for network requests

## Components

### 1. ErrorBoundary (`components/ErrorBoundary.jsx`)

A general-purpose error boundary that catches any JavaScript errors in the component tree.

**Features:**
- Catches all JavaScript errors
- Provides user-friendly fallback UI
- Shows error details in development mode
- Retry functionality
- Navigation options (Go Home, Refresh Page)

**Usage:**
```jsx
import ErrorBoundary from './components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### 2. ApiErrorBoundary (`components/ApiErrorBoundary.jsx`)

A specialized error boundary for API-related errors.

**Features:**
- Catches only API/network errors
- Different UI for network vs service errors
- Retry functionality with loading states
- Automatic error detection

**Usage:**
```jsx
import ApiErrorBoundary from './components/ApiErrorBoundary';

<ApiErrorBoundary>
  <ComponentWithApiCalls />
</ApiErrorBoundary>
```

## Custom Hooks

### 1. useErrorHandler

General-purpose error handling hook.

**Features:**
- Automatic error type detection
- Toast notifications
- Error state management
- Async error handling

**Usage:**
```jsx
import { useErrorHandler } from '../hooks/useErrorHandler';

const MyComponent = () => {
  const { handleError, handleAsyncError, error, isError } = useErrorHandler();

  const handleApiCall = async () => {
    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      handleError(error, 'Custom error message');
    }
  };

  // Or use the async wrapper
  const handleApiCallWithWrapper = async () => {
    return await handleAsyncError(
      async () => await apiCall(),
      'Custom error message'
    );
  };
};
```

### 2. useFormErrorHandler

Specialized hook for form error handling.

**Features:**
- Form validation error management
- Field-specific error handling
- Submission state management
- Automatic error clearing

**Usage:**
```jsx
import { useFormErrorHandler } from '../hooks/useErrorHandler';

const MyForm = () => {
  const { 
    formErrors, 
    isSubmitting, 
    handleFormSubmit, 
    clearFormErrors 
  } = useFormErrorHandler();

  const onSubmit = async (formData) => {
    await handleFormSubmit(async () => {
      const response = await submitForm(formData);
      return response;
    });
  };

  return (
    <form onSubmit={onSubmit}>
      <input 
        name="email" 
        className={formErrors.email ? 'error' : ''} 
      />
      {formErrors.email && <span>{formErrors.email}</span>}
      <button disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};
```

### 3. useApiErrorHandler

Hook for API calls with retry logic.

**Features:**
- Automatic retry on failure
- Configurable retry attempts
- Exponential backoff
- Retry state management

**Usage:**
```jsx
import { useApiErrorHandler } from '../hooks/useErrorHandler';

const MyComponent = () => {
  const { handleApiCall, isRetrying, retryCount } = useApiErrorHandler(3);

  const fetchData = async () => {
    try {
      const result = await handleApiCall(async () => {
        return await apiCall();
      });
      return result;
    } catch (error) {
      // Handle final failure
    }
  };
};
```

## Error Logging

### ErrorLogger (`utils/errorLogger.js`)

Centralized error logging utility.

**Features:**
- Different logging for development and production
- Error categorization (API, validation, component, etc.)
- Sensitive data sanitization
- Integration ready for error reporting services

**Usage:**
```jsx
import { logError, logApiError, logComponentError } from '../utils/errorLogger';

// General error logging
logError(error, { component: 'MyComponent', action: 'buttonClick' });

// API error logging
logApiError(error, '/api/users', 'GET', requestData);

// Component error logging
logComponentError(error, 'MyComponent', props);
```

## Best Practices

### 1. Error Boundary Placement

- Wrap the entire app with `ErrorBoundary`
- Use `ApiErrorBoundary` for components with API calls
- Place boundaries at logical component boundaries

### 2. Error Handling in Components

```jsx
// Good: Use hooks for consistent error handling
const MyComponent = () => {
  const { handleAsyncError } = useErrorHandler();
  
  const handleAction = async () => {
    await handleAsyncError(async () => {
      const result = await apiCall();
      return result;
    }, 'Failed to perform action');
  };
};

// Avoid: Manual try-catch everywhere
const MyComponent = () => {
  const handleAction = async () => {
    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      toast.error('Something went wrong');
      console.error(error);
    }
  };
};
```

### 3. Form Error Handling

```jsx
// Good: Use form error handler
const MyForm = () => {
  const { handleFormSubmit, formErrors } = useFormErrorHandler();
  
  const onSubmit = async (data) => {
    await handleFormSubmit(async () => {
      return await submitForm(data);
    });
  };
};
```

### 4. API Error Handling

```jsx
// Good: Use API error handler with retries
const MyComponent = () => {
  const { handleApiCall } = useApiErrorHandler(3);
  
  const fetchData = async () => {
    try {
      return await handleApiCall(async () => {
        return await apiCall();
      });
    } catch (error) {
      // Handle final failure
    }
  };
};
```

## Error Reporting Integration

The error logging system is designed to easily integrate with error reporting services:

### Sentry Integration Example

```jsx
// In errorLogger.js
if (this.isProduction && window.Sentry) {
  window.Sentry.captureException(error, {
    extra: context,
    tags: {
      component: context.component,
      action: context.action
    }
  });
}
```

### LogRocket Integration Example

```jsx
// In errorLogger.js
if (this.isProduction && window.LogRocket) {
  window.LogRocket.captureException(error);
}
```

## Error Types and Messages

The system automatically categorizes errors and provides appropriate messages:

- **401 Unauthorized**: "Please log in to continue"
- **403 Forbidden**: "You do not have permission to perform this action"
- **404 Not Found**: "The requested resource was not found"
- **422 Validation Error**: "Please check your input and try again"
- **500+ Server Error**: "Server error. Please try again later"
- **Network Error**: "Network error. Please check your connection"
- **Timeout Error**: "Request timed out. Please try again"

## Development vs Production

### Development Mode
- Detailed error information in console
- Error details shown in error boundaries
- Verbose logging for debugging

### Production Mode
- Minimal user-facing error information
- Error reporting service integration
- Sanitized error logs
- Performance optimized

## Testing Error Boundaries

To test error boundaries, you can throw errors in components:

```jsx
const TestComponent = () => {
  const [shouldError, setShouldError] = useState(false);
  
  if (shouldError) {
    throw new Error('Test error');
  }
  
  return (
    <button onClick={() => setShouldError(true)}>
      Trigger Error
    </button>
  );
};
```

## Monitoring and Analytics

The error handling system provides hooks for monitoring:

- Error frequency tracking
- Error type categorization
- User interaction logging
- Performance issue detection

This comprehensive error handling system ensures a robust and user-friendly experience while providing developers with the tools needed for effective debugging and monitoring. 