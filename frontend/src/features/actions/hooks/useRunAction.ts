import { runActionResultSchema, type ActionDefinition } from '@pc-monitor/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, LOGS_KEY } from '@/core/api';
import { toastRunError, toastRunResult } from '../toasts';

/**
 * Runs one system fix action and toasts the outcome. `confirm: true` is sent only for
 * actions that need it, and only once the user said yes in the dialog. A script that ran
 * but failed resolves with `success: false`; a refused request (e.g. already running)
 * rejects with an ApiError.
 */
export function useRunAction(action: ActionDefinition) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['actions', action.id, 'run'],
    mutationFn: () =>
      api.post(`/actions/${action.id}/run`, action.requiresConfirm ? { confirm: true } : {}, runActionResultSchema),
    onSuccess: (result) => toastRunResult(action.label, result),
    onError: (error) => toastRunError(action.label, error),
    // Every run that reaches the script writes an audit log entry.
    onSettled: () => queryClient.invalidateQueries({ queryKey: LOGS_KEY }),
  });
}
