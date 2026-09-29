import { runActionResultSchema, type ActionDefinition } from '@pc-monitor/shared';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/core/api';

/**
 * Runs one system fix action. `confirm: true` is sent only for actions that need it,
 * and only once the user said yes in the dialog. A script that ran but failed resolves
 * with `success: false`; a refused request (e.g. already running) rejects with an ApiError.
 */
export function useRunAction(action: ActionDefinition) {
  return useMutation({
    mutationKey: ['actions', action.id, 'run'],
    mutationFn: () =>
      api.post(`/actions/${action.id}/run`, action.requiresConfirm ? { confirm: true } : {}, runActionResultSchema),
  });
}
