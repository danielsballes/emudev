import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from 'vue';

import { createFixtureModule } from '../fixtures/modules.js';
import { createEngine, createDefaultRepository, SAVE_STORAGE_KEY } from '@/engine/plugin.js';
import { createRegistry } from '@/engine/registry/index.js';

import {
  PLAYER_NAME_ERROR,
  PLAYER_NAME_MAX_LENGTH,
  useSaveStore,
  validatePlayerName,
} from '@/stores/save.js';

const TEST_ROOT_COMPONENT = {};

function activatePinia(plugins) {
  const pinia = createPinia();
  const app = createApp(TEST_ROOT_COMPONENT);
  for (const plugin of plugins) {
    app.use(plugin);
  }
  app.use(pinia);
  setActivePinia(pinia);
}

function setup(repository = createDefaultRepository()) {
  const engine = createEngine({
    registry: createRegistry([createFixtureModule()]),
    repository,
    runner: { run: () => Promise.resolve({}) },
  });
  activatePinia([engine]);
  return { store: useSaveStore(), repository };
}

describe('validatePlayerName', () => {
  it.each([
    ['Ada', null],
    ['  Ada  ', null],
    [' '.repeat(3), PLAYER_NAME_ERROR.EMPTY],
    ['x'.repeat(PLAYER_NAME_MAX_LENGTH + 1), PLAYER_NAME_ERROR.TOO_LONG],
  ])('validates %j', (name, expected) => {
    expect(validatePlayerName(name)).toBe(expected);
  });
});

describe('useSaveStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with an empty save and no player', () => {
    const { store } = setup();

    expect(store.hasPlayer).toBe(false);
    expect(store.player).toBeNull();
    expect(store.levelInfo.level).toBe(1);
  });

  it('creates and persists a player', () => {
    const { store, repository } = setup();

    store.createPlayer({ name: '  Ada ', avatar: 'wizard' });

    expect(store.hasPlayer).toBe(true);
    expect(store.player).toMatchObject({ name: 'Ada', avatar: 'wizard' });
    expect(repository.load().player.name).toBe('Ada');
  });

  it('rejects invalid player names', () => {
    const { store } = setup();

    expect(() => store.createPlayer({ name: '', avatar: 'wizard' })).toThrow(RangeError);
  });

  it('completes lessons, persists progress and exposes unlock state', () => {
    const { store, repository } = setup();

    expect(store.isLessonUnlocked('alpha', 'first-code')).toBe(false);
    const result = store.completeLesson({ moduleId: 'alpha', lessonId: 'intro' });

    expect(result.xpGained).toBe(10);
    expect(store.save.xp).toBe(10);
    expect(store.isLessonCompleted('alpha', 'intro')).toBe(true);
    expect(store.isLessonUnlocked('alpha', 'first-code')).toBe(true);
    expect(store.isModuleUnlocked('alpha')).toBe(true);
    expect(store.getModuleProgress('alpha')).toMatchObject({ completed: 1, total: 4 });
    expect(repository.load().xp).toBe(10);
  });

  it('does not persist again when completing a lesson twice', () => {
    const { store } = setup();
    store.completeLesson({ moduleId: 'alpha', lessonId: 'intro' });
    const saved = localStorage.getItem(SAVE_STORAGE_KEY);
    localStorage.removeItem(SAVE_STORAGE_KEY);

    const result = store.completeLesson({ moduleId: 'alpha', lessonId: 'intro' });

    expect(result.isAlreadyCompleted).toBe(true);
    expect(saved).not.toBeNull();
    expect(localStorage.getItem(SAVE_STORAGE_KEY)).toBeNull();
  });

  it('stores code per exercise', () => {
    const { store, repository } = setup();

    store.saveCode('alpha', 'first-code', 'export const x = 1;');

    expect(store.getCode('alpha', 'first-code')).toBe('export const x = 1;');
    expect(store.getCode('alpha', 'intro')).toBeUndefined();
    expect(repository.load().code['alpha/first-code']).toBe('export const x = 1;');
  });

  it('exports, resets and imports the save', () => {
    const { store } = setup();
    store.createPlayer({ name: 'Ada', avatar: 'wizard' });
    const backup = store.exportSave();

    store.resetSave();
    expect(store.hasPlayer).toBe(false);
    expect(localStorage.getItem(SAVE_STORAGE_KEY)).toBeNull();

    store.importSave(backup);
    expect(store.player.name).toBe('Ada');
  });

  it('keeps state unchanged when storage fails, so the action can be retried', () => {
    const repository = createDefaultRepository();
    const failingRepository = {
      ...repository,
      save: vi.fn().mockImplementationOnce(() => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      }),
    };
    failingRepository.save.mockImplementation(repository.save);
    const { store } = setup(failingRepository);

    expect(() => store.completeLesson({ moduleId: 'alpha', lessonId: 'intro' })).toThrow(
      'Quota exceeded',
    );
    expect(store.isLessonCompleted('alpha', 'intro')).toBe(false);

    const retry = store.completeLesson({ moduleId: 'alpha', lessonId: 'intro' });
    expect(retry.isAlreadyCompleted).toBe(false);
    expect(repository.load().xp).toBe(10);
  });

  it('exposes unlocked eras and the shell era', () => {
    const { store } = setup();

    expect(store.unlockedEras).toEqual(['terminal', 'chip8']);
    expect(store.shellEra).toBe('chip8');
  });

  it('switches the shell skin among unlocked eras and persists it', () => {
    const { store, repository } = setup();

    store.setSkin('terminal');
    expect(store.shellEra).toBe('terminal');
    expect(repository.load().skin).toBe('terminal');

    store.setSkin(null);
    expect(store.shellEra).toBe('chip8');
    expect(() => store.setSkin('nes')).toThrow(RangeError);
  });

  it('loads an existing save on creation', () => {
    setup().store.createPlayer({ name: 'Ada', avatar: 'wizard' });

    expect(setup().store.player.name).toBe('Ada');
  });
});

describe('useEngine', () => {
  it('fails clearly when the engine plugin is missing', () => {
    activatePinia([]);

    expect(() => useSaveStore()).toThrow('Engine not installed');
  });
});
