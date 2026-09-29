import type { MetricPoint } from './buffer';

export interface Series {
  id: string;
  label: string;
  /** A chart slot token, e.g. `var(--chart-1)`: slots are assigned in fixed order. */
  color: string;
  value: (p: MetricPoint) => number | null;
}

export interface Threshold {
  value: number;
  label: string;
}

/** Reference line for an alert threshold in percent; none while it is unknown or unset. */
export function alertLine(percent: number | undefined): Threshold | undefined {
  return percent === undefined ? undefined : { value: percent, label: `Alert ${percent}%` };
}

/**
 * One sentence per chart for screen readers: the latest, average and peak value of each
 * series over the window. It is read on demand, never announced on each tick.
 */
export function summarize(
  title: string,
  points: MetricPoint[],
  series: Series[],
  formatValue: (value: number) => string,
): string {
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last) return `${title}: no data yet.`;

  const minutes = Math.max(1, Math.round((last.t - first.t) / 60_000));
  const parts = series.map((s) => {
    const values = points.map(s.value).filter((v): v is number => v !== null);
    if (values.length === 0) return `${s.label}: not measurable`;
    const now = s.value(last);
    const average = values.reduce((sum, v) => sum + v, 0) / values.length;
    const peak = Math.max(...values);
    return `${s.label}: now ${now === null ? 'N/A' : formatValue(now)}, average ${formatValue(average)}, peak ${formatValue(peak)}`;
  });
  return `${title}, last ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}. ${parts.join('. ')}.`;
}
