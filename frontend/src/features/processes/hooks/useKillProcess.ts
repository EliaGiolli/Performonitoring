import { runActionResultSchema, type ProcessInfo } from '@pc-monitor/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, LOGS_KEY } from '@/core/api';
import { toastRunError, toastRunResult } from '@/features/actions';

const title = (p: ProcessInfo) => `Kill ${p.name}`;

/**
 * Kills a process and toasts the outcome. Only called after the user confirmed in the
 * dialog, so it always sends `confirm: true` (the server refuses the kill without it).
 * A script that ran but failed resolves with `success: false`; a refused request
 * (protected PID, already running) rejects with an ApiError.
 */
export function useKillProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (p: ProcessInfo) => api.post(`/processes/${p.pid}/kill`, { confirm: true }, runActionResultSchema),
    onSuccess: (result, p) => toastRunResult(title(p), result),
    onError: (error, p) => toastRunError(title(p), error),
    // Either way the list changed or is worth re-reading, and the run was logged.
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['processes'] }),
        queryClient.invalidateQueries({ queryKey: LOGS_KEY }),
      ]),
  });
}
