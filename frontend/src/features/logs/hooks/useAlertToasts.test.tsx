import type { Alert } from '@pc-monitor/shared';
import { act, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/core/test/providers';
import { useAlertToasts } from './useAlertToasts';

function AlertFeed() {
  useAlertToasts();
  return null;
}

const alert: Alert = {
  metric: 'cpu',
  value: 93.4,
  threshold: 90,
  message: 'CPU at 93.4% (threshold 90%) for 3 cycles',
  logId: 12,
  timestamp: '2026-09-29T10:00:00.000Z',
};

describe('useAlertToasts', () => {
  it('toasts each alert and refreshes the log', async () => {
    const { socket, client } = renderWithProviders(<AlertFeed />);
    const invalidate = vi.spyOn(client, 'invalidateQueries');

    act(() => socket.emit('alert', alert));

    expect(await screen.findByText('CPU above 90%')).toBeInTheDocument();
    expect(screen.getByText('CPU at 93.4% (threshold 90%) for 3 cycles')).toBeInTheDocument();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['logs'] });
  });

  it('ignores a malformed alert', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { socket, client } = renderWithProviders(<AlertFeed />);
    const invalidate = vi.spyOn(client, 'invalidateQueries');

    act(() => socket.emit('alert', { metric: 'gpu', value: 'high' }));

    expect(invalidate).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('stops listening when unmounted', () => {
    const { socket, unmount } = renderWithProviders(<AlertFeed />);
    expect(socket.listenerCount('alert')).toBe(1);
    unmount();
    expect(socket.listenerCount('alert')).toBe(0);
  });
});
