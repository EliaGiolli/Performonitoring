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
