import { CircleCheck, CircleX, LoaderCircle, RefreshCw, type LucideIcon } from 'lucide-react';
import { cn } from '@/core/lib/utils';
import { useConnectionStore, type ConnectionStatus as Status } from '@/core/ws';

// Status is never color alone: each state has its own icon and a text label.
const STATES: Record<Status, { label: string; Icon: LucideIcon; iconClass: string }> = {
  connecting: { label: 'Connecting…', Icon: LoaderCircle, iconClass: 'text-muted-foreground motion-safe:animate-spin' },
  connected: { label: 'Live', Icon: CircleCheck, iconClass: 'text-status-good' },
  reconnecting: { label: 'Reconnecting…', Icon: RefreshCw, iconClass: 'text-status-warning' },
  disconnected: { label: 'Offline', Icon: CircleX, iconClass: 'text-status-critical' },
};

/** Live-channel indicator for the header; screen readers hear each change once. */
export function ConnectionStatus() {
  const status = useConnectionStore((s) => s.status);
  const { label, Icon, iconClass } = STATES[status];

  return (
    <p role="status" className="flex items-center gap-2 text-sm font-medium">
      <Icon aria-hidden="true" className={cn('size-4 shrink-0', iconClass)} />
      <span>
        <span className="sr-only">Live data: </span>
        {label}
      </span>
    </p>
  );
}
