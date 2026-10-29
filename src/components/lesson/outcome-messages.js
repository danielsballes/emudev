import { ERROR_PHASE, RUN_STATUS } from '@/engine/runner/index.js';

/**
 * Turns a runner outcome into Spanish messages for the student. Assertion errors arrive as data
 * (`matcher`, `expected`, `actual`), so they are explained here instead of in English.
 * @param {object} outcome Result of `runner.run()`.
 * @param {(key: string, values?: object) => string} t vue-i18n translate function.
 * @returns {{ summary: string, problem: string | null }}
 */
export function describeOutcome(outcome, t) {
  const summary = {
    [RUN_STATUS.PASSED]: t('lesson.outcome.passed'),
    [RUN_STATUS.FAILED]: t('lesson.outcome.failed', {
      passed: outcome.summary?.passed ?? 0,
      total: outcome.summary?.total ?? 0,
    }),
    [RUN_STATUS.ERROR]: t('lesson.outcome.error'),
    [RUN_STATUS.TIMEOUT]: t('lesson.outcome.timeout'),
  }[outcome.status];

  const problem =
    outcome.status === RUN_STATUS.ERROR
      ? {
          [ERROR_PHASE.STUDENT]: t('lesson.outcome.studentError', {
            message: outcome.error?.message ?? '',
          }),
          [ERROR_PHASE.TESTS]: t('lesson.outcome.testsError'),
          [ERROR_PHASE.WORKER]: t('lesson.outcome.workerError'),
        }[outcome.phase]
      : null;

  return { summary, problem };
}

/**
 * Explains why a single test failed.
 * @param {{ matcher?: string, expected?: string, actual?: string, negated?: boolean, message: string }} error
 * @param {(key: string, values?: object) => string} t
 */
export function describeTestError(error, t) {
  if (!error.matcher) {
    return t('lesson.test.threw', { message: error.message });
  }
  return error.negated
    ? t('lesson.test.unexpected', { expected: error.expected })
    : t('lesson.test.expected', { expected: error.expected, actual: error.actual });
}
