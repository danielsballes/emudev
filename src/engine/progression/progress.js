/**
 * Key used for lessons, code and badges in the save: `moduleId/itemId`.
 * @param {string} moduleId
 * @param {string} itemId
 */
export function progressKey(moduleId, itemId) {
  return `${moduleId}/${itemId}`;
}

export function isLessonCompleted(save, moduleId, lessonId) {
  return Object.hasOwn(save.lessons, progressKey(moduleId, lessonId));
}

function areLessonsCompleted(save, moduleId, lessons) {
  return lessons.every((lesson) => isLessonCompleted(save, moduleId, lesson.id));
}

export function isChapterCompleted(save, module, chapterId) {
  const chapter = module.chapters.find((candidate) => candidate.id === chapterId);
  return chapter !== undefined && areLessonsCompleted(save, module.id, chapter.lessons);
}

export function isModuleCompleted(save, module) {
  return module.chapters.every((chapter) => areLessonsCompleted(save, module.id, chapter.lessons));
}

/**
 * A module is unlocked when every module it requires is completed.
 * @param {object} save
 * @param {object} registry
 * @param {string} moduleId
 */
export function isModuleUnlocked(save, registry, moduleId) {
  const module = registry.getModule(moduleId);
  return (
    module !== undefined &&
    module.requires.every((requiredId) => {
      const required = registry.getModule(requiredId);
      return required !== undefined && isModuleCompleted(save, required);
    })
  );
}

/**
 * Lessons unlock in order: the first lesson of an unlocked module, any completed lesson, and the
 * lesson right after a completed one.
 * @param {object} save
 * @param {object} registry
 * @param {{ moduleId: string, lessonId: string }} target
 */
export function isLessonUnlocked(save, registry, { moduleId, lessonId }) {
  if (!isModuleUnlocked(save, registry, moduleId)) {
    return false;
  }
  const lessons = registry.getLessons(moduleId);
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  return index === 0 || (index > 0 && isLessonCompleted(save, moduleId, lessons[index - 1].id));
}

/**
 * @param {object} save
 * @param {object} registry
 * @param {string} moduleId
 */
export function getModuleProgress(save, registry, moduleId) {
  const lessons = registry.getLessons(moduleId);
  const completed = lessons.filter((lesson) => isLessonCompleted(save, moduleId, lesson.id)).length;
  return {
    completed,
    total: lessons.length,
    ratio: lessons.length === 0 ? 0 : completed / lessons.length,
  };
}
