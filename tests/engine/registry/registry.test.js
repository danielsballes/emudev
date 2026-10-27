import { describe, expect, it } from 'vitest';

import { createFixtureModule, createSingleLessonModule } from '../../fixtures/modules.js';
import {
  createRegistry,
  loadRegistry,
  ModuleRegistryError,
  validateModule,
} from '@/engine/registry/index.js';

function withLesson(lessonOverrides) {
  const module = createFixtureModule();
  module.chapters[0].lessons[0] = { ...module.chapters[0].lessons[0], ...lessonOverrides };
  return module;
}

describe('validateModule', () => {
  it('accepts a valid manifest', () => {
    expect(validateModule(createFixtureModule())).toEqual([]);
  });

  it('rejects non-objects', () => {
    expect(validateModule(null)).toEqual(['manifest must be an object']);
    expect(validateModule([])).toEqual(['manifest must be an object']);
  });

  it('reports invalid top-level fields', () => {
    const errors = validateModule({
      id: 'Bad Id',
      order: 1.5,
      requires: ['ok', 'Not OK'],
      region: {},
      chapters: [],
      badges: 'none',
    });

    expect(errors).toEqual([
      'id must be a kebab-case id',
      'order must be an integer',
      'requires must be an array of module ids',
      'region.titleKey is required',
      'chapters must not be empty',
      'badges must be an array',
    ]);
  });

  it('reports invalid chapters', () => {
    const errors = validateModule(createFixtureModule({ chapters: [{ id: 'x' }, null] }));

    expect(errors).toEqual([
      'chapters[0].titleKey is required',
      'chapters[0].lessons must not be empty',
      'chapters[1].id must be a kebab-case id',
      'chapters[1].titleKey is required',
      'chapters[1].lessons must not be empty',
      expect.stringContaining('criteria.id must be a lesson id'),
      expect.stringContaining('criteria.id must be a chapter id'),
    ]);
  });

  it.each([
    [{ id: 'X' }, 'chapters[0].lessons[0].id must be a kebab-case id'],
    [{ type: 'video' }, 'chapters[0].lessons[0].type must be one of lesson,exercise,quiz,boss'],
    [{ xp: -5 }, 'chapters[0].lessons[0].xp must be >= 0'],
    [{ content: 'text' }, 'chapters[0].lessons[0].content must be a loader function'],
    [{ type: 'exercise' }, 'chapters[0].lessons[0].exercise must be a loader function'],
    [{ type: 'quiz' }, 'chapters[0].lessons[0].quiz must be a loader function'],
  ])('reports invalid lesson %j', (override, message) => {
    expect(validateModule(withLesson(override))).toEqual([message]);
  });

  it('reports a null lesson', () => {
    const module = createFixtureModule();
    module.chapters[0].lessons[0] = null;

    expect(validateModule(module)).toContain('chapters[0].lessons[0].id must be a kebab-case id');
  });

  it('reports duplicate ids', () => {
    const module = createFixtureModule();
    module.chapters[1].id = 'basics';
    module.chapters[1].lessons[0].id = 'intro';
    module.badges.push({ ...module.badges[0] });

    expect(validateModule(module)).toEqual([
      'duplicate chapter id "basics"',
      'duplicate lesson id "intro"',
      'duplicate badge id "first-steps"',
    ]);
  });

  it('reports invalid badges', () => {
    const module = createFixtureModule({
      badges: [{ id: 'b', titleKey: '', criteria: { type: 'xp' } }, null],
    });

    expect(validateModule(module)).toEqual([
      'badges[0].titleKey is required',
      'badges[0].criteria.type must be one of lesson,chapter,module',
      'badges[1].id must be a kebab-case id',
      'badges[1].titleKey is required',
      'badges[1].criteria.type must be one of lesson,chapter,module',
    ]);
  });
});

const alpha = createFixtureModule({ order: 2 });
const zero = createSingleLessonModule('zero', 1);

function createInvalidRegistry() {
  return createRegistry([
    zero,
    { ...zero },
    { ...alpha, requires: ['missing'] },
    createSingleLessonModule('early', 0, { requires: ['alpha'] }),
    { id: 'broken', requires: 'zero' },
    null,
  ]);
}

describe('createRegistry', () => {
  it('sorts modules by order and fills optional fields', () => {
    const registry = createRegistry([alpha, zero]);

    expect(registry.modules.map((module) => module.id)).toEqual(['zero', 'alpha']);
    expect(registry.getModule('zero')).toMatchObject({ requires: [], badges: [] });
    expect(registry.getModule('missing')).toBeUndefined();
  });

  it('returns a frozen catalogue', () => {
    const registry = createRegistry([zero]);

    expect(Object.isFrozen(registry.modules)).toBe(true);
    expect(Object.isFrozen(registry.getModule('zero').chapters[0].lessons[0])).toBe(true);
    expect(Object.isFrozen(registry.getLessons('zero'))).toBe(true);
    expect(Object.isFrozen(registry.getLesson('zero', 'only-lesson'))).toBe(true);
  });

  it('defaults optional fields even when they are explicitly undefined', () => {
    const registry = createRegistry([{ ...zero, requires: undefined, badges: undefined }]);

    expect(registry.getModule('zero')).toMatchObject({ requires: [], badges: [] });
  });

  it('flattens lessons in order with their module and chapter', () => {
    const registry = createRegistry([alpha]);

    expect(registry.getLessons('alpha').map((lesson) => lesson.id)).toEqual([
      'intro',
      'first-code',
      'quiz-time',
      'final-boss',
    ]);
    expect(registry.getLesson('alpha', 'quiz-time')).toMatchObject({
      moduleId: 'alpha',
      chapterId: 'advanced',
      type: 'quiz',
    });
    expect(registry.getLessons('missing')).toEqual([]);
    expect(registry.getLesson('alpha', 'missing')).toBeUndefined();
  });

  it('finds the next lesson across chapters', () => {
    const registry = createRegistry([alpha]);

    expect(registry.getNextLesson('alpha', 'first-code')?.id).toBe('quiz-time');
    expect(registry.getNextLesson('alpha', 'final-boss')).toBeUndefined();
    expect(registry.getNextLesson('alpha', 'missing')).toBeUndefined();
  });

  it('accepts requirements on earlier modules', () => {
    expect(() => createRegistry([zero, { ...alpha, requires: ['zero'] }])).not.toThrow();
  });

  it('rejects invalid manifests, duplicates and bad requirements', () => {
    let caught;
    try {
      createInvalidRegistry();
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ModuleRegistryError);
    expect(caught.message).toContain('Invalid module registry');
    expect(caught.problems).toEqual(
      expect.arrayContaining([
        'duplicate module id "zero"',
        'alpha: requires "missing", which is missing or not earlier',
        'early: requires "alpha", which is missing or not earlier',
        'broken: order must be an integer',
        'broken: requires must be an array of module ids',
        '(unknown module): manifest must be an object',
      ]),
    );
  });
});

describe('loadRegistry', () => {
  it('builds the registry from the modules folder', () => {
    expect(Array.isArray(loadRegistry().modules)).toBe(true);
  });
});
