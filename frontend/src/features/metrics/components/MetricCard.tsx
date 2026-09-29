import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';

export interface Stat {
  label: string;
  value: string;
}

/** Card frame shared by the metric charts: title, current values, then the chart. */
export function MetricCard({ title, stats, children }: { title: string; stats: Stat[]; children: ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <CardTitle>{title}</CardTitle>
        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {stats.map((s) => (
            <div key={s.label} className="flex gap-1.5">
              <dt className="text-muted-foreground">{s.label}</dt>
              <dd className="font-semibold">{s.value}</dd>
            </div>
          ))}
        </dl>
      </CardHeader>
      <CardContent className="grid gap-4">{children}</CardContent>
    </Card>
  );
}
