import { describe, expect, it } from 'vitest';
import { DEFAULT_FILTERS, toSearchParams } from './filters';

const params = (...args: Parameters<typeof toSearchParams>) => Object.fromEntries(new URLSearchParams(toSearchParams(...args)));

describe('toSearchParams', () => {
  it('asks for active logs, one page, by default', () => {
    expect(params(DEFAULT_FILTERS, undefined)).toEqual({ archived: 'false', limit: '20' });
  });

  it('sends level, source, archived and the page cursor', () => {
    expect(params({ level: 'error', source: 'action', archived: 'archived' }, '1790445368167_5')).toEqual({
      level: 'error',
      source: 'action',
      archived: 'true',
      limit: '20',
      cursor: '1790445368167_5',
    });
  });

  it('leaves archived out when showing everything', () => {
    expect(params({ archived: 'all' }, undefined)).not.toHaveProperty('archived');
  });

  it('turns a day range into inclusive local start and end instants', () => {
    const p = params({ archived: 'all', from: new Date(2026, 8, 20, 15), to: new Date(2026, 8, 22, 9) }, undefined);
    expect(new Date(p.from!)).toEqual(new Date(2026, 8, 20, 0, 0, 0, 0));
    expect(new Date(p.to!)).toEqual(new Date(2026, 8, 22, 23, 59, 59, 999));
  });

  it('treats a range with only a start as that single day', () => {
    const p = params({ archived: 'all', from: new Date(2026, 8, 20, 15) }, undefined);
    expect(new Date(p.to!)).toEqual(new Date(2026, 8, 20, 23, 59, 59, 999));
  });
});
