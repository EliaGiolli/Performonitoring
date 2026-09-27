import { afterEach, describe, expect, it, vi } from 'vitest';
import { readPreference, resolveTheme, savePreference, THEME_STORAGE_KEY } from './theme';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('theme preference', () => {
  it('defaults to dark when nothing is saved', () => {
    expect(readPreference()).toBe('dark');
  });

  it('round-trips a saved preference', () => {
    savePreference('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(readPreference()).toBe('light');
  });

  it('ignores unknown stored values', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'neon');
    expect(readPreference()).toBe('dark');
  });

  it('survives blocked storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(readPreference()).toBe('dark');
    expect(() => savePreference('light')).not.toThrow();
  });
});

describe('resolveTheme', () => {
  it('uses explicit choices as-is and follows the OS for "system"', () => {
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });
});
