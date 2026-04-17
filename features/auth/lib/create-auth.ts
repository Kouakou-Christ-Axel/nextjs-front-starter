import { AuthStrategy } from '@/features/auth/types/auth.type';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { IUser } from '@/features/auth/types/user.type';
import { ApiError } from '@/lib/api-error';
import { toast } from 'sonner';
import { handleApiError } from '@/utils/handle-api-error';

// TODO i18n: move these user-facing strings to the translation layer.
export const GENERIC_LOGIN_ERROR = 'Invalid email or password';
export const GENERIC_REGISTER_ERROR =
  'Unable to create account. Please check your details and try again.';
export const RATE_LIMITED_MESSAGE =
  'Too many attempts. Please try again in a few minutes.';

type AuthOnErrorOptions = {
  /**
   * If provided, this message is shown to the user instead of the backend
   * message. Used for login/register to prevent user-enumeration attacks
   * (the backend must never leak whether the email exists or which field
   * failed validation).
   */
  genericMessage?: string;
  /** Fallback message when the error is not an ApiError / has no message. */
  fallback: string;
};

function makeAuthOnError(context: string, options: AuthOnErrorOptions) {
  return (error: unknown) => {
    const handled = handleApiError(error, options.fallback);

    let message: string;
    if (handled.status === 429) {
      // Rate-limit always wins over the generic message: the user needs to
      // know to back off, not retry the same credentials.
      message = RATE_LIMITED_MESSAGE;
    } else if (options.genericMessage) {
      message = options.genericMessage;
    } else {
      message = handled.message;
    }

    toast.error(message);
    console.error(`${context}:`, error);
  };
}

export function createAuth(
  strategies: Record<string, AuthStrategy>,
  defaultStrategy: string = 'jwt'
) {
  const strategy = strategies[defaultStrategy];
  const userKey = ['authenticated-user'];

  const useUser = () => {
    const queryClient = useQueryClient();
    return useQuery({
      queryKey: userKey,
      queryFn: async () => {
        try {
          return await strategy.getUser();
        } catch (error) {
          if (
            error instanceof ApiError &&
            error.status === 401 &&
            strategy.refresh
          ) {
            const newUser = await strategy.refresh(); // refresh token -> nouveau JWT
            queryClient.setQueryData(['authenticated-user'], newUser);
            return newUser; // retry getUser
          }
          throw error;
        }
      },
      staleTime: 1000 * 60,
    });
  };

  const useLogin = () => {
    const queryClient = useQueryClient();
    const setUser = React.useCallback(
      (data: IUser) => queryClient.setQueryData(userKey, data),
      [queryClient]
    );

    return useMutation({
      mutationFn: strategy.login,
      onSuccess: (data) => {
        setUser(data);
      },
      onError: makeAuthOnError('Login error', {
        genericMessage: GENERIC_LOGIN_ERROR,
        fallback: 'An error occurred during login.',
      }),
    });
  };

  const useLogout = () => {
    const queryClient = useQueryClient();
    const clearUser = React.useCallback(
      () => queryClient.setQueryData(userKey, null),
      [queryClient]
    );

    return useMutation({
      mutationFn: strategy.logout,
      onSuccess: () => {
        clearUser();
      },
      onError: makeAuthOnError('Logout error', {
        fallback: 'An error occurred during logout.',
      }),
    });
  };

  const useRegister = () => {
    if (!strategy.register) {
      throw new Error('Register strategy is not implemented');
    }
    const queryClient = useQueryClient();
    const setUser = React.useCallback(
      (data: IUser) => queryClient.setQueryData(userKey, data),
      [queryClient]
    );

    return useMutation({
      mutationFn: strategy.register,
      onSuccess: (data) => {
        setUser(data);
      },
      onError: makeAuthOnError('Register error', {
        genericMessage: GENERIC_REGISTER_ERROR,
        fallback: 'An error occurred during registration.',
      }),
    });
  };

  const useRefresh = () => {
    const queryClient = useQueryClient();
    if (!strategy.refresh) {
      throw new Error('Refresh strategy is not implemented');
    }

    return useMutation({
      mutationFn: strategy.refresh,
      onSuccess: (data) => {
        queryClient.setQueryData(userKey, data);
      },
      onError: makeAuthOnError('Refresh error', {
        fallback: 'Session refresh failed.',
      }),
    });
  };

  return {
    useUser,
    useLogin,
    useLogout,
    useRegister,
    useRefresh,
  };
}
