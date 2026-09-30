import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogoutButton } from './logout-button';
import * as auth from '@/lib/auth';

function mockUseLogout(mutate: () => void = vi.fn(), isPending = false) {
  return {
    mutate,
    isPending,
    mutateAsync: vi.fn(),
    reset: vi.fn(),
  } as unknown as ReturnType<typeof auth.useLogout>;
}

describe('LogoutButton', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the default logout label', () => {
    vi.spyOn(auth, 'useLogout').mockReturnValue(mockUseLogout());
    render(<LogoutButton />);
    expect(
      screen.getByRole('button', { name: 'Déconnexion' })
    ).toBeInTheDocument();
  });

  it('calls useLogout().mutate on click', async () => {
    const mutate = vi.fn();
    vi.spyOn(auth, 'useLogout').mockReturnValue(mockUseLogout(mutate));

    render(<LogoutButton />);
    await userEvent.click(screen.getByRole('button'));

    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it('disables the button while pending', () => {
    vi.spyOn(auth, 'useLogout').mockReturnValue(mockUseLogout(vi.fn(), true));
    render(<LogoutButton />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('forwards the variant prop to the underlying Button', () => {
    vi.spyOn(auth, 'useLogout').mockReturnValue(mockUseLogout());
    render(<LogoutButton variant="destructive" />);
    const btn = screen.getByRole('button');
    expect(btn.className).toMatch(/destructive/);
  });

  it('accepts custom children (override du label)', () => {
    vi.spyOn(auth, 'useLogout').mockReturnValue(mockUseLogout());
    render(<LogoutButton>Custom text</LogoutButton>);
    expect(
      screen.getByRole('button', { name: 'Custom text' })
    ).toBeInTheDocument();
  });
});
