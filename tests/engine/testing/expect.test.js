import { describe, expect, it } from 'vitest';

import { AssertionError, expect as exerciseExpect } from '@/engine/testing/expect.js';

function captureError(callback) {
  try {
    callback();
  } catch (error) {
    return error;
  }
  throw new Error('Expected callback to throw');
}

describe('exercise expect', () => {
  it('passes when matchers hold', () => {
    expect(() => {
      exerciseExpect(0x2_00).toBe(512);
      exerciseExpect(new Uint8Array([1])).toEqual(new Uint8Array([1]));
      exerciseExpect(1).toBeTruthy();
      exerciseExpect(0).toBeFalsy();
      exerciseExpect(null).toBeNull();
      exerciseExpect(undefined).toBeUndefined();
      exerciseExpect(0).toBeDefined();
      exerciseExpect(2).toBeGreaterThan(1);
      exerciseExpect(2).toBeGreaterThanOrEqual(2);
      exerciseExpect(1).toBeLessThan(2);
      exerciseExpect(2).toBeLessThanOrEqual(2);
      exerciseExpect(new RangeError('x')).toBeInstanceOf(Error);
      exerciseExpect([1, 2]).toContain(2);
      exerciseExpect('abc').toHaveLength(3);
      exerciseExpect(() => {
        throw new Error('boom');
      }).toThrow();
    }).not.toThrow();
  });

  it('supports negation', () => {
    expect(() => exerciseExpect(1).not.toBe(2)).not.toThrow();
    expect(() => exerciseExpect(1).not.toBe(1)).toThrow(AssertionError);
  });

  it('throws structured assertion errors', () => {
    const error = captureError(() => exerciseExpect(0).toBe(0x50));

    expect(error).toBeInstanceOf(AssertionError);
    expect(error).toMatchObject({
      matcher: 'toBe',
      expected: '80 (0x50)',
      actual: '0',
      negated: false,
      message: 'expect(0).toBe(80 (0x50))',
    });
  });

  it('describes negated failures', () => {
    const error = captureError(() => exerciseExpect(3).not.toEqual(3));

    expect(error.message).toBe('expect(3).not.toEqual(3)');
  });

  it('fails safely on values without the required shape', () => {
    expect(() => exerciseExpect(5).toContain(5)).toThrow(AssertionError);
    expect(() => exerciseExpect(undefined).toHaveLength(0)).toThrow(AssertionError);
    expect(() => exerciseExpect('not a function').toThrow()).toThrow(AssertionError);
    expect(() => exerciseExpect(() => {}).toThrow()).toThrow(AssertionError);
  });
});
