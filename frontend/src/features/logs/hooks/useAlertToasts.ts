import type { AlertMetric } from '@pc-monitor/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { LOGS_KEY } from '@/core/api';
import { subscribe, useSocket } from '@/core/ws';

const METRIC_LABELS: Record<AlertMetric, string> = { cpu: 'CPU', ram: 'Memory', disk: 'Disk' };

// Alerts are rare (debounced server-side) and worth reading, so they stay up longer.
const ALERT_DURATION_MS = 15_000;

/**
 * Toasts every threshold `alert` from the live channel and refreshes the log, where the
 * server has just written it. Mount once for the whole app.
 */
export function useAlertToasts() {
  const socket = useSocket();
  const queryClient = useQueryClient();

  useEffect(
    () =>
      subscribe(socket, 'alert', (alert) => {
        toast.warning(`${METRIC_LABELS[alert.metric]} above ${alert.threshold}%`, {
          description: alert.message,
          duration: ALERT_DURATION_MS,
        });
        void queryClient.invalidateQueries({ queryKey: LOGS_KEY });
      }),
    [socket, queryClient],
  );
}
