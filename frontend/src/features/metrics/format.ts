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
