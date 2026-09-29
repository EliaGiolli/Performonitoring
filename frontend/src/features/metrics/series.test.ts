import { describe, expect, it } from 'vitest';
import { fromSnapshot, type MetricPoint } from './buffer';
import { alertLine, summarize, type Series } from './series';
import { makeSnapshot } from './test/fixtures';

const pct = (v: number) => `${Math.round(v)}%`;
const cpu: Series = { id: 'cpu', label: 'Total', color: 'var(--chart-1)', value: (p) => p.cpu };
const sent: Series = { id: 'net', label: 'Sent', color: 'var(--chart-2)', value: (p) => p.netTxBps };

function point(seconds: number, total: number): MetricPoint {
  return fromSnapshot(makeSnapshot(seconds, { total }));
}

describe('summarize', () => {
  it('gives the latest, average and peak value over the window', () => {
    const points = [point(0, 20), point(120, 80), point(180, 50)];
    expect(summarize('CPU load', points, [cpu], pct)).toBe(
      'CPU load, last 3 minutes. Total: now 50%, average 50%, peak 80%.',
    );
  });

  it('skips missing values and says when a series was never measurable', () => {
    const points = [point(0, 10)].map((p) => ({ ...p, netTxBps: null }));
    expect(summarize('Network', points, [cpu, sent], pct)).toBe(
      'Network, last 1 minute. Total: now 10%, average 10%, peak 10%. Sent: not measurable.',
    );
  });

  it('says there is no data yet', () => {
    expect(summarize('CPU load', [], [cpu], pct)).toBe('CPU load: no data yet.');
  });
});

describe('alertLine', () => {
  it('labels the threshold, or draws nothing when it is unknown', () => {
    expect(alertLine(90)).toEqual({ value: 90, label: 'Alert 90%' });
    expect(alertLine(undefined)).toBeUndefined();
  });
});
