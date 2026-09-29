import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useConnectionStore } from '@/core/ws';
import { historyQuery } from '../api';
import { useLiveStats } from './useLiveStats';

/**
 * Prefills the live buffer with stored history, and refetches it after every reconnect
 * so the ticks missed while offline show up instead of a gap. Returns the query state
 * for loading and error UI.
 */
export function useHistoryPrefill() {
  const query = useQuery(historyQuery);
  const { data, refetch } = query;
  const connectCount = useConnectionStore((s) => s.connectCount);
  const firstConnect = useRef(connectCount);

  useEffect(() => {
    if (data) useLiveStats.getState().mergeHistory(data);
  }, [data]);

  useEffect(() => {
    // The initial fetch already covers the first connect; only reconnects leave a gap.
    if (connectCount > Math.max(firstConnect.current, 1)) void refetch();
  }, [connectCount, refetch]);

  return query;
}
