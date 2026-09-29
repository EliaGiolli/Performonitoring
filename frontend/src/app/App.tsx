import { FixActionsPanel } from '@/features/actions';
import { LogsPanel, useAlertToasts } from '@/features/logs';
import { MetricsPanel } from '@/features/metrics';
import { ProcessTable } from '@/features/processes';
import { AppShell } from './layout/AppShell';

export function App() {
  useAlertToasts();

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
            <ProcessTable />
          </section>
          <section aria-labelledby="actions-heading">
            <h2 id="actions-heading" className="mb-3 text-base font-semibold">
              Fix actions
            </h2>
            <FixActionsPanel />
          </section>
        </div>
        <section aria-labelledby="logs-heading">
          <h2 id="logs-heading" className="mb-3 text-base font-semibold">
            Activity log
          </h2>
          <LogsPanel />
        </section>
      </div>
    </AppShell>
  );
}
