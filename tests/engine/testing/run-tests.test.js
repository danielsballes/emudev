import { describe, expect, it } from 'vitest';

import { runTests, serializeError } from '@/engine/testing/index.js';

describe('runTests', () => {
  it('runs every test and reports a summary', async () => {
    const tests = [
      { name: 'passes', run: ({ expect: check }) => check(1).toBe(1) },
      { name: 'fails', run: ({ expect: check }) => check(1).toBe(2), hint: 'Revisa el valor' },
      { name: 'fails without hint', run: () => Promise.reject(new Error('async boom')) },
    ];

    const report = await runTests(tests);

    expect(report).toMatchObject({ total: 3, passed: 1, failed: 2 });
    expect(report.results[0]).toMatchObject({ name: 'passes', passed: true });
    expect(report.results[1]).toMatchObject({
      passed: false,
      hint: 'Revisa el valor',
      error: { name: 'AssertionError', matcher: 'toBe', expected: '2', actual: '1' },
    });
    expect(report.results[2]).not.toHaveProperty('hint');
    expect(report.results[2].error).toEqual({ name: 'Error', message: 'async boom' });
  });

  it('passes the context to every test', async () => {
    const student = { answer: 42 };
    const report = await runTests(
      [{ name: 'uses context', run: ({ student: s, expect: check }) => check(s.answer).toBe(42) }],
      { student },
    );

    expect(report.passed).toBe(1);
  });

  it('rejects malformed test definitions', async () => {
    await expect(runTests([{ name: 'no run' }])).rejects.toThrow(TypeError);
    await expect(runTests('nope')).rejects.toThrow(TypeError);
  });
});

describe('serializeError', () => {
  it('serializes non-error throwables', () => {
    expect(serializeError('oops')).toEqual({ name: 'Error', message: '"oops"' });
  });

  it('turns non-string error fields into text', () => {
    const error = new Error('placeholder');
    error.message = { code: 0x50 };

    expect(serializeError(error)).toEqual({ name: 'Error', message: '{ code: 80 (0x50) }' });
  });

  it('never throws on hostile errors', () => {
    const error = new Error('placeholder');
    Object.defineProperty(error, 'name', {
      get() {
        throw new Error('getter exploded');
      },
    });

    expect(serializeError(error)).toEqual({ name: 'Error', message: '[unprintable error]' });
  });
});
