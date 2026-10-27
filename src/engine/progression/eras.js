import { ERAS, FIRST_ERA, latestEra, resolveImplementedEra } from '../eras.js';
import { isModuleUnlocked } from './progress.js';

/**
 * Eras the player has reached: the first era plus the era of every unlocked module.
 * Returned oldest first.
 * @param {object} save
 * @param {object} registry
 * @returns {string[]}
 */
export function getUnlockedEras(save, registry) {
  const reached = new Set([FIRST_ERA]);
  for (const module of registry.modules) {
    if (isModuleUnlocked(save, registry, module.id)) {
      reached.add(module.era);
    }
  }
  return ERAS.filter((era) => reached.has(era));
}

/**
 * Era used by the shell (world map, HUD, profile): the chosen skin when it is unlocked, otherwise
 * the most modern unlocked era. Always resolved to an era that has a theme.
 * @param {object} save
 * @param {object} registry
 */
export function getShellEra(save, registry) {
  const unlocked = getUnlockedEras(save, registry);
  const era = unlocked.includes(save.skin) ? save.skin : latestEra(unlocked);
  return resolveImplementedEra(era);
}
