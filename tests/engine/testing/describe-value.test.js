import { describe, expect, it } from 'vitest';

import { describeValue, formatInteger } from '@/engine/testing/describe-value.js';

describe('formatInteger', () => {
  it('shows small and unsafe integers in decimal only', () => {
    expect(formatInteger(7)).toBe('7');
    expect(formatInteger(-3)).toBe('-3');
    expect(formatInteger(2 ** 60)).toBe(String(2 ** 60));
  });

  it('adds the hexadecimal form for larger integers', () => {
    expect(formatInteger(80)).toBe('80 (0x50)');
    expect(formatInteger(0x2_00)).toBe('512 (0x200)');
  });
});

describe('describeValue', () => {
  it.each([
    [undefined, 'undefined'],
    [null, 'null'],
    [true, 'true'],
    [1.5, '1.5'],
    [255, '255 (0xFF)'],
    [10n, '10n'],
    ['hi', '"hi"'],
    [Symbol('s'), 'Symbol(s)'],
  ])('describes primitive %s', (value, expected) => {
    expect(describeValue(value)).toBe(expected);
  });

  it('truncates long strings', () => {
    expect(describeValue('a'.repeat(300))).toBe(`"${'a'.repeat(199)}…`);
  });

  it('describes functions', () => {
    expect(describeValue(Math.max)).toBe('[Function max]');
    expect(describeValue(() => {})).toBe('[Function anonymous]');
  });

  it('describes errors and dates', () => {
    expect(describeValue(new RangeError('bad'))).toBe('RangeError: bad');
    expect(describeValue(new Date('2026-01-01T00:00:00.000Z'))).toBe(
      'Date(2026-01-01T00:00:00.000Z)',
    );
  });

  it('describes invalid dates without throwing', () => {
    expect(describeValue(new Date(NaN))).toBe('Date(Invalid)');
  });

  it('reports values that cannot be inspected instead of throwing', () => {
    const hostile = {
      get trap() {
        throw new Error('getter exploded');
      },
    };

    expect(describeValue(hostile)).toBe('[unprintable value]');
  });

  it('only formats the items it shows', () => {
    const hostile = {
      get trap() {
        throw new Error('should not be read');
      },
    };
    const longArray = [...Array.from({ length: 16 }, (_, index) => index), hostile];
    const wideObject = Object.fromEntries(
      Array.from({ length: 16 }, (_, index) => [`k${index}`, index]),
    );
    wideObject.trap = hostile;

    expect(describeValue(longArray)).toContain('… (+1)');
    expect(describeValue(wideObject)).toContain('… (+1)');
  });

  it('describes maps and sets with their contents', () => {
    expect(describeValue(new Map([['pc', 0x2_00]]))).toBe('Map(1) { "pc" => 512 (0x200) }');
    expect(describeValue(new Set([1, 'a']))).toBe('Set(2) { 1, "a" }');
    const twentyNumbers = new Set(Array.from({ length: 20 }, (_, index) => index));
    expect(describeValue(twentyNumbers)).toContain('… (+4) }');
    expect(describeValue({ registers: { v: new Map([[0, 1]]) } })).toBe(
      '{ registers: { v: Map(1) } }',
    );
    expect(describeValue([[new Set([1])]])).toBe('[[Set(1)]]');
  });

  it('describes buffers, data views and regular expressions', () => {
    const bytes = new Uint8Array([9, 1, 2, 9]).buffer;

    expect(describeValue(bytes)).toBe('ArrayBuffer(4) [9, 1, 2, 9]');
    expect(describeValue(new DataView(bytes, 1, 2))).toBe('DataView(2) [1, 2]');
    expect(describeValue(/ab+c/gi)).toBe('/ab+c/gi');
  });

  it('describes typed arrays and truncates them', () => {
    expect(describeValue(new Uint8Array([1, 0x50]))).toBe('Uint8Array(2) [1, 80 (0x50)]');
    expect(describeValue(new Uint8Array(4096))).toContain('… (+4080)');
  });

  it('describes arrays and objects up to a fixed depth', () => {
    expect(describeValue([1, [2, [3]]])).toBe('[1, [2, Array(1)]]');
    expect(describeValue({ pc: 512, nested: { deep: { x: 1 } } })).toBe(
      '{ pc: 512 (0x200), nested: { deep: {…} } }',
    );
    expect(describeValue({})).toBe('{}');
  });
});
