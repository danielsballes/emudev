import { computed, inject, provide } from 'vue';

import { FIRST_ERA } from '@/engine/eras.js';

export const ERA_KEY = Symbol('era');

/**
 * Makes an era available to descendant components (e.g. the shell era, or a module's era inside
 * a lesson). Pair it with `data-era` on the same container so CSS tokens match.
 * @param {import('vue').Ref<string>} era
 */
export function provideEra(era) {
  provide(ERA_KEY, era);
}

/**
 * The era of the closest container, for components that render differently per era
 * (ASCII in `terminal`, pixels in `chip8`…).
 * @returns {import('vue').Ref<string>}
 */
export function useEra() {
  return inject(
    ERA_KEY,
    computed(() => FIRST_ERA),
  );
}
