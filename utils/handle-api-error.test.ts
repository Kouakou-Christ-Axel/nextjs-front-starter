import { describe, expect, it } from 'vitest';
import { handleApiError } from './handle-api-error';
import { ApiError } from '@/lib/api-error';

describe('handleApiError', () => {
  it('extracts message, status and body.errors from an ApiError', () => {
    const apiError = new ApiError(422, 'Validation failed', {
      data: null as never,
      errors: { email: ['emailInvalid'] },
    });

    const result = handleApiError(apiError);

    expect(result).toEqual({
      message: 'Validation failed',
      status: 422,
      errors: { email: ['emailInvalid'] },
    });
  });

  it('handles an ApiError without body', () => {
    const apiError = new ApiError(500, 'Server down');

    const result = handleApiError(apiError);

    expect(result.message).toBe('Server down');
    expect(result.status).toBe(500);
    expect(result.errors).toBeUndefined();
  });

  it('extracts message from a standard Error', () => {
    const result = handleApiError(new Error('Network down'));

    expect(result).toEqual({ message: 'Network down' });
  });

  it('uses a string error as message', () => {
    expect(handleApiError('something broke')).toEqual({
      message: 'something broke',
    });
  });

  it('returns the fallback message when error is null or undefined', () => {
    expect(handleApiError(null, 'Fallback').message).toBe('Fallback');
    expect(handleApiError(undefined, 'Fallback').message).toBe('Fallback');
  });

  it('returns a default message when nothing matches and no fallback is given', () => {
    const result = handleApiError({ weird: true });

    expect(result.message).toBe('An unknown error occurred');
  });
});
