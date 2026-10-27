import {
  isChapterCompleted,
  isLessonCompleted,
  isModuleCompleted,
  progressKey,
} from './progress.js';

const CRITERIA_CHECKS = {
  lesson: (save, module, criteria) => isLessonCompleted(save, module.id, criteria.id),
  chapter: (save, module, criteria) => isChapterCompleted(save, module, criteria.id),
  module: (save, module) => isModuleCompleted(save, module),
};

export function hasBadge(save, moduleId, badgeId) {
  return Object.hasOwn(save.badges, progressKey(moduleId, badgeId));
}

export function meetsBadgeCriteria(save, module, badge) {
  return CRITERIA_CHECKS[badge.criteria.type](save, module, badge.criteria);
}

/**
 * Badges of a module whose criteria are met but that the player does not own yet.
 * @param {object} save
 * @param {object} module
 */
export function findNewBadges(save, module) {
  return module.badges.filter(
    (badge) => !hasBadge(save, module.id, badge.id) && meetsBadgeCriteria(save, module, badge),
  );
}
