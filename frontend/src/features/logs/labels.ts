import type { Log, LogLevel, LogSource } from '@pc-monitor/shared';

export const LEVEL_LABELS: Record<LogLevel, string> = { info: 'Info', warning: 'Warning', error: 'Error' };
export const SOURCE_LABELS: Record<LogSource, string> = { manual: 'Manual', monitor: 'Monitor', action: 'Action' };

const timeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'medium' });
export const formatLogTime = (iso: string) => timeFormat.format(new Date(iso));

/** "OK · 1.1 s" style result of an action run; null for other logs. */
export function formatRun(log: Log): string | null {
  if (log.source !== 'action') return null;
  const parts = [log.success === false ? 'Failed' : log.success ? 'OK' : null];
  if (log.durationMs !== null) {
    parts.push(log.durationMs < 1000 ? `${log.durationMs} ms` : `${(log.durationMs / 1000).toFixed(1)} s`);
  }
  return parts.filter(Boolean).join(' · ') || null;
}
