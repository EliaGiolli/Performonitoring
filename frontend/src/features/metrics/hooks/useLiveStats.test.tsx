import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeSocket } from '@/core/test/fakeSocket';
import { SocketContext } from '@/core/ws/socketContext';
import { at, makeSample, makeSnapshot } from '../test/fixtures';
import { connectLiveStats, useLiveStats, useLiveStatsFeed } from './useLiveStats';

const state = () => useLiveStats.getState();

beforeEach(() => useLiveStats.setState({ points: [], latest: null }));
afterEach(() => vi.restoreAllMocks());

describe('useLiveStats store', () => {
  it('keeps the latest snapshot and appends it to the buffer', () => {
    state().pushSnapshot(makeSnapshot(0));
    state().pushSnapshot(makeSnapshot(2, { total: 90 }));

    expect(state().latest?.cpu.total).toBe(90);
    expect(state().points.map((p) => p.t)).toEqual([at(0), at(2)]);
  });

  it('merges history under the live points', () => {
    state().pushSnapshot(makeSnapshot(4));
    state().mergeHistory([makeSample(0), makeSample(2)]);

    expect(state().points.map((p) => p.t)).toEqual([at(0), at(2), at(4)]);
  });
});

describe('connectLiveStats', () => {
  it('feeds valid snapshot events and drops invalid ones', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const socket = new FakeSocket();
    connectLiveStats(socket);

    socket.emit('snapshot', makeSnapshot(0));
    socket.emit('snapshot', { junk: true });

    expect(state().points).toHaveLength(1);
  });

  it('stops feeding after unsubscribe', () => {
    const socket = new FakeSocket();
    connectLiveStats(socket)();

    socket.emit('snapshot', makeSnapshot(0));

    expect(state().points).toHaveLength(0);
  });
});

describe('useLiveStatsFeed', () => {
  it('subscribes while mounted', () => {
    const socket = new FakeSocket();
    const wrapper = ({ children }: { children: ReactNode }) => <SocketContext value={socket}>{children}</SocketContext>;
    const { unmount } = renderHook(() => useLiveStatsFeed(), { wrapper });

    expect(socket.listenerCount('snapshot')).toBe(1);
    unmount();
    expect(socket.listenerCount('snapshot')).toBe(0);
  });
});
