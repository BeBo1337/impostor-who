import { describe, expect, it } from 'vitest';
import type { CategoryId, WordEntry } from '../data/types';
import { createSeededRng } from './random';
import { EMPTY_WORD_SESSION, pickWord, type WordLibrary, type WordSession } from './words';

const entry = (categoryId: CategoryId, n: number, word = `${categoryId}-word-${n}`): WordEntry => ({
  id: `${categoryId}:${n}`,
  categoryId,
  word,
  hints: [`hint ${n}a`, `hint ${n}b`, `hint ${n}c`],
});

const library: WordLibrary = new Map<CategoryId, readonly WordEntry[]>([
  ['food', [entry('food', 1), entry('food', 2), entry('food', 3)]],
  ['animals', [entry('animals', 1), entry('animals', 2), entry('animals', 3), entry('animals', 4)]],
]);

describe('pickWord', () => {
  it('only picks from enabled categories', () => {
    const rng = createSeededRng(1);
    let session: WordSession = EMPTY_WORD_SESSION;
    for (let i = 0; i < 50; i += 1) {
      const picked = pickWord(['animals'], session, rng, library);
      expect(picked.entry.categoryId).toBe('animals');
      session = picked.session;
    }
  });

  it('prefers unseen words until the category is exhausted, then recycles without an immediate repeat', () => {
    const rng = createSeededRng(3);
    let session: WordSession = EMPTY_WORD_SESSION;
    const seen: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      const picked = pickWord(['food'], session, rng, library);
      seen.push(picked.entry.id);
      session = picked.session;
    }
    expect(new Set(seen).size).toBe(3);

    // Pool exhausted: the next pick recycles but must not repeat the last word.
    const last = seen[seen.length - 1];
    const picked = pickWord(['food'], session, rng, library);
    expect(picked.entry.id).not.toBe(last);
  });

  it('never repeats the previous word immediately, even across categories with the same text', () => {
    const shared: WordLibrary = new Map<CategoryId, readonly WordEntry[]>([
      ['food', [entry('food', 1, 'עכבר'), entry('food', 2, 'גבינה')]],
      ['animals', [entry('animals', 1, 'עכבר'), entry('animals', 2, 'חתול')]],
    ]);
    const rng = createSeededRng(11);
    let session: WordSession = EMPTY_WORD_SESSION;
    let previous: string | null = null;
    for (let i = 0; i < 200; i += 1) {
      const picked = pickWord(['food', 'animals'], session, rng, shared);
      if (previous !== null) expect(picked.entry.word).not.toBe(previous);
      previous = picked.entry.word;
      session = picked.session;
    }
  });

  it('marks the same word in other categories as used once it has been played', () => {
    const shared: WordLibrary = new Map<CategoryId, readonly WordEntry[]>([
      ['food', [entry('food', 1, 'עכבר'), entry('food', 2, 'גבינה'), entry('food', 3, 'לחם')]],
      ['animals', [entry('animals', 1, 'עכבר'), entry('animals', 2, 'חתול'), entry('animals', 3, 'כלב')]],
    ]);
    const rng = createSeededRng(7);
    let session: WordSession = EMPTY_WORD_SESSION;
    let picked = pickWord(['food'], session, rng, shared);
    session = picked.session;
    while (picked.entry.word !== 'עכבר') {
      picked = pickWord(['food'], session, rng, shared);
      session = picked.session;
    }
    // The animals copy is now used too, so the next two animal draws avoid it.
    expect(session.usedIds.has('animals:1')).toBe(true);
    const first = pickWord(['animals'], session, rng, shared);
    const second = pickWord(['animals'], first.session, rng, shared);
    expect([first.entry.word, second.entry.word].sort()).toEqual(['חתול', 'כלב']);
  });

  it('chooses among enabled categories with equal probability', () => {
    const rng = createSeededRng(99);
    const counts = { food: 0, animals: 0 };
    const trials = 6000;
    for (let i = 0; i < trials; i += 1) {
      const picked = pickWord(['food', 'animals'], EMPTY_WORD_SESSION, rng, library);
      counts[picked.entry.categoryId as 'food' | 'animals'] += 1;
    }
    expect(counts.food / trials).toBeGreaterThan(0.46);
    expect(counts.food / trials).toBeLessThan(0.54);
  });

  it('throws when no enabled category has words', () => {
    expect(() => pickWord([], EMPTY_WORD_SESSION, createSeededRng(1), library)).toThrow();
    expect(() => pickWord(['places'], EMPTY_WORD_SESSION, createSeededRng(1), library)).toThrow();
  });

  it('works against the real library for every category', () => {
    const rng = createSeededRng(5);
    let session: WordSession = EMPTY_WORD_SESSION;
    for (let i = 0; i < 300; i += 1) {
      const picked = pickWord(['everyday', 'music', 'nature'], session, rng);
      expect(['everyday', 'music', 'nature']).toContain(picked.entry.categoryId);
      expect(picked.entry.word.length).toBeGreaterThan(0);
      expect(picked.entry.hints.length).toBeGreaterThanOrEqual(3);
      session = picked.session;
    }
  });
});
