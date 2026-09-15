import styles from './PeekingEyes.module.css';

export interface PeekingEyesProps {
  /** "suspicious" is the default mascot look; "happy" is used once dealing is done. */
  mood?: 'suspicious' | 'happy' | undefined;
  className?: string | undefined;
}

interface EyeProps {
  cx: number;
  mood: 'suspicious' | 'happy';
  delay: string;
}

function Eye({ cx, mood, delay }: EyeProps) {
  const cy = 50;
  const rx = 30;
  const ry = mood === 'happy' ? 28 : 26;
  const clipId = `eye-clip-${cx}`;
  return (
    <g className={styles.eye} style={{ animationDelay: delay }}>
      <defs>
        <clipPath id={clipId}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
        </clipPath>
      </defs>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} className={styles.sclera} />
      <g className={styles.pupil} clipPath={`url(#${clipId})`}>
        <circle cx={cx + 3} cy={cy + 4} r={mood === 'happy' ? 11 : 9} className={styles.pupilDot} />
        <circle cx={cx + 7} cy={cy - 1} r={3} className={styles.glint} />
      </g>
      {mood === 'suspicious' ? (
        <path
          d={`M ${cx - 34} 8 H ${cx + 34} V 36 Q ${cx} 47 ${cx - 34} 36 Z`}
          className={styles.lid}
          clipPath={`url(#${clipId})`}
        />
      ) : null}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} className={styles.outline} />
    </g>
  );
}

/**
 * The game's mascot: a pair of eyes peeking over an edge.
 * Purely decorative and hidden from assistive technology.
 */
export function PeekingEyes({ mood = 'suspicious', className }: PeekingEyesProps) {
  return (
    <svg
      viewBox="0 0 160 80"
      className={[styles.root, className].filter(Boolean).join(' ')}
      aria-hidden="true"
      focusable="false"
    >
      <Eye cx={48} mood={mood} delay="0s" />
      <Eye cx={112} mood={mood} delay="0.12s" />
      {mood === 'suspicious' ? (
        <>
          <path d="M 16 22 Q 48 4 80 18" className={styles.brow} />
          <path d="M 86 26 Q 112 12 142 22" className={styles.brow} />
        </>
      ) : (
        <>
          <path d="M 20 14 Q 48 -2 76 14" className={styles.brow} />
          <path d="M 84 14 Q 112 -2 140 14" className={styles.brow} />
        </>
      )}
    </svg>
  );
}
