/** Generates a reasonably unique id for players and rounds. */
export function newId(prefix = 'id'): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') {
    return `${prefix}-${c.randomUUID()}`;
  }
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${time}-${rand}`;
}
