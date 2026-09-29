import { runActionResultSchema } from '@pc-monitor/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api';

/**
 * Kills a process by PID. Only called after the user confirmed in the dialog, so it
 * always sends `confirm: true` (the server refuses the kill without it). A script that
 * ran but failed resolves with `success: false`; a refused request (protected PID,
 * already running) rejects with an ApiError.
 */
export function useKillProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pid: number) => api.post(`/processes/${pid}/kill`, { confirm: true }, runActionResultSchema),
    // Either way the list changed or is worth re-reading.
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['processes'] }),
  });
}
