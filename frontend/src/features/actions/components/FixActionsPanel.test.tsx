import type { ActionDefinition } from '@pc-monitor/shared';
import { fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axeViolations } from '@/core/test/axe';
import { renderWithProviders } from '@/core/test/providers';
import { FixActionsPanel } from './FixActionsPanel';

const ACTIONS: ActionDefinition[] = [
  {
    id: 'flush-dns',
    label: 'Flush DNS cache',
    description: 'Clears the DNS resolver cache.',
    risk: 'low',
    requiresConfirm: false,
    target: 'system',
  },
  {
    id: 'empty-recyclebin',
    label: 'Empty Recycle Bin',
    description: 'Permanently deletes everything in the Recycle Bin. Cannot be undone.',
    risk: 'high',
    requiresConfirm: true,
    target: 'system',
  },
  {
    id: 'kill-process',
    label: 'Kill process',
    description: 'Force-stops a process by PID.',
    risk: 'high',
    requiresConfirm: true,
    target: 'process',
  },
];

const result = (actionId: string) => ({ actionId, success: true, message: 'Done', durationMs: 120, logId: 1 });

const fetchMock = vi.fn((url: string, _init?: RequestInit) => {
  const run = /^\/api\/actions\/([a-z-]+)\/run$/.exec(url);
  const body = run ? result(run[1]!) : ACTIONS;
  return Promise.resolve(new Response(JSON.stringify(body)));
});

beforeEach(() => vi.stubGlobal('fetch', fetchMock));
afterEach(() => {
  fetchMock.mockClear();
  vi.unstubAllGlobals();
});

const runCalls = () => fetchMock.mock.calls.filter(([url]) => url.endsWith('/run'));
const item = (label: string) => screen.getByRole('heading', { name: label }).closest('li')!;

describe('FixActionsPanel', () => {
  it('lists the system actions with their risk, leaving process actions to the process table', async () => {
    renderWithProviders(<FixActionsPanel />);

    expect(await screen.findByRole('heading', { name: 'Flush DNS cache' })).toBeInTheDocument();
    expect(within(item('Flush DNS cache')).getByText('Low risk')).toBeInTheDocument();
    expect(within(item('Empty Recycle Bin')).getByText('High risk')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Kill process' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run Flush DNS cache' })).toHaveAccessibleDescription(
      'Clears the DNS resolver cache.',
    );
  });

  // Tests that start a run wait for its toast, so a late toast never lands in the next test.
  it('runs an action without confirmation right away, without a confirm flag, and toasts the summary', async () => {
    renderWithProviders(<FixActionsPanel />);
    fireEvent.click(await screen.findByRole('button', { name: 'Run Flush DNS cache' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    await vi.waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/actions/flush-dns/run',
        expect.objectContaining({ method: 'POST', body: '{}' }),
      ),
    );
    expect(await screen.findByText('Flush DNS cache: done')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('asks before an action that requires confirmation, and sends confirm: true only once confirmed', async () => {
    renderWithProviders(<FixActionsPanel />);
    fireEvent.click(await screen.findByRole('button', { name: 'Run Empty Recycle Bin' }));

    const dialog = screen.getByRole('alertdialog', { name: 'Empty Recycle Bin?' });
    expect(dialog).toHaveAccessibleDescription(/Cannot be undone/);
    expect(runCalls()).toHaveLength(0);

    fireEvent.click(within(dialog).getByRole('button', { name: 'Empty Recycle Bin' }));

    await vi.waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/actions/empty-recyclebin/run',
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ confirm: true }) }),
      ),
    );
    expect(await screen.findByText('Empty Recycle Bin: done')).toBeInTheDocument();
  });

  it('runs nothing when the confirmation is cancelled', async () => {
    renderWithProviders(<FixActionsPanel />);
    fireEvent.click(await screen.findByRole('button', { name: 'Run Empty Recycle Bin' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(runCalls()).toHaveLength(0);
  });

  it('disables the button while its action runs', async () => {
    let finish!: (res: Response) => void;
    fetchMock.mockImplementationOnce(() => Promise.resolve(new Response(JSON.stringify(ACTIONS))));
    fetchMock.mockImplementationOnce(() => new Promise<Response>((resolve) => (finish = resolve)));
    renderWithProviders(<FixActionsPanel />);

    const button = await screen.findByRole('button', { name: 'Run Flush DNS cache' });
    fireEvent.click(button);

    await vi.waitFor(() => expect(button).toBeDisabled());
    expect(button).toHaveTextContent('Running…');
    expect(screen.getByRole('button', { name: 'Run Empty Recycle Bin' })).toBeEnabled();

    finish(new Response(JSON.stringify(result('flush-dns'))));
    await vi.waitFor(() => expect(button).toBeEnabled());
    expect(await screen.findByText('Flush DNS cache: done')).toBeInTheDocument();
  });

  it('toasts a failure when the script ran but failed', async () => {
    fetchMock.mockImplementationOnce(() => Promise.resolve(new Response(JSON.stringify(ACTIONS))));
    fetchMock.mockImplementationOnce(() =>
      Promise.resolve(
        new Response(JSON.stringify({ ...result('flush-dns'), success: false, message: 'Access is denied' })),
      ),
    );
    renderWithProviders(<FixActionsPanel />);
    fireEvent.click(await screen.findByRole('button', { name: 'Run Flush DNS cache' }));

    expect(await screen.findByText('Flush DNS cache: failed')).toBeInTheDocument();
    expect(screen.getByText('Access is denied')).toBeInTheDocument();
  });

  it('toasts the reason when the backend refuses the run', async () => {
    fetchMock.mockImplementationOnce(() => Promise.resolve(new Response(JSON.stringify(ACTIONS))));
    fetchMock.mockImplementationOnce(() =>
      Promise.resolve(
        new Response(JSON.stringify({ status: 'error', message: 'Flush DNS cache is already running' }), {
          status: 409,
        }),
      ),
    );
    renderWithProviders(<FixActionsPanel />);
    fireEvent.click(await screen.findByRole('button', { name: 'Run Flush DNS cache' }));

    expect(await screen.findByText('Flush DNS cache: failed')).toBeInTheDocument();
    expect(screen.getByText('Flush DNS cache is already running')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<FixActionsPanel />);
    await screen.findByRole('heading', { name: 'Flush DNS cache' });
    expect(await axeViolations(container)).toEqual([]);
  });
});
