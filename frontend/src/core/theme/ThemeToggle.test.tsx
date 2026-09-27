import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { THEME_STORAGE_KEY } from './theme';
import { ThemeToggle } from './ThemeToggle';

const theme = () => document.documentElement.dataset.theme;

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('ThemeToggle', () => {
  it('starts on dark and marks it as the pressed option', () => {
    render(<ThemeToggle />);

    expect(theme()).toBe('dark');
    expect(screen.getByRole('radio', { name: 'Dark theme' })).toBeChecked();
  });

  it('applies and remembers another choice', () => {
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole('radio', { name: 'Light theme' }));

    expect(theme()).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(screen.getByRole('radio', { name: 'Light theme' })).toBeChecked();
  });

  it('keeps the current choice when the active option is clicked again', () => {
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole('radio', { name: 'Dark theme' }));

    expect(theme()).toBe('dark');
  });

  it('resolves "system" from the OS setting (light in jsdom)', () => {
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole('radio', { name: 'System theme' }));

    expect(theme()).toBe('light');
  });
});
