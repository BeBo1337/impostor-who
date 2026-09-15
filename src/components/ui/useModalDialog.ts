import { useEffect, useRef, useState, type MouseEvent } from 'react';

const CLOSE_ANIMATION_MS = 240;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

/**
 * Drives a native <dialog> as a controlled modal: opens with showModal(),
 * animates out before close(), handles Escape and backdrop clicks, locks
 * body scroll, and moves focus to the element marked data-autofocus.
 */
export function useModalDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);
  const onCloseRef = useRef(onClose);
  const openRef = useRef(open);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open) {
      setClosing(false);
      if (!dialog.open) {
        if (typeof dialog.showModal === 'function') {
          dialog.showModal();
        } else {
          dialog.setAttribute('open', '');
        }
      }
      const target =
        dialog.querySelector<HTMLElement>('[data-autofocus]') ??
        dialog.querySelector<HTMLElement>('h1, h2, [tabindex="-1"]');
      target?.focus({ preventScroll: true });
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }

    if (!dialog.open) return;
    setClosing(true);
    const delay = prefersReducedMotion() ? 0 : CLOSE_ANIMATION_MS;
    const timer = window.setTimeout(() => {
      if (dialog.open) dialog.close();
      setClosing(false);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onCancel = (event: Event) => {
      event.preventDefault();
      onCloseRef.current();
    };
    const onNativeClose = () => {
      // The browser closed the dialog itself (e.g. a second Escape press); keep state in sync.
      // A dialog that was removed from the document (remount) also fires close; ignore that.
      if (openRef.current && dialog.isConnected) onCloseRef.current();
    };
    dialog.addEventListener('cancel', onCancel);
    dialog.addEventListener('close', onNativeClose);
    return () => {
      dialog.removeEventListener('cancel', onCancel);
      dialog.removeEventListener('close', onNativeClose);
    };
  }, []);

  const onBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) onCloseRef.current();
  };

  return { ref, closing, onBackdropClick };
}
