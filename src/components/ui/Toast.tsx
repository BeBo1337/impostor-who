import styles from './Toast.module.css';

export interface ToastProps {
  message: string | null;
}

/** Polite status message. The live region stays mounted so changes are announced. */
export function Toast({ message }: ToastProps) {
  return (
    <div className={styles.region} role="status" aria-live="polite" aria-atomic="true">
      {message ? (
        <div className={styles.toast} key={message}>
          {message}
        </div>
      ) : null}
    </div>
  );
}
