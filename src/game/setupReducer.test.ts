import { describe, expect, it } from 'vitest';
import { DEFAULT_SETUP, setupReducer, type SetupState } from './setupReducer';

const withPlayers = (n: number, impostorCount = 1): SetupState => ({
  players: Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `שחקן ${i + 1}` })),
  categoryIds: ['food'],
  impostorCount,
  customWords: [],
});

describe('setupReducer', () => {
  it('starts with an empty roster, one impostor, the three default categories and no custom words', () => {
    expect(DEFAULT_SETUP.players).toEqual([]);
    expect(DEFAULT_SETUP.impostorCount).toBe(1);
    expect(DEFAULT_SETUP.categoryIds).toEqual(['everyday', 'celebrities', 'food']);
    expect(DEFAULT_SETUP.customWords).toEqual([]);
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

  it('reorders the handout order without touching the impostor count', () => {
    const state = setupReducer(withPlayers(6, 2), { type: 'MOVE_PLAYER', id: 'p4', toIndex: 0 });
    expect(state.players.map((p) => p.id)).toEqual(['p4', 'p0', 'p1', 'p2', 'p3', 'p5']);
    expect(state.impostorCount).toBe(2);
  });

  it('ignores moves that change nothing', () => {
    const state = withPlayers(4);
    expect(setupReducer(state, { type: 'MOVE_PLAYER', id: 'p2', toIndex: 2 })).toBe(state);
    expect(setupReducer(state, { type: 'MOVE_PLAYER', id: 'gone', toIndex: 0 })).toBe(state);
  });

  it('deduplicates category ids and drops the custom category while it has no words', () => {
    const state = setupReducer(DEFAULT_SETUP, { type: 'SET_CATEGORIES', categoryIds: ['food', 'food', 'music', 'custom'] });
    expect(state.categoryIds).toEqual(['food', 'music']);
  });

  it('switches the custom category on with the first custom word', () => {
    const state = setupReducer(withPlayers(3), {
      type: 'ADD_CUSTOM_WORD',
      word: { id: 'w1', word: 'הכלב של השכנים', hints: ['נביחות'] },
    });
    expect(state.customWords).toHaveLength(1);
    expect(state.categoryIds).toEqual(['food', 'custom']);
    // A second word keeps the selection as it is.
    const again = setupReducer(state, { type: 'ADD_CUSTOM_WORD', word: { id: 'w2', word: 'עוד', hints: ['רמז'] } });
    expect(again.categoryIds).toEqual(['food', 'custom']);
  });

  it('updates a custom word in place and deselects the category when the last word goes', () => {
    let state = setupReducer(withPlayers(3), {
      type: 'ADD_CUSTOM_WORD',
      word: { id: 'w1', word: 'מילה', hints: ['רמז'] },
    });
    state = setupReducer(state, { type: 'UPDATE_CUSTOM_WORD', id: 'w1', word: 'מילה אחרת', hints: ['רמז', 'עוד רמז'] });
    expect(state.customWords).toEqual([{ id: 'w1', word: 'מילה אחרת', hints: ['רמז', 'עוד רמז'] }]);
    state = setupReducer(state, { type: 'REMOVE_CUSTOM_WORD', id: 'w1' });
    expect(state.customWords).toEqual([]);
    expect(state.categoryIds).toEqual(['food']);
  });

  it('lets the custom category be chosen once words exist', () => {
    const withWord = setupReducer(withPlayers(3), {
      type: 'ADD_CUSTOM_WORD',
      word: { id: 'w1', word: 'מילה', hints: ['רמז'] },
    });
    const onlyCustom = setupReducer(withWord, { type: 'SET_CATEGORIES', categoryIds: ['custom'] });
    expect(onlyCustom.categoryIds).toEqual(['custom']);
  });
});
