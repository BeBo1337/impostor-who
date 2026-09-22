export interface Player {
  /** Stable internal id. Role assignment always refers to this, never to names or positions. */
  readonly id: string;
  readonly name: string;
}

export const MAX_NAME_LENGTH = 30;

/** Collapses internal whitespace, trims the ends and normalizes Unicode. */
export function normalizeName(raw: string): string {
  return raw.normalize('NFC').replace(/\s+/g, ' ').trim();
}

/** Key used to detect duplicate display names. */
export function nameKey(name: string): string {
  return normalizeName(name).toLocaleLowerCase('he');
}

type SegmenterLike = { segment(input: string): Iterable<unknown> };
type IntlWithSegmenter = typeof Intl & {
  Segmenter?: new (locale?: string, options?: { granularity: 'grapheme' }) => SegmenterLike;
};

let segmenter: SegmenterLike | null | undefined;

function getSegmenter(): SegmenterLike | null {
  if (segmenter !== undefined) return segmenter;
  const Ctor = (Intl as IntlWithSegmenter).Segmenter;
  segmenter = Ctor ? new Ctor(undefined, { granularity: 'grapheme' }) : null;
  return segmenter;
}

/** Counts user-perceived characters (grapheme clusters), so emoji count as one. */
export function countGraphemes(value: string): number {
  const seg = getSegmenter();
  if (seg) {
    let count = 0;
    for (const _ of seg.segment(value)) count += 1;
    return count;
  }
  return Array.from(value).length;
}

/** First user-perceived character, for avatars. */
export function firstGrapheme(value: string): string {
  const seg = getSegmenter();
  if (seg) {
    for (const part of seg.segment(value) as Iterable<{ segment: string }>) return part.segment;
    return '';
  }
  return Array.from(value)[0] ?? '';
}

export type NameError = 'empty' | 'tooLong' | 'duplicate';

export type NameValidation =
  | { readonly ok: true; readonly name: string }
  | { readonly ok: false; readonly error: NameError };

/**
 * Validates a proposed player name against the roster.
 * `excludeId` lets a player keep their own name while renaming.
 */
export function validateName(
  raw: string,
  roster: readonly Player[],
  excludeId?: string,
): NameValidation {
  const name = normalizeName(raw);
  if (name.length === 0) return { ok: false, error: 'empty' };
  if (countGraphemes(name) > MAX_NAME_LENGTH) return { ok: false, error: 'tooLong' };
  const key = nameKey(name);
  const clash = roster.some((p) => p.id !== excludeId && nameKey(p.name) === key);
  if (clash) return { ok: false, error: 'duplicate' };
  return { ok: true, name };
}

/**
 * Moves one player to a new position, keeping everyone else in order.
 * The roster order is the order the phone is passed in, so this is the
 * only thing that decides who hands the phone to whom.
 * Returns the same array when the move would change nothing.
 */
export function movePlayer(roster: readonly Player[], id: string, toIndex: number): readonly Player[] {
  const from = roster.findIndex((p) => p.id === id);
  if (from === -1) return roster;
  const to = Math.min(Math.max(Math.trunc(toIndex), 0), roster.length - 1);
  if (to === from) return roster;
  const next = [...roster];
  const [moved] = next.splice(from, 1);
  if (!moved) return roster;
  next.splice(to, 0, moved);
  return next;
}

export const AVATAR_TONE_COUNT = 6;

/** Stable avatar colour index derived from the player's id. */
export function avatarToneIndex(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash % AVATAR_TONE_COUNT;
}
