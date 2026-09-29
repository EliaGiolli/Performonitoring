import { act, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axeViolations } from '@/core/test/axe';
import { renderWithProviders } from '@/core/test/providers';
import { useLiveStats } from '../hooks/useLiveStats';
import { makeSnapshot } from '../test/fixtures';
import { DiskChart } from './DiskChart';

const GB = 1024 ** 3;

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify({ DISK_THRESHOLD: 90 })))));
  useLiveStats.setState({ points: [], latest: null });
});
afterEach(() => vi.unstubAllGlobals());

const stat = (label: string) => screen.getByText(label, { selector: 'dt' }).nextSibling;

function pushWithDrives() {
  const snapshot = makeSnapshot(0);
  snapshot.disk = {
    readBps: 1536,
    writeBps: null,
    drives: [
      { mount: 'C:', fsType: 'NTFS', size: 500 * GB, used: 250 * GB, usedPercent: 50 },
      { mount: 'D:', fsType: 'NTFS', size: 100 * GB, used: 95 * GB, usedPercent: 95 },
    ],
  };
  act(() => useLiveStats.getState().pushSnapshot(snapshot));
}

describe('DiskChart', () => {
  it('shows the current rates, with N/A when one is not measurable', async () => {
    renderWithProviders(<DiskChart />);
    pushWithDrives();

    expect(stat('Read')).toHaveTextContent('1.5 KB/s');
    expect(stat('Write')).toHaveTextContent('N/A');
    // Two series, so the chart carries a legend.
    expect(await screen.findByRole('list', { name: 'Legend' })).toHaveTextContent('ReadWrite');
  });

  it('lists every drive and flags the ones above the alert threshold in words', async () => {
    renderWithProviders(<DiskChart />);
    pushWithDrives();

    const [c, d] = within(screen.getByRole('list', { name: 'Space used' })).getAllByRole('listitem');
    expect(c).toHaveTextContent('C: NTFS50% · 250 GB of 500 GB');
    expect(c).not.toHaveTextContent('Above alert');
    expect(await within(d!).findByText('Above alert')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<DiskChart />);
    pushWithDrives();
    expect(await axeViolations(container)).toEqual([]);
  });
});
