import { AUTH_COOKIE_NAMES } from '@/config/auth';
import { env } from '@/config/env';
import { ApiError } from '@/lib/api-error';
import { appCsrfStore, fetchCsrfToken, isMutatingMethod } from '@/lib/csrf';
import { IApiErrorBody } from '@/types/api';

type RequestBody = Record<string, unknown>;

type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: RequestBody;
  cookie?: string;
  params?: Record<string, string | number | boolean | undefined | null>;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
};

function buildUrlWithParams(
  url: string,
  params?: RequestOptions['params']
): string {
  if (!params) return url;
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null
    )
  );
  if (Object.keys(filteredParams).length === 0) return url;
  const queryString = new URLSearchParams(
    filteredParams as Record<string, string>
  ).toString();
  return `${url}?${queryString}`;
}

// Create a separate function for getting server-side cookies that can be imported where needed
export function getServerCookies() {
  if (typeof window !== 'undefined') return '';

  // Dynamic import next/headers only on server-side
  return import('next/headers').then(async ({ cookies }) => {
    try {
      const cookieStore = await cookies();
      return cookieStore
        .getAll()
        .filter((c) => AUTH_COOKIE_NAMES.has(c.name))
        .map((c) => `${c.name}=${c.value}`)
        .join('; ');
    } catch (error) {
      console.error('Failed to access cookies:', error);
      return '';
    }
  });
}

/**
 * Best-effort extraction of a human-readable message from an error body.
 * Handles both `{ message: string }` and `{ message: string[] }`
 * (NestJS/class-validator returns an array of validation messages).
 */
function extractErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === 'string' && message.length > 0) return message;
    if (Array.isArray(message) && message.length > 0) {
      const joined = message.filter((m) => typeof m === 'string').join(' · ');
      if (joined.length > 0) return joined;
    }
  }
  return fallback;
}

/*
 * Core function to make API requests.
 * Returns the raw response body cast as T — no envelope unwrapping.
 * Callers MUST type T to match the actual backend response shape.
 */
async function fetchApi<T>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body,
    cookie,
    params,
    cache = 'no-store',
    next,
  } = options;

  // Get cookies from the request when running on server
  let cookieHeader = cookie;
  if (typeof window === 'undefined' && !cookie) {
    cookieHeader = await getServerCookies();
  }

  const fullUrl = buildUrlWithParams(
    `${env.NEXT_PUBLIC_BACKEND_URL}${url}`,
    params
  );

  let csrfHeaders: Record<string, string> = {};
  if (
    env.NEXT_PUBLIC_CSRF_ENABLED &&
    isMutatingMethod(method) &&
    typeof window !== 'undefined'
  ) {
    let token = appCsrfStore.get();
    if (!token) {
      token = await fetchCsrfToken(env.NEXT_PUBLIC_BACKEND_URL, appCsrfStore);
    }
    csrfHeaders = { 'X-CSRF-Token': token };
  }

  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[api] ${method} ${url}`);
    }
    const response = await fetch(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headers,
        ...csrfHeaders,
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      cache,
      next,
    });

    let responseBody: unknown;

    try {
      responseBody = await response.json();
    } catch {
      responseBody = null;
    }

    if (!response.ok) {
      throw new ApiError(
        response.status,
        extractErrorMessage(responseBody, response.statusText),
        (responseBody as IApiErrorBody | undefined) ?? undefined
      );
    }

    return responseBody as T;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 403 && env.NEXT_PUBLIC_CSRF_ENABLED) {
        appCsrfStore.clear();
      }
      throw error;
    }
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
    throw new ApiError(
      500,
      (error as Error).message || 'An unknown error occurred',
      undefined
    );
  }
}

/*
 * API client with methods for making HTTP requests.
 * Each method returns the raw response body typed as T.
 * The client is envelope-agnostic — callers describe what the backend actually returns.
 */
export const api = {
  get<T>(url: string, options?: RequestOptions): Promise<T> {
    return fetchApi<T>(url, { ...options, method: 'GET' });
  },
  post<T>(
    url: string,
    body?: RequestBody,
    options?: RequestOptions
  ): Promise<T> {
    return fetchApi<T>(url, { ...options, method: 'POST', body });
  },
  put<T>(
    url: string,
    body?: RequestBody,
    options?: RequestOptions
  ): Promise<T> {
    return fetchApi<T>(url, { ...options, method: 'PUT', body });
  },
  patch<T>(
    url: string,
    body?: RequestBody,
    options?: RequestOptions
  ): Promise<T> {
    return fetchApi<T>(url, { ...options, method: 'PATCH', body });
  },
  delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return fetchApi<T>(url, { ...options, method: 'DELETE' });
  },
};
