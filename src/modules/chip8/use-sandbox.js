import { onBeforeUnmount, ref, shallowRef } from 'vue';

import { createSandboxRunner } from './sandbox-runner.js';

/**
 * Vue wrapper around the sandbox runner. The machine mutates its state in place for speed, so
 * the UI reads `view`, an immutable snapshot replaced after every change.
 * @param {object} [options]
 * @param {ReturnType<typeof createSandboxRunner>} [options.runner]
 * @param {(callback: (time: number) => void) => number} [options.schedule]
 * @param {(handle: number) => void} [options.cancel]
 */
export function useSandbox({
  runner = createSandboxRunner(),
  schedule = requestAnimationFrame,
  cancel = cancelAnimationFrame,
} = {}) {
  const view = shallowRef(runner.snapshot());
  const isRunning = ref(false);
  const error = ref(null);
  const loop = { handle: undefined, lastTime: undefined };

  function refresh() {
    isRunning.value = runner.isRunning;
    error.value = runner.error;
    view.value = runner.snapshot();
  }

  function stopLoop() {
    cancel(loop.handle);
    loop.handle = undefined;
    loop.lastTime = undefined;
  }

  function onFrame(time) {
    runner.advance(loop.lastTime === undefined ? 0 : time - loop.lastTime);
    loop.lastTime = time;
    refresh();
    loop.handle = runner.isRunning ? schedule(onFrame) : undefined;
    if (!runner.isRunning) {
      loop.lastTime = undefined;
    }
  }

  function play() {
    runner.play();
    refresh();
    if (runner.isRunning && loop.handle === undefined) {
      loop.handle = schedule(onFrame);
    }
  }

  function pause() {
    runner.pause();
    stopLoop();
    refresh();
  }

  onBeforeUnmount(stopLoop);

  return {
    runner,
    view,
    isRunning,
    error,
    play,
    pause,
    load(rom) {
      pause();
      runner.load(rom);
      refresh();
    },
    reset() {
      runner.reset();
      refresh();
    },
    stepOnce() {
      pause();
      runner.stepOnce();
      refresh();
    },
    setQuirks(name) {
      runner.setQuirks(name);
      refresh();
    },
    setKey(key, isDown) {
      runner.setKey(key, isDown);
      refresh();
    },
  };
}
