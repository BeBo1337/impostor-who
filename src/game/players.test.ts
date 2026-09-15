import { describe, expect, it } from 'vitest';
import { countGraphemes, firstGrapheme, normalizeName, validateName, type Player } from './players';

const roster: Player[] = [
  { id: '1', name: 'דנה' },
  { id: '2', name: 'Tom' },
];

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
