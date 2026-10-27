import { findNewBadges } from './badges.js';
import { levelForXp } from './levels.js';
import { isLessonCompleted, isLessonUnlocked, progressKey } from './progress.js';

export class ProgressionError extends Error {
  /**
   * @param {'unknown-lesson' | 'locked-lesson'} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    this.name = 'ProgressionError';
    this.code = code;
  }
}

/**
 * Marks a lesson as completed, awarding its XP and any badge it unlocks. Pure: returns a new save.
 * Completing an already completed lesson changes nothing.
 * @param {object} save
 * @param {object} registry
 * @param {{ moduleId: string, lessonId: string, now?: Date }} target
 */
export function completeLesson(save, registry, { moduleId, lessonId, now = new Date() }) {
  const lesson = registry.getLesson(moduleId, lessonId);
  if (!lesson) {
    throw new ProgressionError('unknown-lesson', `Unknown lesson ${moduleId}/${lessonId}`);
  }
  if (isLessonCompleted(save, moduleId, lessonId)) {
    return { save, xpGained: 0, newBadges: [], levelUp: null, isAlreadyCompleted: true };
  }
  if (!isLessonUnlocked(save, registry, { moduleId, lessonId })) {
    throw new ProgressionError('locked-lesson', `Lesson ${moduleId}/${lessonId} is locked`);
  }

  const timestamp = now.toISOString();
  const next = structuredClone(save);
  next.xp += lesson.xp;
  next.lessons[progressKey(moduleId, lessonId)] = { completedAt: timestamp, xpAwarded: lesson.xp };

  const newBadges = findNewBadges(next, registry.getModule(moduleId));
  for (const badge of newBadges) {
    next.badges[progressKey(moduleId, badge.id)] = { earnedAt: timestamp };
  }

  const previousLevel = levelForXp(save.xp);
  const level = levelForXp(next.xp);
  return {
    save: next,
    xpGained: lesson.xp,
    newBadges,
    levelUp: level > previousLevel ? { from: previousLevel, to: level } : null,
    isAlreadyCompleted: false,
  };
}
