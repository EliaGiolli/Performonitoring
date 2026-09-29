import { processListSchema, type ProcessSort } from '@pc-monitor/shared';
import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { api } from '@/core/api';

export const PROCESS_LIMIT = 15;
// Listing processes costs the backend about a second of work on Windows, so the table
// refreshes less often than the 2s charts. Paused while the tab is hidden (Query default).
export const PROCESS_POLL_MS = 5_000;

/** The top processes by CPU or RAM, as ranked by the backend. */
export const processesQuery = (sortBy: ProcessSort) =>
  queryOptions({
    queryKey: ['processes', sortBy],
    queryFn: ({ signal }) => api.get(`/processes?sortBy=${sortBy}&limit=${PROCESS_LIMIT}`, processListSchema, signal),
    refetchInterval: PROCESS_POLL_MS,
    // Switching the ranking keeps the old rows on screen until the new ones arrive.
    placeholderData: keepPreviousData,
  });
