import type { ApiErrorResponse } from './types';

interface ApiRequestOptions {
  method?: string;
  token?: string;
  body?: unknown;
}

interface ApiRequestConfig {
  url: string;
  init: RequestInit;
}

type RequestInterceptor = (
  config: ApiRequestConfig,
) => ApiRequestConfig | Promise<ApiRequestConfig>;
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(
  /\/$/,
  '',
);

const requestInterceptors: RequestInterceptor[] = [];
const responseInterceptors: ResponseInterceptor[] = [];

export const apiInterceptors = {
  request: {
    use(interceptor: RequestInterceptor): () => void {
      requestInterceptors.push(interceptor);
      return () => removeInterceptor(requestInterceptors, interceptor);
    },
  },
  response: {
    use(interceptor: ResponseInterceptor): () => void {
      responseInterceptors.push(interceptor);
      return () => removeInterceptor(responseInterceptors, interceptor);
    },
  },
};

function removeInterceptor<T>(interceptors: T[], interceptor: T): void {
  const index = interceptors.indexOf(interceptor);

  if (index >= 0) {
    interceptors.splice(index, 1);
  }
}

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    const { error, details } = payload as ApiErrorResponse;
    return details || error || fallback;
  }

  return fallback;
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (_err) {
    return { error: text };
  }
}

async function applyRequestInterceptors(
  config: ApiRequestConfig,
): Promise<ApiRequestConfig> {
  let nextConfig = config;

  for (const interceptor of requestInterceptors) {
    nextConfig = await interceptor(nextConfig);
  }

  return nextConfig;
}

async function applyResponseInterceptors(response: Response): Promise<Response> {
  let nextResponse = response;

  for (const interceptor of responseInterceptors) {
    nextResponse = await interceptor(nextResponse);
  }

  return nextResponse;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export async function apiRequest<T>(
  path: string,
  { method = 'GET', token, body }: ApiRequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = await applyRequestInterceptors({
    url: apiUrl(path),
    init: {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    },
  });
  const response = await applyResponseInterceptors(
    await fetch(config.url, config.init),
  );
  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Request failed'));
  }

  return payload as T;
}

apiInterceptors.response.use((response) => {
  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('api:unauthorized'));
  }

  return response;
});
