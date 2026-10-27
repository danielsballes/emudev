import { asArray, validateModule } from './validate-module.js';

export class ModuleRegistryError extends Error {
  /**
   * @param {string[]} problems
   */
  constructor(problems) {
    super(`Invalid module registry:\n- ${problems.join('\n- ')}`);
    this.name = 'ModuleRegistryError';
    this.problems = problems;
  }
}

function deepFreeze(value) {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const item of Object.values(value)) {
      deepFreeze(item);
    }
  }
  return value;
}

function findManifestProblems(manifests) {
  return manifests.flatMap((manifest) =>
    validateModule(manifest).map((error) => `${manifest?.id ?? '(unknown module)'}: ${error}`),
  );
}

function findDuplicateModules(manifests, orderById) {
  const problems = [];
  for (const manifest of manifests) {
    if (orderById.has(manifest?.id)) {
      problems.push(`duplicate module id "${manifest.id}"`);
    }
    orderById.set(manifest?.id, manifest?.order);
  }
  return problems;
}

function findRequirementProblems(manifests, orderById) {
  // Requiring only lower-order modules makes cycles impossible.
  return manifests.flatMap((manifest) =>
    asArray(manifest?.requires)
      .filter((required) => !(orderById.get(required) < manifest.order))
      .map((required) => `${manifest.id}: requires "${required}", which is missing or not earlier`),
  );
}

function collectProblems(manifests) {
  const orderById = new Map();
  return [
    ...findManifestProblems(manifests),
    ...findDuplicateModules(manifests, orderById),
    ...findRequirementProblems(manifests, orderById),
  ];
}

/**
 * Builds the read-only catalogue of learning modules.
 * @param {object[]} manifests Module manifests (see CLAUDE.md, "Cómo añadir un módulo").
 * @throws {ModuleRegistryError} When any manifest is invalid.
 */
export function createRegistry(manifests) {
  const problems = collectProblems(manifests);
  if (problems.length > 0) {
    throw new ModuleRegistryError(problems);
  }

  const modules = deepFreeze(
    manifests
      .map((manifest) => ({
        ...manifest,
        requires: manifest.requires ?? [],
        badges: manifest.badges ?? [],
      }))
      .toSorted((left, right) => left.order - right.order),
  );
  const lessonsByModule = new Map(
    modules.map((module) => [
      module.id,
      deepFreeze(
        module.chapters.flatMap((chapter) =>
          chapter.lessons.map((lesson) => ({
            ...lesson,
            moduleId: module.id,
            chapterId: chapter.id,
          })),
        ),
      ),
    ]),
  );

  const getModule = (moduleId) => modules.find((module) => module.id === moduleId);
  const getLessons = (moduleId) => lessonsByModule.get(moduleId) ?? [];
  const getLesson = (moduleId, lessonId) =>
    getLessons(moduleId).find((lesson) => lesson.id === lessonId);

  function getNextLesson(moduleId, lessonId) {
    const lessons = getLessons(moduleId);
    const index = lessons.findIndex((lesson) => lesson.id === lessonId);
    return index === -1 ? undefined : lessons[index + 1];
  }

  return { modules, getModule, getLessons, getLesson, getNextLesson };
}
