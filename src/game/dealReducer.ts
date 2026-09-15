import type { Round, RoundPlayer } from './round';

/**
 * Explicit state machine for handing out roles on one shared phone.
 *
 *   setup ──START_ROUND──▶ handoff(0, unarmed) ──ARM──▶ handoff(0, armed)
 *   handoff(armed) ──REVEAL──▶ revealed(i, unarmed) ──ARM──▶ revealed(i, armed)
 *   revealed(i) ──CONCEAL──▶ handoff(i, unarmed)            (interruption; same player)
 *   revealed(i, armed) ──CONCEAL_AND_ADVANCE──▶ handoff(i+1) | complete
 *   handoff | revealed ──ABANDON──▶ setup
 *   complete ──START_ROUND──▶ handoff(0)   complete ──BACK_TO_SETUP──▶ setup
 *
 * The `armed` flag makes the primary action a no-op for a short moment after
 * each screen appears, so a double tap can never reveal the next player's card
 * or skip the current player before they have seen theirs.
 */
export type DealState =
  | { readonly status: 'setup' }
  | { readonly status: 'handoff'; readonly round: Round; readonly index: number; readonly armed: boolean }
  | { readonly status: 'revealed'; readonly round: Round; readonly index: number; readonly armed: boolean }
  | { readonly status: 'complete'; readonly round: Round };

export type DealAction =
  | { readonly type: 'START_ROUND'; readonly round: Round }
  | { readonly type: 'ARM' }
  | { readonly type: 'REVEAL' }
  | { readonly type: 'CONCEAL' }
  | { readonly type: 'CONCEAL_AND_ADVANCE' }
  | { readonly type: 'ABANDON' }
  | { readonly type: 'BACK_TO_SETUP' };

export const INITIAL_DEAL_STATE: DealState = { status: 'setup' };

/** Delay before a freshly shown screen accepts its primary tap. */
export const ARM_DELAY_MS = 450;

export function dealReducer(state: DealState, action: DealAction): DealState {
  switch (action.type) {
    case 'START_ROUND': {
      if (state.status !== 'setup' && state.status !== 'complete') return state;
      if (action.round.players.length === 0) return state;
      return { status: 'handoff', round: action.round, index: 0, armed: false };
    }
    case 'ARM': {
      if (state.status !== 'handoff' && state.status !== 'revealed') return state;
      if (state.armed) return state;
      return { ...state, armed: true };
    }
    case 'REVEAL': {
      if (state.status !== 'handoff' || !state.armed) return state;
      return { status: 'revealed', round: state.round, index: state.index, armed: false };
    }
    case 'CONCEAL': {
      if (state.status !== 'revealed') return state;
      return { status: 'handoff', round: state.round, index: state.index, armed: false };
    }
    case 'CONCEAL_AND_ADVANCE': {
      if (state.status !== 'revealed' || !state.armed) return state;
      const next = state.index + 1;
      if (next >= state.round.players.length) {
        return { status: 'complete', round: state.round };
      }
      return { status: 'handoff', round: state.round, index: next, armed: false };
    }
    case 'ABANDON': {
      if (state.status === 'setup') return state;
      return INITIAL_DEAL_STATE;
    }
    case 'BACK_TO_SETUP': {
      if (state.status !== 'complete') return state;
      return INITIAL_DEAL_STATE;
    }
    default:
      return state;
  }
}

export function isDealing(state: DealState): boolean {
  return state.status === 'handoff' || state.status === 'revealed';
}

export function currentPlayer(state: DealState): RoundPlayer | null {
  if (state.status !== 'handoff' && state.status !== 'revealed') return null;
  return state.round.players[state.index] ?? null;
}
