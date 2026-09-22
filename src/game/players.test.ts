import { describe, expect, it } from 'vitest';
import { countGraphemes, firstGrapheme, movePlayer, normalizeName, validateName, type Player } from './players';

const roster: Player[] = [
  { id: '1', name: 'דנה' },
  { id: '2', name: 'Tom' },
];

describe('movePlayer', () => {
  const four: Player[] = ['a', 'b', 'c', 'd'].map((id) => ({ id, name: id.toUpperCase() }));
  const ids = (list: readonly Player[]) => list.map((p) => p.id);

  it('moves a player down, closing the gap behind them', () => {
    expect(ids(movePlayer(four, 'a', 2))).toEqual(['b', 'c', 'a', 'd']);
  });

  it('moves a player up', () => {
    expect(ids(movePlayer(four, 'd', 1))).toEqual(['a', 'd', 'b', 'c']);
  });

  it('moves to either end', () => {
    expect(ids(movePlayer(four, 'c', 0))).toEqual(['c', 'a', 'b', 'd']);
    expect(ids(movePlayer(four, 'a', 3))).toEqual(['b', 'c', 'd', 'a']);
  });

  it('clamps out-of-range targets instead of dropping anyone', () => {
    expect(ids(movePlayer(four, 'c', -5))).toEqual(['c', 'a', 'b', 'd']);
    expect(ids(movePlayer(four, 'b', 99))).toEqual(['a', 'c', 'd', 'b']);
  });

  it('returns the same array when nothing would change', () => {
    expect(movePlayer(four, 'b', 1)).toBe(four);
    expect(movePlayer(four, 'missing', 0)).toBe(four);
    expect(movePlayer([], 'a', 0)).toEqual([]);
  });
});

describe('validateName', () => {
  it('trims and collapses whitespace', () => {
    expect(validateName('  יוסי   כהן ', roster)).toEqual({ ok: true, name: 'יוסי כהן' });
  });

  it('rejects empty names', () => {
    expect(validateName('   ', roster)).toEqual({ ok: false, error: 'empty' });
  });

  it('rejects duplicates after normalization, including case differences', () => {
    expect(validateName(' דנה ', roster)).toEqual({ ok: false, error: 'duplicate' });
    expect(validateName('tom', roster)).toEqual({ ok: false, error: 'duplicate' });
  });

  it('lets a player keep their own name while renaming', () => {
    expect(validateName('דנה', roster, '1')).toEqual({ ok: true, name: 'דנה' });
  });

  it('accepts emoji and mixed scripts, counting user-perceived characters', () => {
    expect(validateName('👩‍🚀 רוני 1', roster)).toEqual({ ok: true, name: '👩‍🚀 רוני 1' });
    expect(countGraphemes('👩‍🚀 רוני')).toBe(6);
    expect(firstGrapheme('👩‍🚀 רוני')).toBe('👩‍🚀');
  });

  it('limits names to 30 user-perceived characters', () => {
    expect(validateName('א'.repeat(30), roster).ok).toBe(true);
    expect(validateName('א'.repeat(31), roster)).toEqual({ ok: false, error: 'tooLong' });
    expect(validateName('🎉'.repeat(30), roster).ok).toBe(true);
  });

  it('normalizes to NFC', () => {
    expect(normalizeName('é')).toBe('é');
  });
});
