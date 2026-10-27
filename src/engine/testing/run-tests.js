import { describeValue } from './describe-value.js';
import { AssertionError, expect } from './expect.js';

/**
 * @typedef {object} ExerciseTest
 * @property {string} name Shown to the student.
 * @property {(context: object) => void | Promise<void>} run
 * @property {string} [hint] Shown to the student when the test fails.
 */

/**
 * Converts any thrown value into plain data that can cross `postMessage`.
 * @param {unknown} error
 */
export function serializeError(error) {
  if (error instanceof AssertionError) {
    const { name, message, matcher, expected, actual, negated } = error;
    return { name, message, matcher, expected, actual, negated };
  }
  return error instanceof Error
    ? { name: error.name, message: error.message }
    : { name: 'Error', message: describeValue(error) };
}

function assertValidTests(tests) {
  const valid =
    Array.isArray(tests) &&
    tests.every((test) => typeof test?.name === 'string' && typeof test.run === 'function');
  if (!valid) {
    throw new TypeError('Exercise tests must be an array of { name, run } objects');
  }
}

async function runTest(test, context) {
  const startedAt = performance.now();
  try {
    await test.run({ ...context, expect });
    return { name: test.name, passed: true, durationMs: performance.now() - startedAt };
  } catch (error) {
    return {
      name: test.name,
      passed: false,
      durationMs: performance.now() - startedAt,
      error: serializeError(error),
      ...(test.hint && { hint: test.hint }),
    };
  }
}

/**
 * Runs exercise tests sequentially. Each test receives `expect` plus the given context.
 * @param {ExerciseTest[]} tests
 * @param {object} [context]
 */
export async function runTests(tests, context = {}) {
  assertValidTests(tests);
  const results = [];
  for (const test of tests) {
    results.push(await runTest(test, context));
  }
  const passed = results.filter((result) => result.passed).length;
  return { results, total: results.length, passed, failed: results.length - passed };
}
