import type { Snapshot, SystemSample } from '@pc-monitor/shared';

/** How much history the charts keep: older points fall off the left edge. */
export const WINDOW_MS = 60 * 60_000;

/**
 * One point on the time axis, shared by every chart. History samples and live
 * snapshots both map onto it; only live points carry per-core values.
 */
export interface MetricPoint {
  /** Epoch milliseconds. */
  t: number;
  cpu: number;
  /** Null when not live or not measurable (usual on Windows). */
  perCore: number[] | null;
  ramUsed: number;
  ramTotal: number;
  ramPercent: number;
  diskReadBps: number | null;
  diskWriteBps: number | null;
  netRxBps: number | null;
  netTxBps: number | null;
}

export function fromSnapshot(s: Snapshot): MetricPoint {
  return {
    t: Date.parse(s.timestamp),
    cpu: s.cpu.total,
    perCore: s.cpu.perCore,
    ramUsed: s.ram.used,
    ramTotal: s.ram.total,
    ramPercent: s.ram.usedPercent,
    diskReadBps: s.disk.readBps,
    diskWriteBps: s.disk.writeBps,
    netRxBps: s.network.rxBps,
    netTxBps: s.network.txBps,
  };
}

export function fromSample(s: SystemSample): MetricPoint {
  return {
    t: Date.parse(s.createdAt),
    cpu: s.cpuTotal,
    perCore: null,
    ramUsed: s.ramUsed,
    ramTotal: s.ramTotal,
    ramPercent: s.ramTotal > 0 ? (s.ramUsed / s.ramTotal) * 100 : 0,
    diskReadBps: s.diskReadBps,
    diskWriteBps: s.diskWriteBps,
    netRxBps: s.netRxBps,
    netTxBps: s.netTxBps,
  };
}

/** Drops points older than the window, measured from the newest point. */
function trim(points: MetricPoint[]): MetricPoint[] {
  const newest = points.at(-1);
  if (!newest) return points;
  const cutoff = newest.t - WINDOW_MS;
  const first = points.findIndex((p) => p.t >= cutoff);
  return first <= 0 ? points : points.slice(first);
}

/** Appends a live point. Ticks arrive in order, so this is the cheap path (every 2s). */
export function appendPoint(points: MetricPoint[], point: MetricPoint): MetricPoint[] {
  const last = points.at(-1);
  if (last && point.t <= last.t) return mergePoints(points, [point]);
  return trim([...points, point]);
}

/**
 * Merges two point lists in time order, keeping one point per ticker cycle. The backend
 * stores each sample under its snapshot's timestamp, so the same cycle seen live and
 * from history has the exact same `t` (cycles can be under a second apart, so nothing
 * looser is safe). The live point wins: it has per-core values. Used for the history
 * prefill and for the gap refetch after a reconnect.
 */
export function mergePoints(a: MetricPoint[], b: MetricPoint[]): MetricPoint[] {
  const all = [...a, ...b].sort((x, y) => x.t - y.t);
  const merged: MetricPoint[] = [];
  for (const point of all) {
    const last = merged.at(-1);
    if (last && point.t === last.t) {
      if (!last.perCore && point.perCore) merged[merged.length - 1] = point;
      continue;
    }
    merged.push(point);
  }
  return trim(merged);
}
