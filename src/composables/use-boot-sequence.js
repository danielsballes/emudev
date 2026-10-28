import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

export function prefersReducedMotion() {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/**
 * Reveals boot lines one at a time, once. Skippable, and instant with reduced motion.
 * @param {number} lineCount
 * @param {{ interval?: number, reducedMotion?: boolean }} [options]
 */
export function useBootSequence(
  lineCount,
  { interval = 350, reducedMotion = prefersReducedMotion() } = {},
) {
  const visibleLines = ref(reducedMotion ? lineCount : 0);
  const isDone = computed(() => visibleLines.value >= lineCount);
  let timer;

  function stop() {
    clearInterval(timer);
  }

  function skip() {
    visibleLines.value = lineCount;
    stop();
  }

  onMounted(() => {
    if (isDone.value) {
      return;
    }
    timer = setInterval(() => {
      visibleLines.value += 1;
      if (isDone.value) {
        stop();
      }
    }, interval);
  });
  onBeforeUnmount(stop);

  return { visibleLines, isDone, skip };
}
