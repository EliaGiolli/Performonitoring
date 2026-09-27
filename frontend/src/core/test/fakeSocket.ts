type Listener = (payload?: unknown) => void;

/** Minimal stand-in for a Socket.IO client socket: tests emit events by hand. */
export class FakeSocket {
  active = true;
  private readonly listeners = new Map<string, Set<Listener>>();

  on(event: string, listener: Listener) {
    let set = this.listeners.get(event);
    if (!set) this.listeners.set(event, (set = new Set()));
    set.add(listener);
    return this;
  }

  off(event: string, listener: Listener) {
    this.listeners.get(event)?.delete(listener);
    return this;
  }

  emit(event: string, payload?: unknown) {
    for (const listener of this.listeners.get(event) ?? []) listener(payload);
  }

  listenerCount(event: string) {
    return this.listeners.get(event)?.size ?? 0;
  }
}
