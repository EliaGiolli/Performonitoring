import type { Snapshot, SystemSample } from '@pc-monitor/shared';
import { useEffect } from 'react';
import { create } from 'zustand';
import { subscribe, useSocket, type EventSource } from '@/core/ws';
import { appendPoint, fromSample, fromSnapshot, mergePoints, type MetricPoint } from '../buffer';

interface LiveStatsState {
  /** Rolling buffer (last hour), oldest first. */
  points: MetricPoint[];
  /** Latest live snapshot: per-core load, drives and temperature have no history. */
  latest: Snapshot | null;
  pushSnapshot: (snapshot: Snapshot) => void;
  mergeHistory: (samples: SystemSample[]) => void;
}

/**
 * Live metrics store. The socket writes into it outside React (see `connectLiveStats`)
 * and each chart reads its own slice through a selector, so a tick only re-renders
 * what changed.
 */
export const useLiveStats = create<LiveStatsState>()((set) => ({
  points: [],
  latest: null,
  pushSnapshot: (snapshot) =>
    set((s) => ({ latest: snapshot, points: appendPoint(s.points, fromSnapshot(snapshot)) })),
  mergeHistory: (samples) => set((s) => ({ points: mergePoints(s.points, samples.map(fromSample)) })),
}));

/** Feeds validated `snapshot` events into the store. Returns the unsubscribe. */
export function connectLiveStats(socket: EventSource): () => void {
  return subscribe(socket, 'snapshot', (snapshot) => useLiveStats.getState().pushSnapshot(snapshot));
}

/** Keeps the store fed while mounted. Mount it once, above the charts. */
export function useLiveStatsFeed() {
  const socket = useSocket();
  useEffect(() => connectLiveStats(socket), [socket]);
}
