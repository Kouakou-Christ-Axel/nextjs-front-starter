import { ApiError } from '@/lib/api-error';

export type HandledApiError = {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
  messages?: string[];
};

const DEFAULT_MESSAGE = 'An unknown error occurred';

// NestJS/class-validator returns validation errors as `message: string[]`.
// Surface them as a list so callers can render them individually.
function extractBodyMessages(body: unknown): string[] | undefined {
  if (!body || typeof body !== 'object' || !('message' in body))
    return undefined;
  const message = (body as { message?: unknown }).message;
  if (Array.isArray(message)) {
    const arr = message.filter((m): m is string => typeof m === 'string');
    return arr.length > 0 ? arr : undefined;
  }
  return undefined;
}

export function handleApiError(
  error: unknown,
  fallbackMessage: string = DEFAULT_MESSAGE
): HandledApiError {
  if (error instanceof ApiError) {
    return {
      message: error.message || fallbackMessage,
      status: error.status,
      errors: error.body?.errors,
      messages: extractBodyMessages(error.body),
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
