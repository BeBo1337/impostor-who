import { describe, expect, it } from 'vitest';
import { CATEGORIES, CATEGORY_IDS } from './categories';
import { ALL_WORDS, WORDS_BY_CATEGORY } from './words';

const REQUIRED_LABELS = [
  'חפצים יומיומיים',
  'אנשים מפורסמים',
  'אוכל ומשקאות',
  'חיות',
  'מותגים ולוגואים',
  'צבעים וצורות',
  'מדינות וערים',
  'רגשות ותחושות',
  'תחביבים ופעילות',
  'תרבות אינטרנט',
  'מטבח ובישול',
  'סרטים וסדרות',
  'מוזיקה ולהקות',
  'מקצועות',
  'בית ספר וחינוך',
  'מדע וטכנולוגיה',
  'ספורט',
  'שחקני כדורגל',
  'גיבורי על',
  'תחבורה',
  'משחקי מחשב',
  'מזג אוויר וטבע',
];

/** Smaller pools are acceptable for narrow topics (superheroes, colours), the average must stay high. */
const MIN_PER_CATEGORY = 70;
const MIN_AVERAGE = 100;
const MIN_HINTS = 3;

const normalize = (text: string) =>
  text
    .normalize('NFC')
    .replace(/[׳״'"״׳.\-–:!?]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('he');

const tokens = (text: string): string[] => normalize(text).split(' ').filter((t) => t.length >= 3);

describe('category definitions', () => {
  it('contains exactly the 22 categories with exact Hebrew labels', () => {
    expect(CATEGORIES).toHaveLength(22);
    expect(CATEGORIES.map((c) => c.label)).toEqual(REQUIRED_LABELS);
    expect(new Set(CATEGORY_IDS).size).toBe(22);
  });
});

describe('footballers', () => {
  it('lists at least 500 players', () => {
    expect(WORDS_BY_CATEGORY.get('footballers')?.length ?? 0).toBeGreaterThanOrEqual(500);
  });
});

describe('word library', () => {
  it('is populated for every category and averages at least 100 words per category', () => {
    for (const id of CATEGORY_IDS) {
      const entries = WORDS_BY_CATEGORY.get(id);
      expect(entries, `category ${id} is missing`).toBeDefined();
      expect(entries!.length, `category ${id} has too few entries`).toBeGreaterThanOrEqual(MIN_PER_CATEGORY);
    }
    expect(ALL_WORDS.length / CATEGORY_IDS.length).toBeGreaterThanOrEqual(MIN_AVERAGE);
  });

  it('has globally unique ids and consistent category ids', () => {
    const ids = new Set<string>();
    for (const [categoryId, entries] of WORDS_BY_CATEGORY) {
      for (const entry of entries) {
        expect(ids.has(entry.id), `duplicate id ${entry.id}`).toBe(false);
        ids.add(entry.id);
        expect(entry.categoryId).toBe(categoryId);
      }
    }
    expect(ids.size).toBe(ALL_WORDS.length);
  });

  it('gives every word at least three distinct, non-empty hints', () => {
    for (const entry of ALL_WORDS) {
      expect(entry.word.trim().length, `${entry.id} word`).toBeGreaterThan(0);
      expect(entry.hints.length, `${entry.id} hints`).toBeGreaterThanOrEqual(MIN_HINTS);
      for (const hint of entry.hints) {
        expect(hint.trim().length, `${entry.id} has an empty hint`).toBeGreaterThan(0);
        expect(hint, `${entry.id} has a placeholder hint`).not.toBe('TODO');
      }
      expect(new Set(entry.hints.map(normalize)).size, `${entry.id} repeats a hint`).toBe(entry.hints.length);
    }
  });

  it('never repeats a word inside one category', () => {
    for (const [categoryId, entries] of WORDS_BY_CATEGORY) {
      const words = entries.map((e) => normalize(e.word));
      expect(new Set(words).size, `duplicate word in ${categoryId}`).toBe(words.length);
    }
  });

  it('never uses the answer, a part of it, or a shared token as a hint', () => {
    const problems: string[] = [];
    for (const entry of ALL_WORDS) {
      const word = normalize(entry.word);
      const wordTokens = new Set(tokens(entry.word));
      for (const rawHint of entry.hints) {
        const hint = normalize(rawHint);
        if (hint === word) problems.push(`${entry.id}: hint equals word`);
        else if (hint.includes(word)) problems.push(`${entry.id}: hint "${rawHint}" contains the word`);
        else if (hint.length >= 3 && word.includes(hint)) problems.push(`${entry.id}: word contains hint "${rawHint}"`);
        for (const t of tokens(rawHint)) {
          if (wordTokens.has(t)) problems.push(`${entry.id}: shared token "${t}" with hint "${rawHint}"`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it('varies hints within every category instead of leaning on a few generic ones', () => {
    for (const [categoryId, entries] of WORDS_BY_CATEGORY) {
      const all = entries.flatMap((e) => e.hints.map(normalize));
      const distinct = new Set(all).size;
      // Very large name lists (footballers) legitimately reuse teams, positions and eras,
      // so a large absolute vocabulary also counts as enough variety.
      const variedEnough = distinct / all.length >= 0.3 || distinct >= 150;
      expect(variedEnough, `${categoryId} hints are too repetitive (${distinct}/${all.length})`).toBe(true);
    }
  });
});
