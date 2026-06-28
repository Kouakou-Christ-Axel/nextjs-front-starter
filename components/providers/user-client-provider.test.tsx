import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import * as auth from '@/lib/auth';
import { ApiError } from '@/lib/api-error';
import type { IUser } from '@/features/auth/types/user.type';

vi.mock('@/i18n/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  useUser: vi.fn(),
}));

import * as navigation from '@/i18n/navigation';
import UserClientProvider from './user-client-provider';

const mockUser: IUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  authorizations: [],
  createdAt: '',
  updatedAt: '',
};

type UseUserResult = ReturnType<typeof auth.useUser>;

function mockUseUser(overrides: Partial<UseUserResult>): void {
  vi.mocked(auth.useUser).mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    ...overrides,
  } as unknown as UseUserResult);
}

describe('UserClientProvider', () => {
  const replaceMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(navigation.useRouter).mockReturnValue({
      push: vi.fn(),
      replace: replaceMock,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    } as unknown as ReturnType<typeof navigation.useRouter>);
    vi.mocked(navigation.usePathname).mockReturnValue('/dashboard');
  });

  it('shows the loader during the initial load', () => {
    mockUseUser({ isLoading: true });

    render(
      <UserClientProvider>
        <div>protected content</div>
      </UserClientProvider>
    );

    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('shows a transient error message (non-401) without redirecting', () => {
    mockUseUser({ isError: true, error: new Error('Network error') });

    render(
      <UserClientProvider>
        <div>protected content</div>
      </UserClientProvider>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('redirects to /login with encoded returnTo on a 401', async () => {
    mockUseUser({ isError: true, error: new ApiError(401, 'Unauthorized') });

    render(
      <UserClientProvider>
        <div>protected content</div>
      </UserClientProvider>
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/login?returnTo=%2Fdashboard');
    });
  });

  it('redirects to /login without returnTo when already on /login', async () => {
    vi.mocked(navigation.usePathname).mockReturnValue('/login');
    mockUseUser({ data: undefined });

    render(
      <UserClientProvider>
        <div>protected content</div>
      </UserClientProvider>
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/login');
    });
  });

  it('redirects to /login when there is no error and no user', async () => {
    mockUseUser({ data: undefined });

    render(
      <UserClientProvider>
        <div>protected content</div>
      </UserClientProvider>
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/login?returnTo=%2Fdashboard');
    });
  });

  it('renders children when the user is authenticated', () => {
    mockUseUser({ data: mockUser });

    render(
      <UserClientProvider>
        <div>protected content</div>
      </UserClientProvider>
    );

    expect(screen.getByText('protected content')).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
