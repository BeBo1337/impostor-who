import { useId, type ReactNode } from 'react';
import { he } from '../../copy/he';
import { IconButton } from './IconButton';
import { CloseIcon } from './Icons';
import styles from './Sheet.module.css';
import { useModalDialog } from './useModalDialog';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string | undefined;
  /** Optional row rendered under the title, e.g. a toolbar. */
  toolbar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  tone?: 'cream' | 'violet' | undefined;
}

/** Accessible bottom sheet built on the native <dialog> element. */
export function Sheet({ open, onClose, title, subtitle, toolbar, footer, children, tone = 'cream' }: SheetProps) {
  const titleId = useId();
  const { ref, closing, onBackdropClick } = useModalDialog(open, onClose);

  return (
    <dialog
      ref={ref}
      className={[styles.dialog, closing ? styles.closing : null].filter(Boolean).join(' ')}
      aria-labelledby={titleId}
      onClick={onBackdropClick}
    >
      <div className={[styles.panel, styles[tone]].join(' ')}>
        <div className={styles.grip} aria-hidden="true" />
        <header className={styles.header}>
          <div className={styles.heading}>
            <h2 id={titleId} className={styles.title} tabIndex={-1}>
              {title}
            </h2>
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>
          <IconButton aria-label={he.players.close} onClick={onClose} tone={tone === 'violet' ? 'light' : 'ink'}>
            <CloseIcon />
          </IconButton>
        </header>
        {toolbar ? <div className={styles.toolbar}>{toolbar}</div> : null}
        <div className={styles.body}>{children}</div>
        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </div>
    </dialog>
  );
}
