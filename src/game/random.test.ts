import { describe, expect, it } from 'vitest';
import { createSeededRng, pickOne, randomInt, sampleDistinct, shuffle } from './random';

describe('randomInt', () => {
  it('stays within range even when the source returns 1', () => {
    expect(randomInt(5, () => 1)).toBe(4);
    expect(randomInt(5, () => 0)).toBe(0);
    expect(randomInt(5, () => 0.999999)).toBe(4);
  });

  it('rejects a non-positive range', () => {
    expect(() => randomInt(0)).toThrow(RangeError);
  });
});

describe('shuffle', () => {
  it('returns a permutation and leaves the input untouched', () => {
    const rng = createSeededRng(7);
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const result = shuffle(input, rng);
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(result).not.toBe(input);
    expect([...result].sort((a, b) => a - b)).toEqual(input);
  });
});

describe('sampleDistinct', () => {
  it('returns exactly the requested number of distinct items', () => {
    const rng = createSeededRng(42);
    const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    for (let i = 0; i < 200; i += 1) {
      const picked = sampleDistinct(items, 3, rng);
      expect(picked).toHaveLength(3);
      expect(new Set(picked).size).toBe(3);
      for (const p of picked) expect(items).toContain(p);
    }
  });

  it('gives every item an equal chance', () => {
    const rng = createSeededRng(2024);
    const items = ['a', 'b', 'c', 'd', 'e'];
    const counts = new Map(items.map((i) => [i, 0]));
    const trials = 20000;
    for (let i = 0; i < trials; i += 1) {
      for (const p of sampleDistinct(items, 2, rng)) counts.set(p, (counts.get(p) ?? 0) + 1);
    }
    // Each item should be selected in ~40% of trials (2 of 5).
    for (const [item, count] of counts) {
      const share = count / trials;
      expect(share, `share of ${item}`).toBeGreaterThan(0.37);
      expect(share, `share of ${item}`).toBeLessThan(0.43);
    }
  });

  it('rejects impossible counts', () => {
    expect(() => sampleDistinct([1, 2], 3)).toThrow(RangeError);
    expect(() => sampleDistinct([1, 2], -1)).toThrow(RangeError);
  });
});

describe('pickOne', () => {
  it('throws on an empty list', () => {
    expect(() => pickOne([])).toThrow(RangeError);
  });
});
