import type { ActionRisk } from '@pc-monitor/shared';
import { cva } from 'class-variance-authority';
import { OctagonAlert, ShieldCheck, TriangleAlert, type LucideIcon } from 'lucide-react';

// Status colors tint the frame and icon only; the label stays in the text color, so
// the risk reads the same without color (icon + words).
const riskBadge = cva('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium', {
  variants: {
    risk: {
      low: 'border-status-good/60 bg-status-good/10 [&_svg]:text-status-good',
      medium: 'border-status-warning/70 bg-status-warning/10 [&_svg]:text-status-warning',
      high: 'border-status-critical/60 bg-status-critical/10 [&_svg]:text-status-critical',
    },
  },
});

const RISK: Record<ActionRisk, { label: string; Icon: LucideIcon }> = {
  low: { label: 'Low risk', Icon: ShieldCheck },
  medium: { label: 'Medium risk', Icon: TriangleAlert },
  high: { label: 'High risk', Icon: OctagonAlert },
};

export function RiskBadge({ risk }: { risk: ActionRisk }) {
  const { label, Icon } = RISK[risk];
  return (
    <span className={riskBadge({ risk })}>
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
    </span>
  );
}
