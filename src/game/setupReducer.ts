import { DEFAULT_CATEGORY_IDS } from '../data/categories';
import type { CategoryId } from '../data/types';
import type { CustomWord } from './customWords';
import type { Player } from './players';
import { clampImpostorCount } from './rules';

export interface SetupState {
  readonly players: readonly Player[];
  readonly categoryIds: readonly CategoryId[];
  readonly impostorCount: number;
  /** The players' own words; selectable as the "custom" category once it has any. */
  readonly customWords: readonly CustomWord[];
}

export type SetupAction =
  | { readonly type: 'ADD_PLAYER'; readonly player: Player }
  | { readonly type: 'RENAME_PLAYER'; readonly id: string; readonly name: string }
  | { readonly type: 'REMOVE_PLAYER'; readonly id: string }
  | { readonly type: 'SET_CATEGORIES'; readonly categoryIds: readonly CategoryId[] }
  | { readonly type: 'SET_IMPOSTOR_COUNT'; readonly count: number }
  | { readonly type: 'ADD_CUSTOM_WORD'; readonly word: CustomWord }
  | { readonly type: 'UPDATE_CUSTOM_WORD'; readonly id: string; readonly word: string; readonly hints: readonly string[] }
  | { readonly type: 'REMOVE_CUSTOM_WORD'; readonly id: string }
  | { readonly type: 'REPLACE'; readonly state: SetupState };

export const DEFAULT_SETUP: SetupState = {
  players: [],
  categoryIds: DEFAULT_CATEGORY_IDS,
  impostorCount: 1,
  customWords: [],
};

/** The custom category can only be selected while it has words. */
function withCustomRule(categoryIds: readonly CategoryId[], customWords: readonly CustomWord[]): CategoryId[] {
  const unique = Array.from(new Set(categoryIds));
  return customWords.length > 0 ? unique : unique.filter((id) => id !== 'custom');
}

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
      return { ...state, categoryIds: withCustomRule(action.categoryIds, state.customWords) };
    }
    case 'SET_IMPOSTOR_COUNT': {
      return { ...state, impostorCount: clampImpostorCount(action.count, state.players.length) };
    }
    case 'ADD_CUSTOM_WORD': {
      if (state.customWords.some((w) => w.id === action.word.id)) return state;
      const customWords = [...state.customWords, action.word];
      // The first custom word switches the category on so it is playable right away.
      const categoryIds = state.categoryIds.includes('custom') ? state.categoryIds : [...state.categoryIds, 'custom' as const];
      return { ...state, customWords, categoryIds };
    }
    case 'UPDATE_CUSTOM_WORD': {
      return {
        ...state,
        customWords: state.customWords.map((w) =>
          w.id === action.id ? { ...w, word: action.word, hints: action.hints } : w,
        ),
      };
    }
    case 'REMOVE_CUSTOM_WORD': {
      const customWords = state.customWords.filter((w) => w.id !== action.id);
      if (customWords.length === state.customWords.length) return state;
      return { ...state, customWords, categoryIds: withCustomRule(state.categoryIds, customWords) };
    }
    case 'REPLACE':
      return action.state;
    default:
      return state;
  }
}
