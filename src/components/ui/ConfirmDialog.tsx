import { useId } from 'react';
import { Button } from './Button';
import styles from './ConfirmDialog.module.css';
import { useModalDialog } from './useModalDialog';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Small centred confirmation. Cancel is the safe, focused default. */
export function ConfirmDialog({ open, title, body, confirmLabel, cancelLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const titleId = useId();
  const bodyId = useId();
  const { ref, closing, onBackdropClick } = useModalDialog(open, onCancel);

  return (
    <dialog
      ref={ref}
      className={[styles.dialog, closing ? styles.closing : null].filter(Boolean).join(' ')}
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      onClick={onBackdropClick}
    >
      <div className={styles.card}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <p id={bodyId} className={styles.body}>
          {body}
        </p>
        <div className={styles.actions}>
          <Button variant="paper" onClick={onCancel} data-autofocus>
            {cancelLabel}
          </Button>
          <Button variant="coral" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
