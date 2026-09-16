import { describe, expect, it } from 'vitest';
import { DEFAULT_SETUP } from '../game/setupReducer';
import { STORAGE_KEY, loadSetup, sanitizeSetup, saveSetup, type StorageLike } from './setupStorage';

class MemoryStorage implements StorageLike {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

const throwing: StorageLike = {
  getItem() {
    throw new Error('blocked');
  },
  setItem() {
    throw new Error('blocked');
  },
};

describe('setup storage', () => {
  it('returns defaults when storage is unavailable or throws', () => {
    expect(loadSetup(null)).toEqual(DEFAULT_SETUP);
    expect(loadSetup(throwing)).toEqual(DEFAULT_SETUP);
    expect(saveSetup(DEFAULT_SETUP, null)).toBe(false);
    expect(saveSetup(DEFAULT_SETUP, throwing)).toBe(false);
  });

  it('returns defaults for malformed JSON and unknown versions', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, '{not json');
    expect(loadSetup(storage)).toEqual(DEFAULT_SETUP);
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, players: [] }));
    expect(loadSetup(storage)).toEqual(DEFAULT_SETUP);
    storage.setItem(STORAGE_KEY, JSON.stringify([1, 2, 3]));
    expect(loadSetup(storage)).toEqual(DEFAULT_SETUP);
  });

  it('still loads version 1 payloads, with no custom words', () => {
    const state = sanitizeSetup({
      version: 1,
      players: [{ id: 'a', name: 'דנה' }],
      categoryIds: ['food', 'custom'],
      impostorCount: 1,
    });
    expect(state.players).toEqual([{ id: 'a', name: 'דנה' }]);
    expect(state.customWords).toEqual([]);
    // "custom" cannot stay selected without words.
    expect(state.categoryIds).toEqual(['food']);
  });

  it('drops broken players, duplicate names and duplicate ids', () => {
    const state = sanitizeSetup({
      version: 2,
      players: [
        { id: 'a', name: 'דנה' },
        { id: 'b', name: '  דנה ' },
        { id: 'a', name: 'אחר' },
        { id: 'c', name: '' },
        { id: 'd' },
        'garbage',
        { id: 'e', name: 'Tom' },
      ],
      categoryIds: ['food'],
      impostorCount: 1,
      customWords: [],
    });
    expect(state.players).toEqual([
      { id: 'a', name: 'דנה' },
      { id: 'e', name: 'Tom' },
    ]);
  });

  it('drops unknown categories and falls back to defaults when none remain', () => {
    const some = sanitizeSetup({ version: 2, players: [], categoryIds: ['food', 'nope', 'food'], impostorCount: 1 });
    expect(some.categoryIds).toEqual(['food']);
    const none = sanitizeSetup({ version: 2, players: [], categoryIds: ['nope'], impostorCount: 1 });
    expect(none.categoryIds).toEqual(DEFAULT_SETUP.categoryIds);
    const missing = sanitizeSetup({ version: 2, players: [], impostorCount: 1 });
    expect(missing.categoryIds).toEqual(DEFAULT_SETUP.categoryIds);
  });

  it('keeps valid custom words, skips broken ones and keeps the custom category only with words', () => {
    const state = sanitizeSetup({
      version: 2,
      players: [],
      categoryIds: ['custom', 'food'],
      impostorCount: 1,
      customWords: [
        { id: 'w1', word: 'הכלב של השכנים', hints: ['נביחות', 'לילה'] },
        { id: 'w2', word: 'בלי רמז', hints: [] },
        { id: 'w3', word: 'פיצה', hints: ['פיצה'] },
        { id: 'w1', word: 'כפול', hints: ['רמז'] },
        { id: 'w4', word: '  הכלב של השכנים', hints: ['שוב'] },
        { id: 'w5', word: 'תקין', hints: ['רמז', 7, null] },
        'garbage',
      ],
    });
    expect(state.customWords).toEqual([
      { id: 'w1', word: 'הכלב של השכנים', hints: ['נביחות', 'לילה'] },
      { id: 'w5', word: 'תקין', hints: ['רמז'] },
    ]);
    expect(state.categoryIds).toEqual(['custom', 'food']);

    const empty = sanitizeSetup({ version: 2, players: [], categoryIds: ['custom', 'food'], impostorCount: 1, customWords: [] });
    expect(empty.categoryIds).toEqual(['food']);
  });

  it('clamps the impostor count to the restored roster', () => {
    const players = Array.from({ length: 4 }, (_, i) => ({ id: `p${i}`, name: `שחקן ${i}` }));
    expect(sanitizeSetup({ version: 2, players, categoryIds: ['food'], impostorCount: 3 }).impostorCount).toBe(1);
    expect(sanitizeSetup({ version: 2, players, categoryIds: ['food'], impostorCount: 'two' }).impostorCount).toBe(1);
    const seven = Array.from({ length: 7 }, (_, i) => ({ id: `p${i}`, name: `שחקן ${i}` }));
    expect(sanitizeSetup({ version: 2, players: seven, categoryIds: ['food'], impostorCount: 2 }).impostorCount).toBe(2);
  });

  it('round-trips a valid setup including custom words', () => {
    const storage = new MemoryStorage();
    const state = {
      players: [
        { id: 'a', name: 'דנה' },
        { id: 'b', name: 'Tom' },
        { id: 'c', name: '🎉 רוני' },
      ],
      categoryIds: ['custom', 'music', 'nature'] as const,
      impostorCount: 1,
      customWords: [{ id: 'w1', word: 'הכלב של השכנים', hints: ['נביחות', 'לילה'] }],
    };
    expect(saveSetup(state, storage)).toBe(true);
    expect(loadSetup(storage)).toEqual(state);
  });
});
