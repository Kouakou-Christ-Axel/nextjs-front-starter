import { describe, expect, it } from 'vitest';

import {
  buildLoginRedirectUrl,
  extractLocale,
  hasAuthCookie,
  isProtectedPath,
} from './auth-guard';

describe('isProtectedPath', () => {
  const patterns = [/^\/(en|fr)\/dashboard(\/.*)?$/];

  it('matches the root of a protected path', () => {
    expect(isProtectedPath('/fr/dashboard', patterns)).toBe(true);
  });

  it('matches nested protected paths', () => {
    expect(isProtectedPath('/en/dashboard/settings', patterns)).toBe(true);
  });

  it('does not match public paths', () => {
    expect(isProtectedPath('/fr', patterns)).toBe(false);
    expect(isProtectedPath('/en/login', patterns)).toBe(false);
  });

  it('does not match without a locale prefix', () => {
    expect(isProtectedPath('/dashboard', patterns)).toBe(false);
  });

  it('returns false on empty patterns', () => {
    expect(isProtectedPath('/fr/dashboard', [])).toBe(false);
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

describe('extractLocale', () => {
  const locales = ['en', 'fr'] as const;

  it('returns the locale when present as first segment', () => {
    expect(extractLocale('/fr/dashboard', locales, 'en')).toBe('fr');
    expect(extractLocale('/en/settings', locales, 'fr')).toBe('en');
  });

  it('returns fallback when first segment is not a known locale', () => {
    expect(extractLocale('/dashboard', locales, 'fr')).toBe('fr');
  });

  it('returns fallback for empty path', () => {
    expect(extractLocale('/', locales, 'en')).toBe('en');
  });
});

describe('buildLoginRedirectUrl', () => {
  const locales = ['en', 'fr'] as const;

  it('redirects to the locale-aware login page', () => {
    const req = new URL('https://example.com/fr/dashboard');
    const url = buildLoginRedirectUrl(req, '/fr/dashboard', locales, 'en');
    expect(url.pathname).toBe('/fr/login');
  });

  it('falls back to the default locale when pathname has no locale', () => {
    const req = new URL('https://example.com/dashboard');
    const url = buildLoginRedirectUrl(req, '/dashboard', locales, 'fr');
    expect(url.pathname).toBe('/fr/login');
  });

  it('strips query parameters from the redirect url and adds returnTo', () => {
    const req = new URL('https://example.com/fr/dashboard?token=secret');
    const url = buildLoginRedirectUrl(req, '/fr/dashboard', locales, 'en');
    expect(url.searchParams.get('token')).toBeNull();
    expect(url.searchParams.get('returnTo')).toBe('/fr/dashboard');
  });

  it('adds returnTo param with the protected pathname', () => {
    const req = new URL('https://example.com/fr/dashboard/settings');
    const url = buildLoginRedirectUrl(
      req,
      '/fr/dashboard/settings',
      locales,
      'en'
    );
    expect(url.pathname).toBe('/fr/login');
    expect(url.searchParams.get('returnTo')).toBe('/fr/dashboard/settings');
  });

  it('preserves the host and protocol of the request', () => {
    const req = new URL('https://example.com:4443/en/dashboard/admin');
    const url = buildLoginRedirectUrl(
      req,
      '/en/dashboard/admin',
      locales,
      'fr'
    );
    expect(url.host).toBe('example.com:4443');
    expect(url.protocol).toBe('https:');
    expect(url.pathname).toBe('/en/login');
  });
});
