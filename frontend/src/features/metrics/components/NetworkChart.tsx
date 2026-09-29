import { formatRate, rateTicks } from '../format';
import { useLiveStats } from '../hooks/useLiveStats';
import type { Series } from '../series';
import { MetricCard } from './MetricCard';
import { TimeSeriesChart } from './TimeSeriesChart';

const SERIES: Series[] = [
  { id: 'rx', label: 'Received', color: 'var(--chart-1)', value: (p) => p.netRxBps },
  { id: 'tx', label: 'Sent', color: 'var(--chart-2)', value: (p) => p.netTxBps },
];

/** Network card: received / sent throughput over time, across all interfaces. */
export function NetworkChart() {
  const points = useLiveStats((s) => s.points);
  const current = points.at(-1);

  return (
    <MetricCard
      title="Network"
      stats={[
        { label: 'Received', value: formatRate(current?.netRxBps ?? null) },
        { label: 'Sent', value: formatRate(current?.netTxBps ?? null) },
      ]}
    >
      <TimeSeriesChart data={points} series={SERIES} formatValue={formatRate} yTicks={rateTicks} />
    </MetricCard>
  );
}
