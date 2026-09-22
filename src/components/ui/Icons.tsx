import {
  Check,
  ChevronDown,
  CircleHelp,
  Eye,
  EyeOff,
  GripVertical,
  Minus,
  Pencil,
  Plus,
  X,
  type LucideIcon,
} from 'lucide-react';

export interface IconProps {
  size?: number | undefined;
  className?: string | undefined;
  strokeWidth?: number | undefined;
}

/** Small UI glyphs, all from Lucide so they share one visual family with the category icons. */
function wrap(Icon: LucideIcon, displayName: string) {
  function WrappedIcon({ size = 24, className, strokeWidth = 2.5 }: IconProps) {
    return <Icon size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" focusable="false" />;
  }
  WrappedIcon.displayName = displayName;
  return WrappedIcon;
}

export const PlusIcon = wrap(Plus, 'PlusIcon');
export const MinusIcon = wrap(Minus, 'MinusIcon');
export const CloseIcon = wrap(X, 'CloseIcon');
export const CheckIcon = wrap(Check, 'CheckIcon');
export const PencilIcon = wrap(Pencil, 'PencilIcon');
export const ChevronDownIcon = wrap(ChevronDown, 'ChevronDownIcon');
export const EyeIcon = wrap(Eye, 'EyeIcon');
export const EyeOffIcon = wrap(EyeOff, 'EyeOffIcon');
export const HelpIcon = wrap(CircleHelp, 'HelpIcon');
export const GripIcon = wrap(GripVertical, 'GripIcon');
