import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axeViolations } from '@/core/test/axe';
import { renderWithProviders } from '@/core/test/providers';
import { useLiveStats } from '../hooks/useLiveStats';
import { makeSnapshot } from '../test/fixtures';
import { RamChart } from './RamChart';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify({ RAM_THRESHOLD: 80 })))));
  useLiveStats.setState({ points: [], latest: null });
});
afterEach(() => vi.unstubAllGlobals());

const stat = (label: string) => screen.getByText(label, { selector: 'dt' }).nextSibling;

describe('RamChart', () => {
  it('shows N/A before the first reading', () => {
    renderWithProviders(<RamChart />);
    expect(stat('Used')).toHaveTextContent('N/A');
    expect(stat('In use')).toHaveTextContent('N/A');
  });

  it('shows the used share and the used / total amount', () => {
    renderWithProviders(<RamChart />);
    act(() => useLiveStats.getState().pushSnapshot(makeSnapshot(0)));

    expect(stat('Used')).toHaveTextContent('50%');
    expect(stat('In use')).toHaveTextContent('8.0 GB of 16.0 GB');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<RamChart />);
    act(() => useLiveStats.getState().pushSnapshot(makeSnapshot(0)));
    expect(await axeViolations(container)).toEqual([]);
  });
});
