import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryClient } from '@/core/api';
import { FakeSocket } from '@/core/test/fakeSocket';
import { trackConnection, useConnectionStore } from '@/core/ws';
import { SocketContext } from '@/core/ws/socketContext';
import { at, makeSample, makeSnapshot } from '../test/fixtures';
import { useHistoryPrefill } from './useHistoryPrefill';
import { useLiveStats, useLiveStatsFeed } from './useLiveStats';

const fetchMock = vi.fn<typeof fetch>();
const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
const times = () => useLiveStats.getState().points.map((p) => p.t);

let socket: FakeSocket;

function setup() {
  const client = createQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <SocketContext value={socket}>{children}</SocketContext>
    </QueryClientProvider>
  );
  return renderHook(
    () => {
      useLiveStatsFeed();
      return useHistoryPrefill();
    },
    { wrapper },
  );
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  socket = new FakeSocket();
  useLiveStats.setState({ points: [], latest: null });
  useConnectionStore.setState({ status: 'connecting', connectCount: 0 });
});
afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('useHistoryPrefill', () => {
  it('asks for the last hour and prefills the buffer before live ticks', async () => {
    fetchMock.mockResolvedValue(json([makeSample(0), makeSample(2)]));
    const { result } = setup();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchMock.mock.calls[0]![0]).toBe('/api/metrics/history?minutes=60');

    act(() => socket.emit('snapshot', makeSnapshot(4)));
    expect(times()).toEqual([at(0), at(2), at(4)]);
  });

  it('refetches after a reconnect to fill the gap, but not on the first connect', async () => {
    const untrack = trackConnection(socket);
    fetchMock.mockResolvedValueOnce(json([makeSample(0)]));
    const { result } = setup();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    act(() => socket.emit('connect'));
    act(() => socket.emit('snapshot', makeSnapshot(2)));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Offline between 2s and 10s; the backend kept storing samples meanwhile.
    fetchMock.mockResolvedValueOnce(json([makeSample(0), makeSample(4), makeSample(6), makeSample(8)]));
    act(() => socket.emit('disconnect'));
    act(() => socket.emit('connect'));
    act(() => socket.emit('snapshot', makeSnapshot(10)));

    await waitFor(() => expect(times()).toEqual([at(0), at(2), at(4), at(6), at(8), at(10)]));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    untrack();
  });

  it('exposes a failed prefill without touching the buffer', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404, statusText: 'Not Found' }));
    const { result } = setup();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(times()).toEqual([]);
  });
});
