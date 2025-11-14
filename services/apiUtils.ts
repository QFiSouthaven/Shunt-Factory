// services/apiUtils.ts

export class ApiServiceError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiServiceError';
    // This is necessary for correctly extending built-in classes like Error in some environments
    Object.setPrototypeOf(this, ApiServiceError.prototype);
  }
}

/**
 * A utility function that wraps an API call with a retry mechanism.
 * If the API call fails with a rate limit error (429), it will retry
 * the call with an exponential backoff delay.
 * @param apiCall The async function to call.
 * @returns The result of the API call.
 */
export const withRetries = async <T>(apiCall: () => Promise<T>): Promise<T> => {
    const maxRetries = 3;
    let delay = 1000; // start with 1 second

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await apiCall();
        } catch (error: any) {
            const errorMessage = error.toString().toLowerCase();
            const isRateLimitError = errorMessage.includes('429') || errorMessage.includes('resource_exhausted') || errorMessage.includes('rate limit');

            if (isRateLimitError && i < maxRetries - 1) {
                console.warn(`Rate limit hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
            } else {
                // Last attempt or not a rate limit error, re-throw it
                throw error;
            }
        }
    }
    // This line should be unreachable due to the throw in the catch block on the final iteration
    throw new Error("An unexpected error occurred within the retry logic.");
};

/**
 * A utility to handle API errors in a standardized way.
 * It can process Response objects, ApiServiceError instances, or generic Errors.
 * @param error The error object to handle.
 * @returns A user-friendly error message string.
 */
export const handleApiError = (error: any): string => {
  if (error instanceof Response) {
    switch (error.status) {
      case 401:
        return 'Authentication failed. Please check your credentials.';
      case 429:
        return 'Too Many Requests. Please wait a moment and try again.';
      case 500:
        return 'Internal Server Error. The server encountered a problem.';
      default:
        return `An unexpected network error occurred (Status: ${error.status}).`;
    }
  }

  if (error instanceof ApiServiceError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }
  
  // Fallback for non-Error objects or unknown types
  return 'An unexpected error occurred. Please try again.';
};