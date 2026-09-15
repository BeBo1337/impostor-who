import type { CategoryId, WordEntry } from '../data/types';
import { WORDS_BY_CATEGORY } from '../data/words';
import { defaultRng, pickOne, type Rng } from './random';

/**
 * In-memory record of which words this session has already used.
 * Never persisted: a reload starts fresh.
 */
export interface WordSession {
  readonly usedIds: ReadonlySet<string>;
  /** Normalized text of the most recent word, to block an immediate repeat across categories. */
  readonly lastWordKey: string | null;
}

export const EMPTY_WORD_SESSION: WordSession = { usedIds: new Set<string>(), lastWordKey: null };

export function wordKey(word: string): string {
  return word.normalize('NFC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('he');
}

export type WordLibrary = ReadonlyMap<CategoryId, readonly WordEntry[]>;

/** Ids of every entry sharing the same normalized word, computed once per library. */
const sameWordIndexes = new WeakMap<WordLibrary, ReadonlyMap<string, readonly string[]>>();

function idsWithSameWord(library: WordLibrary, key: string): readonly string[] {
  let index = sameWordIndexes.get(library);
  if (!index) {
    const built = new Map<string, string[]>();
    for (const entries of library.values()) {
      for (const entry of entries) {
        const entryKey = wordKey(entry.word);
        const list = built.get(entryKey);
        if (list) list.push(entry.id);
        else built.set(entryKey, [entry.id]);
      }
    }
    index = built;
    sameWordIndexes.set(library, index);
  }
  return index.get(key) ?? [];
}

export interface PickedWord {
  readonly entry: WordEntry;
  readonly session: WordSession;
}

/**
 * Chooses one enabled category with equal probability, then an entry from it.
 * Unseen entries are preferred; once a category is exhausted its pool is
 * recycled. The previous round's word is never repeated immediately when any
 * alternative exists.
 */
export function pickWord(
  categoryIds: readonly CategoryId[],
  session: WordSession = EMPTY_WORD_SESSION,
  rng: Rng = defaultRng,
  library: WordLibrary = WORDS_BY_CATEGORY,
): PickedWord {
  const enabled = Array.from(new Set(categoryIds)).filter((id) => (library.get(id)?.length ?? 0) > 0);
  if (enabled.length === 0) {
    throw new Error('pickWord: no enabled category has words');
  }

  const categoryId = pickOne(enabled, rng);
  const pool = library.get(categoryId) as readonly WordEntry[];
  const isNotLast = (entry: WordEntry) => wordKey(entry.word) !== session.lastWordKey;

  let usedIds = session.usedIds;
  let candidates: readonly WordEntry[] = pool.filter((entry) => !usedIds.has(entry.id) && isNotLast(entry));

  if (candidates.length === 0) {
    // Recycle only this category's pool; other categories keep their history.
    const poolIds = new Set(pool.map((entry) => entry.id));
    usedIds = new Set(Array.from(usedIds).filter((id) => !poolIds.has(id)));
    candidates = pool.filter(isNotLast);
    if (candidates.length === 0) candidates = pool;
  }

  const entry = pickOne(candidates, rng);
  const key = wordKey(entry.word);
  const nextUsed = new Set(usedIds);
  nextUsed.add(entry.id);
  // The same word may exist in several categories; once it has been played,
  // treat every copy as used so the group never meets it twice in one session.
  for (const id of idsWithSameWord(library, key)) nextUsed.add(id);
  return { entry, session: { usedIds: nextUsed, lastWordKey: key } };
}
