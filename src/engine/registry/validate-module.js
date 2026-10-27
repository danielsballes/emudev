import { ERAS } from '../eras.js';

export const LESSON_TYPES = Object.freeze(['lesson', 'exercise', 'quiz', 'boss']);
export const BADGE_CRITERIA = Object.freeze(['lesson', 'chapter', 'module']);

const ID_PATTERN = /^[a-z\d]+(?:-[a-z\d]+)*$/;

const isId = (value) => typeof value === 'string' && ID_PATTERN.test(value);
const isNonEmptyString = (value) => typeof value === 'string' && value.length > 0;
const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const hasCodeExercise = (lesson) => lesson.type === 'exercise' || lesson.type === 'boss';

/**
 * Returns the value when it is an array, otherwise an empty array.
 * @param {unknown} value
 * @returns {unknown[]}
 */
export const asArray = (value) => (Array.isArray(value) ? value : []);

function check(errors, condition, message) {
  if (!condition) {
    errors.push(message);
  }
}

function validateLesson(lesson, path, errors) {
  check(errors, isId(lesson?.id), `${path}.id must be a kebab-case id`);
  check(errors, LESSON_TYPES.includes(lesson?.type), `${path}.type must be one of ${LESSON_TYPES}`);
  check(errors, Number.isSafeInteger(lesson?.xp) && lesson.xp >= 0, `${path}.xp must be >= 0`);
  check(errors, typeof lesson?.content === 'function', `${path}.content must be a loader function`);
  if (hasCodeExercise(lesson ?? {})) {
    check(
      errors,
      typeof lesson.exercise === 'function',
      `${path}.exercise must be a loader function`,
    );
  }
  if (lesson?.type === 'quiz') {
    check(errors, typeof lesson.quiz === 'function', `${path}.quiz must be a loader function`);
  }
}

function validateChapter(chapter, path, errors) {
  check(errors, isId(chapter?.id), `${path}.id must be a kebab-case id`);
  check(errors, isNonEmptyString(chapter?.titleKey), `${path}.titleKey is required`);
  const lessons = chapter?.lessons;
  check(errors, Array.isArray(lessons) && lessons.length > 0, `${path}.lessons must not be empty`);
  for (const [index, lesson] of asArray(lessons).entries()) {
    validateLesson(lesson, `${path}.lessons[${index}]`, errors);
  }
}

function findDuplicates(ids) {
  return [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
}

function collectIds(manifest) {
  const chapters = asArray(manifest.chapters);
  return {
    chapterIds: chapters.map((chapter) => chapter?.id),
    lessonIds: chapters.flatMap((chapter) => asArray(chapter?.lessons).map((lesson) => lesson?.id)),
  };
}

function validateBadge(badge, path, ids, errors) {
  check(errors, isId(badge?.id), `${path}.id must be a kebab-case id`);
  check(errors, isNonEmptyString(badge?.titleKey), `${path}.titleKey is required`);
  const criteria = badge?.criteria;
  check(
    errors,
    BADGE_CRITERIA.includes(criteria?.type),
    `${path}.criteria.type must be one of ${BADGE_CRITERIA}`,
  );
  if (criteria?.type === 'lesson') {
    check(errors, ids.lessonIds.includes(criteria.id), `${path}.criteria.id must be a lesson id`);
  }
  if (criteria?.type === 'chapter') {
    check(errors, ids.chapterIds.includes(criteria.id), `${path}.criteria.id must be a chapter id`);
  }
}

function validateStructure(manifest, errors) {
  check(errors, isId(manifest.id), 'id must be a kebab-case id');
  check(errors, Number.isSafeInteger(manifest.order), 'order must be an integer');
  check(
    errors,
    manifest.requires === undefined ||
      (Array.isArray(manifest.requires) && manifest.requires.every((id) => isId(id))),
    'requires must be an array of module ids',
  );
  check(errors, ERAS.includes(manifest.era), `era must be one of ${ERAS}`);
  check(errors, isNonEmptyString(manifest.region?.titleKey), 'region.titleKey is required');
  const chapters = manifest.chapters;
  check(errors, Array.isArray(chapters) && chapters.length > 0, 'chapters must not be empty');
  for (const [index, chapter] of asArray(chapters).entries()) {
    validateChapter(chapter, `chapters[${index}]`, errors);
  }
}

function validateReferences(manifest, errors) {
  const ids = collectIds(manifest);
  for (const id of findDuplicates(ids.chapterIds)) {
    errors.push(`duplicate chapter id "${id}"`);
  }
  for (const id of findDuplicates(ids.lessonIds)) {
    errors.push(`duplicate lesson id "${id}"`);
  }
  check(
    errors,
    manifest.badges === undefined || Array.isArray(manifest.badges),
    'badges must be an array',
  );
  const badges = asArray(manifest.badges);
  for (const [index, badge] of badges.entries()) {
    validateBadge(badge, `badges[${index}]`, ids, errors);
  }
  const duplicateBadgeIds = findDuplicates(badges.map((badge) => badge?.id));
  for (const id of duplicateBadgeIds) {
    errors.push(`duplicate badge id "${id}"`);
  }
}

/**
 * Validates a module manifest in isolation. Cross-module rules (unique ids, `requires`) are
 * checked by the registry.
 * @param {unknown} manifest
 * @returns {string[]} Developer-facing error messages; empty when valid.
 */
export function validateModule(manifest) {
  if (!isObject(manifest)) {
    return ['manifest must be an object'];
  }
  const errors = [];
  validateStructure(manifest, errors);
  validateReferences(manifest, errors);
  return errors;
}
