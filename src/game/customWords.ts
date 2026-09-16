import type { WordEntry } from '../data/types';
import { WORDS_BY_CATEGORY } from '../data/words';
import { countGraphemes } from './players';
import type { WordLibrary } from './words';

/** A word the players typed in themselves. Lives in setup state and local storage. */
export interface CustomWord {
  readonly id: string;
  readonly word: string;
  /** At least one association for the impostor. */
  readonly hints: readonly string[];
}

export const MAX_CUSTOM_WORDS = 200;
export const MAX_CUSTOM_TEXT_LENGTH = 40;
export const MAX_CUSTOM_HINTS = 5;

const clean = (text: string): string => text.normalize('NFC').replace(/\s+/g, ' ').trim();
const keyOf = (text: string): string => clean(text).toLocaleLowerCase('he');

/** Splits a free-text hint field on commas, semicolons or line breaks. */
export function parseHints(text: string): string[] {
  const seen = new Set<string>();
  const hints: string[] = [];
  for (const part of text.split(/[,;،\n]+/)) {
    const hint = clean(part);
    if (!hint) continue;
    const key = keyOf(hint);
    if (seen.has(key)) continue;
    seen.add(key);
    hints.push(hint);
    if (hints.length >= MAX_CUSTOM_HINTS) break;
  }
  return hints;
}

export type CustomWordError =
  | 'emptyWord'
  | 'wordTooLong'
  | 'duplicate'
  | 'noHints'
  | 'hintTooLong'
  | 'hintIsWord'
  | 'tooMany';

export type CustomWordValidation =
  | { readonly ok: true; readonly word: string; readonly hints: readonly string[] }
  | { readonly ok: false; readonly error: CustomWordError };

/**
 * Validates a proposed custom word and its hint text against the current list.
 * `excludeId` lets a word keep its own text while being edited.
 */
export function validateCustomWord(
  rawWord: string,
  rawHints: string,
  existing: readonly CustomWord[],
  excludeId?: string,
): CustomWordValidation {
  const word = clean(rawWord);
  if (!word) return { ok: false, error: 'emptyWord' };
  if (countGraphemes(word) > MAX_CUSTOM_TEXT_LENGTH) return { ok: false, error: 'wordTooLong' };
  const wordKey = keyOf(word);
  if (existing.some((w) => w.id !== excludeId && keyOf(w.word) === wordKey)) return { ok: false, error: 'duplicate' };
  if (!excludeId && existing.length >= MAX_CUSTOM_WORDS) return { ok: false, error: 'tooMany' };

  const hints = parseHints(rawHints);
  if (hints.length === 0) return { ok: false, error: 'noHints' };
  if (hints.some((h) => countGraphemes(h) > MAX_CUSTOM_TEXT_LENGTH)) return { ok: false, error: 'hintTooLong' };
  const givesAway = hints.some((h) => {
    const hintKey = keyOf(h);
    return hintKey === wordKey || hintKey.includes(wordKey) || (hintKey.length >= 3 && wordKey.includes(hintKey));
  });
  if (givesAway) return { ok: false, error: 'hintIsWord' };

  return { ok: true, word, hints };
}

/** Converts the players' words into library entries under the "custom" category. */
export function customWordEntries(words: readonly CustomWord[]): readonly WordEntry[] {
  return words.map((w) => ({ id: `custom:${w.word}`, categoryId: 'custom', word: w.word, hints: w.hints }));
}

/** The built-in library plus the custom category when it has any words. */
export function buildLibrary(customWords: readonly CustomWord[]): WordLibrary {
  const library = new Map(WORDS_BY_CATEGORY);
  if (customWords.length > 0) library.set('custom', customWordEntries(customWords));
  return library;
}
