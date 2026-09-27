import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '@/core/test/axe';
import { App } from './App';

describe('App', () => {
  it('renders the shell: page heading, live status, theme switch and main landmark', () => {
    render(<App />);

    expect(screen.getByRole('banner')).toContainElement(screen.getByRole('heading', { level: 1, name: 'PC Monitor' }));
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Color theme' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
  });

  it('offers a skip link to the main content', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
  });

  it('lays out one section per feature', () => {
    render(<App />);
    const sections = ['Live metrics', 'Processes', 'Fix actions', 'Activity log'];
    for (const name of sections) expect(screen.getByRole('region', { name })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<App />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
