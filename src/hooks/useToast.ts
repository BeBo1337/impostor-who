import { useCallback, useEffect, useRef, useState } from 'react';

/** A single transient status message that clears itself. */
export function useToast(durationMs = 4200): [string | null, (message: string) => void] {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const show = useCallback(
    (next: string) => {
      setMessage(next);
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setMessage(null);
        timer.current = null;
      }, durationMs);
    },
    [durationMs],
  );

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  return [message, show];
}
