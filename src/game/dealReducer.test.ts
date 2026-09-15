import { describe, expect, it } from 'vitest';
import { INITIAL_DEAL_STATE, currentPlayer, dealReducer, type DealAction, type DealState } from './dealReducer';
import type { Round } from './round';

const round: Round = {
  id: 'round-1',
  players: [
    { id: 'a', name: 'אורי' },
    { id: 'b', name: 'Bar' },
    { id: 'c', name: 'גל' },
    { id: 'd', name: 'דנה' },
  ],
  impostorIds: new Set(['c']),
  entry: { id: 'food:פיצה', categoryId: 'food', word: 'פיצה', hints: ['מפגש חברים', 'משולשים', 'איטליה'] },
  hint: 'מפגש חברים',
  starterId: 'b',
};

const run = (actions: DealAction[], from: DealState = INITIAL_DEAL_STATE): DealState =>
  actions.reduce(dealReducer, from);

const revealFirst = (): DealState => run([{ type: 'START_ROUND', round }, { type: 'ARM' }, { type: 'REVEAL' }]);

describe('dealReducer', () => {
  it('starts a round on the first player, unarmed', () => {
    const state = run([{ type: 'START_ROUND', round }]);
    expect(state).toEqual({ status: 'handoff', round, index: 0, armed: false });
    expect(currentPlayer(state)?.id).toBe('a');
  });

  it('ignores a reveal until the handoff screen is armed', () => {
    const unarmed = run([{ type: 'START_ROUND', round }, { type: 'REVEAL' }]);
    expect(unarmed.status).toBe('handoff');
    const armed = run([{ type: 'ARM' }, { type: 'REVEAL' }], unarmed);
    expect(armed).toEqual({ status: 'revealed', round, index: 0, armed: false });
  });

  it('treats a double tap on reveal as a single reveal', () => {
    const state = run([{ type: 'START_ROUND', round }, { type: 'ARM' }, { type: 'REVEAL' }, { type: 'REVEAL' }]);
    expect(state).toEqual({ status: 'revealed', round, index: 0, armed: false });
  });

  it('does not let reveal-then-hide in one burst skip the current player', () => {
    const state = run([{ type: 'CONCEAL_AND_ADVANCE' }], revealFirst());
    expect(state).toEqual({ status: 'revealed', round, index: 0, armed: false });
  });

  it('advances exactly one player on a double tap of hide-and-continue', () => {
    const state = run([{ type: 'ARM' }, { type: 'CONCEAL_AND_ADVANCE' }, { type: 'CONCEAL_AND_ADVANCE' }], revealFirst());
    expect(state).toEqual({ status: 'handoff', round, index: 1, armed: false });
  });

  it('does not let hide-then-reveal in one burst open the next card', () => {
    const state = run([{ type: 'ARM' }, { type: 'CONCEAL_AND_ADVANCE' }, { type: 'REVEAL' }], revealFirst());
    expect(state.status).toBe('handoff');
    expect(currentPlayer(state)?.id).toBe('b');
  });

  it('conceals on interruption without advancing, even before the card is armed', () => {
    const state = run([{ type: 'CONCEAL' }], revealFirst());
    expect(state).toEqual({ status: 'handoff', round, index: 0, armed: false });
    // A stray CONCEAL while already concealed changes nothing.
    expect(dealReducer(state, { type: 'CONCEAL' })).toBe(state);
  });

  it('completes only after every player has viewed their card', () => {
    let state = run([{ type: 'START_ROUND', round }]);
    for (let i = 0; i < round.players.length; i += 1) {
      expect(state.status).toBe('handoff');
      state = run([{ type: 'ARM' }, { type: 'REVEAL' }, { type: 'ARM' }], state);
      expect(state.status).toBe('revealed');
      if (i < round.players.length - 1) {
        state = dealReducer(state, { type: 'CONCEAL_AND_ADVANCE' });
        expect(state.status).not.toBe('complete');
      }
    }
    state = dealReducer(state, { type: 'CONCEAL_AND_ADVANCE' });
    expect(state).toEqual({ status: 'complete', round });
  });

  it('keeps the same round object through every transition', () => {
    let state = run([{ type: 'ARM' }, { type: 'CONCEAL_AND_ADVANCE' }], revealFirst());
    expect(state.status === 'handoff' && state.round).toBe(round);
    state = run([{ type: 'ARM' }, { type: 'REVEAL' }], state);
    expect(state.status === 'revealed' && state.round).toBe(round);
  });

  it('abandons back to setup from any dealing state and returns to setup after completion', () => {
    expect(dealReducer(revealFirst(), { type: 'ABANDON' })).toEqual(INITIAL_DEAL_STATE);
    const complete: DealState = { status: 'complete', round };
    expect(dealReducer(complete, { type: 'BACK_TO_SETUP' })).toEqual(INITIAL_DEAL_STATE);
    const next = { ...round, id: 'round-2' };
    expect(dealReducer(complete, { type: 'START_ROUND', round: next })).toEqual({
      status: 'handoff',
      round: next,
      index: 0,
      armed: false,
    });
  });

  it('ignores actions that are not valid for the current state', () => {
    const setup = INITIAL_DEAL_STATE;
    expect(dealReducer(setup, { type: 'REVEAL' })).toBe(setup);
    expect(dealReducer(setup, { type: 'CONCEAL_AND_ADVANCE' })).toBe(setup);
    expect(dealReducer(setup, { type: 'ARM' })).toBe(setup);
    const handoff = run([{ type: 'START_ROUND', round }]);
    expect(dealReducer(handoff, { type: 'START_ROUND', round })).toBe(handoff);
    expect(dealReducer(handoff, { type: 'CONCEAL_AND_ADVANCE' })).toBe(handoff);
    const armed = dealReducer(handoff, { type: 'ARM' });
    expect(dealReducer(armed, { type: 'ARM' })).toBe(armed);
  });
});
