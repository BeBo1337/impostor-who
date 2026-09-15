import { describe, expect, it } from 'vitest';
import { DEFAULT_SETUP, setupReducer, type SetupState } from './setupReducer';

const withPlayers = (n: number, impostorCount = 1): SetupState => ({
  players: Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `שחקן ${i + 1}` })),
  categoryIds: ['food'],
  impostorCount,
});

describe('setupReducer', () => {
  it('starts with an empty roster, one impostor and the three default categories', () => {
    expect(DEFAULT_SETUP.players).toEqual([]);
    expect(DEFAULT_SETUP.impostorCount).toBe(1);
    expect(DEFAULT_SETUP.categoryIds).toEqual(['everyday', 'celebrities', 'food']);
  });

  it('adding players raises the maximum but never the configured count', () => {
    let state = withPlayers(5, 1);
    state = setupReducer(state, { type: 'ADD_PLAYER', player: { id: 'new', name: 'נועה' } });
    expect(state.players).toHaveLength(6);
    expect(state.impostorCount).toBe(1);
  });

  it('removing players clamps the configured count to the new maximum', () => {
    let state = withPlayers(6, 2);
    state = setupReducer(state, { type: 'REMOVE_PLAYER', id: 'p0' });
    expect(state.players).toHaveLength(5);
    expect(state.impostorCount).toBe(1);
  });

  it('keeps the count when removal does not change the maximum', () => {
    let state = withPlayers(8, 2);
    state = setupReducer(state, { type: 'REMOVE_PLAYER', id: 'p3' });
    expect(state.impostorCount).toBe(2);
  });

  it('clamps explicit count changes', () => {
    const state = withPlayers(7, 1);
    expect(setupReducer(state, { type: 'SET_IMPOSTOR_COUNT', count: 5 }).impostorCount).toBe(2);
    expect(setupReducer(state, { type: 'SET_IMPOSTOR_COUNT', count: 0 }).impostorCount).toBe(1);
  });

  it('renames by id and ignores duplicate ids on add', () => {
    let state = withPlayers(3);
    state = setupReducer(state, { type: 'RENAME_PLAYER', id: 'p1', name: 'Dana 🎉' });
    expect(state.players[1]?.name).toBe('Dana 🎉');
    const same = setupReducer(state, { type: 'ADD_PLAYER', player: { id: 'p1', name: 'אחר' } });
    expect(same).toBe(state);
  });

  it('deduplicates category ids', () => {
    const state = setupReducer(DEFAULT_SETUP, { type: 'SET_CATEGORIES', categoryIds: ['food', 'food', 'music'] });
    expect(state.categoryIds).toEqual(['food', 'music']);
  });
});
