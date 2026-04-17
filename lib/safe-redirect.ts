const DANGEROUS_SCHEMES = /^\s*(javascript|data|vbscript|file):/i;
const MAX_LENGTH = 2048;

/**
 * Returns `raw` if and only if it is a safe internal relative path.
 * Otherwise returns `fallback` (default: '/').
 *
 * A path is considered safe when it:
 * - Starts with '/' but not with '//' (rejects protocol-relative URLs)
 * - Does not contain '://' (no URL scheme)
 * - Does not contain '\' (no backslash bypass)
 * - Does not start with a dangerous scheme (javascript:, data:, vbscript:, file:)
 * - Is shorter than 2048 characters
 *
 * This helper is intended to harden login/returnTo-style redirect flows
 * against open-redirect vulnerabilities.
 */
export function safeRedirectTarget(
  raw: string | null | undefined,
  fallback: string = '/'
): string {
  if (typeof raw !== 'string' || raw.length === 0) return fallback;
  if (raw.length >= MAX_LENGTH) return fallback;
  if (raw.includes('\\')) return fallback;
  if (raw.includes('://')) return fallback;
  if (DANGEROUS_SCHEMES.test(raw)) return fallback;
  if (!raw.startsWith('/')) return fallback;
  if (raw.startsWith('//')) return fallback;
  return raw;
}
