import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CircleX, LoaderCircle, PauseCircle, Table2 } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { Toggle } from '@/core/components/ui/toggle';
import { cn } from '@/core/lib/utils';
import type { MetricPoint } from '../buffer';
import { formatClock, formatClockSeconds } from '../format';
import { useFeedStatus } from '../hooks/useFeedStatus';
import { summarize, type Series, type Threshold } from '../series';
import { ReadingsTable } from './ReadingsTable';

interface PlotProps {
  data: MetricPoint[];
  series: Series[];
  formatValue: (value: number) => string;
  /** Fixed domain for percentages; omit to fit the data (rates). */
  yDomain?: [number, number];
  /** Tick values for the data maximum, when the axis fits the data (see `rateTicks`). */
  yTicks?: ((max: number) => number[]) | undefined;
  threshold?: Threshold | undefined;
  height: number;
}

const SHORT_SPAN_MS = 10 * 60_000;
const AXIS_TICK = { fill: 'var(--chart-label)', fontSize: 12 };

/** Legend with line keys (mirrors the marks); only drawn for two or more series. */
function SeriesLegend({ series }: { series: Series[] }) {
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
} & Pick<PlotProps, 'series' | 'formatValue'>) {
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
function Plot({ data, series, formatValue, yDomain, yTicks, threshold, height }: PlotProps) {
  // Right after startup the window spans seconds, and minute ticks would all read the same.
  const span = (data.at(-1)?.t ?? 0) - (data[0]?.t ?? 0);
  const formatTick = span < SHORT_SPAN_MS ? formatClockSeconds : formatClock;
  const ticks = yTicks?.(Math.max(0, ...data.flatMap((p) => series.map((s) => s.value(p) ?? 0))));
  const domain = yDomain ?? (ticks ? [0, ticks.at(-1)!] : [0, 'auto']);

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
          domain={domain}
          {...(ticks ? { ticks } : {})}
          tickFormatter={formatValue}
          tick={AXIS_TICK}
          stroke="var(--chart-axis)"
          width={72}
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

// Placeholder with the chart's footprint, so the card doesn't jump when data arrives.
function Placeholder({ height, children }: { height: number; children: ReactNode }) {
  return (
    <div
      style={{ height }}
      className="flex items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground"
    >
      {children}
    </div>
  );
}

type TimeSeriesChartProps = Omit<PlotProps, 'height'> & {
  /** Names the chart in its summary and table, e.g. "CPU load". */
  title: string;
  height?: number;
};

/**
 * A metric over time with everything around the plot: legend, chart/table toggle, a
 * screen-reader summary (read on demand, never announced per tick) and the loading,
 * waiting and offline states. When the live channel drops, the last data stays on
 * screen, dimmed, under a "not live" note.
 */
export function TimeSeriesChart({ title, height = 200, ...plot }: TimeSeriesChartProps) {
  const { data, series, formatValue } = plot;
  const status = useFeedStatus(data.length > 0);
  const [showTable, setShowTable] = useState(false);
  const summaryId = useId();
  const hasData = status === 'live' || status === 'stale';

  return (
    <figure aria-label={title} aria-describedby={summaryId} className="grid gap-2">
      <p id={summaryId} className="sr-only">
        {summarize(title, data, series, formatValue)}
      </p>
      <div className="flex min-h-9 flex-wrap items-center justify-between gap-2">
        <SeriesLegend series={series} />
        {status === 'stale' && (
          <p className="flex items-center gap-1.5 text-xs font-medium">
            <PauseCircle aria-hidden="true" className="size-3.5 text-status-warning" />
            Not live: showing the last data received
          </p>
        )}
        {hasData && (
          <Toggle
            variant="outline"
            pressed={showTable}
            onPressedChange={setShowTable}
            className="ml-auto h-11 px-3 text-xs sm:h-9"
          >
            <Table2 aria-hidden="true" />
            Table view
          </Toggle>
        )}
      </div>
      {status === 'loading' && (
        <Placeholder height={height}>
          <LoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin" />
          Loading history…
        </Placeholder>
      )}
      {status === 'waiting' && <Placeholder height={height}>Waiting for the first reading…</Placeholder>}
      {status === 'offline' && (
        <Placeholder height={height}>
          <CircleX aria-hidden="true" className="size-4 text-status-critical" />
          Offline: no data to show
        </Placeholder>
      )}
      {hasData &&
        (showTable ? (
          <ReadingsTable title={title} points={data} series={series} formatValue={formatValue} />
        ) : (
          <div className={cn(status === 'stale' && 'opacity-60')}>
            <Plot {...plot} height={height} />
          </div>
        ))}
    </figure>
  );
}
