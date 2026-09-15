import type { CategoryId, WordEntry } from '../data/types';
import { newId } from './ids';
import type { Player } from './players';
import { defaultRng, pickOne, sampleDistinct, type Rng } from './random';
import { MIN_PLAYERS, maxImpostors } from './rules';
import { pickWord, type WordLibrary, type WordSession } from './words';

export interface RoundPlayer {
  readonly id: string;
  readonly name: string;
}

/** Everything about one round. Created once; never mutated while dealing. */
export interface Round {
  readonly id: string;
  /** Frozen copy of the roster in handout order. */
  readonly players: readonly RoundPlayer[];
  readonly impostorIds: ReadonlySet<string>;
  readonly entry: WordEntry;
  /** The one association shown to every impostor this round, drawn from `entry.hints`. */
  readonly hint: string;
  /**
   * The player who opens the conversation once every card has been seen.
   * Drawn uniformly from the whole roster, independently of roles, so it
   * reveals nothing about who the impostors are.
   */
  readonly starterId: string;
}

export type Role =
  | { readonly kind: 'word'; readonly word: string }
  | { readonly kind: 'impostor'; readonly hint: string };

export interface RoundInput {
  readonly players: readonly Player[];
  readonly categoryIds: readonly CategoryId[];
  readonly impostorCount: number;
}

export interface CreatedRound {
  readonly round: Round;
  readonly session: WordSession;
}

export function createRound(
  input: RoundInput,
  session: WordSession,
  rng: Rng = defaultRng,
  library?: WordLibrary,
): CreatedRound {
  const { players, categoryIds, impostorCount } = input;

  if (players.length < MIN_PLAYERS) {
    throw new Error(`createRound: need at least ${MIN_PLAYERS} players`);
  }
  if (new Set(players.map((p) => p.id)).size !== players.length) {
    throw new Error('createRound: player ids must be unique');
  }
  const max = maxImpostors(players.length);
  if (!Number.isInteger(impostorCount) || impostorCount < 1 || impostorCount > max) {
    throw new Error(`createRound: impostorCount must be between 1 and ${max}`);
  }
  if (categoryIds.length === 0) {
    throw new Error('createRound: at least one category is required');
  }

  const impostorIds = new Set(sampleDistinct(players, impostorCount, rng).map((p) => p.id));
  const picked = library ? pickWord(categoryIds, session, rng, library) : pickWord(categoryIds, session, rng);
  if (picked.entry.hints.length === 0) {
    throw new Error(`createRound: entry ${picked.entry.id} has no hints`);
  }
  const hint = pickOne(picked.entry.hints, rng);
  const starterId = pickOne(players, rng).id;

  const round: Round = {
    id: newId('round'),
    players: players.map((p) => ({ id: p.id, name: p.name })),
    impostorIds,
    entry: picked.entry,
    hint,
    starterId,
  };

  return { round, session: picked.session };
}

export function isImpostor(round: Round, playerId: string): boolean {
  return round.impostorIds.has(playerId);
}

/** The randomly drawn player who speaks first. Public information. */
export function starterOf(round: Round): RoundPlayer {
  const starter = round.players.find((p) => p.id === round.starterId);
  if (!starter) throw new Error('starterOf: starterId is not in the roster');
  return starter;
}

/** The private information for one player. Impostors never receive the word. */
export function roleFor(round: Round, playerId: string): Role {
  if (isImpostor(round, playerId)) {
    return { kind: 'impostor', hint: round.hint };
  }
  return { kind: 'word', word: round.entry.word };
}
