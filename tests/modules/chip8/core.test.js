import { describe, expect, it } from 'vitest';

import {
  Chip8Error,
  createChip8,
  decode,
  DISPLAY_WIDTH,
  FONT_START,
  PROGRAM_START,
  QUIRKS,
} from '@/modules/chip8/core/index.js';

/**
 * Builds a machine, loads the given opcodes at 0x200 and runs `steps` instructions.
 * @param {number[]} opcodes 16-bit opcodes.
 */
function run(opcodes, { steps = opcodes.length, quirks, random, setup } = {}) {
  const chip8 = createChip8({ quirks, random });
  chip8.loadRom(opcodes.flatMap((opcode) => [opcode >> 8, opcode & 0xff]));
  setup?.(chip8);
  for (let index = 0; index < steps; index += 1) {
    chip8.step();
  }
  return chip8.state;
}

const pressKeyA = (chip8) => chip8.setKey(0xa, true);

const pixel = (state, x, y) => state.display[y * DISPLAY_WIDTH + x];

describe('decode', () => {
  it('splits an opcode into its fields', () => {
    expect(decode(0xd1_23)).toEqual({
      opcode: 0xd1_23,
      kind: 0xd,
      x: 1,
      y: 2,
      n: 3,
      nn: 0x23,
      nnn: 0x1_23,
    });
  });
});

describe('machine', () => {
  it('starts with the font loaded and PC at 0x200', () => {
    const { state } = createChip8();

    expect(state.pc).toBe(PROGRAM_START);
    expect([...state.memory.subarray(FONT_START, FONT_START + 5)]).toEqual([
      0xf0, 0x90, 0x90, 0x90, 0xf0,
    ]);
  });

  it('rejects ROMs that do not fit and resets to a clean state', () => {
    const chip8 = createChip8();

    expect(() => chip8.loadRom(new Uint8Array(4096))).toThrow(Chip8Error);
    chip8.state.v[0] = 9;
    chip8.reset();
    expect(chip8.state.v[0]).toBe(0);
  });

  it('decrements timers down to zero', () => {
    const chip8 = createChip8();
    chip8.state.delayTimer = 1;
    chip8.state.soundTimer = 2;

    chip8.tickTimers();
    chip8.tickTimers();

    expect(chip8.state.delayTimer).toBe(0);
    expect(chip8.state.soundTimer).toBe(0);
  });

  it('throws on unknown opcodes', () => {
    expect(() => run([0x80_08])).toThrow(/Unknown opcode 0x8008/);
    expect(() => run([0xe0_00])).toThrow(Chip8Error);
    expect(() => run([0xf0_00])).toThrow(Chip8Error);
  });
});

describe('flow control', () => {
  it('00E0 clears the screen and 0NNN is ignored', () => {
    const state = run([0x00_e0, 0x01_23], {
      setup: (chip8) => chip8.state.display.fill(1),
    });

    expect(state.display.every((value) => value === 0)).toBe(true);
    expect(state.pc).toBe(0x2_04);
  });

  it('1NNN jumps', () => {
    expect(run([0x13_45]).pc).toBe(0x3_45);
  });

  it('2NNN calls and 00EE returns', () => {
    const called = run([0x22_04, 0x00_00, 0x00_ee], { steps: 1 });
    expect(called).toMatchObject({ pc: 0x2_04, sp: 1 });
    expect(called.stack[0]).toBe(0x2_02);

    const returned = run([0x22_04, 0x00_00, 0x00_ee], { steps: 2 });
    expect(returned).toMatchObject({ pc: 0x2_02, sp: 0 });
  });

  it('reports stack underflow and overflow', () => {
    expect(() => run([0x00_ee])).toThrow(expect.objectContaining({ code: 'stack-underflow' }));
    expect(() => run([0x22_00], { steps: 17 })).toThrow(
      expect.objectContaining({ code: 'stack-overflow' }),
    );
  });

  it.each([
    ['3XNN skips when VX == NN', [0x60_05, 0x30_05], 0x2_06],
    ['3XNN does not skip otherwise', [0x60_05, 0x30_06], 0x2_04],
    ['4XNN skips when VX != NN', [0x60_05, 0x40_06], 0x2_06],
    ['5XY0 skips when VX == VY', [0x60_05, 0x61_05, 0x50_10], 0x2_08],
    ['9XY0 skips when VX != VY', [0x60_05, 0x61_06, 0x90_10], 0x2_08],
  ])('%s', (_name, opcodes, pc) => {
    expect(run(opcodes).pc).toBe(pc);
  });

  it('BNNN jumps to NNN + V0 (COSMAC) or XNN + VX (SCHIP)', () => {
    expect(run([0x60_02, 0x61_04, 0xb3_00]).pc).toBe(0x3_02);
    expect(run([0x60_02, 0x63_04, 0xb3_00], { quirks: QUIRKS.schip }).pc).toBe(0x3_04);
  });
});

describe('registers and ALU', () => {
  it('6XNN sets, 7XNN adds without carry flag, ANNN sets I', () => {
    const state = run([0x6a_ff, 0x7a_02, 0xa1_23]);

    expect(state.v[0xa]).toBe(0x01);
    expect(state.v[0xf]).toBe(0);
    expect(state.i).toBe(0x1_23);
  });

  it.each([
    ['8XY0 copies', 0x81_20, [0x0f, 0x33], { 1: 0x33 }],
    ['8XY1 ORs', 0x81_21, [0x0f, 0x30], { 1: 0x3f, 15: 0 }],
    ['8XY2 ANDs', 0x81_22, [0x0f, 0x3c], { 1: 0x0c }],
    ['8XY3 XORs', 0x81_23, [0x0f, 0x3c], { 1: 0x33 }],
    ['8XY4 adds with carry', 0x81_24, [0xff, 0x02], { 1: 0x01, 15: 1 }],
    ['8XY4 adds without carry', 0x81_24, [0x01, 0x02], { 1: 0x03, 15: 0 }],
    ['8XY5 subtracts without borrow', 0x81_25, [0x05, 0x03], { 1: 0x02, 15: 1 }],
    ['8XY5 subtracts with borrow', 0x81_25, [0x03, 0x05], { 1: 0xfe, 15: 0 }],
    ['8XY7 subtracts reversed', 0x81_27, [0x03, 0x05], { 1: 0x02, 15: 1 }],
    ['8XY6 shifts VY right (COSMAC)', 0x81_26, [0x00, 0x05], { 1: 0x02, 15: 1 }],
    ['8XYE shifts VY left (COSMAC)', 0x81_2e, [0x00, 0x81], { 1: 0x02, 15: 1 }],
  ])('%s', (_name, opcode, [vx, vy], expected) => {
    const state = run([0x61_00 | vx, 0x62_00 | vy, 0x6f_09, opcode]);

    for (const [register, value] of Object.entries(expected)) {
      expect(state.v[register]).toBe(value);
    }
  });

  it('applies SCHIP quirks to shifts and logic', () => {
    const state = run([0x61_05, 0x62_ff, 0x6f_09, 0x81_26], { quirks: QUIRKS.schip });
    expect(state.v[1]).toBe(0x02);

    const logic = run([0x6f_09, 0x81_21], { quirks: QUIRKS.schip });
    expect(logic.v[0xf]).toBe(9);
  });

  it('writes the result before the flag when VX is VF', () => {
    const state = run([0x6f_ff, 0x61_02, 0x8f_14]);

    expect(state.v[0xf]).toBe(1);
  });

  it('CXNN masks a random byte', () => {
    expect(run([0xc3_0f], { random: () => 0xab }).v[3]).toBe(0x0b);
  });
});

describe('display', () => {
  it('DXYN draws a sprite and reports collisions', () => {
    // Draw the "0" glyph at (1, 2), then draw it again to erase it.
    const first = run([0xa0_50, 0x60_01, 0x61_02, 0xd0_15]);
    expect(pixel(first, 1, 2)).toBe(1);
    expect(pixel(first, 2, 3)).toBe(0);
    expect(first.v[0xf]).toBe(0);
    expect(first.drawn).toBe(true);

    const second = run([0xa0_50, 0x60_01, 0x61_02, 0xd0_15, 0xd0_15]);
    expect(pixel(second, 1, 2)).toBe(0);
    expect(second.v[0xf]).toBe(1);
  });

  it('wraps the start position and clips at the edges', () => {
    const state = run([0xa0_50, 0x60_7e, 0x61_3e, 0xd0_15]);

    expect(pixel(state, 62, 30)).toBe(1);
    expect(pixel(state, 0, 30)).toBe(0);
    expect(pixel(state, 62, 0)).toBe(0);
  });

  it('wraps sprites around the edges when clipping is disabled', () => {
    const quirks = { ...QUIRKS.cosmac, clipSprites: false };
    const state = run([0xa0_50, 0x60_3e, 0x61_1e, 0xd0_15], { quirks });

    expect(pixel(state, 0, 30)).toBe(1);
    expect(pixel(state, 62, 0)).toBe(1);
  });
});

describe('keys and timers', () => {
  it('EX9E and EXA1 skip depending on the key state', () => {
    const setup = pressKeyA;

    expect(run([0x60_0a, 0xe0_9e], { setup }).pc).toBe(0x2_06);
    expect(run([0x60_0a, 0xe0_a1], { setup }).pc).toBe(0x2_04);
    expect(run([0x60_0b, 0xe0_a1], { setup }).pc).toBe(0x2_06);
  });

  it('FX0A waits until a key is pressed', () => {
    const waiting = run([0xf3_0a], { steps: 3 });
    expect(waiting.pc).toBe(PROGRAM_START);

    const pressed = run([0xf3_0a], { setup: (chip8) => chip8.setKey(7, true) });
    expect(pressed.v[3]).toBe(7);
    expect(pressed.pc).toBe(0x2_02);
  });

  it('FX07, FX15 and FX18 move values between registers and timers', () => {
    const state = run([0x61_2a, 0xf1_15, 0xf1_18, 0xf2_07]);

    expect(state.delayTimer).toBe(0x2a);
    expect(state.soundTimer).toBe(0x2a);
    expect(state.v[2]).toBe(0x2a);
  });

  it('setKey releases keys too', () => {
    const chip8 = createChip8();
    chip8.setKey(1, true);
    chip8.setKey(1, false);

    expect(chip8.state.keys[1]).toBe(0);
  });
});

describe('memory', () => {
  it('FX1E adds to I and FX29 points I at a font glyph', () => {
    expect(run([0xa1_00, 0x63_05, 0xf3_1e]).i).toBe(0x1_05);
    expect(run([0x63_0b, 0xf3_29]).i).toBe(FONT_START + 0xb * 5);
  });

  it('FX33 stores the decimal digits of VX', () => {
    const state = run([0xa3_00, 0x62_9c, 0xf2_33]);

    expect([...state.memory.subarray(0x3_00, 0x3_03)]).toEqual([1, 5, 6]);
  });

  it('FX55 and FX65 store and load V0..VX, incrementing I (COSMAC)', () => {
    const state = run([0x60_01, 0x61_02, 0x62_03, 0xa3_00, 0xf2_55, 0xa3_00, 0x60_00, 0xf1_65]);

    expect([...state.memory.subarray(0x3_00, 0x3_03)]).toEqual([1, 2, 3]);
    expect(state.v[0]).toBe(1);
    expect(state.i).toBe(0x3_02);
  });

  it('leaves I unchanged with the SCHIP quirk', () => {
    expect(run([0xa3_00, 0xf2_55], { quirks: QUIRKS.schip }).i).toBe(0x3_00);
  });
});
