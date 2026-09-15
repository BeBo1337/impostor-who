/** A source of uniform random numbers in [0, 1). */
export type Rng = () => number;

const TWO_POW_32 = 4294967296;

/** Uses the Web Crypto API when available, falling back to Math.random. */
export const defaultRng: Rng = () => {
  const c = globalThis.crypto;
  if (c && typeof c.getRandomValues === 'function') {
    const buf = new Uint32Array(1);
    c.getRandomValues(buf);
    return (buf[0] ?? 0) / TWO_POW_32;
  }
  return Math.random();
};

/** Deterministic generator (mulberry32) for tests and reproducible checks. */
export function createSeededRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / TWO_POW_32;
  };
}

/** Uniform integer in [0, maxExclusive). */
export function randomInt(maxExclusive: number, rng: Rng = defaultRng): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new RangeError(`randomInt: maxExclusive must be a positive integer, got ${maxExclusive}`);
  }
  const index = Math.floor(rng() * maxExclusive);
  return index >= maxExclusive ? maxExclusive - 1 : index;
}

export function pickOne<T>(items: readonly T[], rng: Rng = defaultRng): T {
  if (items.length === 0) throw new RangeError('pickOne: items is empty');
  return items[randomInt(items.length, rng)] as T;
}

/** Fisher–Yates shuffle. Returns a new array; never uses a random sort comparator. */
export function shuffle<T>(items: readonly T[], rng: Rng = defaultRng): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1, rng);
    const tmp = result[i] as T;
    result[i] = result[j] as T;
    result[j] = tmp;
  }
  return result;
}

/**
 * Selects `count` distinct items with equal probability for every item
 * (partial Fisher–Yates). Order of the result is random as well.
 */
export function sampleDistinct<T>(items: readonly T[], count: number, rng: Rng = defaultRng): T[] {
  if (!Number.isInteger(count) || count < 0 || count > items.length) {
    throw new RangeError(`sampleDistinct: count ${count} is out of range for ${items.length} items`);
  }
  const pool = items.slice();
  const result: T[] = [];
  for (let i = 0; i < count; i += 1) {
    const j = i + randomInt(pool.length - i, rng);
    const picked = pool[j] as T;
    pool[j] = pool[i] as T;
    pool[i] = picked;
    result.push(picked);
  }
  return result;
}
