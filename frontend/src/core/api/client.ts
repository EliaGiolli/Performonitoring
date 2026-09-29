import { errorResponseSchema } from '@pc-monitor/shared';
import type { z } from 'zod';

/**
 * Failed API call. `status` is the HTTP status, or 0 when the backend was unreachable
 * or answered with something that doesn't match the shared schema.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ApiError';
    this.status = status;
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface RequestOptions {
  body?: unknown;
  signal?: AbortSignal | undefined;
  /** Extra headers, e.g. the admin key; they can't replace the JSON content type. */
  headers?: Record<string, string> | undefined;
}

// Every request carries a JSON content type: the backend refuses mutating requests
// without it (a cross-site form can't send it without a CORS preflight).
const JSON_HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json' };

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return undefined;
  }
}

async function request<S extends z.ZodType>(
  method: Method,
  path: string,
  schema: S,
  { body, signal, headers }: RequestOptions = {},
): Promise<z.infer<S>> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: { ...headers, ...JSON_HEADERS },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      ...(signal ? { signal } : {}),
    });
  } catch (cause) {
    // Let TanStack Query see its own cancellations as aborts, not as failures.
    if (signal?.aborted) throw cause;
    throw new ApiError(0, 'Backend unreachable', { cause });
  }

  const json = await readJson(res);

  if (!res.ok) {
    const parsed = errorResponseSchema.safeParse(json);
    throw new ApiError(res.status, parsed.success ? parsed.data.message : res.statusText || `HTTP ${res.status}`);
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError(0, `Unexpected response from ${method} ${path}`, { cause: parsed.error });
  }
  return parsed.data;
}

/** Typed client for the backend under `/api`: each call validates the response with a shared schema. */
export const api = {
  get: <S extends z.ZodType>(path: string, schema: S, signal?: AbortSignal) =>
    request('GET', path, schema, { signal }),
  post: <S extends z.ZodType>(path: string, body: unknown, schema: S, headers?: Record<string, string>) =>
    request('POST', path, schema, { body, headers }),
  patch: <S extends z.ZodType>(path: string, body: unknown, schema: S, headers?: Record<string, string>) =>
    request('PATCH', path, schema, { body, headers }),
  delete: <S extends z.ZodType>(path: string, schema: S, headers?: Record<string, string>) =>
    request('DELETE', path, schema, { headers }),
};
