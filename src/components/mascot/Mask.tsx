import styles from './Mask.module.css';

export interface MaskProps {
  className?: string | undefined;
}

/** Masquerade mask shown privately on the impostor's card. Decorative only. */
export function Mask({ className }: MaskProps) {
  return (
    <svg
      viewBox="0 0 220 120"
      className={[styles.root, className].filter(Boolean).join(' ')}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M 196 46 L 214 112" className={styles.stick} />
      <path
        d="M 12 42 C 40 8 88 16 110 40 C 132 16 180 8 208 42 C 200 84 160 100 130 76 C 120 68 100 68 90 76 C 60 100 20 84 12 42 Z"
        className={styles.face}
      />
      <ellipse cx="64" cy="52" rx="24" ry="14" className={styles.hole} />
      <ellipse cx="156" cy="52" rx="24" ry="14" className={styles.hole} />
      <circle cx="30" cy="30" r="4" className={styles.spark} />
      <circle cx="192" cy="28" r="3" className={styles.spark} />
      <path d="M 110 22 l 3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 z" className={styles.spark} />
    </svg>
  );
}
