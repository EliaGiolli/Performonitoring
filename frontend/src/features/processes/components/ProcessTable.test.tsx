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

const killResult = { actionId: 'kill-process', success: true, message: 'Killed chrome.exe (PID 10)', durationMs: 420, logId: 7 };

const fetchMock = vi.fn((url: string, _init?: RequestInit) => {
  if (url.endsWith('/kill')) return Promise.resolve(new Response(JSON.stringify(killResult)));
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

  it('kills a process only after confirmation, then refreshes the list and the log', async () => {
    const { client } = renderWithProviders(<ProcessTable />);
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    await screen.findByText('3 of 180 running');
    const listCalls = () => fetchMock.mock.calls.filter(([url]) => url.startsWith('/api/processes?')).length;
    const before = listCalls();

    fireEvent.click(within(table()).getByRole('button', { name: 'Kill chrome.exe, PID 10' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Kill chrome.exe?' });
    expect(dialog).toHaveAccessibleDescription(/PID 10/);
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/kill'), expect.anything());

    fireEvent.click(within(dialog).getByRole('button', { name: 'Kill process' }));

    await vi.waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/processes/10/kill',
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ confirm: true }) }),
      ),
    );
    await vi.waitFor(() => expect(listCalls()).toBeGreaterThan(before));
    expect(await screen.findByText('Kill chrome.exe: done')).toBeInTheDocument();
    expect(screen.getByText('Killed chrome.exe (PID 10)')).toBeInTheDocument();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['logs'] });
  });

  it('toasts why a kill was refused', async () => {
    renderWithProviders(<ProcessTable />);
    await screen.findByText('3 of 180 running');
    fetchMock.mockImplementationOnce(() =>
      Promise.resolve(
        new Response(JSON.stringify({ status: 'error', message: 'Refusing to kill protected process 10' }), {
          status: 403,
        }),
      ),
    );

    fireEvent.click(within(table()).getByRole('button', { name: 'Kill chrome.exe, PID 10' }));
    fireEvent.click(screen.getByRole('button', { name: 'Kill process' }));

    expect(await screen.findByText('Kill chrome.exe: failed')).toBeInTheDocument();
    expect(screen.getByText('Refusing to kill protected process 10')).toBeInTheDocument();
  });

  it('sends nothing when the kill is cancelled', async () => {
    renderWithProviders(<ProcessTable />);
    await screen.findByText('3 of 180 running');

    fireEvent.click(within(table()).getByRole('button', { name: 'Kill Code.exe, PID 20' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/kill'), expect.anything());
  });

  it('offers a kill button on each card too', async () => {
    renderWithProviders(<ProcessTable />);
    await screen.findByText('3 of 180 running');

    const cards = screen.getByRole('list', { name: /^Processes/ });
    expect(within(cards).getAllByRole('button', { name: /^Kill / })).toHaveLength(3);
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
