import { describeValue } from '../testing/describe-value.js';

const LEVELS = ['log', 'info', 'warn', 'error', 'debug'];

/**
 * Creates a console replacement that records output instead of printing it, so the student's
 * `console.log` calls can be shown in the lesson UI.
 * @param {{ limit?: number }} [options] Maximum number of entries kept.
 */
export function createConsoleCapture({ limit = 200 } = {}) {
  const entries = [];
  let dropped = 0;

  const record = (level, values) => {
    if (entries.length >= limit) {
      dropped += 1;
      return;
    }
    const text = values
      .map((value) => (typeof value === 'string' ? value : describeValue(value)))
      .join(' ');
    entries.push({ level, text });
  };

  const console = Object.fromEntries(
    LEVELS.map((level) => [level, (...values) => record(level, values)]),
  );

  return {
    console,
    get entries() {
      return [...entries];
    },
    get dropped() {
      return dropped;
    },
  };
}

/**
 * Replaces the console of a scope (the sandbox worker) with a captured one.
 * @param {object} scope
 * @param {object} capturedConsole Usually `createConsoleCapture().console`.
 */
export function installConsole(scope, capturedConsole) {
  Object.defineProperty(scope, 'console', {
    value: capturedConsole,
    writable: false,
    configurable: true,
  });
}
