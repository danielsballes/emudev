export const ROUTE = Object.freeze({
  HOME: 'home',
  CREATE_CHARACTER: 'create-character',
});

/**
 * Sends players without a character to character creation, and players who already have one away
 * from it.
 * @param {{ meta: { requiresPlayer?: boolean, guestOnly?: boolean } }} to
 * @param {boolean} hasPlayer
 * @returns {true | { name: string }}
 */
export function resolvePlayerRoute(to, hasPlayer) {
  if (!hasPlayer && to.meta.requiresPlayer) {
    return { name: ROUTE.CREATE_CHARACTER };
  }
  if (hasPlayer && to.meta.guestOnly) {
    return { name: ROUTE.HOME };
  }
  return true;
}
