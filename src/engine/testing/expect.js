import { isDeepEqual } from './deep-equal.js';
import { describeValue } from './describe-value.js';

/**
 * Error thrown by a failed `expect` matcher. Carries structured data so the UI can explain the
 * failure in the student's language instead of relying on the English message.
 */
export class AssertionError extends Error {
  /**
   * @param {{ matcher: string, expected?: unknown, actual: unknown, negated: boolean }} details
   */
  constructor({ matcher, expected, actual, negated }) {
    const expectedText = describeValue(expected);
    const actualText = describeValue(actual);
    super(`expect(${actualText}).${negated ? 'not.' : ''}${matcher}(${expectedText})`);
    this.name = 'AssertionError';
    this.matcher = matcher;
    this.expected = expectedText;
    this.actual = actualText;
    this.negated = negated;
  }
}

function didThrow(callback) {
  try {
    callback();
    return false;
  } catch {
    return true;
  }
}

const MATCHERS = {
  toBe: (actual, expected) => Object.is(actual, expected),
  toEqual: (actual, expected) => isDeepEqual(actual, expected),
  toBeTruthy: Boolean,
  toBeFalsy: (actual) => !actual,
  toBeNull: (actual) => actual === null,
  toBeUndefined: (actual) => actual === undefined,
  toBeDefined: (actual) => actual !== undefined,
  toBeGreaterThan: (actual, expected) => actual > expected,
  toBeGreaterThanOrEqual: (actual, expected) => actual >= expected,
  toBeLessThan: (actual, expected) => actual < expected,
  toBeLessThanOrEqual: (actual, expected) => actual <= expected,
  toBeInstanceOf: (actual, expected) => actual instanceof expected,
  toContain: (actual, expected) => actual?.includes?.(expected) === true,
  toHaveLength: (actual, expected) => actual?.length === expected,
  toThrow: (actual) => typeof actual === 'function' && didThrow(actual),
};

function buildMatchers(actual, negated) {
  return Object.fromEntries(
    Object.entries(MATCHERS).map(([matcher, check]) => [
      matcher,
      (expected) => {
        if (check(actual, expected) === negated) {
          throw new AssertionError({ matcher, expected, actual, negated });
        }
      },
    ]),
  );
}

/**
 * Minimal Jest-like assertion API exposed to exercise tests.
 * @param {unknown} actual
 */
export function expect(actual) {
  return { ...buildMatchers(actual, false), not: buildMatchers(actual, true) };
}
