import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

export const useErrorHandler = () => {
  const [error, setError] = useState(null);
  const [isError, setIsError] = useState(false);

  const handleError = useCallback((error, customMessage = null) => {
    console.error('Error handled by useErrorHandler:', error);

    // Determine error type and show appropriate message
    let message = customMessage;

    if (!message) {
      if (error?.response?.status === 401) {
        message = 'Please log in to continue';
      } else if (error?.response?.status === 403) {
        message = 'You do not have permission to perform this action';
      } else if (error?.response?.status === 404) {
        message = 'The requested resource was not found';
      } else if (error?.response?.status === 422) {
        message = 'Please check your input and try again';
      } else if (error?.response?.status >= 500) {
        message = 'Server error. Please try again later';
      } else if (error?.message?.includes('network')) {
        message = 'Network error. Please check your connection';
      } else if (error?.message?.includes('timeout')) {
        message = 'Request timed out. Please try again';
      } else {
        message = error?.response?.data?.message || error?.message || 'An unexpected error occurred';
      }
    }

    // Show toast notification
    toast.error(message);

    // Set error state
    setError(error);
    setIsError(true);

    return message;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setIsError(false);
  }, []);

  const handleAsyncError = useCallback(async (asyncFunction, customMessage = null) => {
    try {
      clearError();
      return await asyncFunction();
    } catch (error) {
      handleError(error, customMessage);
      throw error; // Re-throw to allow calling code to handle if needed
    }
  }, [handleError, clearError]);

  return {
    error,
    isError,
    handleError,
    clearError,
    handleAsyncError
  };
};

// Hook for handling form submission errors
export const useFormErrorHandler = () => {
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormError = useCallback((error, fieldName = null) => {
    if (error?.response?.data?.errors) {
      // Handle validation errors from backend
      const validationErrors = {};
      error.response.data.errors.forEach(err => {
        validationErrors[err.field || 'general'] = err.message;
      });
      setFormErrors(validationErrors);
    } else if (fieldName) {
      // Handle single field error
      setFormErrors(prev => ({
        ...prev,
        [fieldName]: error?.message || 'This field has an error'
      }));
    } else {
      // Handle general form error
      toast.error(error?.response?.data?.message || error?.message || 'Form submission failed');
    }
  }, []);

  const clearFormErrors = useCallback(() => {
    setFormErrors({});
  }, []);

  const clearFieldError = useCallback((fieldName) => {
    setFormErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const handleFormSubmit = useCallback(async (submitFunction) => {
    setIsSubmitting(true);
    clearFormErrors();

    try {
      const result = await submitFunction();
      setIsSubmitting(false);
      return result;
    } catch (error) {
      setIsSubmitting(false);
      handleFormError(error);
      throw error;
    }
  }, [clearFormErrors, handleFormError]);

  return {
    formErrors,
    isSubmitting,
    handleFormError,
    clearFormErrors,
    clearFieldError,
    handleFormSubmit
  };
};

// Hook for handling API call errors with retry logic
export const useApiErrorHandler = (maxRetries = 3) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleApiCall = useCallback(async (apiFunction, retryDelay = 1000) => {
    let attempts = 0;

    while (attempts <= maxRetries) {
      try {
        setIsRetrying(attempts > 0);
        setRetryCount(attempts);
        
        const result = await apiFunction();
        
        // Reset retry state on success
        setRetryCount(0);
        setIsRetrying(false);
        
        return result;
      } catch (error) {
        attempts++;
        
        // Don't retry on certain error types
        if (error?.response?.status === 401 || 
            error?.response?.status === 403 || 
            error?.response?.status === 404) {
          throw error;
        }
        
        if (attempts <= maxRetries) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempts));
          continue;
        }
        
        // Max retries reached
        setIsRetrying(false);
        throw error;
      }
    }
  }, [maxRetries]);

  return {
    retryCount,
    isRetrying,
    handleApiCall
  };
}; 