import type { ProcessInfo } from '@pc-monitor/shared';
import { fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axeViolations } from '@/core/test/axe';
import { renderWithProviders } from '@/core/test/providers';
import { ProcessTable } from './ProcessTable';

const MB = 1024 ** 2;
const proc = (pid: number, name: string, cpuPercent: number, memBytes: number): ProcessInfo => ({
  pid,
  name,
  cpuPercent,
  memBytes,
  memPercent: 1,
});

// Ranked like the backend would: by CPU, or by RAM when asked.
const byCpu = [proc(10, 'chrome.exe', 12.3, 300 * MB), proc(20, 'Code.exe', 4, 900 * MB), proc(30, 'agent.exe', 0.4, 50 * MB)];
const byMem = [...byCpu].sort((a, b) => b.memBytes - a.memBytes);

const fetchMock = vi.fn((url: string) => {
  const processes = url.includes('sortBy=mem') ? byMem : byCpu;
  return Promise.resolve(new Response(JSON.stringify({ total: 180, processes })));
});

beforeEach(() => vi.stubGlobal('fetch', fetchMock));
afterEach(() => {
  fetchMock.mockClear();
  vi.unstubAllGlobals();
});

const table = () => screen.getByRole('table', { name: /Top processes/ });
const rowNames = () => within(table()).getAllByRole('rowheader').map((c) => c.textContent);
const header = (name: string) => within(table()).getByRole('columnheader', { name: new RegExp(`^${name}`) });

describe('ProcessTable', () => {
  it('lists the top processes by CPU first, with one-decimal CPU and binary RAM', async () => {
    renderWithProviders(<ProcessTable />);

    expect(await screen.findByText('3 of 180 running')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/processes?sortBy=cpu&limit=15', expect.anything());
    expect(rowNames()).toEqual(['chrome.exe', 'Code.exe', 'agent.exe']);
    const first = within(table()).getAllByRole('row')[1]!;
    expect(first).toHaveTextContent('chrome.exe1012.3%300 MB');
    expect(header('CPU')).toHaveAttribute('aria-sort', 'descending');
  });

  it('sorts by name when its header is clicked, and flips on a second click', async () => {
    renderWithProviders(<ProcessTable />);
    await screen.findByText('3 of 180 running');

    fireEvent.click(within(header('Name')).getByRole('button'));
    expect(rowNames()).toEqual(['agent.exe', 'chrome.exe', 'Code.exe']);
    expect(header('Name')).toHaveAttribute('aria-sort', 'ascending');
    expect(header('CPU')).not.toHaveAttribute('aria-sort');
    expect(table()).toHaveAccessibleName('Top processes, sorted by Name, ascending');

    fireEvent.click(within(header('Name')).getByRole('button'));
    expect(rowNames()).toEqual(['Code.exe', 'chrome.exe', 'agent.exe']);
    expect(header('Name')).toHaveAttribute('aria-sort', 'descending');
  });

  it('asks the backend for the top processes by RAM when sorting by RAM', async () => {
    renderWithProviders(<ProcessTable />);
    await screen.findByText('3 of 180 running');

    fireEvent.click(within(header('RAM')).getByRole('button'));

    expect(header('RAM')).toHaveAttribute('aria-sort', 'descending');
    expect(fetchMock).toHaveBeenCalledWith('/api/processes?sortBy=mem&limit=15', expect.anything());
    await vi.waitFor(() => expect(rowNames()).toEqual(['Code.exe', 'chrome.exe', 'agent.exe']));
  });

  it('offers a sort control and cards for small screens', async () => {
    renderWithProviders(<ProcessTable />);
    await screen.findByText('3 of 180 running');

    fireEvent.click(screen.getByRole('radio', { name: 'Name' }));

    const cards = within(screen.getByRole('list', { name: 'Processes, sorted by Name, ascending' })).getAllByRole(
      'listitem',
    );
    expect(cards.map((c) => c.textContent?.split(' PID')[0])).toEqual(['agent.exe', 'chrome.exe', 'Code.exe']);
    expect(cards[0]).toHaveTextContent('PID 30');
  });

  it('says so when the processes cannot be loaded', async () => {
    const failure = JSON.stringify({ status: 'error', message: 'Unable to list processes' });
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(failure, { status: 500 }))));
    renderWithProviders(<ProcessTable />);

    // A 5xx is retried twice (about 3s of backoff) before the error shows.
    expect(await screen.findByRole('alert', {}, { timeout: 6000 })).toHaveTextContent(
      "Couldn't load processes: Unable to list processes",
    );
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<ProcessTable />);
    await screen.findByText('3 of 180 running');
    expect(await axeViolations(container)).toEqual([]);
  });
});
