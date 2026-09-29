import { useHistoryPrefill } from '../hooks/useHistoryPrefill';
import { useLiveStatsFeed } from '../hooks/useLiveStats';
import { CpuChart } from './CpuChart';
import { DiskChart } from './DiskChart';
import { NetworkChart } from './NetworkChart';
import { RamChart } from './RamChart';

/** The live metrics grid. Mounts the socket feed and the history prefill once for all charts. */
export function MetricsPanel() {
  useLiveStatsFeed();
  useHistoryPrefill();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <CpuChart />
      <RamChart />
      <DiskChart />
      <NetworkChart />
    </div>
  );
}
