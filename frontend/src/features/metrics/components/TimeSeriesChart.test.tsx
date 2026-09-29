import { fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axeViolations } from '@/core/test/axe';
import { renderWithProviders } from '@/core/test/providers';
import { useConnectionStore, type ConnectionStatus } from '@/core/ws';
import { fromSnapshot, type MetricPoint } from '../buffer';
import { formatPercent } from '../format';
import type { Series } from '../series';
import { makeSnapshot } from '../test/fixtures';
import { TimeSeriesChart } from './TimeSeriesChart';

const SERIES: Series[] = [{ id: 'cpu', label: 'Total', color: 'var(--chart-1)', value: (p) => p.cpu }];
const POINTS: MetricPoint[] = [10, 30, 50].map((total, i) => fromSnapshot(makeSnapshot(i * 60, { total })));

// The history request never settles unless a test answers it.
const fetchMock = vi.fn<typeof fetch>(() => new Promise(() => {}));

beforeEach(() => vi.stubGlobal('fetch', fetchMock));
afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

function renderChart(data: MetricPoint[], connection: ConnectionStatus = 'connected') {
  useConnectionStore.setState({ status: connection });
  return renderWithProviders(
    <TimeSeriesChart title="CPU load" data={data} series={SERIES} formatValue={formatPercent} />,
  );
}

describe('TimeSeriesChart states', () => {
  it('shows loading while the history is on its way', () => {
    renderChart([]);
    expect(screen.getByText('Loading history…')).toBeInTheDocument();
  });

  it('waits for the first reading once the history came back empty', async () => {
    fetchMock.mockResolvedValue(new Response('[]'));
    renderChart([]);
    expect(await screen.findByText('Waiting for the first reading…')).toBeInTheDocument();
  });

  it('says offline when there is neither data nor a live channel', async () => {
    fetchMock.mockResolvedValue(new Response('[]'));
    renderChart([], 'disconnected');
    expect(await screen.findByText('Offline: no data to show')).toBeInTheDocument();
  });

  it('keeps the last data on screen, marked as not live, when the channel drops', () => {
    renderChart(POINTS, 'reconnecting');
    expect(screen.getByText('Not live: showing the last data received')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Table view' })).toBeInTheDocument();
  });

  it('shows no status note while live', () => {
    renderChart(POINTS);
    expect(screen.queryByText(/Not live|Loading|Waiting|Offline/)).not.toBeInTheDocument();
  });
});

describe('TimeSeriesChart accessibility', () => {
  it('describes the chart in a visually hidden summary that is not a live region', () => {
    renderChart(POINTS);
    const figure = screen.getByRole('figure', { name: 'CPU load' });
    expect(figure).toHaveAccessibleDescription('CPU load, last 2 minutes. Total: now 50%, average 30%, peak 50%.');
    expect(figure.querySelector('[aria-live]')).toBeNull();
  });

  it('switches to a table of the latest readings, newest first, and back', () => {
    renderChart(POINTS);
    const toggle = screen.getByRole('button', { name: 'Table view' });

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows.map((r) => r.lastChild?.textContent)).toEqual(['50%', '30%', '10%']);
    expect(screen.getByRole('table', { name: /latest 3 readings, newest first/ })).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('has no accessibility violations in chart and table view', async () => {
    const { container } = renderChart(POINTS);
    expect(await axeViolations(container)).toEqual([]);

    fireEvent.click(screen.getByRole('button', { name: 'Table view' }));
    expect(await axeViolations(container)).toEqual([]);
  });
});
