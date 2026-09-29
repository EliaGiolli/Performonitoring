import { useQuery } from '@tanstack/react-query';
import { useConnectionStore } from '@/core/ws';
import { historyQuery } from '../api';

/**
 * What a chart can show right now:
 * - `loading`: no data yet, the history prefill is still on its way
 * - `waiting`: connected, but neither history nor a first tick has arrived
 * - `offline`: no data and no live channel
 * - `stale`: data to show, but the live channel is down, so it is not moving
 * - `live`: data to show and new ticks arriving
 */
export type FeedStatus = 'loading' | 'waiting' | 'offline' | 'stale' | 'live';

export function useFeedStatus(hasData: boolean): FeedStatus {
  const connection = useConnectionStore((s) => s.status);
  // Shares the prefill's cache entry: this only reads its state, it never refetches.
  const historyPending = useQuery(historyQuery).isPending;
  const connected = connection === 'connected';

  if (hasData) return connected ? 'live' : 'stale';
  if (historyPending) return 'loading';
  return connected ? 'waiting' : 'offline';
}
