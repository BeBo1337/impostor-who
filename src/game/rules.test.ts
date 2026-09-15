import { describe, expect, it } from 'vitest';
import { checkCanStart, clampImpostorCount, maxImpostors } from './rules';

const players = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `שחקן ${i}` }));

describe('maxImpostors', () => {
  it.each([
    [3, 1],
    [4, 1],
    [5, 1],
    [6, 2],
    [7, 2],
    [10, 2],
    [11, 3],
    [15, 3],
    [16, 4],
    [20, 4],
    [21, 5],
    [30, 6],
  ])('%i players allow %i impostors', (count, expected) => {
    expect(maxImpostors(count)).toBe(expected);
  });

  it('reports 1 for rosters that are too small, so the control never shows zero', () => {
    expect(maxImpostors(0)).toBe(1);
    expect(maxImpostors(2)).toBe(1);
  });
});

describe('clampImpostorCount', () => {
  it('reduces the count when the roster shrinks below the maximum', () => {
    expect(clampImpostorCount(2, 5)).toBe(1);
    expect(clampImpostorCount(3, 10)).toBe(2);
    expect(clampImpostorCount(4, 15)).toBe(3);
  });

  it('keeps a valid count unchanged', () => {
    expect(clampImpostorCount(2, 7)).toBe(2);
    expect(clampImpostorCount(1, 3)).toBe(1);
  });

  it('never goes below one and rejects garbage', () => {
    expect(clampImpostorCount(0, 8)).toBe(1);
    expect(clampImpostorCount(-5, 8)).toBe(1);
    expect(clampImpostorCount(Number.NaN, 8)).toBe(1);
    expect(clampImpostorCount(2.7, 12)).toBe(2);
  });
});

describe('checkCanStart', () => {
  const categoryIds = ['food'] as const;

  it('requires at least three players', () => {
    expect(checkCanStart({ players: players(2), categoryIds, impostorCount: 1 })).toEqual({
      ok: false,
      reason: 'players',
    });
  });

  it('requires at least one category', () => {
    expect(checkCanStart({ players: players(4), categoryIds: [], impostorCount: 1 })).toEqual({
      ok: false,
      reason: 'categories',
    });
  });

  it('rejects an impostor count above the maximum', () => {
    expect(checkCanStart({ players: players(4), categoryIds, impostorCount: 2 })).toEqual({
      ok: false,
      reason: 'impostors',
    });
  });

  it('accepts a valid setup', () => {
    expect(checkCanStart({ players: players(7), categoryIds, impostorCount: 2 })).toEqual({ ok: true });
  });
});
