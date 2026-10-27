import { describe, expect, it } from 'vitest';

import { ERROR_PHASE, executeSubmission, RUN_STATUS } from '@/engine/runner/execute-submission.js';

// Real ES module loading from source, like the worker does with Blob URLs.
function importModule(source) {
  return import(/* @vite-ignore */ `data:text/javascript,${encodeURIComponent(source)}`);
}

const TESTS_SOURCE = `
export default [
  { name: 'adds numbers', run: ({ student, expect }) => expect(student.add(2, 3)).toBe(5) },
  {
    name: 'adds bytes with wraparound',
    run: ({ student, expect }) => expect(student.add(0xff, 1)).toBe(0),
    hint: 'Use & 0xFF',
  },
];
`;

describe('executeSubmission', () => {
  it('passes when every test passes', async () => {
    const outcome = await executeSubmission({
      studentSource: 'export const add = (a, b) => (a + b) & 0xff;',
      testsSource: TESTS_SOURCE,
      importModule,
    });

    expect(outcome).toMatchObject({
      status: RUN_STATUS.PASSED,
      summary: { total: 2, passed: 2, failed: 0 },
    });
  });

  it('fails with per-test results when a test fails', async () => {
    const outcome = await executeSubmission({
      studentSource: 'export const add = (a, b) => a + b;',
      testsSource: TESTS_SOURCE,
      importModule,
    });

    expect(outcome.status).toBe(RUN_STATUS.FAILED);
    expect(outcome.results[1]).toMatchObject({
      passed: false,
      hint: 'Use & 0xFF',
      error: { expected: '0', actual: '256 (0x100)' },
    });
  });

  it('reports student syntax errors', async () => {
    const outcome = await executeSubmission({
      studentSource: 'export const add = (a, b) => ;',
      testsSource: TESTS_SOURCE,
      importModule,
    });

    expect(outcome).toMatchObject({
      status: RUN_STATUS.ERROR,
      phase: ERROR_PHASE.STUDENT,
      error: { name: 'SyntaxError' },
      results: [],
    });
  });

  it('reports student top-level exceptions', async () => {
    const outcome = await executeSubmission({
      studentSource: 'throw new Error("boom");',
      testsSource: TESTS_SOURCE,
      importModule,
    });

    expect(outcome).toMatchObject({ phase: ERROR_PHASE.STUDENT, error: { message: 'boom' } });
  });

  it('reports a student error even when the thrown value cannot be inspected', async () => {
    const outcome = await executeSubmission({
      studentSource: 'const { proxy, revoke } = Proxy.revocable({}, {}); revoke(); throw proxy;',
      testsSource: TESTS_SOURCE,
      importModule,
    });

    // The exact message depends on the module loader; what matters is a clean student error.
    expect(outcome).toMatchObject({
      status: RUN_STATUS.ERROR,
      phase: ERROR_PHASE.STUDENT,
      error: { message: expect.any(String) },
    });
  });

  it('blames the exercise when its tests cannot load', async () => {
    const outcome = await executeSubmission({
      studentSource: 'export const add = () => 0;',
      testsSource: 'export default [;',
      importModule,
    });

    expect(outcome).toMatchObject({ status: RUN_STATUS.ERROR, phase: ERROR_PHASE.TESTS });
  });

  it('blames the exercise when its tests are malformed', async () => {
    const outcome = await executeSubmission({
      studentSource: 'export const add = () => 0;',
      testsSource: 'export default "nope";',
      importModule,
    });

    expect(outcome).toMatchObject({ status: RUN_STATUS.ERROR, phase: ERROR_PHASE.TESTS });
  });
});
