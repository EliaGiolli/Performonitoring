import { useQuery } from '@tanstack/react-query';
import { thresholdsQuery } from '../api';
import type { MetricPoint } from '../buffer';
import { formatBytes, formatPercent } from '../format';
import { useLiveStats } from '../hooks/useLiveStats';
import { MetricCard } from './MetricCard';
import { alertLine, type Series } from '../series';
import { TimeSeriesChart } from './TimeSeriesChart';

const SERIES: Series[] = [{ id: 'ram', label: 'Used', color: 'var(--chart-1)', value: (p: MetricPoint) => p.ramPercent }];

/** Memory card: used share over time against the alert threshold, plus used / total now. */
export function RamChart() {
  const points = useLiveStats((s) => s.points);
  const threshold = useQuery(thresholdsQuery).data?.RAM_THRESHOLD;
  const current = points.at(-1);

  return (
    <MetricCard
      title="Memory"
      stats={[
        { label: 'Used', value: formatPercent(current?.ramPercent ?? null) },
        {
          label: 'In use',
          value: current ? `${formatBytes(current.ramUsed)} of ${formatBytes(current.ramTotal)}` : 'N/A',
        },
      ]}
    >
      <TimeSeriesChart
        data={points}
        series={SERIES}
        formatValue={formatPercent}
        yDomain={[0, 100]}
        threshold={alertLine(threshold)}
      />
    </MetricCard>
  );
}
