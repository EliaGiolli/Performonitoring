import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MetricPoint } from '../buffer';
import { formatClock, formatClockSeconds } from '../format';

export interface Series {
  id: string;
  label: string;
  /** A chart slot token, e.g. `var(--chart-1)`: slots are assigned in fixed order. */
  color: string;
  value: (p: MetricPoint) => number | null;
}

export interface Threshold {
  value: number;
  label: string;
}

interface TimeSeriesChartProps {
  data: MetricPoint[];
  series: Series[];
  formatValue: (value: number) => string;
  /** Fixed domain for percentages; omit to fit the data (rates). */
  yDomain?: [number, number];
  threshold?: Threshold | undefined;
  height?: number;
}

const SHORT_SPAN_MS = 10 * 60_000;
const AXIS_TICK = { fill: 'var(--chart-label)', fontSize: 12 };

/** Legend with line keys (mirrors the marks); only drawn for two or more series. */
export function SeriesLegend({ series }: { series: Series[] }) {
  if (series.length < 2) return null;
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legend">
      {series.map((s) => (
        <li key={s.id} className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-0.5 w-3 rounded-full" style={{ backgroundColor: s.color }} />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  series,
  formatValue,
}: {
  active: boolean | undefined;
  payload: readonly { payload?: unknown }[] | undefined;
  label: unknown;
} & Pick<TimeSeriesChartProps, 'series' | 'formatValue'>) {
  const point = payload?.[0]?.payload as MetricPoint | undefined;
  if (!active || !point) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="mb-1 text-muted-foreground">{formatClockSeconds(Number(label))}</p>
      <ul className="grid gap-0.5">
        {series.map((s) => {
          const value = s.value(point);
          return (
            <li key={s.id} className="flex items-center gap-2">
              <span aria-hidden="true" className="h-0.5 w-3 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="font-semibold tabular-nums">{value === null ? 'N/A' : formatValue(value)}</span>
              <span className="text-muted-foreground">{s.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Line chart over the shared time axis: 2px lines, hairline grid, a crosshair tooltip
 * listing every series, and an optional dashed threshold line. Missing values
 * (null) leave a gap instead of a fake zero.
 */
export function TimeSeriesChart({ data, series, formatValue, yDomain, threshold, height = 200 }: TimeSeriesChartProps) {
  // Right after startup the window spans seconds, and minute ticks would all read the same.
  const span = (data.at(-1)?.t ?? 0) - (data[0]?.t ?? 0);
  const formatTick = span < SHORT_SPAN_MS ? formatClockSeconds : formatClock;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis
          dataKey="t"
          type="number"
          scale="time"
          domain={['dataMin', 'dataMax']}
          tickFormatter={formatTick}
          tick={AXIS_TICK}
          stroke="var(--chart-axis)"
          minTickGap={48}
        />
        <YAxis
          domain={yDomain ?? [0, 'auto']}
          tickFormatter={formatValue}
          tick={AXIS_TICK}
          stroke="var(--chart-axis)"
          width={64}
          allowDecimals={false}
        />
        <Tooltip
          isAnimationActive={false}
          cursor={{ stroke: 'var(--chart-label)', strokeWidth: 1 }}
          content={({ active, payload, label }) => (
            <ChartTooltip active={active} payload={payload} label={label} series={series} formatValue={formatValue} />
          )}
        />
        {threshold && (
          <ReferenceLine
            y={threshold.value}
            stroke="var(--status-critical)"
            strokeDasharray="4 4"
            ifOverflow="extendDomain"
            label={{ value: threshold.label, position: 'insideTopRight', fill: 'var(--muted-foreground)', fontSize: 12 }}
          />
        )}
        {series.map((s) => (
          <Line
            key={s.id}
            name={s.label}
            dataKey={s.value}
            stroke={s.color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={false}
            activeDot={{ r: 4, stroke: 'var(--card)', strokeWidth: 2 }}
            isAnimationActive={false}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
