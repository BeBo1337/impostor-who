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
  Pizza,
  Shapes,
  Smile,
  Tag,
  Target,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { CategoryId } from '../../data/types';

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
  superheroes: Zap,
  transport: Car,
  videogames: Gamepad2,
  nature: CloudSun,
};

export interface CategoryIconProps {
  id: CategoryId;
  /** Rendered width and height in px. */
  size?: number | undefined;
  className?: string | undefined;
  strokeWidth?: number | undefined;
}

/** Lucide icon for a category. Decorative; the label is always shown next to it. */
export function CategoryIcon({ id, size = 24, className, strokeWidth = 2.25 }: CategoryIconProps) {
  const Icon = ICONS[id];
  return <Icon size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" focusable="false" />;
}
