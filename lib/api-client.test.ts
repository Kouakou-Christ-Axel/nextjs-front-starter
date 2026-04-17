import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('api-client', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  describe('request logging (#10)', () => {
    it('does not log request info in production', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: null }),
      }) as unknown as typeof fetch;

      const { api } = await import('@/lib/api-client');
      await api.get('/users', { params: { email: 'secret@x.com' } });

      const calls = logSpy.mock.calls.flat().map(String).join('\n');
      expect(calls).not.toContain('Making');
      expect(calls).not.toContain('secret@x.com');
    });

    it('logs method and path (not query string) in development', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: null }),
      }) as unknown as typeof fetch;

      const { api } = await import('@/lib/api-client');
      await api.get('/users', { params: { email: 'secret@x.com' } });

      const calls = logSpy.mock.calls.flat().map(String).join('\n');
      expect(calls).toContain('GET');
      expect(calls).toContain('/users');
      expect(calls).not.toContain('secret@x.com');
      expect(calls).not.toContain('?');
    });

    it('does not log errors in production', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      global.fetch = vi
        .fn()
        .mockRejectedValue(new Error('network boom with secret token abc123'));

      const { api } = await import('@/lib/api-client');
      await expect(api.get('/users')).rejects.toThrow();

      const logs = logSpy.mock.calls.flat().map(String).join('\n');
      const errors = errorSpy.mock.calls.flat().map(String).join('\n');
      expect(logs).not.toContain('secret token abc123');
      expect(errors).not.toContain('secret token abc123');
    });

    it('uses console.error (not console.log) for errors in development', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      global.fetch = vi.fn().mockRejectedValue(new Error('network boom'));

      const { api } = await import('@/lib/api-client');
      await expect(api.get('/users')).rejects.toThrow();

      const logs = logSpy.mock.calls.flat().map(String).join('\n');
      expect(logs).not.toContain('network boom');
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('getServerCookies cookie whitelist (#16)', () => {
    beforeEach(() => {
      vi.stubGlobal('window', undefined);
    });

    it('returns only whitelisted auth cookies, filtering out others', async () => {
      vi.doMock('next/headers', () => ({
        cookies: async () => ({
          getAll: () => [
            { name: 'access_token', value: 'a' },
            { name: 'analytics_id', value: 'x' },
            { name: 'refresh_token', value: 'r' },
            { name: '_ga', value: 'g' },
          ],
        }),
      }));

      const { getServerCookies } = await import('@/lib/api-client');
      const result = await getServerCookies();

      expect(result).toContain('access_token=a');
      expect(result).toContain('refresh_token=r');
      expect(result).not.toContain('analytics_id');
      expect(result).not.toContain('_ga');
    });

    it('forwards __Host- prefixed auth cookies', async () => {
      vi.doMock('next/headers', () => ({
        cookies: async () => ({
          getAll: () => [
            { name: '__Host-access_token', value: 'h1' },
            { name: '__Host-refresh_token', value: 'h2' },
            { name: 'tracking', value: 't' },
          ],
        }),
      }));

      const { getServerCookies } = await import('@/lib/api-client');
      const result = await getServerCookies();

      expect(result).toContain('__Host-access_token=h1');
      expect(result).toContain('__Host-refresh_token=h2');
      expect(result).not.toContain('tracking');
    });
  });

  describe('CSRF (#1)', () => {
    const BACKEND_URL = 'http://api.example.com';

    function mockEnv(csrfEnabled: boolean) {
      vi.doMock('@/config/env', () => ({
        env: {
          NEXT_PUBLIC_BACKEND_URL: BACKEND_URL,
          NEXT_PUBLIC_CSRF_ENABLED: csrfEnabled,
        },
      }));
    }

    it('does not send X-CSRF-Token on mutation when flag is disabled', async () => {
      mockEnv(false);
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: null }),
      });
      global.fetch = fetchSpy as unknown as typeof fetch;

      const { api } = await import('@/lib/api-client');
      await api.post('/users', { name: 'x' });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [, init] = fetchSpy.mock.calls[0];
      expect(init.headers).not.toHaveProperty('X-CSRF-Token');
    });

    it('fetches /csrf-token then sends X-CSRF-Token on mutation when flag is enabled', async () => {
      mockEnv(true);
      const fetchSpy = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ csrfToken: 't1' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: null }),
        });
      global.fetch = fetchSpy as unknown as typeof fetch;

      const { api } = await import('@/lib/api-client');
      await api.post('/users', { name: 'x' });

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      const [firstUrl] = fetchSpy.mock.calls[0];
      expect(firstUrl).toBe(`${BACKEND_URL}/csrf-token`);
      const [, mutationInit] = fetchSpy.mock.calls[1];
      expect(mutationInit.headers['X-CSRF-Token']).toBe('t1');
    });

    it('reuses cached CSRF token without refetching', async () => {
      mockEnv(true);
      const { appCsrfStore: store } = await import('@/lib/csrf');
      store.set('cached-token');

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: null }),
      });
      global.fetch = fetchSpy as unknown as typeof fetch;

      const { api } = await import('@/lib/api-client');
      await api.post('/users', { name: 'x' });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, init] = fetchSpy.mock.calls[0];
      expect(url).toBe(`${BACKEND_URL}/users`);
      expect(init.headers['X-CSRF-Token']).toBe('cached-token');
    });

    it('does not send X-CSRF-Token on GET (non-mutating) even when flag is enabled', async () => {
      mockEnv(true);
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: null }),
      });
      global.fetch = fetchSpy as unknown as typeof fetch;

      const { api } = await import('@/lib/api-client');
      await api.get('/users');

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, init] = fetchSpy.mock.calls[0];
      expect(url).toBe(`${BACKEND_URL}/users`);
      expect(init.headers).not.toHaveProperty('X-CSRF-Token');
    });

    it('clears the cached token on 403 response', async () => {
      mockEnv(true);
      const { appCsrfStore: store } = await import('@/lib/csrf');
      store.set('stale');

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ message: 'invalid csrf token' }),
      });
      global.fetch = fetchSpy as unknown as typeof fetch;

      const { api } = await import('@/lib/api-client');
      await expect(api.post('/users', { name: 'x' })).rejects.toThrow();

      expect(store.get()).toBeNull();
    });
  });
});
