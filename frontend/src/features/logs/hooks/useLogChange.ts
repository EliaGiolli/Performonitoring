import { logSchema, messageResponseSchema, type Log } from '@pc-monitor/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError, LOGS_KEY } from '@/core/api';
import { adminHeaders, clearAdminKey, getAdminKey } from '../adminKey';

export type LogChange = { kind: 'archive'; log: Log; archived: boolean } | { kind: 'delete'; log: Log };

const DONE: Record<string, string> = { archive: 'Log entry archived', restore: 'Log entry restored', delete: 'Log entry deleted' };
const doneKey = (c: LogChange) => (c.kind === 'delete' ? 'delete' : c.archived ? 'archive' : 'restore');

/**
 * Archives, restores or deletes a log entry; both are admin-only on the server. A 403
 * means the key is missing or wrong: the stored key is dropped and `onNeedKey` is
 * called with the change, so the caller can ask for a key and retry it. `rejected` says
 * whether a key had been sent (i.e. it was wrong, not just missing).
 */
export function useLogChange(onNeedKey: (change: LogChange, rejected: boolean) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    // The response isn't used: the list is refetched either way.
    mutationFn: async (change: LogChange): Promise<void> => {
      const path = `/logs/${change.log.id}`;
      if (change.kind === 'delete') await api.delete(path, messageResponseSchema, adminHeaders());
      else await api.patch(path, { archived: change.archived }, logSchema, adminHeaders());
    },
    onSuccess: (_result, change) => toast.success(DONE[doneKey(change)]),
    onError: (error, change) => {
      if (error instanceof ApiError && error.status === 403) {
        const rejected = getAdminKey() !== null;
        clearAdminKey();
        onNeedKey(change, rejected);
        return;
      }
      toast.error(`${change.kind === 'delete' ? 'Delete' : 'Archive'} failed`, { description: error.message });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: LOGS_KEY }),
  });
}
