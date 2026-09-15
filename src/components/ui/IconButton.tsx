import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './IconButton.module.css';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: icon-only controls must always have an accessible name. */
  'aria-label': string;
  tone?: 'ink' | 'light' | 'solid' | undefined;
  children: ReactNode;
}

export function IconButton({ tone = 'ink', className, children, type = 'button', ...rest }: IconButtonProps) {
  const classes = [styles.iconButton, styles[tone], className].filter(Boolean).join(' ');
  return (
    <button type={type} className={classes} {...rest}>
      <span className={styles.glyph} aria-hidden="true">
        {children}
      </span>
    </button>
  );
}
