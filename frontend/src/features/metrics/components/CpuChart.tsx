import { useQuery } from '@tanstack/react-query';
import { useId } from 'react';
import { thresholdsQuery } from '../api';
import type { MetricPoint } from '../buffer';
import { formatPercent, formatTemperature } from '../format';
import { useLiveStats } from '../hooks/useLiveStats';
import { MetricCard } from './MetricCard';
import { alertLine, type Series } from '../series';
import { TimeSeriesChart } from './TimeSeriesChart';

const SERIES: Series[] = [{ id: 'cpu', label: 'Total', color: 'var(--chart-1)', value: (p: MetricPoint) => p.cpu }];

/** Current load per logical core, as small multiples (one hue, never one per core). */
function PerCore({ loads }: { loads: number[] }) {
  const headingId = useId();
  return (
    <div>
      <h4 id={headingId} className="mb-2 text-xs font-medium text-muted-foreground">
        Per core, now
      </h4>
      <ul aria-labelledby={headingId} className="grid grid-cols-4 gap-x-3 gap-y-2 sm:grid-cols-8">
        {loads.map((load, i) => (
          <li key={i} className="grid gap-1 text-xs">
            <span className="flex justify-between gap-1">
              <span className="text-muted-foreground">
                <span className="sr-only">Core </span>
                {i + 1}
              </span>
              <span className="tabular-nums">{formatPercent(load)}</span>
            </span>
            {/* The number above carries the value; the bar is its visual twin. */}
            <span aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-muted">
              <span className="block h-full rounded-full bg-chart-1" style={{ width: `${load}%` }} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** CPU card: total load over time against the alert threshold, per-core load and temperature. */
export function CpuChart() {
  const points = useLiveStats((s) => s.points);
  const cpu = useLiveStats((s) => s.latest?.cpu);
  const threshold = useQuery(thresholdsQuery).data?.CPU_THRESHOLD;
  const current = points.at(-1)?.cpu ?? null;

  return (
    <MetricCard
      title="CPU"
      stats={[
        { label: 'Load', value: formatPercent(current) },
        { label: 'Temperature', value: formatTemperature(cpu?.tempC ?? null) },
      ]}
    >
      <TimeSeriesChart
        data={points}
        series={SERIES}
        formatValue={formatPercent}
        yDomain={[0, 100]}
        threshold={alertLine(threshold)}
      />
      {cpu && cpu.perCore.length > 0 && <PerCore loads={cpu.perCore} />}
    </MetricCard>
  );
}
