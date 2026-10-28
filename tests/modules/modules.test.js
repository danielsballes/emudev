import { describe, expect, it } from 'vitest';

import { loadRegistry } from '@/engine/registry/index.js';
import { i18n } from '@/i18n';

const registry = loadRegistry();
const hasKey = (key) => i18n.global.te(key, 'es');

describe('learning modules', () => {
  it('builds a valid registry from src/modules', () => {
    expect(registry.modules.map((module) => module.id)).toEqual(['fundamentals', 'chip8']);
  });

  it('has a Spanish text for every title', () => {
    const keys = registry.modules.flatMap((module) => [
      module.region.titleKey,
      ...module.chapters.flatMap((chapter) => [
        chapter.titleKey,
        ...chapter.lessons.map((lesson) => lesson.titleKey),
      ]),
    ]);

    expect(keys.filter((key) => !hasKey(key))).toEqual([]);
  });

  it('loads the content of every lesson', async () => {
    const lessons = registry.modules.flatMap((module) => registry.getLessons(module.id));
    const contents = await Promise.all(lessons.map((lesson) => lesson.content()));

    expect(contents.every((content) => content.default.startsWith('# '))).toBe(true);
  });
});
