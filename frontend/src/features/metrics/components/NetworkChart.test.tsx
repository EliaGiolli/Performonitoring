import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axeViolations } from '@/core/test/axe';
import { renderWithProviders } from '@/core/test/providers';
import { useLiveStats } from '../hooks/useLiveStats';
import { makeSnapshot } from '../test/fixtures';
import { NetworkChart } from './NetworkChart';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{}'))));
  useLiveStats.setState({ points: [], latest: null });
});
afterEach(() => vi.unstubAllGlobals());

const stat = (label: string) => screen.getByText(label, { selector: 'dt' }).nextSibling;

describe('NetworkChart', () => {
  it('shows the current received and sent rates', () => {
    renderWithProviders(<NetworkChart />);
    const snapshot = makeSnapshot(0);
    snapshot.network = { rxBps: 2 * 1024 * 1024, txBps: null };
    act(() => useLiveStats.getState().pushSnapshot(snapshot));

    expect(stat('Received')).toHaveTextContent('2.0 MB/s');
    expect(stat('Sent')).toHaveTextContent('N/A');
    expect(screen.getByRole('list', { name: 'Legend' })).toHaveTextContent('ReceivedSent');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<NetworkChart />);
    act(() => useLiveStats.getState().pushSnapshot(makeSnapshot(0)));
    expect(await axeViolations(container)).toEqual([]);
  });
});
