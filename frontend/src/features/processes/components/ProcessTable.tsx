import type { ProcessInfo, ProcessSort } from '@pc-monitor/shared';
import { useQuery } from '@tanstack/react-query';
import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/core/components/ui/toggle-group';
import { formatBytes } from '@/core/lib/format';
import { processesQuery } from '../api';

const features = tableFeatures({ rowSortingFeature, sortedRowModel: createSortedRowModel() });
const column = createColumnHelper<typeof features, ProcessInfo>();

type SortableId = 'name' | 'cpuPercent' | 'memBytes';

const SORT_LABELS: Record<SortableId, string> = { name: 'Name', cpuPercent: 'CPU', memBytes: 'RAM' };

const columns = column.columns([
  column.accessor('name', {
    header: SORT_LABELS.name,
    sortFn: (a, b, id) => a.getValue<string>(id).localeCompare(b.getValue<string>(id), undefined, { sensitivity: 'base' }),
  }),
  column.accessor('pid', { header: 'PID', enableSorting: false }),
  // Numbers read best biggest first, so their first click sorts descending.
  column.accessor('cpuPercent', { header: SORT_LABELS.cpuPercent, sortDescFirst: true }),
  column.accessor('memBytes', { header: SORT_LABELS.memBytes, sortDescFirst: true }),
]);

// One decimal, like Task Manager: most processes sit well under 1%.
const formatCpu = (percent: number) => `${percent.toFixed(1)}%`;

const INITIAL_SORT: SortingState = [{ id: 'cpuPercent', desc: true }];

// The backend ranks the top N by CPU or RAM; sorting by name reorders the current CPU top N.
function serverSort(sorting: SortingState): ProcessSort {
  return sorting[0]?.id === 'memBytes' ? 'mem' : 'cpu';
}

const ariaSort = (dir: false | 'asc' | 'desc') =>
  dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : undefined;

/** Top processes, refreshed every few seconds: a sortable table on desktop, cards on small screens. */
export function ProcessTable() {
  const [sorting, setSorting] = useState<SortingState>(INITIAL_SORT);
  const { data, error, isPending } = useQuery(processesQuery(serverSort(sorting)));

  const table = useTable({
    features,
    columns,
    data: data?.processes ?? NO_ROWS,
    getRowId: (p) => String(p.pid),
    state: { sorting },
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    enableMultiSort: false,
  });
  const rows = table.getRowModel().rows;
  const active = sorting[0];
  const sortSummary = active
    ? `sorted by ${SORT_LABELS[active.id as SortableId]}, ${active.desc ? 'descending' : 'ascending'}`
    : '';

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <CardTitle>Top processes</CardTitle>
        {data && (
          <p className="text-sm text-muted-foreground">
            {data.processes.length} of {data.total} running
          </p>
        )}
      </CardHeader>
      <CardContent className="grid gap-3">
        {isPending ? (
          <p className="text-sm text-muted-foreground">Loading processes…</p>
        ) : error && !data ? (
          <p role="alert" className="text-sm">
            Couldn&apos;t load processes: {error.message}
          </p>
        ) : (
          <>
            {/* Small screens: no column headers to click, so sorting gets its own control. */}
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              aria-label="Sort processes by"
              className="md:hidden"
              value={active?.id ?? ''}
              onValueChange={(id) => {
                if (!id) return;
                const col = table.getColumn(id);
                if (col) setSorting([{ id, desc: col.getFirstSortDir() === 'desc' }]);
              }}
            >
              {(Object.keys(SORT_LABELS) as SortableId[]).map((id) => (
                <ToggleGroupItem key={id} value={id} className="h-11 px-4">
                  {SORT_LABELS[id]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            <ul aria-label={`Processes, ${sortSummary}`} className="grid gap-2 md:hidden">
              {rows.map(({ original: p }) => (
                <li key={p.pid} className="rounded-md border p-3">
                  <p className="truncate font-medium" title={p.name}>
                    {p.name} <span className="font-normal text-muted-foreground">PID {p.pid}</span>
                  </p>
                  <dl className="mt-1 flex gap-4 text-sm tabular-nums">
                    <div className="flex gap-1.5">
                      <dt className="text-muted-foreground">CPU</dt>
                      <dd>{formatCpu(p.cpuPercent)}</dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt className="text-muted-foreground">RAM</dt>
                      <dd>{formatBytes(p.memBytes)}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>

            <div className="hidden rounded-md border md:block">
              <table className="w-full text-sm">
                <caption className="sr-only">Top processes, {sortSummary}</caption>
                <thead className="text-xs text-muted-foreground">
                  {table.getHeaderGroups().map((group) => (
                    <tr key={group.id}>
                      {group.headers.map((header) => {
                        const col = header.column;
                        const numeric = col.id !== 'name';
                        const label = String(col.columnDef.header);
                        const dir = col.getIsSorted();
                        const Icon = dir === 'asc' ? ArrowUp : dir === 'desc' ? ArrowDown : ArrowUpDown;
                        return (
                          <th
                            key={header.id}
                            scope="col"
                            aria-sort={ariaSort(dir)}
                            className={`px-3 py-2 font-medium ${numeric ? 'text-right' : 'text-left'}`}
                          >
                            {col.getCanSort() ? (
                              <button
                                type="button"
                                onClick={col.getToggleSortingHandler()}
                                className={`inline-flex h-9 items-center gap-1 rounded-sm hover:text-foreground ${numeric ? 'flex-row-reverse' : ''} ${dir ? 'text-foreground' : ''}`}
                              >
                                {label}
                                <Icon aria-hidden="true" className="size-3.5" />
                              </button>
                            ) : (
                              label
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  ))}
                </thead>
                <tbody className="tabular-nums">
                  {rows.map(({ original: p }) => (
                    <tr key={p.pid} className="border-t">
                      <th scope="row" className="max-w-0 truncate px-3 py-2 text-left font-medium" title={p.name}>
                        {p.name}
                      </th>
                      <td className="px-3 py-2 text-right text-muted-foreground">{p.pid}</td>
                      <td className="px-3 py-2 text-right">{formatCpu(p.cpuPercent)}</td>
                      <td className="px-3 py-2 text-right">{formatBytes(p.memBytes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Stable empty input: a fresh [] every render would make the table recompute its rows.
const NO_ROWS: ProcessInfo[] = [];
