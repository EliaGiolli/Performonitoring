const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

/** 1536 -> "1.5 KB" (binary steps, like Task Manager). */
export function formatBytes(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  const digits = unit === 0 || value >= 100 ? 0 : 1;
  return `${value.toFixed(digits)} ${UNITS[unit]}`;
}

export function formatRate(bps: number | null): string {
  return bps === null ? 'N/A' : `${formatBytes(bps)}/s`;
}

export function formatPercent(value: number | null): string {
  return value === null ? 'N/A' : `${Math.round(value)}%`;
}

export function formatTemperature(celsius: number | null): string {
  return celsius === null ? 'N/A' : `${Math.round(celsius)} °C`;
}

const clock = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
const clockWithSeconds = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export const formatClock = (t: number) => clock.format(t);
export const formatClockSeconds = (t: number) => clockWithSeconds.format(t);

/**
 * Evenly spaced axis ticks for a byte rate, round in the unit they are displayed in
 * (0 / 20 / 40 / 60 MB/s rather than 0 / 14.3 / 28.6 MB/s). About four steps.
 */
export function rateTicks(max: number): number[] {
  if (!(max > 0)) return [0, 1024];
  let unit = 1;
  while (max / unit >= 1024 && unit < 1024 ** (UNITS.length - 1)) unit *= 1024;
  const raw = max / unit / 4;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = Math.max(1, ([1, 2, 5, 10].find((m) => m * magnitude >= raw) ?? 10) * magnitude * unit);
  const ticks = [0];
  while (ticks.at(-1)! < max) ticks.push(ticks.length * step);
  return ticks;
}
