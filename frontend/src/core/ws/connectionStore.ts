import { create } from 'zustand';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

interface ConnectionState {
  status: ConnectionStatus;
  /** Increments on every successful (re)connect, so features can refetch what they missed. */
  connectCount: number;
}

export const useConnectionStore = create<ConnectionState>()(() => ({ status: 'connecting', connectCount: 0 }));

/** The slice of a Socket.IO socket the status tracker reads. */
export interface StatusSource {
  /** True while Socket.IO will keep trying to reconnect on its own. */
  readonly active: boolean;
  on(event: string, listener: () => void): unknown;
  off(event: string, listener: () => void): unknown;
}

/** Mirrors the socket lifecycle into the connection store. Returns the cleanup. */
export function trackConnection(socket: StatusSource): () => void {
  const set = useConnectionStore.setState;
  const onConnect = () => set((s) => ({ status: 'connected', connectCount: s.connectCount + 1 }));
  // After a drop, Socket.IO retries by itself unless the server or the client closed the
  // socket on purpose; `active` tells which of the two it is.
  const onLost = () => set({ status: socket.active ? 'reconnecting' : 'disconnected' });

  socket.on('connect', onConnect);
  socket.on('disconnect', onLost);
  socket.on('connect_error', onLost);
  return () => {
    socket.off('connect', onConnect);
    socket.off('disconnect', onLost);
    socket.off('connect_error', onLost);
  };
}
