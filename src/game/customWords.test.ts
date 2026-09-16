import { describe, expect, it } from 'vitest';
import { WORDS_BY_CATEGORY } from '../data/words';
import { buildLibrary, parseHints, validateCustomWord, type CustomWord } from './customWords';

const existing: CustomWord[] = [
  { id: 'w1', word: 'סבתא של יוסי', hints: ['משפחה', 'עוגיות'] },
  { id: 'w2', word: 'Dana', hints: ['חברה'] },
];

describe('parseHints', () => {
  it('splits on commas, semicolons and line breaks, trims and deduplicates', () => {
    expect(parseHints(' משפחה , עוגיות;שבת\nמשפחה ')).toEqual(['משפחה', 'עוגיות', 'שבת']);
  });

  it('caps the number of hints', () => {
    expect(parseHints('א,ב,ג,ד,ה,ו,ז')).toHaveLength(5);
  });

  it('returns nothing for blank text', () => {
    expect(parseHints('  , ,')).toEqual([]);
  });
});

describe('validateCustomWord', () => {
  it('accepts a clean word with at least one hint', () => {
    expect(validateCustomWord(' הכלב  של השכנים ', 'נביחות, לילה', existing)).toEqual({
      ok: true,
      word: 'הכלב של השכנים',
      hints: ['נביחות', 'לילה'],
    });
  });

  it('rejects empty words, missing hints and duplicates', () => {
    expect(validateCustomWord('   ', 'רמז', existing)).toEqual({ ok: false, error: 'emptyWord' });
    expect(validateCustomWord('מילה', '  ', existing)).toEqual({ ok: false, error: 'noHints' });
    expect(validateCustomWord('dana', 'רמז', existing)).toEqual({ ok: false, error: 'duplicate' });
  });

  it('lets a word keep its own text while being edited', () => {
    expect(validateCustomWord('Dana', 'חברה', existing, 'w2').ok).toBe(true);
  });

  it('rejects hints that give the word away', () => {
    expect(validateCustomWord('פיצה', 'פיצה', existing)).toEqual({ ok: false, error: 'hintIsWord' });
    expect(validateCustomWord('פיצה', 'מגש פיצה', existing)).toEqual({ ok: false, error: 'hintIsWord' });
    expect(validateCustomWord('מכונית אדומה', 'אדומה', existing)).toEqual({ ok: false, error: 'hintIsWord' });
    expect(validateCustomWord('פיצה', 'מפגש חברים', existing).ok).toBe(true);
  });

  it('enforces length limits', () => {
    expect(validateCustomWord('א'.repeat(41), 'רמז', existing)).toEqual({ ok: false, error: 'wordTooLong' });
    expect(validateCustomWord('מילה', 'ב'.repeat(41), existing)).toEqual({ ok: false, error: 'hintTooLong' });
  });

  it('stops at the maximum number of words', () => {
    const many: CustomWord[] = Array.from({ length: 200 }, (_, i) => ({ id: `id${i}`, word: `מילה ${i}`, hints: ['רמז'] }));
    expect(validateCustomWord('חדשה', 'רמז', many)).toEqual({ ok: false, error: 'tooMany' });
  });
});

describe('buildLibrary', () => {
  it('returns the built-in library untouched when there are no custom words', () => {
    const library = buildLibrary([]);
    expect(library.has('custom')).toBe(false);
    expect(library.size).toBe(WORDS_BY_CATEGORY.size);
  });

  it('adds the custom category with entries derived from the words', () => {
    const library = buildLibrary(existing);
    const entries = library.get('custom') ?? [];
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({ id: 'custom:סבתא של יוסי', categoryId: 'custom', word: 'סבתא של יוסי', hints: ['משפחה', 'עוגיות'] });
    expect(library.get('food')).toBe(WORDS_BY_CATEGORY.get('food'));
  });
});
