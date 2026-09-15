import { useEffect, useRef } from 'react';

const GUARD_KEY = 'miHamitchazeRoundGuard';

function hasGuard(): boolean {
  const state: unknown = window.history.state;
  return typeof state === 'object' && state !== null && (state as Record<string, unknown>)[GUARD_KEY] === true;
}

/**
 * While `active`, keeps one extra history entry so the browser back button
 * (or swipe) calls `onBack` instead of leaving the page. The app never puts
 * round data in the URL or history state; the entry is only a marker.
 */
export function useBackGuard(active: boolean, onBack: () => void): void {
  const onBackRef = useRef(onBack);

  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  useEffect(() => {
    if (!active) return;
    if (!hasGuard()) {
      window.history.pushState({ [GUARD_KEY]: true }, '');
    }
    const onPop = () => {
      onBackRef.current();
      if (!hasGuard()) window.history.pushState({ [GUARD_KEY]: true }, '');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [active]);
}
