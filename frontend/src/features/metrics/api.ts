import { systemSampleSchema, thresholdsSchema } from '@pc-monitor/shared';
import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '@/core/api';
import { WINDOW_MS } from './buffer';

const historySchema = z.array(systemSampleSchema);

/** Stored samples covering the chart window, oldest first. */
export const historyQuery = queryOptions({
  queryKey: ['metrics', 'history'],
  queryFn: ({ signal }) => api.get(`/metrics/history?minutes=${WINDOW_MS / 60_000}`, historySchema, signal),
  // The socket keeps the charts current; history is only refetched on purpose (reconnect).
  staleTime: Infinity,
});

/** Alert thresholds, drawn as reference lines. Rarely change, so a short stale time is enough. */
export const thresholdsQuery = queryOptions({
  queryKey: ['config', 'thresholds'],
  queryFn: ({ signal }) => api.get('/config/thresholds', thresholdsSchema, signal),
  staleTime: 60_000,
});
