export type ThemePreference = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

// Keep in sync with public/theme-init.js, which applies the theme before React loads.
export const THEME_STORAGE_KEY = 'pc-monitor-theme';
export const DEFAULT_THEME: ThemePreference = 'dark';

const PREFERENCES: readonly ThemePreference[] = ['dark', 'light', 'system'];

function isPreference(value: unknown): value is ThemePreference {
  return PREFERENCES.includes(value as ThemePreference);
}

// Storage can be missing or throw (private windows, blocked site data): fall back to the default.
export function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isPreference(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function savePreference(preference: ThemePreference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Not persisted; the choice still applies for this visit.
  }
}

export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light';
  return preference;
}

export function applyTheme(theme: ResolvedTheme) {
  document.documentElement.dataset.theme = theme;
}
