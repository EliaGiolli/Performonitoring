import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useConnectionStore, type ConnectionStatus as Status } from '@/core/ws';
import { ConnectionStatus } from './ConnectionStatus';

beforeEach(() => useConnectionStore.setState({ status: 'connecting', connectCount: 0 }));

describe('ConnectionStatus', () => {
  it.each<[Status, string]>([
    ['connecting', 'Connecting…'],
    ['connected', 'Live'],
    ['reconnecting', 'Reconnecting…'],
    ['disconnected', 'Offline'],
  ])('shows a text label for %s, never color alone', (status, label) => {
    useConnectionStore.setState({ status });
    render(<ConnectionStatus />);

    expect(screen.getByRole('status')).toHaveTextContent(`Live data: ${label}`);
  });

  it('follows store updates', () => {
    render(<ConnectionStatus />);

    act(() => useConnectionStore.setState({ status: 'disconnected' }));

    expect(screen.getByRole('status')).toHaveTextContent('Offline');
  });
});
