import { DEFAULT_CATEGORY_IDS } from '../data/categories';
import type { CategoryId } from '../data/types';
import type { Player } from './players';
import { clampImpostorCount } from './rules';

export interface SetupState {
  readonly players: readonly Player[];
  readonly categoryIds: readonly CategoryId[];
  readonly impostorCount: number;
}

export type SetupAction =
  | { readonly type: 'ADD_PLAYER'; readonly player: Player }
  | { readonly type: 'RENAME_PLAYER'; readonly id: string; readonly name: string }
  | { readonly type: 'REMOVE_PLAYER'; readonly id: string }
  | { readonly type: 'SET_CATEGORIES'; readonly categoryIds: readonly CategoryId[] }
  | { readonly type: 'SET_IMPOSTOR_COUNT'; readonly count: number }
  | { readonly type: 'REPLACE'; readonly state: SetupState };

export const DEFAULT_SETUP: SetupState = {
  players: [],
  categoryIds: DEFAULT_CATEGORY_IDS,
  impostorCount: 1,
};

export function setupReducer(state: SetupState, action: SetupAction): SetupState {
  switch (action.type) {
    case 'ADD_PLAYER': {
      if (state.players.some((p) => p.id === action.player.id)) return state;
      // Adding players may raise the maximum but never changes the configured count.
      return { ...state, players: [...state.players, action.player] };
    }
    case 'RENAME_PLAYER': {
      return {
        ...state,
        players: state.players.map((p) => (p.id === action.id ? { ...p, name: action.name } : p)),
      };
    }
    case 'REMOVE_PLAYER': {
      const players = state.players.filter((p) => p.id !== action.id);
      if (players.length === state.players.length) return state;
      return {
        ...state,
        players,
        // Fewer players can lower the maximum, so the count is clamped automatically.
        impostorCount: clampImpostorCount(state.impostorCount, players.length),
      };
    }
    case 'SET_CATEGORIES': {
      return { ...state, categoryIds: Array.from(new Set(action.categoryIds)) };
    }
    case 'SET_IMPOSTOR_COUNT': {
      return { ...state, impostorCount: clampImpostorCount(action.count, state.players.length) };
    }
    case 'REPLACE':
      return action.state;
    default:
      return state;
  }
}
