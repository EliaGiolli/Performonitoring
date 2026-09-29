import { describe, expect, it } from 'vitest';
import { formatBytes, formatPercent, formatRate, formatTemperature, rateTicks } from './format';

const MB = 1024 ** 2;

describe('formatters', () => {
  it('formats bytes in binary units', () => {
    expect([0, 1536, 150 * MB, 16 * 1024 ** 3].map(formatBytes)).toEqual(['0 B', '1.5 KB', '150 MB', '16.0 GB']);
  });

  it('says N/A for values that could not be measured', () => {
    expect([formatRate(null), formatPercent(null), formatTemperature(null)]).toEqual(['N/A', 'N/A', 'N/A']);
    expect([formatRate(2048), formatPercent(42.6), formatTemperature(61.4)]).toEqual(['2.0 KB/s', '43%', '61 °C']);
  });
});

describe('rateTicks', () => {
  it('steps evenly in the displayed unit and covers the maximum', () => {
    expect(rateTicks(57.2 * MB).map((t) => t / MB)).toEqual([0, 20, 40, 60]);
    expect(rateTicks(781 * 1024).map(formatRate)).toEqual(['0 B/s', '200 KB/s', '400 KB/s', '600 KB/s', '800 KB/s']);
  });

  it('has a sane scale for an idle or empty series', () => {
    expect(rateTicks(0)).toEqual([0, 1024]);
    expect(rateTicks(3)).toEqual([0, 1, 2, 3]);
  });
});
