import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { Suspense } from 'react';
import * as auth from '@/lib/auth';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

import * as nextNavigation from 'next/navigation';
import LoginForm from './login-form';

function makeMockUseLogin(
  overrides: { mutate?: ReturnType<typeof vi.fn>; isPending?: boolean } = {}
) {
  return {
    mutate: vi.fn(),
    isPending: false,
    ...overrides,
  } as unknown as ReturnType<typeof auth.useLogin>;
}

function renderWithSuspense(ui: React.ReactElement) {
  return render(<Suspense fallback={<div>loading…</div>}>{ui}</Suspense>);
}

describe('LoginForm — flow returnTo', () => {
  const pushMock = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    pushMock.mockReset();
    vi.mocked(nextNavigation.useRouter).mockReturnValue({
      push: pushMock,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    } as unknown as ReturnType<typeof nextNavigation.useRouter>);
  });

  it('redirige vers /dashboard par défaut quand returnTo est absent', async () => {
    vi.mocked(nextNavigation.useSearchParams).mockReturnValue({
      get: () => null,
    } as unknown as ReturnType<typeof nextNavigation.useSearchParams>);

    const mutateMock = vi
      .fn()
      .mockImplementation(
        (_data: unknown, options?: { onSuccess?: () => void }) => {
          options?.onSuccess?.();
        }
      );

    vi.spyOn(auth, 'useLogin').mockReturnValue(
      makeMockUseLogin({ mutate: mutateMock })
    );

    renderWithSuspense(<LoginForm />);

    const user = userEvent.setup();
    await user.type(
      screen.getByPlaceholderText('exemple@email.com'),
      'test@example.com'
    );
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/dashboard'));
  });

  it('redirige vers returnTo quand le param est une URL interne valide', async () => {
    vi.mocked(nextNavigation.useSearchParams).mockReturnValue({
      get: (key: string) =>
        key === 'returnTo' ? '/fr/dashboard/settings' : null,
    } as unknown as ReturnType<typeof nextNavigation.useSearchParams>);

    const mutateMock = vi
      .fn()
      .mockImplementation(
        (_data: unknown, options?: { onSuccess?: () => void }) => {
          options?.onSuccess?.();
        }
      );

    vi.spyOn(auth, 'useLogin').mockReturnValue(
      makeMockUseLogin({ mutate: mutateMock })
    );

    renderWithSuspense(<LoginForm />);

    const user = userEvent.setup();
    await user.type(
      screen.getByPlaceholderText('exemple@email.com'),
      'test@example.com'
    );
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith('/fr/dashboard/settings')
    );
  });

  it('redirige vers /dashboard quand returnTo est une URL externe (open-redirect bloqué)', async () => {
    vi.mocked(nextNavigation.useSearchParams).mockReturnValue({
      get: (key: string) =>
        key === 'returnTo' ? 'https://evil.com/phishing' : null,
    } as unknown as ReturnType<typeof nextNavigation.useSearchParams>);

    const mutateMock = vi
      .fn()
      .mockImplementation(
        (_data: unknown, options?: { onSuccess?: () => void }) => {
          options?.onSuccess?.();
        }
      );

    vi.spyOn(auth, 'useLogin').mockReturnValue(
      makeMockUseLogin({ mutate: mutateMock })
    );

    renderWithSuspense(<LoginForm />);

    const user = userEvent.setup();
    await user.type(
      screen.getByPlaceholderText('exemple@email.com'),
      'test@example.com'
    );
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/dashboard'));
  });

  it('ne redirige pas si la mutation ne déclenche pas onSuccess', () => {
    vi.mocked(nextNavigation.useSearchParams).mockReturnValue({
      get: () => '/fr/dashboard',
    } as unknown as ReturnType<typeof nextNavigation.useSearchParams>);

    // mutate ne déclenche pas onSuccess → pas de navigation
    const mutateMock = vi.fn();

    vi.spyOn(auth, 'useLogin').mockReturnValue(
      makeMockUseLogin({ mutate: mutateMock })
    );

    renderWithSuspense(<LoginForm />);

    expect(pushMock).not.toHaveBeenCalled();
  });

  it('redirige vers /login quand returnTo vaut /login (chemin relatif valide)', async () => {
    // safeRedirectTarget accepte /login — comportement intentionnel documenté
    vi.mocked(nextNavigation.useSearchParams).mockReturnValue({
      get: (key: string) => (key === 'returnTo' ? '/login' : null),
    } as unknown as ReturnType<typeof nextNavigation.useSearchParams>);

    const mutateMock = vi
      .fn()
      .mockImplementation(
        (_data: unknown, options?: { onSuccess?: () => void }) => {
          options?.onSuccess?.();
        }
      );

    vi.spyOn(auth, 'useLogin').mockReturnValue(
      makeMockUseLogin({ mutate: mutateMock })
    );

    renderWithSuspense(<LoginForm />);

    const user = userEvent.setup();
    await user.type(
      screen.getByPlaceholderText('exemple@email.com'),
      'test@example.com'
    );
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/login'));
  });
});
