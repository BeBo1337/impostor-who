import type { CategoryId } from '../data/types';
import type { Player } from './players';

export const MIN_PLAYERS = 3;
export const PLAYERS_PER_IMPOSTOR = 5;

/**
 * Maximum number of impostors for a roster: one per five players, rounded up.
 * 3–5 → 1, 6–10 → 2, 11–15 → 3, 16–20 → 4, and so on.
 * Rosters smaller than the minimum still report 1 so the control stays sane.
 */
export function maxImpostors(playerCount: number): number {
  if (!Number.isFinite(playerCount) || playerCount < MIN_PLAYERS) return 1;
  return Math.max(1, Math.ceil(playerCount / PLAYERS_PER_IMPOSTOR));
}

/** Coerces any configured count into the valid integer range for the roster. */
export function clampImpostorCount(count: number, playerCount: number): number {
  const max = maxImpostors(playerCount);
  if (!Number.isFinite(count)) return 1;
  return Math.min(Math.max(1, Math.trunc(count)), max);
}

export interface SetupSnapshot {
  readonly players: readonly Player[];
  readonly categoryIds: readonly CategoryId[];
  readonly impostorCount: number;
}

export type StartCheck =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: 'players' | 'categories' | 'impostors' };

/** Whether a round can start, and if not, the first reason to show the user. */
export function checkCanStart(setup: SetupSnapshot): StartCheck {
  if (setup.players.length < MIN_PLAYERS) return { ok: false, reason: 'players' };
  if (setup.categoryIds.length === 0) return { ok: false, reason: 'categories' };
  const max = maxImpostors(setup.players.length);
  if (!Number.isInteger(setup.impostorCount) || setup.impostorCount < 1 || setup.impostorCount > max) {
    return { ok: false, reason: 'impostors' };
  }
  return { ok: true };
}
