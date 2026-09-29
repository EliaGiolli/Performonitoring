import type { RunActionResult } from '@pc-monitor/shared';
import { toast } from 'sonner';

// Failures stay up longer: they usually need reading (why it was refused, what to try).
const ERROR_DURATION_MS = 10_000;

/** Toast for a run that reached the script: its one-line summary, as success or failure. */
export function toastRunResult(title: string, result: RunActionResult) {
  if (result.success) toast.success(`${title}: done`, { description: result.message });
  else toast.error(`${title}: failed`, { description: result.message, duration: ERROR_DURATION_MS });
}

/** Toast for a run the backend refused or couldn't answer (409 already running, 403, offline...). */
export function toastRunError(title: string, error: Error) {
  toast.error(`${title}: failed`, { description: error.message, duration: ERROR_DURATION_MS });
}
