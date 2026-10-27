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
