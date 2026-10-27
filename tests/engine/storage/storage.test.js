import { beforeEach, describe, expect, it } from 'vitest';

import {
  assertSaveData,
  createEmptySave,
  createLocalStorageRepository,
  migrateEnvelope,
  SAVE_VERSION,
  SaveFormatError,
} from '@/engine/storage/index.js';

const NOW = new Date('2026-10-27T12:00:00.000Z');
const KEY = 'test-save';

function createRepository(options = {}) {
  return createLocalStorageRepository({
    key: KEY,
    version: SAVE_VERSION,
    createInitialData: createEmptySave,
    validate: assertSaveData,
    now: () => NOW,
    ...options,
  });
}

function envelope(data) {
  return JSON.stringify({ version: SAVE_VERSION, savedAt: NOW.toISOString(), data });
}

describe('migrateEnvelope', () => {
  const migrations = {
    2: (data) => ({ ...data, coins: 0 }),
    3: (data) => ({ ...data, coins: data.coins + 10 }),
  };

  it('applies every migration up to the target version in order', () => {
    expect(
      migrateEnvelope({ version: 1, data: { xp: 5 } }, { targetVersion: 3, migrations }),
    ).toEqual({ xp: 5, coins: 10 });
  });

  it('returns data unchanged when already at the target version', () => {
    expect(
      migrateEnvelope({ version: 3, data: { a: 1 } }, { targetVersion: 3, migrations }),
    ).toEqual({
      a: 1,
    });
  });

  it('rejects saves from the future or with missing migrations', () => {
    expect(() =>
      migrateEnvelope({ version: 4, data: {} }, { targetVersion: 3, migrations }),
    ).toThrow(expect.objectContaining({ code: 'unsupported-version' }));
    expect(() =>
      migrateEnvelope({ version: 1, data: {} }, { targetVersion: 2, migrations: {} }),
    ).toThrow(expect.objectContaining({ code: 'unsupported-version' }));
  });

  it.each([
    null,
    'save',
    { version: 0, data: {} },
    { version: 1.5, data: {} },
    { version: 1 },
    { version: 1, data: [] },
  ])('rejects malformed envelope %j', (value) => {
    expect(() => migrateEnvelope(value, { targetVersion: 1, migrations: {} })).toThrow(
      SaveFormatError,
    );
  });
});

describe('assertSaveData', () => {
  it('accepts an empty save and one with a player', () => {
    expect(() => assertSaveData(createEmptySave())).not.toThrow();
    expect(() =>
      assertSaveData({ ...createEmptySave(), player: { name: 'Ada' }, xp: 10 }),
    ).not.toThrow();
  });

  it.each([
    ['negative xp', { xp: -1 }],
    ['fractional xp', { xp: 1.5 }],
    ['array lessons', { lessons: [] }],
    ['string player', { player: 'Ada' }],
    ['null badges', { badges: null }],
  ])('rejects %s', (_label, override) => {
    expect(() => assertSaveData({ ...createEmptySave(), ...override })).toThrow(
      expect.objectContaining({ code: 'invalid-format' }),
    );
  });
});

describe('createLocalStorageRepository', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns initial data when nothing is stored', () => {
    expect(createRepository().load()).toEqual(createEmptySave());
  });

  it('saves and loads data inside a versioned envelope', () => {
    const repository = createRepository();
    const data = { ...createEmptySave(), xp: 120 };

    repository.save(data);

    expect(JSON.parse(localStorage.getItem(KEY))).toEqual({
      version: SAVE_VERSION,
      savedAt: NOW.toISOString(),
      data,
    });
    expect(repository.load()).toEqual(data);
  });

  it('fills keys missing from older saves with initial values', () => {
    localStorage.setItem(KEY, envelope({ player: null, xp: 3, lessons: {} }));

    expect(createRepository().load()).toEqual({ ...createEmptySave(), xp: 3 });
  });

  it('backs up unreadable saves and starts fresh', () => {
    localStorage.setItem(KEY, '{broken');

    expect(createRepository().load()).toEqual(createEmptySave());
    expect(localStorage.getItem(`${KEY}:backup:${NOW.getTime()}`)).toBe('{broken');
  });

  it('backs up saves with an invalid shape', () => {
    localStorage.setItem(KEY, envelope({ ...createEmptySave(), xp: 'lots' }));

    expect(createRepository().load()).toEqual(createEmptySave());
    expect(localStorage.length).toBe(2);
  });

  it('clears the stored save', () => {
    const repository = createRepository();
    repository.save(createEmptySave());

    repository.clear();

    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('exports and re-imports a save', () => {
    const repository = createRepository();
    repository.save({ ...createEmptySave(), xp: 42 });
    const backup = repository.exportSave();
    repository.clear();

    const imported = repository.importSave(backup);

    expect(imported.xp).toBe(42);
    expect(repository.load().xp).toBe(42);
  });

  it('rejects invalid imports without touching the current save', () => {
    const repository = createRepository();
    repository.save({ ...createEmptySave(), xp: 7 });

    expect(() => repository.importSave('not json')).toThrow(
      expect.objectContaining({ code: 'invalid-json' }),
    );
    expect(() => repository.importSave(envelope({ ...createEmptySave(), xp: -5 }))).toThrow(
      expect.objectContaining({ code: 'invalid-format' }),
    );
    expect(() => repository.importSave(envelope([]))).toThrow(
      expect.objectContaining({ code: 'invalid-format' }),
    );
    expect(repository.load().xp).toBe(7);
  });

  it('works without a validator', () => {
    const repository = createRepository({ validate: undefined });
    localStorage.setItem(KEY, envelope({ anything: true }));

    expect(repository.load()).toMatchObject({ anything: true });
  });
});
