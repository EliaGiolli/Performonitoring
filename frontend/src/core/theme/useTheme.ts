import { useEffect, useState } from 'react';
import { applyTheme, readPreference, resolveTheme, savePreference, type ThemePreference } from './theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

/** The saved theme preference, applied to <html>; "system" follows the OS setting live. */
export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(readPreference);

  useEffect(() => {
    savePreference(preference);
    const media = window.matchMedia(DARK_QUERY);
    const apply = () => applyTheme(resolveTheme(preference, media.matches));
    apply();
    if (preference !== 'system') return;
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [preference]);

  return { preference, setPreference };
}
