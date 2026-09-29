import type { LogLevel } from '@pc-monitor/shared';
import { CircleX, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import { LEVEL_LABELS } from '../labels';

const LEVEL_ICONS: Record<LogLevel, { Icon: LucideIcon; className: string }> = {
  info: { Icon: Info, className: 'text-muted-foreground' },
  warning: { Icon: TriangleAlert, className: 'text-status-warning' },
  error: { Icon: CircleX, className: 'text-status-critical' },
};

/** Level as icon + word: the color only reinforces it. */
export function LevelLabel({ level }: { level: LogLevel }) {
  const { Icon, className } = LEVEL_ICONS[level];
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon aria-hidden="true" className={`size-4 shrink-0 ${className}`} />
      {LEVEL_LABELS[level]}
    </span>
  );
}
