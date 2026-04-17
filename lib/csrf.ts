export type CsrfTokenStore = {
  get(): string | null;
  set(token: string): void;
  clear(): void;
};

export function createInMemoryTokenStore(): CsrfTokenStore {
  let token: string | null = null;
  return {
    get: () => token,
    set: (t) => {
      token = t;
    },
    clear: () => {
      token = null;
    },
  };
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function isMutatingMethod(method: string): boolean {
  return MUTATING_METHODS.has(method.toUpperCase());
}

export async function fetchCsrfToken(
  backendUrl: string,
  store: CsrfTokenStore
): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${backendUrl}/csrf-token`, {
      credentials: 'include',
    });
  } catch (err) {
    store.clear();
    throw err;
  }
  if (!res.ok) {
    store.clear();
    throw new Error(`CSRF token fetch failed: ${res.status}`);
  }
  const body = (await res.json()) as { csrfToken?: string };
  if (!body.csrfToken) {
    store.clear();
    throw new Error('CSRF token fetch response missing csrfToken');
  }
  store.set(body.csrfToken);
  return body.csrfToken;
}

export const appCsrfStore = createInMemoryTokenStore();
