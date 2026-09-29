import type { LogLevel, LogSource } from '@pc-monitor/shared';

export const PAGE_SIZE = 20;

export type ArchivedFilter = 'active' | 'archived' | 'all';

export interface LogFilters {
  level?: LogLevel | undefined;
  source?: LogSource | undefined;
  archived: ArchivedFilter;
  /** Whole local days, inclusive. `to` alone is ignored; `from` alone means that one day. */
  from?: Date | undefined;
  to?: Date | undefined;
}

export const DEFAULT_FILTERS: LogFilters = { archived: 'active' };

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

/** Query string for GET /api/logs: the filters, one page, and the cursor of that page. */
export function toSearchParams(filters: LogFilters, cursor: string | undefined): string {
  const params = new URLSearchParams();
  if (filters.level) params.set('level', filters.level);
  if (filters.source) params.set('source', filters.source);
  if (filters.archived !== 'all') params.set('archived', String(filters.archived === 'archived'));
  if (filters.from) {
    params.set('from', startOfDay(filters.from).toISOString());
    params.set('to', endOfDay(filters.to ?? filters.from).toISOString());
  }
  params.set('limit', String(PAGE_SIZE));
  if (cursor) params.set('cursor', cursor);
  return params.toString();
}
