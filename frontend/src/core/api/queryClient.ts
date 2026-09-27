import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './client';

// Retrying a 4xx can't succeed, so only transient failures (unreachable backend, 5xx) retry.
function shouldRetry(failureCount: number, error: unknown) {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < 2;
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      // Live values come from the socket; refetching on focus would only duplicate them.
      queries: { retry: shouldRetry, refetchOnWindowFocus: false, staleTime: 10_000 },
      mutations: { retry: false },
    },
  });
}
