import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type CsrfTokenStore,
  createInMemoryTokenStore,
  fetchCsrfToken,
  isMutatingMethod,
} from './csrf';

describe('createInMemoryTokenStore', () => {
  it('returns null initially', () => {
    const store = createInMemoryTokenStore();
    expect(store.get()).toBeNull();
  });

  it('stores a token after set', () => {
    const store = createInMemoryTokenStore();
    store.set('tok-123');
    expect(store.get()).toBe('tok-123');
  });

  it('clears the token', () => {
    const store = createInMemoryTokenStore();
    store.set('tok-123');
    store.clear();
    expect(store.get()).toBeNull();
  });

  it('isolates state between instances', () => {
    const a = createInMemoryTokenStore();
    const b = createInMemoryTokenStore();
    a.set('x');
    expect(b.get()).toBeNull();
    expect(a.get()).toBe('x');
  });
});

describe('isMutatingMethod', () => {
  it('returns true for POST/PUT/PATCH/DELETE', () => {
    expect(isMutatingMethod('POST')).toBe(true);
    expect(isMutatingMethod('PUT')).toBe(true);
    expect(isMutatingMethod('PATCH')).toBe(true);
    expect(isMutatingMethod('DELETE')).toBe(true);
  });

  it('returns false for GET/HEAD/OPTIONS', () => {
    expect(isMutatingMethod('GET')).toBe(false);
    expect(isMutatingMethod('HEAD')).toBe(false);
    expect(isMutatingMethod('OPTIONS')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isMutatingMethod('post')).toBe(true);
    expect(isMutatingMethod('PoSt')).toBe(true);
    expect(isMutatingMethod('get')).toBe(false);
  });
});

describe('fetchCsrfToken', () => {
  const originalFetch = global.fetch;
  let store: CsrfTokenStore;

  beforeEach(() => {
    store = createInMemoryTokenStore();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('fetches and stores the token on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ csrfToken: 'abc' }),
    }) as unknown as typeof fetch;

    const token = await fetchCsrfToken('http://api.example.com', store);
    expect(token).toBe('abc');
    expect(store.get()).toBe('abc');
  });

  it('sends credentials: include', async () => {
    const spy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ csrfToken: 'abc' }),
    });
    global.fetch = spy as unknown as typeof fetch;

    await fetchCsrfToken('http://api.example.com', store);
    expect(spy).toHaveBeenCalledWith(
      'http://api.example.com/csrf-token',
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('clears and throws on fetch failure', async () => {
    store.set('stale');
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    await expect(
      fetchCsrfToken('http://api.example.com', store)
    ).rejects.toThrow();
    expect(store.get()).toBeNull();
  });

  it('clears and throws when response body has no csrfToken', async () => {
    store.set('stale');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    await expect(
      fetchCsrfToken('http://api.example.com', store)
    ).rejects.toThrow(/csrfToken/);
    expect(store.get()).toBeNull();
  });

  it('clears and rethrows when fetch itself rejects', async () => {
    store.set('stale');
    global.fetch = vi
      .fn()
      .mockRejectedValue(new Error('network down')) as unknown as typeof fetch;

    await expect(
      fetchCsrfToken('http://api.example.com', store)
    ).rejects.toThrow(/network down/);
    expect(store.get()).toBeNull();
  });
});
