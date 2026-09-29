import type { ActionDefinition } from '@pc-monitor/shared';
import { useQuery } from '@tanstack/react-query';
import { Play } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { actionsQuery } from '../api';
import { useRunAction } from '../hooks/useRunAction';
import { ConfirmDialog } from './ConfirmDialog';
import { RiskBadge } from './RiskBadge';

/** One-click system fixes from the backend registry. Process actions live in the process table. */
export function FixActionsPanel() {
  const { data, error, isPending } = useQuery(actionsQuery);
  const actions = data?.filter((a) => a.target === 'system');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available actions</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <p className="text-sm text-muted-foreground">Loading actions…</p>
        ) : error ? (
          <p role="alert" className="text-sm">
            Couldn&apos;t load actions: {error.message}
          </p>
        ) : (
          <ul className="grid gap-3">
            {actions?.map((action) => (
              <ActionItem key={action.id} action={action} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ActionItem({ action }: { action: ActionDefinition }) {
  const run = useRunAction(action);
  const [confirming, setConfirming] = useState(false);
  const descriptionId = `action-${action.id}-description`;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
      <div className="grid min-w-0 flex-1 basis-60 gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-medium">{action.label}</h4>
          <RiskBadge risk={action.risk} />
        </div>
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {action.description}
        </p>
      </div>
      <Button
        variant="outline"
        aria-label={`Run ${action.label}`}
        aria-describedby={descriptionId}
        disabled={run.isPending}
        // Only actions the server guards with a confirmation ask first; the rest run now.
        onClick={() => (action.requiresConfirm ? setConfirming(true) : run.mutate())}
      >
        <Play aria-hidden="true" />
        {run.isPending ? 'Running…' : 'Run'}
      </Button>
      {action.requiresConfirm && (
        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          title={`${action.label}?`}
          description={action.description}
          confirmLabel={action.label}
          destructive={action.risk === 'high'}
          onConfirm={() => run.mutate()}
        />
      )}
    </li>
  );
}
