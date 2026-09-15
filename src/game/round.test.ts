import { describe, expect, it } from 'vitest';
import type { CategoryId, WordEntry } from '../data/types';
import { WORDS_BY_CATEGORY } from '../data/words';
import type { Player } from './players';
import { createSeededRng } from './random';
import { createRound, isImpostor, roleFor, starterOf } from './round';
import { EMPTY_WORD_SESSION, type WordLibrary } from './words';

const roster = (n: number): Player[] => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `שחקן ${i + 1}` }));

describe('createRound', () => {
  it('assigns exactly the requested number of distinct impostors', () => {
    const rng = createSeededRng(8);
    for (let trial = 0; trial < 100; trial += 1) {
      const players = roster(7);
      const { round } = createRound({ players, categoryIds: ['food'], impostorCount: 2 }, EMPTY_WORD_SESSION, rng);
      expect(round.impostorIds.size).toBe(2);
      const impostors = players.filter((p) => isImpostor(round, p.id));
      expect(impostors).toHaveLength(2);
    }
  });

  it('gives all ordinary players the same word and impostors the same matching hint without the word', () => {
    const rng = createSeededRng(21);
    const players = roster(7);
    const { round } = createRound({ players, categoryIds: ['animals'], impostorCount: 2 }, EMPTY_WORD_SESSION, rng);

    const words = new Set<string>();
    const hints = new Set<string>();
    let impostorCount = 0;
    for (const p of players) {
      const role = roleFor(round, p.id);
      if (role.kind === 'word') {
        words.add(role.word);
      } else {
        impostorCount += 1;
        hints.add(role.hint);
        expect(role).not.toHaveProperty('word');
        expect(role.hint).not.toBe(round.entry.word);
      }
    }
    expect(words.size).toBe(1);
    expect([...words][0]).toBe(round.entry.word);
    expect(impostorCount).toBe(2);
    expect(hints.size).toBe(1);
    expect([...hints][0]).toBe(round.hint);
    expect(round.entry.hints).toContain(round.hint);
  });

  it('draws the hint from the entry with every hint getting a turn', () => {
    const rng = createSeededRng(5);
    const seen = new Set<string>();
    const players = roster(3);
    const custom: WordLibrary = new Map<CategoryId, readonly WordEntry[]>([
      ['food', [{ id: 'food:פיצה', categoryId: 'food', word: 'פיצה', hints: ['מפגש חברים', 'משולשים', 'איטליה'] }]],
    ]);
    for (let i = 0; i < 200; i += 1) {
      const { round } = createRound({ players, categoryIds: ['food'], impostorCount: 1 }, EMPTY_WORD_SESSION, rng, custom);
      expect(['מפגש חברים', 'משולשים', 'איטליה']).toContain(round.hint);
      seen.add(round.hint);
    }
    expect(seen.size).toBe(3);
  });

  it('selects content only from the enabled categories', () => {
    const rng = createSeededRng(13);
    const enabled: CategoryId[] = ['sports', 'science'];
    const allowed = new Set([
      ...(WORDS_BY_CATEGORY.get('sports') ?? []).map((e) => e.id),
      ...(WORDS_BY_CATEGORY.get('science') ?? []).map((e) => e.id),
    ]);
    let session = EMPTY_WORD_SESSION;
    for (let trial = 0; trial < 200; trial += 1) {
      const created = createRound({ players: roster(4), categoryIds: enabled, impostorCount: 1 }, session, rng);
      expect(enabled).toContain(created.round.entry.categoryId);
      expect(allowed.has(created.round.entry.id)).toBe(true);
      session = created.session;
    }
  });

  it('gives every player an equal chance of being the impostor', () => {
    const rng = createSeededRng(77);
    const players = roster(4);
    const counts = new Map(players.map((p) => [p.id, 0]));
    const trials = 8000;
    for (let i = 0; i < trials; i += 1) {
      const { round } = createRound({ players, categoryIds: ['food'], impostorCount: 1 }, EMPTY_WORD_SESSION, rng);
      for (const id of round.impostorIds) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    for (const [id, count] of counts) {
      expect(count / trials, id).toBeGreaterThan(0.22);
      expect(count / trials, id).toBeLessThan(0.28);
    }
  });

  it('draws an opening player from the roster with equal chances, regardless of role', () => {
    const rng = createSeededRng(31);
    const players = roster(4);
    const counts = new Map(players.map((p) => [p.id, 0]));
    let starterWasImpostor = 0;
    const trials = 8000;
    for (let i = 0; i < trials; i += 1) {
      const { round } = createRound({ players, categoryIds: ['food'], impostorCount: 1 }, EMPTY_WORD_SESSION, rng);
      const starter = starterOf(round);
      expect(players.map((p) => p.id)).toContain(starter.id);
      expect(starter.id).toBe(round.starterId);
      counts.set(starter.id, (counts.get(starter.id) ?? 0) + 1);
      if (isImpostor(round, starter.id)) starterWasImpostor += 1;
    }
    for (const [id, count] of counts) {
      expect(count / trials, id).toBeGreaterThan(0.22);
      expect(count / trials, id).toBeLessThan(0.28);
    }
    // With one impostor among four, the opener should be the impostor about a quarter of the time.
    expect(starterWasImpostor / trials).toBeGreaterThan(0.21);
    expect(starterWasImpostor / trials).toBeLessThan(0.29);
  });

  it('keeps the roster order and copies names into the round', () => {
    const players = roster(5);
    const { round } = createRound({ players, categoryIds: ['food'], impostorCount: 1 }, EMPTY_WORD_SESSION, createSeededRng(1));
    expect(round.players.map((p) => p.id)).toEqual(players.map((p) => p.id));
    expect(round.players.map((p) => p.name)).toEqual(players.map((p) => p.name));
  });

  it('uses the provided library when given', () => {
    const custom: WordLibrary = new Map<CategoryId, readonly WordEntry[]>([
      ['food', [{ id: 'x-1', categoryId: 'food', word: 'פיצה', hints: ['מפגש חברים', 'משולשים', 'איטליה'] }]],
    ]);
    const { round } = createRound(
      { players: roster(3), categoryIds: ['food'], impostorCount: 1 },
      EMPTY_WORD_SESSION,
      createSeededRng(1),
      custom,
    );
    expect(round.entry.id).toBe('x-1');
  });

  it('rejects invalid input', () => {
    const rng = createSeededRng(1);
    expect(() => createRound({ players: roster(2), categoryIds: ['food'], impostorCount: 1 }, EMPTY_WORD_SESSION, rng)).toThrow();
    expect(() => createRound({ players: roster(4), categoryIds: ['food'], impostorCount: 2 }, EMPTY_WORD_SESSION, rng)).toThrow();
    expect(() => createRound({ players: roster(4), categoryIds: ['food'], impostorCount: 0 }, EMPTY_WORD_SESSION, rng)).toThrow();
    expect(() => createRound({ players: roster(4), categoryIds: [], impostorCount: 1 }, EMPTY_WORD_SESSION, rng)).toThrow();
    const dup: Player[] = [
      { id: 'a', name: 'א' },
      { id: 'a', name: 'ב' },
      { id: 'c', name: 'ג' },
    ];
    expect(() => createRound({ players: dup, categoryIds: ['food'], impostorCount: 1 }, EMPTY_WORD_SESSION, rng)).toThrow();
  });
});
