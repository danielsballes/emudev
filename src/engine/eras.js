/**
 * Visual eras, from the oldest to the most modern. The UI evolves through them as the player
 * unlocks modules (see PLAN.md, "Visual eras").
 */
export const ERAS = Object.freeze([
  'terminal',
  'chip8',
  'gameboy',
  'nes',
  'gba',
  'early-3d',
  'modern',
]);

/**
 * Eras that already have a theme in `src/themes/`. Others fall back to the closest older one.
 */
export const IMPLEMENTED_ERAS = Object.freeze(['terminal', 'chip8']);

export const FIRST_ERA = ERAS[0];

const eraRank = (era) => ERAS.indexOf(era);

/**
 * Returns the given era if it has a theme, otherwise the closest older era that has one.
 * @param {string} era
 */
export function resolveImplementedEra(era) {
  const rank = eraRank(era);
  const candidates = IMPLEMENTED_ERAS.filter((implemented) => eraRank(implemented) <= rank);
  return candidates.at(-1) ?? FIRST_ERA;
}

/**
 * The most modern era of a list, or the first era when the list is empty.
 * @param {string[]} eras
 */
export function latestEra(eras) {
  return eras.toSorted((left, right) => eraRank(left) - eraRank(right)).at(-1) ?? FIRST_ERA;
}
