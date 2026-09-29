import type { MetricPoint } from '../buffer';
import { formatClockSeconds } from '../format';
import type { Series } from '../series';

// Short enough to show in full: no scroll container to reach by keyboard.
const ROWS = 10;

/** Table twin of a chart: the latest readings, newest first, every value as text. */
export function ReadingsTable({
  title,
  points,
  series,
  formatValue,
}: {
  title: string;
  points: MetricPoint[];
  series: Series[];
  formatValue: (value: number) => string;
}) {
  const rows = points.slice(-ROWS).reverse();
  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <caption className="sr-only">
          {title}: latest {rows.length} readings, newest first
        </caption>
        <thead className="text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium">
              Time
            </th>
            {series.map((s) => (
              <th key={s.id} scope="col" className="px-3 py-2 text-right font-medium">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map((p) => (
            <tr key={p.t} className="border-t">
              <th scope="row" className="px-3 py-1.5 text-left font-normal text-muted-foreground">
                {formatClockSeconds(p.t)}
              </th>
              {series.map((s) => {
                const value = s.value(p);
                return (
                  <td key={s.id} className="px-3 py-1.5 text-right">
                    {value === null ? 'N/A' : formatValue(value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
