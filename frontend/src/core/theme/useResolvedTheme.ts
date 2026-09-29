import { useSyncExternalStore } from 'react';
import type { ResolvedTheme } from './theme';

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

const read = (): ResolvedTheme => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

/**
 * The theme currently on <html>, read-only. For components that need it in JS (e.g. the
 * toaster); `useTheme` owns the preference and must stay single.
 */
export function useResolvedTheme(): ResolvedTheme {
  return useSyncExternalStore(subscribe, read);
}
