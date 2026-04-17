import { useCallback, useSyncExternalStore } from 'react';

const DEFAULT_MOBILE_QUERY = '(max-width: 768px)';

/**
 * Returns whether the current viewport matches a "mobile" media query.
 * Default breakpoint: `(max-width: 768px)` (Tailwind `md` breakpoint).
 * SSR-safe: returns `false` on the server, then reconciles after mount.
 */
export function useIsMobile(query: string = DEFAULT_MOBILE_QUERY): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query]
  );

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query]
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
