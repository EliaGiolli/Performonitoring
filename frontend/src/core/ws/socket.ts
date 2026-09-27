import { serverEventSchemas, type ServerToClientEvents } from '@pc-monitor/shared';
import { io, type Socket } from 'socket.io-client';

export type ServerEvent = keyof ServerToClientEvents;
export type ServerPayload<E extends ServerEvent> = Parameters<ServerToClientEvents[E]>[0];

/** The slice of a Socket.IO socket that subscriptions need (a fake one satisfies it in tests). */
export interface EventSource {
  on(event: string, listener: (payload: unknown) => void): unknown;
  off(event: string, listener: (payload: unknown) => void): unknown;
}

/**
 * Creates the live-channel socket (not yet connected). It is deliberately untyped:
 * payloads are untrusted until `subscribe` has validated them, so that is the only
 * typed way to read an event.
 */
export function createSocket(): Socket {
  // Same origin as the page: in dev, Vite proxies /ws to the backend.
  return io({ path: '/ws', transports: ['websocket'], autoConnect: false });
}

/**
 * Listens to a server event, validating each payload with the shared schema. Invalid
 * payloads are dropped with a warning instead of reaching the UI. Returns the unsubscribe.
 */
export function subscribe<E extends ServerEvent>(
  source: EventSource,
  event: E,
  handler: (payload: ServerPayload<E>) => void,
): () => void {
  const schema = serverEventSchemas[event];
  const listener = (raw: unknown) => {
    const result = schema.safeParse(raw);
    if (!result.success) {
      console.warn(`Dropped invalid "${event}" event`, result.error.issues);
      return;
    }
    handler(result.data as ServerPayload<E>);
  };
  source.on(event, listener);
  return () => source.off(event, listener);
}
