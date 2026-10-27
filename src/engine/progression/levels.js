/**
 * XP curve: reaching level `n` requires `XP_CURVE_FACTOR * n * (n - 1)` total XP.
 * Level 1 = 0 XP, level 2 = 100, level 3 = 300, level 4 = 600, level 5 = 1000…
 */
export const XP_CURVE_FACTOR = 50;

/**
 * Total XP needed to reach a level.
 * @param {number} level 1-based level.
 */
export function xpForLevel(level) {
  return XP_CURVE_FACTOR * level * (level - 1);
}

/**
 * Level reached with the given total XP.
 * @param {number} xp
 */
export function levelForXp(xp) {
  // Inverse of xpForLevel, then corrected for floating point rounding.
  let level = Math.max(1, Math.floor((1 + Math.sqrt(1 + (4 * xp) / XP_CURVE_FACTOR)) / 2));
  while (xpForLevel(level + 1) <= xp) {
    level += 1;
  }
  while (level > 1 && xpForLevel(level) > xp) {
    level -= 1;
  }
  return level;
}

/**
 * Everything the HUD needs to render the level and XP bar.
 * @param {number} xp Total XP.
 */
export function getLevelInfo(xp) {
  const level = levelForXp(xp);
  const levelStartXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  return {
    level,
    xp,
    levelStartXp,
    nextLevelXp,
    xpIntoLevel: xp - levelStartXp,
    xpToNextLevel: nextLevelXp - xp,
    progress: (xp - levelStartXp) / (nextLevelXp - levelStartXp),
  };
}
