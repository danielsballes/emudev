const load = () => Promise.resolve({});

/**
 * Builds a valid module manifest for tests. Two chapters:
 * - `basics`: `intro` (lesson, 10 xp), `first-code` (exercise, 50 xp)
 * - `advanced`: `quiz-time` (quiz, 20 xp), `final-boss` (boss, 100 xp)
 */
export function createFixtureModule(overrides = {}) {
  return {
    id: 'alpha',
    order: 1,
    era: 'chip8',
    region: { titleKey: 'modules.alpha.title' },
    chapters: [
      {
        id: 'basics',
        titleKey: 'modules.alpha.basics',
        lessons: [
          { id: 'intro', type: 'lesson', xp: 10, content: load },
          { id: 'first-code', type: 'exercise', xp: 50, content: load, exercise: load },
        ],
      },
      {
        id: 'advanced',
        titleKey: 'modules.alpha.advanced',
        lessons: [
          { id: 'quiz-time', type: 'quiz', xp: 20, content: load, quiz: load },
          { id: 'final-boss', type: 'boss', xp: 100, content: load, exercise: load },
        ],
      },
    ],
    badges: [
      { id: 'first-steps', titleKey: 'b.first', criteria: { type: 'lesson', id: 'first-code' } },
      { id: 'basics-done', titleKey: 'b.basics', criteria: { type: 'chapter', id: 'basics' } },
      { id: 'champion', titleKey: 'b.champion', criteria: { type: 'module' } },
    ],
    ...overrides,
  };
}

export function createSingleLessonModule(id, order, overrides = {}) {
  return {
    id,
    order,
    era: 'terminal',
    region: { titleKey: `modules.${id}.title` },
    chapters: [
      {
        id: 'only',
        titleKey: `modules.${id}.only`,
        lessons: [{ id: 'only-lesson', type: 'lesson', xp: 5, content: load }],
      },
    ],
    ...overrides,
  };
}
