import { useEffect, useRef } from 'react';

/**
 * Calls `onHide` whenever the page is hidden, the window loses focus or the
 * page is being unloaded, while `active` is true. Used to conceal a revealed
 * card the moment the phone is interrupted.
 */
export function useConcealOnHide(active: boolean, onHide: () => void): void {
  const onHideRef = useRef(onHide);

  useEffect(() => {
    onHideRef.current = onHide;
  }, [onHide]);

  useEffect(() => {
    if (!active) return;
    const hide = () => onHideRef.current();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') hide();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', hide);
    window.addEventListener('pagehide', hide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', hide);
      window.removeEventListener('pagehide', hide);
    };
  }, [active]);
}
