import type { CSSProperties, ReactNode } from 'react';
import styles from './Sticker.module.css';

export interface StickerProps {
  children: ReactNode;
  tone?: 'coral' | 'lime' | 'cream' | 'violet' | 'ink' | undefined;
  /** Rotation in degrees; small values look like a hand-placed sticker. */
  rotate?: number | undefined;
  className?: string | undefined;
  'aria-hidden'?: boolean | undefined;
}

export function Sticker({ children, tone = 'coral', rotate = -6, className, ...rest }: StickerProps) {
  const style = { '--sticker-rotate': `${rotate}deg` } as CSSProperties;
  return (
    <span className={[styles.sticker, styles[tone], className].filter(Boolean).join(' ')} style={style} {...rest}>
      {children}
    </span>
  );
}
