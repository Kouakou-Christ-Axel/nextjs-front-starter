import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createAuth } from './create-auth';
import { AuthStrategy } from '@/features/auth/types/auth.type';
import { ApiError } from '@/lib/api-error';
import { IUser } from '@/features/auth/types/user.type';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

function makeStrategy(overrides: Partial<AuthStrategy> = {}): AuthStrategy {
  const noopUser: IUser = {
    id: '1',
    email: 'a@b.c',
    name: 'Test',
    authorizations: [],
    createdAt: '',
    updatedAt: '',
  };
  return {
    getUser: vi.fn().mockResolvedValue(noopUser),
    login: vi.fn().mockResolvedValue(noopUser),
    register: vi.fn().mockResolvedValue(noopUser),
    logout: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockResolvedValue(noopUser),
    ...overrides,
  };
}

describe('createAuth > useLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls toast.error (not toast.success) with the ApiError message on login failure', async () => {
    const strategy = makeStrategy({
      login: vi
        .fn()
        .mockRejectedValue(new ApiError(401, 'Invalid credentials')),
    });
    const { useLogin } = createAuth({ mock: strategy }, 'mock');

    const { result } = renderHook(() => useLogin(), { wrapper: makeWrapper() });

    result.current.mutate({ email: 'x@y.z', password: '12345678' });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    });

    expect(toast.success).not.toHaveBeenCalled();
  });
});

describe('createAuth > useRegister', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls toast.error with the ApiError message on register failure', async () => {
    const strategy = makeStrategy({
      register: vi
        .fn()
        .mockRejectedValue(new ApiError(409, 'Email already taken')),
    });
    const { useRegister } = createAuth({ mock: strategy }, 'mock');

    const { result } = renderHook(() => useRegister(), {
      wrapper: makeWrapper(),
    });

    result.current.mutate({
      email: 'x@y.z',
      password: '12345678',
      confirmPassword: '12345678',
      firstName: 'John',
      lastName: 'Doe',
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Email already taken');
    });
  });
});

describe('createAuth > useLogout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls toast.error with the ApiError message on logout failure', async () => {
    const strategy = makeStrategy({
      logout: vi.fn().mockRejectedValue(new ApiError(500, 'Logout failed')),
    });
    const { useLogout } = createAuth({ mock: strategy }, 'mock');

    const { result } = renderHook(() => useLogout(), {
      wrapper: makeWrapper(),
    });

    result.current.mutate();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Logout failed');
    });
  });
});

describe('createAuth > useRefresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls toast.error with the ApiError message on refresh failure', async () => {
    const strategy = makeStrategy({
      refresh: vi.fn().mockRejectedValue(new ApiError(401, 'Session expired')),
    });
    const { useRefresh } = createAuth({ mock: strategy }, 'mock');

    const { result } = renderHook(() => useRefresh(), {
      wrapper: makeWrapper(),
    });

    result.current.mutate();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Session expired');
    });
  });
});
