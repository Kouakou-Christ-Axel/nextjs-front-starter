import { describe, expect, it } from 'vitest';

import { buildCsp, generateNonce } from './csp';

describe('generateNonce', () => {
  it('returns a non-empty string', () => {
    expect(generateNonce()).toBeTypeOf('string');
    expect(generateNonce().length).toBeGreaterThan(0);
  });

  it('returns a different value each call (practically unique)', () => {
    const a = generateNonce();
    const b = generateNonce();
    expect(a).not.toBe(b);
  });

  it('only contains base64url-safe characters', () => {
    expect(generateNonce()).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe('buildCsp', () => {
  it('includes the nonce in script-src', () => {
    const csp = buildCsp({ nonce: 'abc123', isProd: true });
    expect(csp).toContain("'nonce-abc123'");
    expect(csp).toContain('script-src');
  });

  it('includes unsafe-inline for styles (Tailwind requirement)', () => {
    const csp = buildCsp({ nonce: 'x', isProd: true });
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
  });

  it('includes frame-ancestors none', () => {
    expect(buildCsp({ nonce: 'x', isProd: true })).toContain(
      "frame-ancestors 'none'"
    );
  });

  it('allows connect-src to the backend', () => {
    const csp = buildCsp({
      nonce: 'x',
      isProd: true,
      backendUrl: 'https://api.example.com',
    });
    expect(csp).toContain('https://api.example.com');
  });

  it('enables upgrade-insecure-requests in prod only', () => {
    expect(buildCsp({ nonce: 'x', isProd: true })).toContain(
      'upgrade-insecure-requests'
    );
    expect(buildCsp({ nonce: 'x', isProd: false })).not.toContain(
      'upgrade-insecure-requests'
    );
  });

  it('allows unsafe-eval in dev (React refresh)', () => {
    expect(buildCsp({ nonce: 'x', isProd: false })).toContain("'unsafe-eval'");
    expect(buildCsp({ nonce: 'x', isProd: true })).not.toContain(
      "'unsafe-eval'"
    );
  });
});
