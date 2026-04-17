import { ApiError } from '@/lib/api-error';

export type HandledApiError = {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
};

const DEFAULT_MESSAGE = 'An unknown error occurred';

export function handleApiError(
  error: unknown,
  fallbackMessage: string = DEFAULT_MESSAGE
): HandledApiError {
  if (error instanceof ApiError) {
    return {
      message: error.message || fallbackMessage,
      status: error.status,
      errors: error.body?.errors,
    };
  }

  if (error instanceof Error) {
    return { message: error.message || fallbackMessage };
  }

  if (typeof error === 'string' && error.length > 0) {
    return { message: error };
  }

  return { message: fallbackMessage };
}
