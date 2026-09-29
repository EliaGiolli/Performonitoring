// Public API of the metrics feature: other modules import only from this file.
export { MetricsPanel } from './components/MetricsPanel';
export { useLiveStats, useLiveStatsFeed } from './hooks/useLiveStats';
export { useHistoryPrefill } from './hooks/useHistoryPrefill';
export type { MetricPoint } from './buffer';
