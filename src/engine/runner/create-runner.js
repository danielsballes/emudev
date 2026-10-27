import { ERROR_PHASE, RUN_STATUS } from './execute-submission.js';

export const DEFAULT_TIMEOUT_MS = 3000;

function createSandboxWorker() {
  return new Worker(new URL('sandbox.worker.js', import.meta.url), { type: 'module' });
}

/**
 * Creates a runner that executes student code in a disposable Web Worker.
 * A worker that does not answer in time (e.g. an infinite loop) is terminated.
 * @param {object} [options]
 * @param {() => Worker} [options.createWorker]
 * @param {number} [options.timeoutMs]
 */
export function createRunner({
  createWorker = createSandboxWorker,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  /**
   * @param {{ studentSource: string, testsSource: string }} submission
   * @returns {Promise<object>} The run outcome (see `RUN_STATUS`).
   */
  function run({ studentSource, testsSource }) {
    return new Promise((resolve) => {
      const worker = createWorker();
      const token = crypto.randomUUID();
      let isSettled = false;

      const finish = (outcome) => {
        if (isSettled) {
          return;
        }
        isSettled = true;
        clearTimeout(timer);
        worker.terminate();
        resolve({ logs: [], droppedLogs: 0, ...outcome });
      };

      const timer = setTimeout(
        () => finish({ status: RUN_STATUS.TIMEOUT, results: [], timeoutMs }),
        timeoutMs,
      );

      worker.addEventListener('message', ({ data }) => {
        if (data?.type === 'result' && data.token === token) {
          finish(data.outcome);
        }
      });
      worker.addEventListener('error', (event) => {
        event.preventDefault?.();
        finish({
          status: RUN_STATUS.ERROR,
          phase: ERROR_PHASE.WORKER,
          error: { name: 'Error', message: event.message ?? 'Worker error' },
          results: [],
        });
      });

      worker.postMessage({ type: 'run', token, studentSource, testsSource });
    });
  }

  return { run };
}
