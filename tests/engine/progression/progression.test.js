import { describe, expect, it } from 'vitest';

import { createFixtureModule, createSingleLessonModule } from '../../fixtures/modules.js';
import { createRegistry } from '@/engine/registry/index.js';
import { createEmptySave } from '@/engine/storage/index.js';
import {
  completeLesson,
  findNewBadges,
  getLevelInfo,
  getModuleProgress,
  isChapterCompleted,
  isLessonUnlocked,
  isModuleCompleted,
  isModuleUnlocked,
  levelForXp,
  ProgressionError,
  xpForLevel,
} from '@/engine/progression/index.js';

const NOW = new Date('2026-10-27T12:00:00.000Z');

const registry = createRegistry([
  createSingleLessonModule('zero', 1),
  createFixtureModule({ order: 2, requires: ['zero'] }),
]);

function completeAll(save, moduleId, lessonIds) {
  let current = save;
  for (const lessonId of lessonIds) {
    current = completeLesson(current, registry, { moduleId, lessonId, now: NOW }).save;
  }
  return current;
}

const zeroDone = () => completeAll(createEmptySave(), 'zero', ['only-lesson']);

describe('levels', () => {
  it.each([
    [1, 0],
    [2, 100],
    [3, 300],
    [4, 600],
    [5, 1000],
  ])('level %i needs %i xp', (level, xp) => {
    expect(xpForLevel(level)).toBe(xp);
    expect(levelForXp(xp)).toBe(level);
    expect(levelForXp(xp - 1)).toBe(Math.max(1, level - 1));
  });

  it('handles large xp values exactly', () => {
    for (let level = 1; level <= 500; level += 1) {
      expect(levelForXp(xpForLevel(level))).toBe(level);
    }
  });

  it('describes progress inside the current level', () => {
    expect(getLevelInfo(150)).toEqual({
      level: 2,
      xp: 150,
      levelStartXp: 100,
      nextLevelXp: 300,
      xpIntoLevel: 50,
      xpToNextLevel: 150,
      progress: 0.25,
    });
  });
});

describe('unlocks', () => {
  it('unlocks modules when their requirements are completed', () => {
    expect(isModuleUnlocked(createEmptySave(), registry, 'zero')).toBe(true);
    expect(isModuleUnlocked(createEmptySave(), registry, 'alpha')).toBe(false);
    expect(isModuleUnlocked(zeroDone(), registry, 'alpha')).toBe(true);
    expect(isModuleUnlocked(createEmptySave(), registry, 'missing')).toBe(false);
  });

  it('treats unknown requirements as locked', () => {
    const fakeRegistry = {
      getModule: (id) => (id === 'solo' ? { id, requires: ['ghost'] } : undefined),
    };

    expect(isModuleUnlocked(createEmptySave(), fakeRegistry, 'solo')).toBe(false);
  });

  it('unlocks lessons one after another', () => {
    const save = completeAll(zeroDone(), 'alpha', ['intro']);
    const unlocked = (lessonId) =>
      isLessonUnlocked(save, registry, { moduleId: 'alpha', lessonId });

    expect(unlocked('intro')).toBe(true);
    expect(unlocked('first-code')).toBe(true);
    expect(unlocked('quiz-time')).toBe(false);
    expect(unlocked('missing')).toBe(false);
  });

  it('keeps every lesson locked while the module is locked', () => {
    expect(
      isLessonUnlocked(createEmptySave(), registry, { moduleId: 'alpha', lessonId: 'intro' }),
    ).toBe(false);
  });
});

describe('progress', () => {
  it('reports chapter, module and overall progress', () => {
    const module = registry.getModule('alpha');
    const save = completeAll(zeroDone(), 'alpha', ['intro', 'first-code']);

    expect(isChapterCompleted(save, module, 'basics')).toBe(true);
    expect(isChapterCompleted(save, module, 'advanced')).toBe(false);
    expect(isChapterCompleted(save, module, 'missing')).toBe(false);
    expect(isModuleCompleted(save, module)).toBe(false);
    expect(getModuleProgress(save, registry, 'alpha')).toEqual({
      completed: 2,
      total: 4,
      ratio: 0.5,
    });
    expect(getModuleProgress(save, registry, 'missing')).toEqual({
      completed: 0,
      total: 0,
      ratio: 0,
    });
  });
});

describe('completeLesson', () => {
  it('awards xp and records completion without mutating the input', () => {
    const before = zeroDone();
    const snapshot = structuredClone(before);

    const result = completeLesson(before, registry, {
      moduleId: 'alpha',
      lessonId: 'intro',
      now: NOW,
    });

    expect(before).toEqual(snapshot);
    expect(result).toMatchObject({ xpGained: 10, newBadges: [], isAlreadyCompleted: false });
    expect(result.save.xp).toBe(15);
    expect(result.save.lessons['alpha/intro']).toEqual({
      completedAt: NOW.toISOString(),
      xpAwarded: 10,
    });
  });

  it('awards lesson, chapter and module badges when earned', () => {
    const save = completeAll(zeroDone(), 'alpha', ['intro']);

    const afterExercise = completeLesson(save, registry, {
      moduleId: 'alpha',
      lessonId: 'first-code',
      now: NOW,
    });
    expect(afterExercise.newBadges.map((badge) => badge.id)).toEqual([
      'first-steps',
      'basics-done',
    ]);
    expect(afterExercise.save.badges['alpha/first-steps']).toEqual({ earnedAt: NOW.toISOString() });

    const finished = completeAll(afterExercise.save, 'alpha', ['quiz-time', 'final-boss']);
    expect(Object.keys(finished.badges)).toEqual([
      'alpha/first-steps',
      'alpha/basics-done',
      'alpha/champion',
    ]);
    expect(findNewBadges(finished, registry.getModule('alpha'))).toEqual([]);
  });

  it('reports level ups', () => {
    const save = completeAll(zeroDone(), 'alpha', ['intro', 'first-code', 'quiz-time']);

    const result = completeLesson(save, registry, {
      moduleId: 'alpha',
      lessonId: 'final-boss',
      now: NOW,
    });

    expect(save.xp).toBe(85);
    expect(result.levelUp).toEqual({ from: 1, to: 2 });
  });

  it('is idempotent for completed lessons', () => {
    const save = zeroDone();

    const result = completeLesson(save, registry, { moduleId: 'zero', lessonId: 'only-lesson' });

    expect(result).toEqual({
      save,
      xpGained: 0,
      newBadges: [],
      levelUp: null,
      isAlreadyCompleted: true,
    });
  });

  it('rejects unknown and locked lessons', () => {
    expect(() =>
      completeLesson(createEmptySave(), registry, { moduleId: 'alpha', lessonId: 'nope' }),
    ).toThrow(expect.objectContaining({ code: 'unknown-lesson' }));
    expect(() =>
      completeLesson(createEmptySave(), registry, { moduleId: 'alpha', lessonId: 'intro' }),
    ).toThrow(ProgressionError);
  });

  it('uses the current time by default', () => {
    const result = completeLesson(createEmptySave(), registry, {
      moduleId: 'zero',
      lessonId: 'only-lesson',
    });

    expect(Date.parse(result.save.lessons['zero/only-lesson'].completedAt)).not.toBeNaN();
  });
});
