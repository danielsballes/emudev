import { afterEach, describe, expect, it, vi } from 'vitest';

import { createRunner, DEFAULT_TIMEOUT_MS } from '@/engine/runner/create-runner.js';
import { RUN_STATUS } from '@/engine/runner/execute-submission.js';

class FakeWorker extends EventTarget {
  constructor(respond) {
    super();
    this.respond = respond;
    this.terminate = vi.fn();
    this.sent = [];
  }

  postMessage(message) {
    this.sent.push(message);
    queueMicrotask(() => this.respond?.(this, message));
  }

  emitMessage(data) {
    this.dispatchEvent(new MessageEvent('message', { data }));
  }

  emitError(message) {
    const event = new Event('error', { cancelable: true });
    if (message !== undefined) {
      event.message = message;
    }
    this.dispatchEvent(event);
  }
}

const submission = { studentSource: 'export const a = 1;', testsSource: 'export default [];' };

function runWith(respond, options = {}) {
  const worker = new FakeWorker(respond);
  const runner = createRunner({ createWorker: () => worker, ...options });
  return { worker, promise: runner.run(submission) };
}

describe('createRunner', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends the submission with a per-run token and resolves with the worker outcome', async () => {
    const { worker, promise } = runWith((self, message) =>
      self.emitMessage({
        type: 'result',
        token: message.token,
        outcome: { status: RUN_STATUS.PASSED, results: [], logs: [{ level: 'log', text: 'hi' }] },
      }),
    );

    const outcome = await promise;

    expect(worker.sent[0]).toMatchObject({ type: 'run', ...submission });
    expect(worker.sent[0].token).toEqual(expect.any(String));
    expect(outcome).toEqual({
      status: RUN_STATUS.PASSED,
      results: [],
      logs: [{ level: 'log', text: 'hi' }],
      droppedLogs: 0,
    });
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('ignores messages without the run token (e.g. faked by student code)', async () => {
    vi.useFakeTimers();
    const { worker, promise } = runWith((self) => {
      self.emitMessage({ type: 'result', token: 'forged', outcome: { status: 'passed' } });
      self.emitMessage({ type: 'other' });
      self.emitMessage(null);
    });

    await vi.advanceTimersByTimeAsync(DEFAULT_TIMEOUT_MS);

    await expect(promise).resolves.toMatchObject({ status: RUN_STATUS.TIMEOUT });
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('times out and terminates a worker that never answers', async () => {
    vi.useFakeTimers();
    const { worker, promise } = runWith(undefined, { timeoutMs: 500 });

    await vi.advanceTimersByTimeAsync(500);

    await expect(promise).resolves.toEqual({
      status: RUN_STATUS.TIMEOUT,
      results: [],
      timeoutMs: 500,
      logs: [],
      droppedLogs: 0,
    });
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('reports worker errors once', async () => {
    const { worker, promise } = runWith((self) => {
      self.emitError('Script failed');
      self.emitError();
    });

    await expect(promise).resolves.toMatchObject({
      status: RUN_STATUS.ERROR,
      phase: 'worker',
      error: { message: 'Script failed' },
    });
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('uses a generic message when the error event has none', async () => {
    const { promise } = runWith((self) => self.emitError());

    await expect(promise).resolves.toMatchObject({ error: { message: 'Worker error' } });
  });
});
