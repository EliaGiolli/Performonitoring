import { beforeEach, describe, expect, it } from 'vitest';
import { FakeSocket } from '@/core/test/fakeSocket';
import { trackConnection, useConnectionStore } from './connectionStore';

const status = () => useConnectionStore.getState().status;

beforeEach(() => useConnectionStore.setState({ status: 'connecting', connectCount: 0 }));

describe('trackConnection', () => {
  it('goes connected on connect and counts every (re)connect', () => {
    const socket = new FakeSocket();
    trackConnection(socket);

    socket.emit('connect');
    expect(status()).toBe('connected');
    socket.emit('disconnect');
    socket.emit('connect');
    expect(useConnectionStore.getState().connectCount).toBe(2);
  });

  it('shows reconnecting while Socket.IO keeps retrying', () => {
    const socket = new FakeSocket();
    trackConnection(socket);
    socket.emit('connect');

    socket.emit('disconnect');
    expect(status()).toBe('reconnecting');
    socket.emit('connect_error');
    expect(status()).toBe('reconnecting');
  });

  it('shows disconnected when the socket stopped retrying', () => {
    const socket = new FakeSocket();
    trackConnection(socket);
    socket.active = false;

    socket.emit('connect_error');

    expect(status()).toBe('disconnected');
  });

  it('removes its listeners on cleanup', () => {
    const socket = new FakeSocket();
    const cleanup = trackConnection(socket);

    cleanup();

    expect(['connect', 'disconnect', 'connect_error'].map((e) => socket.listenerCount(e))).toEqual([0, 0, 0]);
  });
});
