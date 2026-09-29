import type { Log, LogPage } from '@pc-monitor/shared';
import { fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axeViolations } from '@/core/test/axe';
import { renderWithProviders } from '@/core/test/providers';
import { LogsPanel } from './LogsPanel';

function makeLog(id: number, overrides: Partial<Log> = {}): Log {
  return {
    id,
    timestamp: new Date(Date.UTC(2026, 8, 29, 10, 0, id)).toISOString(),
    logLevel: 'info',
    logMessage: `Entry ${id}`,
    archived: false,
    source: 'manual',
    actionId: null,
    success: null,
    durationMs: null,
    ...overrides,
  };
}

const FIRST: LogPage = {
  items: [
    makeLog(3, {
      source: 'action',
      actionId: 'flush-dns',
      success: true,
      durationMs: 1125,
      logMessage: 'Flush DNS cache: DNS cache flushed',
    }),
    makeLog(2, { logLevel: 'warning', source: 'monitor', logMessage: 'CPU above 90% for 3 cycles' }),
  ],
  nextCursor: '1790445368167_2',
};
const SECOND: LogPage = { items: [makeLog(1, { logMessage: 'Oldest entry' })], nextCursor: null };

const denied = { status: 'error', message: 'Access denied: invalid or missing API key' };

const fetchMock = vi.fn((url: string, init?: RequestInit) => {
  // PATCH / DELETE play the admin guard: only the key "secret" gets through.
  if (init?.method === 'PATCH' || init?.method === 'DELETE') {
    const key = (init.headers as Record<string, string>)['x-api-key'];
    if (key !== 'secret') return Promise.resolve(new Response(JSON.stringify(denied), { status: 403 }));
    const body = init.method === 'DELETE' ? { message: 'Log deleted successfully' } : { ...makeLog(3), archived: true };
    return Promise.resolve(new Response(JSON.stringify(body)));
  }
  const page = url.includes('cursor=') ? SECOND : FIRST;
  return Promise.resolve(new Response(JSON.stringify(page)));
});

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  sessionStorage.clear();
});
afterEach(() => {
  fetchMock.mockClear();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const lastQuery = () => Object.fromEntries(new URL(fetchMock.mock.lastCall![0], 'http://x').searchParams);
const table = () => screen.getByRole('table', { name: /Log entries/ });
const changes = () => fetchMock.mock.calls.filter(([, init]) => init?.method === 'PATCH' || init?.method === 'DELETE');
const rowOf = (message: string) => within(table()).getByText(message).closest('tr')!;

describe('LogsPanel', () => {
  it('shows the newest active entries with level, source and run result', async () => {
    renderWithProviders(<LogsPanel />);

    expect(await screen.findByRole('table', { name: 'Log entries, page 1, newest first' })).toBeInTheDocument();
    expect(lastQuery()).toEqual({ archived: 'false', limit: '20' });
    const [, run, alert] = within(table()).getAllByRole('row');
    expect(run).toHaveTextContent('InfoAction (flush-dns)Flush DNS cache: DNS cache flushedOK · 1.1 s');
    expect(alert).toHaveTextContent('WarningMonitorCPU above 90% for 3 cycles—');
  });

  it('filters by level and source, back on page 1', async () => {
    renderWithProviders(<LogsPanel />);
    await screen.findByRole('table');
    fireEvent.click(screen.getByRole('button', { name: 'Older' }));
    await screen.findByText('Page 2');

    fireEvent.change(screen.getByRole('combobox', { name: 'Level' }), { target: { value: 'error' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Source' }), { target: { value: 'action' } });

    await vi.waitFor(() => expect(lastQuery()).toEqual({ level: 'error', source: 'action', archived: 'false', limit: '20' }));
    expect(await screen.findByText('Page 1')).toBeInTheDocument();
  });

  it('shows archived entries or everything on request', async () => {
    renderWithProviders(<LogsPanel />);
    await screen.findByRole('table');

    fireEvent.click(screen.getByRole('radio', { name: 'Archived' }));
    await vi.waitFor(() => expect(lastQuery()).toMatchObject({ archived: 'true' }));

    fireEvent.click(screen.getByRole('radio', { name: 'All' }));
    await vi.waitFor(() => expect(lastQuery()).not.toHaveProperty('archived'));
  });

  it('pages back and forth with the keyset cursor', async () => {
    renderWithProviders(<LogsPanel />);
    await screen.findByRole('table');
    expect(screen.getByRole('button', { name: 'Newer' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Older' }));

    expect(await screen.findByText('Oldest entry', { selector: 'td' })).toBeInTheDocument();
    expect(lastQuery()).toMatchObject({ cursor: '1790445368167_2' });
    expect(screen.getByRole('button', { name: 'Older' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Newer' }));
    expect(await screen.findByText('Page 1')).toBeInTheDocument();
    expect(screen.getByText('CPU above 90% for 3 cycles', { selector: 'td' })).toBeInTheDocument();
  });

  it('filters by a date range picked in the calendar', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 29, 12));
    renderWithProviders(<LogsPanel />);
    await screen.findByRole('table');

    fireEvent.click(screen.getByRole('button', { name: 'Dates Any date' }));
    const grid = screen.getByRole('grid');
    fireEvent.click(within(grid).getByText('20'));
    fireEvent.click(within(grid).getByText('22'));

    await vi.waitFor(() => expect(lastQuery()).toHaveProperty('to'));
    expect(new Date(lastQuery().from!)).toEqual(new Date(2026, 8, 20));
    expect(new Date(lastQuery().to!)).toEqual(new Date(2026, 8, 22, 23, 59, 59, 999));
    expect(within(grid).getByText('30').closest('button')).toBeDisabled(); // no future days
  });

  it('asks for the admin key when archiving is refused, then retries with it', async () => {
    renderWithProviders(<LogsPanel />);
    await screen.findByRole('table');

    const archive = within(rowOf('CPU above 90% for 3 cycles')).getByRole('button', { name: 'Archive' });
    expect(archive).toHaveAccessibleDescription('CPU above 90% for 3 cycles');
    fireEvent.click(archive);

    const dialog = await screen.findByRole('dialog', { name: 'Admin key needed' });
    expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument(); // none sent yet, nothing "wrong"
    expect(await axeViolations(document.body)).toEqual([]);
    fireEvent.change(within(dialog).getByLabelText('Admin key'), { target: { value: 'secret' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Log entry archived')).toBeInTheDocument();
    const [url, init] = changes().at(-1)!;
    expect(url).toBe('/api/logs/2');
    expect(init).toMatchObject({ method: 'PATCH', body: JSON.stringify({ archived: true }) });
    expect(init?.headers).toMatchObject({ 'x-api-key': 'secret' });
    expect(sessionStorage.getItem('pc-monitor-admin-key')).toBe('secret');
  });

  it('says the key was wrong when the stored one is refused, and forgets it', async () => {
    sessionStorage.setItem('pc-monitor-admin-key', 'stale');
    renderWithProviders(<LogsPanel />);
    await screen.findByRole('table');

    fireEvent.click(within(rowOf('CPU above 90% for 3 cycles')).getByRole('button', { name: 'Archive' }));

    const dialog = await screen.findByRole('dialog', { name: 'Admin key needed' });
    expect(within(dialog).getByRole('alert')).toHaveTextContent('That key was not accepted.');
    expect(sessionStorage.getItem('pc-monitor-admin-key')).toBeNull();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('deletes an entry only after confirmation, with the stored key', async () => {
    sessionStorage.setItem('pc-monitor-admin-key', 'secret');
    renderWithProviders(<LogsPanel />);
    await screen.findByRole('table');

    fireEvent.click(within(rowOf('CPU above 90% for 3 cycles')).getByRole('button', { name: 'Delete' }));
    const confirm = screen.getByRole('alertdialog', { name: 'Delete this log entry?' });
    expect(confirm).toHaveAccessibleDescription(/CPU above 90% for 3 cycles/);
    expect(changes()).toHaveLength(0);

    fireEvent.click(within(confirm).getByRole('button', { name: 'Delete entry' }));

    expect(await screen.findByText('Log entry deleted')).toBeInTheDocument();
    expect(changes().at(-1)).toEqual(['/api/logs/2', expect.objectContaining({ method: 'DELETE' })]);
  });

  it('sends nothing when the delete is cancelled', async () => {
    renderWithProviders(<LogsPanel />);
    await screen.findByRole('table');

    fireEvent.click(within(rowOf('Flush DNS cache: DNS cache flushed')).getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(changes()).toHaveLength(0);
  });

  it('offers Restore instead of Archive on an archived entry', async () => {
    fetchMock.mockImplementationOnce(() =>
      Promise.resolve(new Response(JSON.stringify({ items: [makeLog(9, { archived: true, logMessage: 'Old one' })], nextCursor: null }))),
    );
    sessionStorage.setItem('pc-monitor-admin-key', 'secret');
    renderWithProviders(<LogsPanel />);
    await screen.findByRole('table');

    fireEvent.click(within(rowOf('Old one')).getByRole('button', { name: 'Restore' }));

    expect(await screen.findByText('Log entry restored')).toBeInTheDocument();
    expect(changes().at(-1)![1]).toMatchObject({ method: 'PATCH', body: JSON.stringify({ archived: false }) });
  });

  it('says so when nothing matches', async () => {
    fetchMock.mockImplementationOnce(() => Promise.resolve(new Response(JSON.stringify({ items: [], nextCursor: null }))));
    renderWithProviders(<LogsPanel />);
    expect(await screen.findByText('No log entries match these filters.')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<LogsPanel />);
    await screen.findByRole('table');
    expect(await axeViolations(container)).toEqual([]);
  });
});
