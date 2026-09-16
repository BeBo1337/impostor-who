import {
  Briefcase,
  Car,
  Clapperboard,
  CloudSun,
  CookingPot,
  FlaskConical,
  Gamepad2,
  Globe,
  GraduationCap,
  House,
  MessageCircle,
  Mic,
  Music,
  PawPrint,
  PenLine,
  Pizza,
  Shapes,
  Smile,
  Tag,
  Target,
  Trophy,
  Zap,
  createLucideIcon,
  type LucideIcon,
} from 'lucide-react';
import type { CategoryId } from '../../data/types';

/** Lucide has no football, so this one is drawn in the same 24px, 2px-stroke family. */
const SoccerBall: LucideIcon = createLucideIcon('SoccerBall', [
  ['circle', { cx: '12', cy: '12', r: '10', key: 'ball' }],
  ['path', { d: 'M12 8.8 15.04 11.01 13.88 14.59 10.12 14.59 8.96 11.01Z', key: 'pentagon' }],
  ['path', { d: 'M12 8.8V2.2M15.04 11.01 21.3 9M13.88 14.59 17.8 19.9M10.12 14.59 6.2 19.9M8.96 11.01 2.7 9', key: 'seams' }],
]);

const ICONS: Record<CategoryId, LucideIcon> = {
  everyday: House,
  celebrities: Mic,
  food: Pizza,
  animals: PawPrint,
  brands: Tag,
  colors: Shapes,
  places: Globe,
  emotions: Smile,
  hobbies: Target,
  internet: MessageCircle,
  kitchen: CookingPot,
  screen: Clapperboard,
  music: Music,
  professions: Briefcase,
  school: GraduationCap,
  science: FlaskConical,
  sports: Trophy,
  footballers: SoccerBall,
  superheroes: Zap,
  transport: Car,
  videogames: Gamepad2,
  nature: CloudSun,
  custom: PenLine,
};

export interface CategoryIconProps {
  id: CategoryId;
  /** Rendered width and height in px. */
  size?: number | undefined;
  className?: string | undefined;
  strokeWidth?: number | undefined;
}

/** Icon for a category. Decorative; the label is always shown next to it. */
export function CategoryIcon({ id, size = 24, className, strokeWidth = 2.25 }: CategoryIconProps) {
  const Icon = ICONS[id];
  return <Icon size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" focusable="false" />;
}
