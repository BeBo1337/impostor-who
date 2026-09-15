import { avatarToneIndex, firstGrapheme } from '../../game/players';
import styles from './Avatar.module.css';

export interface AvatarProps {
  id: string;
  name: string;
  size?: 'sm' | 'md' | undefined;
}

/** Colour-coded initial for a player. Decorative: the name is always shown next to it. */
export function Avatar({ id, name, size = 'md' }: AvatarProps) {
  const tone = avatarToneIndex(id);
  return (
    <span className={[styles.avatar, styles[size]].join(' ')} data-tone={tone} aria-hidden="true">
      <bdi>{firstGrapheme(name)}</bdi>
    </span>
  );
}
