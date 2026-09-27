import { render, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeSocket } from '@/core/test/fakeSocket';
import { useConnectionStore } from './connectionStore';
import { SocketProvider } from './SocketProvider';
import { useSocket } from './socketContext';

class FakeConnectableSocket extends FakeSocket {
  connect = vi.fn(() => this.emit('connect'));
  disconnect = vi.fn();
}

let fake: FakeConnectableSocket;
vi.mock('./socket', () => ({ createSocket: () => fake }));

beforeEach(() => {
  fake = new FakeConnectableSocket();
  useConnectionStore.setState({ status: 'connecting', connectCount: 0 });
});
afterEach(() => vi.restoreAllMocks());

describe('SocketProvider', () => {
  it('connects on mount, tracks the status and disconnects on unmount', () => {
    const { unmount } = render(<SocketProvider>child</SocketProvider>);

    expect(fake.connect).toHaveBeenCalled();
    expect(useConnectionStore.getState().status).toBe('connected');

    unmount();

    expect(fake.disconnect).toHaveBeenCalled();
    expect(fake.listenerCount('connect')).toBe(0);
  });

  it('exposes the socket to children', () => {
    const { result } = renderHook(() => useSocket(), { wrapper: SocketProvider });
    expect(result.current).toBe(fake);
  });

  it('refuses useSocket outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useSocket())).toThrow('inside <SocketProvider>');
  });
});
