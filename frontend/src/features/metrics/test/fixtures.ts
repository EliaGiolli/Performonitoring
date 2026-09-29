import type { Snapshot, SystemSample } from '@pc-monitor/shared';

const T0 = Date.parse('2026-09-29T10:00:00.000Z');
const GB = 1024 ** 3;

/** A valid live snapshot `secondsAfter` T0. */
export function makeSnapshot(secondsAfter = 0, overrides: Partial<Snapshot['cpu']> = {}): Snapshot {
  return {
    timestamp: new Date(T0 + secondsAfter * 1000).toISOString(),
    cpu: { total: 40, perCore: [30, 50], tempC: null, ...overrides },
    ram: { used: 8 * GB, total: 16 * GB, usedPercent: 50 },
    disk: {
      drives: [{ mount: 'C:', fsType: 'NTFS', size: 500 * GB, used: 250 * GB, usedPercent: 50 }],
      readBps: 1000,
      writeBps: 2000,
    },
    network: { rxBps: 300, txBps: 400 },
  };
}

/** A valid stored sample `secondsAfter` T0. */
export function makeSample(secondsAfter = 0, id = secondsAfter): SystemSample {
  return {
    id,
    createdAt: new Date(T0 + secondsAfter * 1000).toISOString(),
    cpuTotal: 20,
    cpuTemp: null,
    ramUsed: 4 * GB,
    ramTotal: 16 * GB,
    diskReadBps: null,
    diskWriteBps: null,
    netRxBps: 10,
    netTxBps: 20,
  };
}

export const at = (secondsAfter: number) => T0 + secondsAfter * 1000;
