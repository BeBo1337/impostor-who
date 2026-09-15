import type { CategoryId, WordEntry, WordSeed } from './types';

const clean = (text: string): string => text.normalize('NFC').replace(/\s+/g, ' ').trim();

/**
 * Turns compact [word, ...hints] seeds into typed entries.
 * Ids combine the category and the word, so reordering a list never changes them.
 */
export function defineWords(categoryId: CategoryId, seeds: readonly WordSeed[]): readonly WordEntry[] {
  return seeds.map(([word, ...hints]) => {
    const cleanWord = clean(word);
    return {
      id: `${categoryId}:${cleanWord}`,
      categoryId,
      word: cleanWord,
      hints: hints.map(clean),
    };
  });
}
