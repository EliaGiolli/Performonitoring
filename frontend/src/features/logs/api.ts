import { logPageSchema } from '@pc-monitor/shared';
import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { api, LOGS_KEY } from '@/core/api';
import { toSearchParams, type LogFilters } from './filters';

/** One page of logs, newest first. The key holds the exact query string. */
export const logsQuery = (filters: LogFilters, cursor: string | undefined) => {
  const search = toSearchParams(filters, cursor);
  return queryOptions({
    queryKey: [...LOGS_KEY, search],
    queryFn: ({ signal }) => api.get(`/logs?${search}`, logPageSchema, signal),
    // Filter and page changes keep the old rows on screen until the new ones arrive.
    placeholderData: keepPreviousData,
  });
};
