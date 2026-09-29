import type { Log } from '@pc-monitor/shared';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useReducer } from 'react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { logsQuery } from '../api';
import { DEFAULT_FILTERS, type LogFilters } from '../filters';
import { formatLogTime, formatRun, SOURCE_LABELS } from '../labels';
import { LevelLabel } from './LevelLabel';
import { LogFiltersBar } from './LogFiltersBar';

const features = tableFeatures({});
const column = createColumnHelper<typeof features, Log>();

// Server order (newest first) is the only order: pages are keyset cursors over it.
const columns = column.columns([
  column.accessor('timestamp', { header: 'Time' }),
  column.accessor('logLevel', { header: 'Level' }),
  column.accessor('source', { header: 'Source' }),
  column.accessor('logMessage', { header: 'Message' }),
  column.display({ id: 'result', header: 'Result' }),
]);

// Keyset paging: `cursors[i]` opens page i + 1 (undefined = first page). Going back pops.
interface PagingState {
  filters: LogFilters;
  cursors: (string | undefined)[];
}
type PagingAction = { type: 'filter'; patch: Partial<LogFilters> } | { type: 'next'; cursor: string } | { type: 'prev' };

function paging(state: PagingState, action: PagingAction): PagingState {
  switch (action.type) {
    case 'filter':
      return { filters: { ...state.filters, ...action.patch }, cursors: [undefined] };
    case 'next':
      return { ...state, cursors: [...state.cursors, action.cursor] };
    case 'prev':
      return state.cursors.length > 1 ? { ...state, cursors: state.cursors.slice(0, -1) } : state;
  }
}

/** The activity log: filters, one page of entries (table on desktop, cards on small screens), paging. */
export function LogsPanel() {
  const [{ filters, cursors }, dispatch] = useReducer(paging, { filters: DEFAULT_FILTERS, cursors: [undefined] });
  const { data, error, isPending, isPlaceholderData } = useQuery(logsQuery(filters, cursors.at(-1)));
  const table = useTable({ features, columns, data: data?.items ?? NO_ROWS, getRowId: (log) => String(log.id) });
  const rows = table.getRowModel().rows;
  const page = cursors.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent entries</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <LogFiltersBar filters={filters} onChange={(patch) => dispatch({ type: 'filter', patch })} />

        {isPending ? (
          <p className="text-sm text-muted-foreground">Loading log entries…</p>
        ) : error && !data ? (
          <p role="alert" className="text-sm">
            Couldn&apos;t load the log: {error.message}
          </p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No log entries match these filters.</p>
        ) : (
          <div aria-busy={isPlaceholderData} className={isPlaceholderData ? 'opacity-60' : undefined}>
            <ul aria-label={`Log entries, page ${page}`} className="grid gap-2 md:hidden">
              {rows.map(({ original: log }) => (
                <li key={log.id} className="grid gap-1 rounded-md border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <LevelLabel level={log.logLevel} />
                    <span className="text-muted-foreground">{formatLogTime(log.timestamp)}</span>
                  </div>
                  <p className="break-words">{log.logMessage}</p>
                  <p className="text-xs text-muted-foreground">
                    <SourceText log={log} />
                    {formatRun(log) && ` · ${formatRun(log)}`}
                  </p>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto rounded-md border md:block">
              <table className="w-full text-sm">
                <caption className="sr-only">Log entries, page {page}, newest first</caption>
                <thead className="text-xs text-muted-foreground">
                  {table.getHeaderGroups().map((group) => (
                    <tr key={group.id}>
                      {group.headers.map((header) => (
                        <th key={header.id} scope="col" className="px-3 py-2 text-left font-medium whitespace-nowrap">
                          {String(header.column.columnDef.header)}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {rows.map(({ original: log }) => (
                    <tr key={log.id} className="border-t align-top">
                      <th scope="row" className="px-3 py-2 text-left font-normal whitespace-nowrap text-muted-foreground tabular-nums">
                        {formatLogTime(log.timestamp)}
                      </th>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <LevelLabel level={log.logLevel} />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <SourceText log={log} />
                      </td>
                      <td className="px-3 py-2 break-words">{log.logMessage}</td>
                      <td className="px-3 py-2 whitespace-nowrap tabular-nums">{formatRun(log) ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(page > 1 || data?.nextCursor) && (
          <nav aria-label="Log pages" className="flex items-center justify-between gap-3">
            <Button variant="outline" disabled={page === 1} onClick={() => dispatch({ type: 'prev' })}>
              <ChevronLeft aria-hidden="true" />
              Newer
            </Button>
            <span className="text-sm text-muted-foreground">Page {page}</span>
            <Button
              variant="outline"
              disabled={!data?.nextCursor || isPlaceholderData}
              onClick={() => data?.nextCursor && dispatch({ type: 'next', cursor: data.nextCursor })}
            >
              Older
              <ChevronRight aria-hidden="true" />
            </Button>
          </nav>
        )}
      </CardContent>
    </Card>
  );
}

function SourceText({ log }: { log: Log }) {
  return (
    <>
      {SOURCE_LABELS[log.source]}
      {log.actionId && <span className="text-muted-foreground"> ({log.actionId})</span>}
      {log.archived && <span className="ml-1.5 rounded border px-1 text-xs text-muted-foreground">Archived</span>}
    </>
  );
}

// Stable empty input: a fresh [] every render would make the table recompute its rows.
const NO_ROWS: Log[] = [];
