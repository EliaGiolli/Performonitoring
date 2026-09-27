import { useEffect, useState, type ReactNode } from 'react';
import { trackConnection } from './connectionStore';
import { createSocket } from './socket';
import { SocketContext } from './socketContext';

/** Opens the live channel while mounted and tracks its status in the connection store. */
export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket] = useState(createSocket);

  useEffect(() => {
    const untrack = trackConnection(socket);
    socket.connect();
    return () => {
      untrack();
      socket.disconnect();
    };
  }, [socket]);

  return <SocketContext value={socket}>{children}</SocketContext>;
}
