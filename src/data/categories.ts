import type { Category, CategoryId } from './types';

export type { Category, CategoryId } from './types';

export const CATEGORIES: readonly Category[] = [
  { id: 'everyday', label: 'חפצים יומיומיים', tone: 'mint' },
  { id: 'celebrities', label: 'אנשים מפורסמים', tone: 'lavender' },
  { id: 'food', label: 'אוכל ומשקאות', tone: 'peach' },
  { id: 'animals', label: 'חיות', tone: 'sand' },
  { id: 'brands', label: 'מותגים ולוגואים', tone: 'sky' },
  { id: 'colors', label: 'צבעים וצורות', tone: 'pink' },
  { id: 'places', label: 'מדינות וערים', tone: 'mint' },
  { id: 'emotions', label: 'רגשות ותחושות', tone: 'peach' },
  { id: 'hobbies', label: 'תחביבים ופעילויות', tone: 'lavender' },
  { id: 'internet', label: 'תרבות אינטרנט', tone: 'sky' },
  { id: 'kitchen', label: 'מטבח ובישול', tone: 'sand' },
  { id: 'screen', label: 'סרטים וסדרות', tone: 'pink' },
  { id: 'music', label: 'מוזיקה ולהקות', tone: 'mint' },
  { id: 'professions', label: 'מקצועות', tone: 'sky' },
  { id: 'school', label: 'בית ספר וחינוך', tone: 'lavender' },
  { id: 'science', label: 'מדע וטכנולוגיה', tone: 'peach' },
  { id: 'sports', label: 'ספורט', tone: 'sand' },
  { id: 'superheroes', label: 'גיבורי על', tone: 'pink' },
  { id: 'transport', label: 'תחבורה', tone: 'mint' },
  { id: 'videogames', label: 'משחקי מחשב', tone: 'lavender' },
  { id: 'nature', label: 'מזג אוויר וטבע', tone: 'sky' },
];

export const CATEGORY_IDS: readonly CategoryId[] = CATEGORIES.map((c) => c.id);

const BY_ID: ReadonlyMap<CategoryId, Category> = new Map(CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: CategoryId): Category {
  const found = BY_ID.get(id);
  if (!found) throw new Error(`Unknown category: ${id}`);
  return found;
}

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && BY_ID.has(value as CategoryId);
}

/** Categories selected when the app is opened for the first time. */
export const DEFAULT_CATEGORY_IDS: readonly CategoryId[] = ['everyday', 'celebrities', 'food'];
