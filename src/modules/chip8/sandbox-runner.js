import { createChip8, QUIRKS, TIMER_HZ } from './core/index.js';

export const DEFAULT_INSTRUCTIONS_PER_SECOND = 600;
const TIMER_INTERVAL_MS = 1000 / TIMER_HZ;
/**
 * Longest gap simulated at once, so coming back to a hidden tab does not fast-forward.
 */
const MAX_ELAPSED_MS = 100;

/**
 * Runs a CHIP-8 machine in real time for the sandbox: CPU at a fixed instruction rate, timers at
 * 60 Hz, pause, single step and quirk presets. It has no DOM dependencies: the caller drives it
 * with `advance(elapsedMs)` (e.g. from `requestAnimationFrame`).
 * @param {{ quirks?: string, instructionsPerSecond?: number, random?: () => number }} [options]
 */
export function createSandboxRunner({
  quirks = 'cosmac',
  instructionsPerSecond = DEFAULT_INSTRUCTIONS_PER_SECOND,
  random,
} = {}) {
  const config = { quirks, instructionsPerSecond, random };
  const status = { isRunning: false, error: null, rom: null };
  const clock = { instructions: 0, timers: 0 };
  let chip8 = createChip8({ quirks: QUIRKS[config.quirks], random });

  function boot(rom) {
    chip8 = createChip8({ quirks: QUIRKS[config.quirks], random: config.random });
    chip8.loadRom(rom);
    status.rom = rom;
    status.error = null;
    clock.instructions = 0;
    clock.timers = 0;
  }

  function step() {
    try {
      chip8.step();
    } catch (error) {
      status.error = error;
      status.isRunning = false;
    }
  }

  return {
    get chip8() {
      return chip8;
    },
    get isRunning() {
      return status.isRunning;
    },
    get error() {
      return status.error;
    },
    get quirks() {
      return config.quirks;
    },
    get hasRom() {
      return status.rom !== null;
    },

    /**
     * Loads a ROM on a fresh machine and leaves it paused at 0x200.
     * @param {Uint8Array | number[]} rom
     */
    load(rom) {
      status.isRunning = false;
      boot(rom);
    },

    /**
     * Restarts the loaded ROM from the beginning, keeping the run/pause state.
     */
    reset() {
      if (status.rom) {
        boot(status.rom);
      }
    },

    play() {
      status.isRunning = status.rom !== null && status.error === null;
    },

    pause() {
      status.isRunning = false;
    },

    /**
     * Executes exactly one instruction while paused.
     */
    stepOnce() {
      if (!status.rom || status.error !== null) {
        return;
      }
      status.isRunning = false;
      step();
    },

    /**
     * Switches quirk preset and restarts the ROM, since results depend on it.
     * @param {'cosmac' | 'schip'} name
     */
    setQuirks(name) {
      config.quirks = name;
      if (status.rom) {
        boot(status.rom);
      }
    },

    setKey(key, isDown) {
      chip8.setKey(key, isDown);
    },

    /**
     * Immutable copy of everything a debugger shows, safe to hand to the UI.
     */
    snapshot() {
      const { state } = chip8;
      return {
        v: Uint8Array.from(state.v),
        i: state.i,
        pc: state.pc,
        sp: state.sp,
        stack: Uint16Array.from(state.stack),
        delayTimer: state.delayTimer,
        soundTimer: state.soundTimer,
        display: Uint8Array.from(state.display),
        keys: Uint8Array.from(state.keys),
        memory: Uint8Array.from(state.memory),
      };
    },

    /**
     * Simulates `elapsedMs` of real time while running.
     * @param {number} elapsedMs
     */
    advance(elapsedMs) {
      if (!status.isRunning) {
        return;
      }
      const elapsed = Math.min(elapsedMs, MAX_ELAPSED_MS);
      clock.instructions += (elapsed * config.instructionsPerSecond) / 1000;
      clock.timers += elapsed;
      while (clock.instructions >= 1 && status.isRunning) {
        clock.instructions -= 1;
        step();
      }
      while (clock.timers >= TIMER_INTERVAL_MS) {
        clock.timers -= TIMER_INTERVAL_MS;
        chip8.tickTimers();
      }
    },
  };
}
