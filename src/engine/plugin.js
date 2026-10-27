import { inject } from 'vue';

import { loadRegistry } from './registry/index.js';
import { createRunner } from './runner/index.js';
import {
  assertSaveData,
  createEmptySave,
  createLocalStorageRepository,
  SAVE_MIGRATIONS,
  SAVE_VERSION,
} from './storage/index.js';

export const ENGINE_KEY = Symbol('engine');
export const SAVE_STORAGE_KEY = 'emudev:save';

export function createDefaultRepository() {
  return createLocalStorageRepository({
    key: SAVE_STORAGE_KEY,
    version: SAVE_VERSION,
    migrations: SAVE_MIGRATIONS,
    createInitialData: createEmptySave,
    validate: assertSaveData,
  });
}

/**
 * Vue plugin exposing the engine services (module registry, save repository, code runner).
 * Services can be replaced, e.g. with fakes in tests or an API repository once a backend exists.
 * @param {{ registry?: object, repository?: object, runner?: object }} [services]
 */
export function createEngine({
  registry = loadRegistry(),
  repository = createDefaultRepository(),
  runner = createRunner(),
} = {}) {
  const engine = Object.freeze({ registry, repository, runner });
  return {
    ...engine,
    install(app) {
      app.provide(ENGINE_KEY, engine);
    },
  };
}

/**
 * Returns the engine services provided by `createEngine`.
 */
export function useEngine() {
  const engine = inject(ENGINE_KEY, null);
  if (!engine) {
    throw new Error('Engine not installed: call app.use(createEngine())');
  }
  return engine;
}
