import { actionDefinitionSchema } from '@pc-monitor/shared';
import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '@/core/api';

const actionListSchema = z.array(actionDefinitionSchema);

/** The fix actions the backend can run (metadata only). Fixed at build time, so never stale. */
export const actionsQuery = queryOptions({
  queryKey: ['actions'],
  queryFn: ({ signal }) => api.get('/actions', actionListSchema, signal),
  staleTime: Infinity,
});
