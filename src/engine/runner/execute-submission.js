import { runTests, serializeError } from '../testing/run-tests.js';

/**
 * Possible outcome statuses of a submission run.
 * - `passed`: every test passed.
 * - `failed`: the code loaded but at least one test failed.
 * - `error`: the code (or the exercise tests) could not be loaded or crashed the sandbox.
 * - `timeout`: the run exceeded the time limit (usually an infinite loop).
 */
export const RUN_STATUS = Object.freeze({
  PASSED: 'passed',
  FAILED: 'failed',
  ERROR: 'error',
  TIMEOUT: 'timeout',
});

/**
 * Phases where a run can fail before any test result exists.
 * `student` means the student's code threw while loading (syntax error, top-level exception);
 * `tests` means the exercise tests themselves are broken (a content bug, not the student's).
 */
export const ERROR_PHASE = Object.freeze({
  STUDENT: 'student',
  TESTS: 'tests',
  WORKER: 'worker',
});

function errorOutcome(phase, error) {
  return { status: RUN_STATUS.ERROR, phase, error: serializeError(error), results: [] };
}

/**
 * Loads the student's module and the exercise tests, then runs the tests against the student's
 * exports. Runs inside the sandbox worker; module loading is injected to keep it testable.
 * @param {object} submission
 * @param {string} submission.studentSource ES module source written by the student.
 * @param {string} submission.testsSource ES module source whose default export is the test list.
 * @param {(source: string) => Promise<object>} submission.importModule
 */
export async function executeSubmission({ studentSource, testsSource, importModule }) {
  let testsModule;
  try {
    testsModule = await importModule(testsSource);
  } catch (error) {
    return errorOutcome(ERROR_PHASE.TESTS, error);
  }

  let studentModule;
  try {
    studentModule = await importModule(studentSource);
  } catch (error) {
    return errorOutcome(ERROR_PHASE.STUDENT, error);
  }

  try {
    const report = await runTests(testsModule.default, { student: studentModule });
    return {
      status: report.failed === 0 ? RUN_STATUS.PASSED : RUN_STATUS.FAILED,
      results: report.results,
      summary: { total: report.total, passed: report.passed, failed: report.failed },
    };
  } catch (error) {
    return errorOutcome(ERROR_PHASE.TESTS, error);
  }
}
