import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createAuth,
  GENERIC_LOGIN_ERROR,
  GENERIC_REGISTER_ERROR,
  RATE_LIMITED_MESSAGE,
} from './create-auth';
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

function makeWrapperWithClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper, queryClient };
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

  it('calls toast.error with the generic login message on login failure (does not expose backend message)', async () => {
    const strategy = makeStrategy({
      login: vi
        .fn()
        .mockRejectedValue(new ApiError(401, 'Invalid credentials')),
    });
    const { useLogin } = createAuth({ mock: strategy }, 'mock');

    const { result } = renderHook(() => useLogin(), { wrapper: makeWrapper() });

    result.current.mutate({ email: 'x@y.z', password: '12345678' });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(GENERIC_LOGIN_ERROR);
    });

    expect(toast.error).not.toHaveBeenCalledWith('Invalid credentials');
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('calls toast.error with the rate-limit message on 429', async () => {
    const strategy = makeStrategy({
      login: vi
        .fn()
        .mockRejectedValue(new ApiError(429, 'backend rate limit msg')),
    });
    const { useLogin } = createAuth({ mock: strategy }, 'mock');

    const { result } = renderHook(() => useLogin(), { wrapper: makeWrapper() });

    result.current.mutate({ email: 'x@y.z', password: '12345678' });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(RATE_LIMITED_MESSAGE);
    });

    expect(toast.error).not.toHaveBeenCalledWith('backend rate limit msg');
    expect(toast.error).not.toHaveBeenCalledWith(GENERIC_LOGIN_ERROR);
  });
});

describe('createAuth > useRegister', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls toast.error with the generic register message on register failure (does not expose backend message)', async () => {
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
      expect(toast.error).toHaveBeenCalledWith(GENERIC_REGISTER_ERROR);
    });

    expect(toast.error).not.toHaveBeenCalledWith('Email already taken');
  });

  it('calls toast.error with the rate-limit message on 429', async () => {
    const strategy = makeStrategy({
      register: vi
        .fn()
        .mockRejectedValue(new ApiError(429, 'backend rate limit msg')),
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
      expect(toast.error).toHaveBeenCalledWith(RATE_LIMITED_MESSAGE);
    });

    expect(toast.error).not.toHaveBeenCalledWith('backend rate limit msg');
    expect(toast.error).not.toHaveBeenCalledWith(GENERIC_REGISTER_ERROR);
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

  it('calls toast.error with the rate-limit message on 429', async () => {
    const strategy = makeStrategy({
      logout: vi
        .fn()
        .mockRejectedValue(new ApiError(429, 'backend rate limit msg')),
    });
    const { useLogout } = createAuth({ mock: strategy }, 'mock');

    const { result } = renderHook(() => useLogout(), {
      wrapper: makeWrapper(),
    });

    result.current.mutate();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(RATE_LIMITED_MESSAGE);
    });

    expect(toast.error).not.toHaveBeenCalledWith('backend rate limit msg');
  });
});

describe('createAuth > cache wipe at auth boundary', () => {
  const userKey = ['authenticated-user'];
  const abilitiesKey = ['auth', 'abilities'];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logout removes every cached query and nulls the user', async () => {
    const { useLogout } = createAuth({ mock: makeStrategy() }, 'mock');
    const { wrapper, queryClient } = makeWrapperWithClient();

    queryClient.setQueryData(userKey, { id: 'old' });
    queryClient.setQueryData(abilitiesKey, { sentinel: true });

    const { result } = renderHook(() => useLogout(), { wrapper });
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(abilitiesKey)).toBeUndefined();
    expect(queryClient.getQueryData(userKey)).toBeNull();
  });

  it('login wipes stale cache then seeds the new user', async () => {
    const newUser: IUser = {
      id: '2',
      email: 'new@b.c',
      name: 'New',
      authorizations: [],
      createdAt: '',
      updatedAt: '',
    };
    const strategy = makeStrategy({
      login: vi.fn().mockResolvedValue(newUser),
    });
    const { useLogin } = createAuth({ mock: strategy }, 'mock');
    const { wrapper, queryClient } = makeWrapperWithClient();

    queryClient.setQueryData(userKey, { id: 'old' });
    queryClient.setQueryData(abilitiesKey, { sentinel: true });

    const { result } = renderHook(() => useLogin(), { wrapper });
    result.current.mutate({ email: 'new@b.c', password: '12345678' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(abilitiesKey)).toBeUndefined();
    expect(queryClient.getQueryData(userKey)).toEqual(newUser);
  });

  it('logout wipes the cache even when the logout request fails', async () => {
    const strategy = makeStrategy({
      logout: vi.fn().mockRejectedValue(new ApiError(500, 'Logout failed')),
    });
    const { useLogout } = createAuth({ mock: strategy }, 'mock');
    const { wrapper, queryClient } = makeWrapperWithClient();

    queryClient.setQueryData(abilitiesKey, { sentinel: true });

    const { result } = renderHook(() => useLogout(), { wrapper });
    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryClient.getQueryData(abilitiesKey)).toBeUndefined();
    expect(queryClient.getQueryData(userKey)).toBeNull();
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

  it('calls toast.error with the rate-limit message on 429', async () => {
    const strategy = makeStrategy({
      refresh: vi
        .fn()
        .mockRejectedValue(new ApiError(429, 'backend rate limit msg')),
    });
    const { useRefresh } = createAuth({ mock: strategy }, 'mock');

    const { result } = renderHook(() => useRefresh(), {
      wrapper: makeWrapper(),
    });

    result.current.mutate();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(RATE_LIMITED_MESSAGE);
    });

    expect(toast.error).not.toHaveBeenCalledWith('backend rate limit msg');
  });
});
