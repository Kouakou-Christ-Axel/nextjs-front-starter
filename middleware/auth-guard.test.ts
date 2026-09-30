import { describe, expect, it } from 'vitest';

import {
  buildLoginRedirectUrl,
  hasAuthCookie,
  isProtectedPath,
} from './auth-guard';

describe('isProtectedPath', () => {
  const patterns = [/^\/dashboard(\/.*)?$/];

  it('matches the root of a protected path', () => {
    expect(isProtectedPath('/dashboard', patterns)).toBe(true);
  });

  it('matches nested protected paths', () => {
    expect(isProtectedPath('/dashboard/settings', patterns)).toBe(true);
  });

  it('does not match public paths', () => {
    expect(isProtectedPath('/', patterns)).toBe(false);
    expect(isProtectedPath('/login', patterns)).toBe(false);
  });

  it('returns false on empty patterns', () => {
    expect(isProtectedPath('/dashboard', [])).toBe(false);
  });
});

describe('hasAuthCookie', () => {
  const names = new Set(['access_token', 'refresh_token']);

  it('returns true when a whitelisted cookie is present', () => {
    const cookies = {
      get: (n: string) => (n === 'access_token' ? { value: 'x' } : undefined),
    };
    expect(hasAuthCookie(cookies, names)).toBe(true);
  });

  it('returns false when no whitelisted cookie is present', () => {
    const cookies = {
      get: (n: string) => (n === 'other' ? { value: 'x' } : undefined),
    };
    expect(hasAuthCookie(cookies, names)).toBe(false);
  });

  it('returns false when cookie exists but value is empty', () => {
    const cookies = {
      get: (n: string) => (n === 'access_token' ? { value: '' } : undefined),
    };
    expect(hasAuthCookie(cookies, names)).toBe(false);
  });
});

describe('buildLoginRedirectUrl', () => {
  it('redirects to the login page with returnTo', () => {
    const req = new URL('https://example.com/dashboard');
    const url = buildLoginRedirectUrl(req, '/dashboard');
    expect(url.pathname).toBe('/login');
    expect(url.searchParams.get('returnTo')).toBe('/dashboard');
  });

  it('strips query parameters from the original url', () => {
    const req = new URL('https://example.com/dashboard?token=secret');
    const url = buildLoginRedirectUrl(req, '/dashboard');
    expect(url.searchParams.get('token')).toBeNull();
  });

  it('preserves the host and protocol of the request', () => {
    const req = new URL('https://example.com:4443/dashboard/admin');
    const url = buildLoginRedirectUrl(req, '/dashboard/admin');
    expect(url.host).toBe('example.com:4443');
    expect(url.protocol).toBe('https:');
    expect(url.searchParams.get('returnTo')).toBe('/dashboard/admin');
  });
});
