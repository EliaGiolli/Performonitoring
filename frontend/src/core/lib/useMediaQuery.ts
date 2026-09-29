import { useCallback, useSyncExternalStore } from 'react';

/** Tailwind's `md` breakpoint, for components that swap markup rather than styles. */
export const MD_QUERY = '(min-width: 768px)';

/** Whether a CSS media query matches, updated when it starts or stops matching. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}
