import { describe, expect, it } from 'vitest';
import { appendPoint, fromSample, fromSnapshot, mergePoints, WINDOW_MS } from './buffer';
import { at, makeSample, makeSnapshot } from './test/fixtures';

const live = (s: number) => fromSnapshot(makeSnapshot(s));
const stored = (s: number) => fromSample(makeSample(s));

describe('fromSnapshot / fromSample', () => {
  it('maps both onto the same point shape', () => {
    expect(live(0)).toMatchObject({ t: at(0), cpu: 40, perCore: [30, 50], ramPercent: 50, netRxBps: 300 });
    expect(stored(0)).toMatchObject({ t: at(0), cpu: 20, perCore: null, ramPercent: 25, diskReadBps: null });
  });
});

describe('appendPoint', () => {
  it('appends in time order', () => {
    expect(appendPoint([live(0)], live(2)).map((p) => p.t)).toEqual([at(0), at(2)]);
  });

  it('drops points that fell out of the one-hour window', () => {
    const points = appendPoint([live(0), live(2)], live(WINDOW_MS / 1000 + 1));
    expect(points.map((p) => p.t)).toEqual([at(2), at(WINDOW_MS / 1000 + 1)]);
  });

  it('merges an out-of-order point instead of appending it', () => {
    expect(appendPoint([live(0), live(4)], live(2)).map((p) => p.t)).toEqual([at(0), at(2), at(4)]);
  });
});

describe('mergePoints', () => {
  it('fills a gap in the middle, in time order', () => {
    const merged = mergePoints([live(0), live(10)], [stored(4), stored(6)]);
    expect(merged.map((p) => p.t)).toEqual([at(0), at(4), at(6), at(10)]);
  });

  it('keeps one point per cycle and prefers the live one', () => {
    const merged = mergePoints([live(2)], [stored(0), stored(2.3)]);
    expect(merged).toHaveLength(2);
    expect(merged[1]).toMatchObject({ t: at(2), perCore: [30, 50] });
  });

  it('is idempotent for the same history', () => {
    const once = mergePoints([], [stored(0), stored(2)]);
    expect(mergePoints(once, [stored(0), stored(2)])).toEqual(once);
  });
});
