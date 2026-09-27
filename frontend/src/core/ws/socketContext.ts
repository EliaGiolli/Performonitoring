import { createContext, useContext } from 'react';
import type { EventSource } from './socket';

// The socket instance never changes after mount, so Context is enough here: live
// payloads go to stores through `subscribe`, never through this context.
export const SocketContext = createContext<EventSource | null>(null);

/** The live-channel socket; read events from it with `subscribe`. */
export function useSocket(): EventSource {
  const socket = useContext(SocketContext);
  if (!socket) throw new Error('useSocket must be used inside <SocketProvider>');
  return socket;
}
