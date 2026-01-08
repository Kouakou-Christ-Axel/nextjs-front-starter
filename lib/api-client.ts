import { env } from '@/config/env';
import { ApiError } from '@/lib/api-error';
import { ApiResponse } from '@/types/api';

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
        .map((c) => `${c.name}=${c.value}`)
        .join('; ');
    } catch (error) {
      console.error('Failed to access cookies:', error);
      return '';
    }
  });
}

/*
 * Core function to make API requests
 */
async function fetchApi<T>(
  url: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
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

  const response = await fetch(fullUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
    cache,
    next,
  });

  let responseBody: ApiResponse<T> | null;

  try {
    responseBody = await response.json();
  } catch {
    responseBody = null;
  }

  if (!response.ok) {
    throw new ApiError<T>(
      response.status,
      responseBody?.message || response.statusText,
      responseBody ?? undefined
    );
  }

  return responseBody as ApiResponse<T>;
}

/*
 * API client with methods for making HTTP requests
 */
export const api = {
  get<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return fetchApi<T>(url, { ...options, method: 'GET' });
  },
  post<T>(
    url: string,
    body?: RequestBody,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return fetchApi<T>(url, { ...options, method: 'POST', body });
  },
  put<T>(
    url: string,
    body?: RequestBody,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return fetchApi<T>(url, { ...options, method: 'PUT', body });
  },
  patch<T>(
    url: string,
    body?: RequestBody,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return fetchApi<T>(url, { ...options, method: 'PATCH', body });
  },
  delete<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return fetchApi<T>(url, { ...options, method: 'DELETE' });
  },
};
