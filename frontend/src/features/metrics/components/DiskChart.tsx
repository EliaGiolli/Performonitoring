import type { DriveStats } from '@pc-monitor/shared';
import { useQuery } from '@tanstack/react-query';
import { TriangleAlert } from 'lucide-react';
import { useId } from 'react';
import { cn } from '@/core/lib/utils';
import { thresholdsQuery } from '../api';
import { formatBytes, formatPercent, formatRate } from '../format';
import { useLiveStats } from '../hooks/useLiveStats';
import type { Series } from '../series';
import { MetricCard } from './MetricCard';
import { TimeSeriesChart } from './TimeSeriesChart';

const SERIES: Series[] = [
  { id: 'read', label: 'Read', color: 'var(--chart-1)', value: (p) => p.diskReadBps },
  { id: 'write', label: 'Write', color: 'var(--chart-2)', value: (p) => p.diskWriteBps },
];

/** Space used per drive; a drive past the alert threshold says so in words and with an icon. */
function Drives({ drives, threshold }: { drives: DriveStats[]; threshold: number | undefined }) {
  const headingId = useId();
  return (
    <div>
      <h4 id={headingId} className="mb-2 text-xs font-medium text-muted-foreground">
        Space used
      </h4>
      <ul aria-labelledby={headingId} className="grid gap-3">
        {drives.map((d) => {
          const full = threshold !== undefined && d.usedPercent >= threshold;
          return (
            <li key={d.mount} className="grid gap-1 text-sm">
              <span className="flex flex-wrap justify-between gap-x-3">
                <span className="font-medium">
                  {d.mount} <span className="text-xs font-normal text-muted-foreground">{d.fsType}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  {full && (
                    <span className="flex items-center gap-1 text-xs font-medium">
                      <TriangleAlert aria-hidden="true" className="size-3.5 text-status-critical" />
                      Above alert
                    </span>
                  )}
                  <span className="tabular-nums">
                    {formatPercent(d.usedPercent)}
                    <span className="text-muted-foreground">
                      {' '}
                      · {formatBytes(d.used)} of {formatBytes(d.size)}
                    </span>
                  </span>
                </span>
              </span>
              {/* The text above carries the value; the bar is its visual twin. */}
              <span aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-muted">
                <span
                  className={cn('block h-full rounded-full', full ? 'bg-status-critical' : 'bg-chart-1')}
                  style={{ width: `${d.usedPercent}%` }}
                />
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Disk card: read / write throughput over time and the space used on each drive. */
export function DiskChart() {
  const points = useLiveStats((s) => s.points);
  const drives = useLiveStats((s) => s.latest?.disk.drives);
  const threshold = useQuery(thresholdsQuery).data?.DISK_THRESHOLD;
  const current = points.at(-1);

  return (
    <MetricCard
      title="Disk"
      stats={[
        { label: 'Read', value: formatRate(current?.diskReadBps ?? null) },
        { label: 'Write', value: formatRate(current?.diskWriteBps ?? null) },
      ]}
    >
      <TimeSeriesChart data={points} series={SERIES} formatValue={formatRate} />
      {drives && drives.length > 0 && <Drives drives={drives} threshold={threshold} />}
    </MetricCard>
  );
}
