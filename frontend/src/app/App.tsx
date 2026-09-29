import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { MetricsPanel } from '@/features/metrics';
import { AppShell } from './layout/AppShell';

// Placeholder panels: each feature replaces its own in the next phases.
function Panel({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Card className="min-h-40">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{children ?? 'No data yet.'}</CardContent>
    </Card>
  );
}

export function App() {
  return (
    <AppShell>
      <div className="grid gap-8">
        <section aria-labelledby="metrics-heading">
          <h2 id="metrics-heading" className="mb-3 text-base font-semibold">
            Live metrics
          </h2>
          <MetricsPanel />
        </section>
        <div className="grid gap-8 lg:grid-cols-2">
          <section aria-labelledby="processes-heading">
            <h2 id="processes-heading" className="mb-3 text-base font-semibold">
              Processes
            </h2>
            <Panel title="Top processes" />
          </section>
          <section aria-labelledby="actions-heading">
            <h2 id="actions-heading" className="mb-3 text-base font-semibold">
              Fix actions
            </h2>
            <Panel title="Available actions" />
          </section>
        </div>
        <section aria-labelledby="logs-heading">
          <h2 id="logs-heading" className="mb-3 text-base font-semibold">
            Activity log
          </h2>
          <Panel title="Recent entries" />
        </section>
      </div>
    </AppShell>
  );
}
