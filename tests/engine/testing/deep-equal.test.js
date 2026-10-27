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
    expect(isDeepEqual(new Set([1]), new Set([1, 2]))).toBe(false);
  });

  it('compares set members and map entries structurally, one to one', () => {
    expect(isDeepEqual(new Set([{ address: 512 }]), new Set([{ address: 512 }]))).toBe(true);
    expect(isDeepEqual(new Set([{ a: 1 }, { a: 1 }]), new Set([{ a: 1 }, { a: 2 }]))).toBe(false);
    expect(isDeepEqual(new Set([1, { a: 1 }]), new Set([{ a: 1 }, 2]))).toBe(false);
    expect(isDeepEqual(new Map([[{ id: 1 }, 'x']]), new Map([[{ id: 1 }, 'x']]))).toBe(true);
    expect(isDeepEqual(new Map([[{ id: 1 }, 'x']]), new Map([[{ id: 1 }, 'y']]))).toBe(false);
    expect(isDeepEqual(new Map([['k', { v: [1] }]]), new Map([['k', { v: [1] }]]))).toBe(true);
    expect(
      isDeepEqual(
        new Map([['k', 1]]),
        new Map([
          ['k', 1],
          ['j', 2],
        ]),
      ),
    ).toBe(false);
  });

  it('compares regular expressions by source and flags', () => {
    expect(isDeepEqual(/alpha/g, /alpha/g)).toBe(true);
    expect(isDeepEqual(/alpha/g, /beta/g)).toBe(false);
    expect(isDeepEqual(/alpha/g, /alpha/i)).toBe(false);
  });

  it('compares errors by name, message and own fields', () => {
    expect(isDeepEqual(new Error('alpha'), new Error('alpha'))).toBe(true);
    expect(isDeepEqual(new Error('alpha'), new Error('beta'))).toBe(false);
    expect(isDeepEqual(new TypeError('x'), new RangeError('x'))).toBe(false);
    const withCode = (code) => Object.assign(new Error('x'), { code });
    expect(isDeepEqual(withCode(1), withCode(2))).toBe(false);
  });

  it('only treats opaque types as equal when they are the same instance', () => {
    const weakMap = new WeakMap();

    expect(isDeepEqual(weakMap, weakMap)).toBe(true);
    expect(isDeepEqual(new WeakMap(), new WeakMap())).toBe(false);
    expect(isDeepEqual(new WeakSet(), new WeakSet())).toBe(false);
    expect(isDeepEqual(Promise.resolve(1), Promise.resolve(1))).toBe(false);
  });

  it('compares class instances key by key', () => {
    class Cpu {
      constructor(pc) {
        this.pc = pc;
      }
    }

    expect(isDeepEqual(new Cpu(0x2_00), new Cpu(0x2_00))).toBe(true);
    expect(isDeepEqual(new Cpu(0x2_00), new Cpu(0x2_02))).toBe(false);
    expect(isDeepEqual(new Cpu(0x2_00), { pc: 0x2_00 })).toBe(false);
  });

  it('compares ArrayBuffers and DataViews byte by byte', () => {
    expect(isDeepEqual(new Uint8Array([1]).buffer, new Uint8Array([1]).buffer)).toBe(true);
    expect(isDeepEqual(new Uint8Array([1]).buffer, new Uint8Array([2]).buffer)).toBe(false);
    expect(isDeepEqual(new Uint8Array([1, 2]).buffer, new Uint8Array([1]).buffer)).toBe(false);

    const bytes = new Uint8Array([9, 1, 2, 9]).buffer;
    const expected = new DataView(new Uint8Array([1, 2]).buffer);
    expect(isDeepEqual(new DataView(bytes, 1, 2), expected)).toBe(true);
    expect(isDeepEqual(new DataView(bytes, 0, 2), expected)).toBe(false);
  });
});
