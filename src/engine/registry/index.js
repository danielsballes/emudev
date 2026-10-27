import { createRegistry } from './create-registry.js';

export { createRegistry, ModuleRegistryError } from './create-registry.js';
export { BADGE_CRITERIA, LESSON_TYPES, validateModule } from './validate-module.js';

/**
 * Discovers every `src/modules/<id>/module.js` at build time and builds the registry.
 * @returns {ReturnType<typeof createRegistry>}
 */
export function loadRegistry() {
  const found = import.meta.glob('/src/modules/*/module.js', { eager: true, import: 'default' });
  return createRegistry(Object.values(found));
}
