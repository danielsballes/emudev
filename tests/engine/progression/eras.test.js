import { describe, expect, it } from 'vitest';

import { createSingleLessonModule } from '../../fixtures/modules.js';
import { ERAS, latestEra, resolveImplementedEra } from '@/engine/eras.js';
import { completeLesson, getShellEra, getUnlockedEras } from '@/engine/progression/index.js';
import { createRegistry } from '@/engine/registry/index.js';
import { createEmptySave } from '@/engine/storage/index.js';

const registry = createRegistry([
  createSingleLessonModule('fundamentals', 0),
  createSingleLessonModule('chip8', 1, { era: 'chip8', requires: ['fundamentals'] }),
  createSingleLessonModule('gameboy', 2, { era: 'gameboy', requires: ['chip8'] }),
]);

function complete(save, moduleId) {
  return completeLesson(save, registry, { moduleId, lessonId: 'only-lesson' }).save;
}

describe('eras', () => {
  it('lists eras from oldest to most modern', () => {
    expect(ERAS[0]).toBe('terminal');
    expect(ERAS.at(-1)).toBe('modern');
  });

  it('falls back to the closest older era with a theme', () => {
    expect(resolveImplementedEra('terminal')).toBe('terminal');
    expect(resolveImplementedEra('chip8')).toBe('chip8');
    expect(resolveImplementedEra('nes')).toBe('chip8');
    expect(resolveImplementedEra('unknown')).toBe('terminal');
  });

  it('finds the most modern era of a list', () => {
    expect(latestEra(['gba', 'terminal', 'nes'])).toBe('gba');
    expect(latestEra([])).toBe('terminal');
  });
});

describe('getUnlockedEras', () => {
  it('starts with the first era and adds the era of each unlocked module', () => {
    const fresh = createEmptySave();
    const afterFundamentals = complete(fresh, 'fundamentals');
    const afterChip8 = complete(afterFundamentals, 'chip8');

    expect(getUnlockedEras(fresh, registry)).toEqual(['terminal']);
    expect(getUnlockedEras(afterFundamentals, registry)).toEqual(['terminal', 'chip8']);
    expect(getUnlockedEras(afterChip8, registry)).toEqual(['terminal', 'chip8', 'gameboy']);
  });
});

describe('getShellEra', () => {
  const afterFundamentals = complete(createEmptySave(), 'fundamentals');

  it('uses the most modern unlocked era', () => {
    expect(getShellEra(createEmptySave(), registry)).toBe('terminal');
    expect(getShellEra(afterFundamentals, registry)).toBe('chip8');
  });

  it('resolves unlocked eras without a theme yet', () => {
    expect(getShellEra(complete(afterFundamentals, 'chip8'), registry)).toBe('chip8');
  });

  it('honors an unlocked skin and ignores a locked one', () => {
    expect(getShellEra({ ...afterFundamentals, skin: 'terminal' }, registry)).toBe('terminal');
    expect(getShellEra({ ...createEmptySave(), skin: 'chip8' }, registry)).toBe('terminal');
  });
});
