import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { useHistoryPrefill } from '../hooks/useHistoryPrefill';
import { useLiveStatsFeed } from '../hooks/useLiveStats';
import { CpuChart } from './CpuChart';

// Stand-in for the charts that are not built yet.
function Pending({ title }: { title: string }) {
  return (
    <Card className="min-h-40">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">No data yet.</CardContent>
    </Card>
  );
}

/** The live metrics grid. Mounts the socket feed and the history prefill once for all charts. */
export function MetricsPanel() {
  useLiveStatsFeed();
  useHistoryPrefill();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <CpuChart />
      <Pending title="Memory" />
      <Pending title="Disk" />
      <Pending title="Network" />
    </div>
  );
}
