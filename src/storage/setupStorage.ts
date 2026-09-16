import { isCategoryId } from '../data/categories';
import type { CategoryId } from '../data/types';
import { MAX_CUSTOM_WORDS, validateCustomWord, type CustomWord } from '../game/customWords';
import { validateName, type Player } from '../game/players';
import { clampImpostorCount } from '../game/rules';
import { DEFAULT_SETUP, type SetupState } from '../game/setupReducer';

export const STORAGE_KEY = 'mi-hamitchaze.setup';
/** Version 2 added the players' own words. Version 1 payloads still load. */
export const STORAGE_VERSION = 2;
const MAX_STORED_PLAYERS = 100;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface StoredSetupV2 {
  version: 2;
  players: { id: string; name: string }[];
  categoryIds: string[];
  impostorCount: number;
  customWords: { id: string; word: string; hints: string[] }[];
}

/** Returns localStorage when it is usable, or null when access is blocked. */
export function getSafeStorage(): StorageLike | null {
  try {
    const storage = globalThis.localStorage;
    if (!storage) return null;
    const probe = `${STORAGE_KEY}.probe`;
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizePlayers(raw: unknown): Player[] {
  const players: Player[] = [];
  const seenIds = new Set<string>();
  if (!Array.isArray(raw)) return players;
  for (const item of raw) {
    if (players.length >= MAX_STORED_PLAYERS) break;
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.name !== 'string') continue;
    if (item.id.length === 0 || item.id.length > 80 || seenIds.has(item.id)) continue;
    const check = validateName(item.name, players);
    if (!check.ok) continue;
    seenIds.add(item.id);
    players.push({ id: item.id, name: check.name });
  }
  return players;
}

function sanitizeCustomWords(raw: unknown): CustomWord[] {
  const words: CustomWord[] = [];
  const seenIds = new Set<string>();
  if (!Array.isArray(raw)) return words;
  for (const item of raw) {
    if (words.length >= MAX_CUSTOM_WORDS) break;
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.word !== 'string') continue;
    if (item.id.length === 0 || item.id.length > 80 || seenIds.has(item.id)) continue;
    const hints = Array.isArray(item.hints) ? item.hints.filter((h): h is string => typeof h === 'string') : [];
    const check = validateCustomWord(item.word, hints.join(','), words);
    if (!check.ok) continue;
    seenIds.add(item.id);
    words.push({ id: item.id, word: check.word, hints: check.hints });
  }
  return words;
}

/**
 * Converts anything that came out of storage into a valid setup state.
 * Unknown categories are dropped, broken players and words are skipped,
 * duplicates are removed and the impostor count is clamped to the roster.
 */
export function sanitizeSetup(raw: unknown): SetupState {
  if (!isRecord(raw) || (raw.version !== 1 && raw.version !== 2)) return DEFAULT_SETUP;

  const players = sanitizePlayers(raw.players);
  const customWords = raw.version === 2 ? sanitizeCustomWords(raw.customWords) : [];

  let categoryIds: CategoryId[] = [];
  if (Array.isArray(raw.categoryIds)) {
    categoryIds = Array.from(new Set(raw.categoryIds.filter(isCategoryId)));
  }
  if (customWords.length === 0) categoryIds = categoryIds.filter((id) => id !== 'custom');
  if (categoryIds.length === 0) categoryIds = [...DEFAULT_SETUP.categoryIds];

  const impostorCount = clampImpostorCount(
    typeof raw.impostorCount === 'number' ? raw.impostorCount : 1,
    players.length,
  );

  return { players, categoryIds, impostorCount, customWords };
}

export function loadSetup(storage: StorageLike | null = getSafeStorage()): SetupState {
  if (!storage) return DEFAULT_SETUP;
  try {
    const text = storage.getItem(STORAGE_KEY);
    if (!text) return DEFAULT_SETUP;
    return sanitizeSetup(JSON.parse(text));
  } catch {
    return DEFAULT_SETUP;
  }
}

export function saveSetup(state: SetupState, storage: StorageLike | null = getSafeStorage()): boolean {
  if (!storage) return false;
  const payload: StoredSetupV2 = {
    version: STORAGE_VERSION,
    players: state.players.map((p) => ({ id: p.id, name: p.name })),
    categoryIds: [...state.categoryIds],
    impostorCount: state.impostorCount,
    customWords: state.customWords.map((w) => ({ id: w.id, word: w.word, hints: [...w.hints] })),
  };
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}
