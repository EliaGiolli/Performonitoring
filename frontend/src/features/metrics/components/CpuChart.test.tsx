import { act, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axeViolations } from '@/core/test/axe';
import { renderWithProviders } from '@/core/test/providers';
import { useLiveStats } from '../hooks/useLiveStats';
import { makeSnapshot } from '../test/fixtures';
import { CpuChart } from './CpuChart';

const fetchMock = vi.fn(() => Promise.resolve(new Response(JSON.stringify({ CPU_THRESHOLD: 85 }))));

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  useLiveStats.setState({ points: [], latest: null });
});
afterEach(() => {
  fetchMock.mockClear();
  vi.unstubAllGlobals();
});

const push = (...args: Parameters<typeof makeSnapshot>) =>
  act(() => useLiveStats.getState().pushSnapshot(makeSnapshot(...args)));

describe('CpuChart', () => {
  it('shows the current load and N/A for a missing temperature', () => {
    renderWithProviders(<CpuChart />);
    push(0, { total: 42.4, tempC: null });

    const header = screen.getByRole('heading', { name: 'CPU' }).parentElement!;
    expect(within(header).getByText('Load').nextSibling).toHaveTextContent('42%');
    expect(within(header).getByText('Temperature').nextSibling).toHaveTextContent('N/A');
  });

  it('shows the temperature when the machine reports one', () => {
    renderWithProviders(<CpuChart />);
    push(0, { tempC: 61.2 });

    expect(screen.getByText('61 °C')).toBeInTheDocument();
  });

  it('lists the current load of every core', () => {
    renderWithProviders(<CpuChart />);
    push(0, { perCore: [12, 88, 50] });

    const cores = within(screen.getByRole('list', { name: 'Per core, now' })).getAllByRole('listitem');
    expect(cores.map((c) => c.textContent)).toEqual(['Core 112%', 'Core 288%', 'Core 350%']);
  });

  it('reads the CPU threshold for the reference line', () => {
    renderWithProviders(<CpuChart />);
    expect(fetchMock).toHaveBeenCalledWith('/api/config/thresholds', expect.anything());
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<CpuChart />);
    push(0);
    expect(await axeViolations(container)).toEqual([]);
  });
});
