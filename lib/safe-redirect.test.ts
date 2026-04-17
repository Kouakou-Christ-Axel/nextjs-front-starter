import { describe, expect, it } from 'vitest';
import { safeRedirectTarget } from './safe-redirect';

describe('safeRedirectTarget', () => {
  describe('safe internal paths', () => {
    it('accepts a simple internal path', () => {
      expect(safeRedirectTarget('/dashboard')).toBe('/dashboard');
    });

    it('accepts an internal path with a query string', () => {
      expect(safeRedirectTarget('/dashboard?foo=bar')).toBe(
        '/dashboard?foo=bar'
      );
    });

    it('accepts an internal path with a hash fragment', () => {
      expect(safeRedirectTarget('/users/123#section')).toBe(
        '/users/123#section'
      );
    });

    it('returns the safe path when a fallback is also provided', () => {
      expect(safeRedirectTarget('/dashboard', '/login')).toBe('/dashboard');
    });
  });

  describe('unsafe URLs fall back', () => {
    it('rejects absolute http(s) URLs', () => {
      expect(safeRedirectTarget('https://evil.com')).toBe('/');
    });

    it('rejects protocol-relative URLs starting with //', () => {
      expect(safeRedirectTarget('//evil.com')).toBe('/');
    });

    it('rejects javascript: URLs', () => {
      expect(safeRedirectTarget('javascript:alert(1)')).toBe('/');
    });

    it('rejects data: URLs (case-insensitive)', () => {
      expect(
        safeRedirectTarget('DATA:text/html,<script>alert(1)</script>')
      ).toBe('/');
    });

    it('rejects vbscript: URLs', () => {
      expect(safeRedirectTarget('vbscript:msgbox(1)')).toBe('/');
    });

    it('rejects file: URLs', () => {
      expect(safeRedirectTarget('file:///etc/passwd')).toBe('/');
    });

    it('rejects paths without a leading slash', () => {
      expect(safeRedirectTarget('dashboard')).toBe('/');
    });

    it('rejects paths containing a backslash', () => {
      expect(safeRedirectTarget('\\evil.com')).toBe('/');
    });

    it('rejects paths with a backslash after a leading slash', () => {
      expect(safeRedirectTarget('/\\evil.com')).toBe('/');
    });

    it('rejects any input containing :// (scheme)', () => {
      expect(safeRedirectTarget('/redirect?to=https://evil.com')).toBe('/');
    });

    it('rejects very long inputs (>= 2048 chars)', () => {
      const long = '/' + 'a'.repeat(2048);
      expect(safeRedirectTarget(long)).toBe('/');
    });
  });

  describe('nullish and empty inputs fall back', () => {
    it('returns fallback for null', () => {
      expect(safeRedirectTarget(null)).toBe('/');
    });

    it('returns fallback for undefined', () => {
      expect(safeRedirectTarget(undefined)).toBe('/');
    });

    it('returns fallback for an empty string', () => {
      expect(safeRedirectTarget('')).toBe('/');
    });

    it('returns fallback for a whitespace-padded path (no trim)', () => {
      expect(safeRedirectTarget('  /dashboard  ')).toBe('/');
    });
  });

  describe('custom fallback', () => {
    it('returns the custom fallback when the input is unsafe', () => {
      expect(safeRedirectTarget('https://evil.com', '/login')).toBe('/login');
    });

    it('returns the custom fallback when the input is null', () => {
      expect(safeRedirectTarget(null, '/login')).toBe('/login');
    });

    it('returns the custom fallback when the input is empty', () => {
      expect(safeRedirectTarget('', '/login')).toBe('/login');
    });
  });
});
