import { CATEGORY_IDS } from '../categories';
import type { CategoryId, WordEntry } from '../types';
import { animalsWords } from './animals';
import { brandsWords } from './brands';
import { celebritiesWords } from './celebrities';
import { colorsWords } from './colors';
import { emotionsWords } from './emotions';
import { everydayWords } from './everyday';
import { foodWords } from './food';
import { hobbiesWords } from './hobbies';
import { internetWords } from './internet';
import { kitchenWords } from './kitchen';
import { musicWords } from './music';
import { natureWords } from './nature';
import { placesWords } from './places';
import { professionsWords } from './professions';
import { schoolWords } from './school';
import { scienceWords } from './science';
import { screenWords } from './screen';
import { sportsWords } from './sports';
import { superheroesWords } from './superheroes';
import { transportWords } from './transport';
import { videogamesWords } from './videogames';

/** Every word-and-hint pair, grouped by category. */
export const WORDS_BY_CATEGORY: ReadonlyMap<CategoryId, readonly WordEntry[]> = new Map<
  CategoryId,
  readonly WordEntry[]
>([
  ['everyday', everydayWords],
  ['celebrities', celebritiesWords],
  ['food', foodWords],
  ['animals', animalsWords],
  ['brands', brandsWords],
  ['colors', colorsWords],
  ['places', placesWords],
  ['emotions', emotionsWords],
  ['hobbies', hobbiesWords],
  ['internet', internetWords],
  ['kitchen', kitchenWords],
  ['screen', screenWords],
  ['music', musicWords],
  ['professions', professionsWords],
  ['school', schoolWords],
  ['science', scienceWords],
  ['sports', sportsWords],
  ['superheroes', superheroesWords],
  ['transport', transportWords],
  ['videogames', videogamesWords],
  ['nature', natureWords],
]);

/** Flat list in category order. */
export const ALL_WORDS: readonly WordEntry[] = CATEGORY_IDS.flatMap((id) => WORDS_BY_CATEGORY.get(id) ?? []);
