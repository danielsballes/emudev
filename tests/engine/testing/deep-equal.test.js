import { describe, expect, it } from 'vitest';

import { isDeepEqual } from '@/engine/testing/deep-equal.js';

describe('isDeepEqual', () => {
  it('compares primitives with Object.is semantics', () => {
    expect(isDeepEqual(1, 1)).toBe(true);
    expect(isDeepEqual(NaN, NaN)).toBe(true);
    expect(isDeepEqual(1, '1')).toBe(false);
    expect(isDeepEqual(null, {})).toBe(false);
  });

  it('compares arrays and typed arrays element by element', () => {
    expect(isDeepEqual([1, [2]], [1, [2]])).toBe(true);
    expect(isDeepEqual([1, 2], [1])).toBe(false);
    expect(isDeepEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2]))).toBe(true);
    expect(isDeepEqual(new Uint8Array([1]), new Uint16Array([1]))).toBe(false);
  });

  it('compares plain objects by own keys', () => {
    expect(isDeepEqual({ a: 1, b: { c: 2 } }, { b: { c: 2 }, a: 1 })).toBe(true);
    expect(isDeepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(isDeepEqual({ a: 1, b: undefined }, { a: 1, c: undefined })).toBe(false);
  });

  it('compares dates, maps and sets', () => {
    expect(isDeepEqual(new Date(0), new Date(0))).toBe(true);
    expect(isDeepEqual(new Date(0), new Date(1))).toBe(false);
    expect(isDeepEqual(new Map([['a', [1]]]), new Map([['a', [1]]]))).toBe(true);
    expect(isDeepEqual(new Map([['a', 1]]), new Map([['b', 1]]))).toBe(false);
    expect(isDeepEqual(new Set([1, 2]), new Set([2, 1]))).toBe(true);
    expect(isDeepEqual(new Set([1]), new Set([2]))).toBe(false);
  });
});
