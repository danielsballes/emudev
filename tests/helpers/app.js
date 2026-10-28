import { createPinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';

import { createFixtureModule } from '../fixtures/modules.js';
import { createDefaultRepository, createEngine } from '@/engine/plugin.js';
import { createRegistry } from '@/engine/registry/index.js';
import { routes } from '@/router';
import { resolvePlayerRoute } from '@/router/player-guard.js';
import { useSaveStore } from '@/stores/save.js';

/**
 * Everything a component test needs to behave like the real app: engine (fake runner), Pinia and
 * a memory-history router with the player guard. Saves go to the jsdom localStorage.
 * @param {{ modules?: object[] }} [options]
 */
export function createTestApp({ modules = [createFixtureModule()] } = {}) {
  const repository = createDefaultRepository();
  const engine = createEngine({
    registry: createRegistry(modules),
    repository,
    runner: { run: () => Promise.resolve({}) },
  });
  const pinia = createPinia();
  const router = createRouter({ history: createMemoryHistory(), routes });
  router.beforeEach((to) => resolvePlayerRoute(to, useSaveStore(pinia).hasPlayer));
  return { repository, pinia, router, plugins: [engine, pinia, router] };
}

/**
 * Stores a save with a player before the app starts, as if the player had played before.
 * @param {ReturnType<typeof createTestApp>} testApp
 * @param {object} [overrides]
 */
export function seedPlayer(testApp, overrides = {}) {
  testApp.repository.save({
    player: { name: 'Ada', avatar: 'pilcrow', createdAt: '2026-10-27T12:00:00.000Z' },
    xp: 40,
    lessons: {},
    code: {},
    badges: {},
    skin: null,
    ...overrides,
  });
}
