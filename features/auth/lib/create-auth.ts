import { AuthStrategy } from '@/features/auth/types/auth.type';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { IUser } from '@/features/auth/types/user.type';
import { ApiError } from '@/lib/api-error';
import { toast } from 'sonner';
import { handleApiError } from '@/utils/handle-api-error';

function makeOnError(context: string, fallback: string) {
  return (error: unknown) => {
    const { message } = handleApiError(error, fallback);
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
      onError: makeOnError('Login error', 'An error occurred during login.'),
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
      onError: makeOnError('Logout error', 'An error occurred during logout.'),
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
      onError: makeOnError(
        'Register error',
        'An error occurred during registration.'
      ),
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
      onError: makeOnError('Refresh error', 'Session refresh failed.'),
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
