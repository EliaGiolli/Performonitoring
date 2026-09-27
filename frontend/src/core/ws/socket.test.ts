import type { Snapshot } from '@pc-monitor/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FakeSocket } from '@/core/test/fakeSocket';
import { createSocket, subscribe } from './socket';

const snapshot: Snapshot = {
  timestamp: '2026-09-27T10:00:00.000Z',
  cpu: { total: 42, perCore: [40, 44], tempC: null },
  ram: { used: 8, total: 16, usedPercent: 50 },
  disk: { drives: [], readBps: null, writeBps: null },
  network: { rxBps: 1, txBps: 2 },
};

afterEach(() => vi.restoreAllMocks());

describe('createSocket', () => {
  it('targets /ws over the websocket transport and waits for an explicit connect', () => {
    const socket = createSocket();
    expect(socket.io.opts.path).toBe('/ws');
    expect(socket.io.opts.transports).toEqual(['websocket']);
    expect(socket.connected).toBe(false);
    expect(socket.active).toBe(false);
  });
});

describe('subscribe', () => {
  it('passes valid payloads to the handler', () => {
    const socket = new FakeSocket();
    const handler = vi.fn();
    subscribe(socket, 'snapshot', handler);

    socket.emit('snapshot', snapshot);

    expect(handler).toHaveBeenCalledWith(snapshot);
  });

  it('drops payloads that fail the shared schema, with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const socket = new FakeSocket();
    const handler = vi.fn();
    subscribe(socket, 'snapshot', handler);

    socket.emit('snapshot', { ...snapshot, cpu: { ...snapshot.cpu, total: 250 } });
    socket.emit('snapshot', 'not an object');

    expect(handler).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('validates each event against its own schema', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const socket = new FakeSocket();
    const handler = vi.fn();
    subscribe(socket, 'alert', handler);

    socket.emit('alert', snapshot);

    expect(handler).not.toHaveBeenCalled();
  });

  it('stops listening after unsubscribe', () => {
    const socket = new FakeSocket();
    const unsubscribe = subscribe(socket, 'snapshot', vi.fn());
    expect(socket.listenerCount('snapshot')).toBe(1);

    unsubscribe();

    expect(socket.listenerCount('snapshot')).toBe(0);
  });
});
