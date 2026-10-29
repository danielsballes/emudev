import { describe, expect, it } from 'vitest';

import { disassemble } from '@/modules/chip8/core/disassemble.js';

describe('disassemble', () => {
  it.each([
    [0x00_e0, 'CLS'],
    [0x00_ee, 'RET'],
    [0x01_23, 'SYS 0x123'],
    [0x16_00, 'JP 0x600'],
    [0x22_a4, 'CALL 0x2A4'],
    [0x30_ff, 'SE V0, 0xFF'],
    [0x41_05, 'SNE V1, 0x05'],
    [0x51_20, 'SE V1, V2'],
    [0x6a_2b, 'LD VA, 0x2B'],
    [0x7f_01, 'ADD VF, 0x01'],
    [0x81_20, 'LD V1, V2'],
    [0x81_21, 'OR V1, V2'],
    [0x81_22, 'AND V1, V2'],
    [0x81_23, 'XOR V1, V2'],
    [0x81_24, 'ADD V1, V2'],
    [0x81_25, 'SUB V1, V2'],
    [0x81_26, 'SHR V1, V2'],
    [0x81_27, 'SUBN V1, V2'],
    [0x81_2e, 'SHL V1, V2'],
    [0x91_20, 'SNE V1, V2'],
    [0xa2_ea, 'LD I, 0x2EA'],
    [0xb3_00, 'JP V0, 0x300'],
    [0xc4_0f, 'RND V4, 0x0F'],
    [0xd1_25, 'DRW V1, V2, 5'],
    [0xe5_9e, 'SKP V5'],
    [0xe5_a1, 'SKNP V5'],
    [0xf5_07, 'LD V5, DT'],
    [0xf5_0a, 'LD V5, K'],
    [0xf5_15, 'LD DT, V5'],
    [0xf5_18, 'LD ST, V5'],
    [0xf5_1e, 'ADD I, V5'],
    [0xf5_29, 'LD F, V5'],
    [0xf5_33, 'LD B, V5'],
    [0xf5_55, 'LD [I], V5'],
    [0xf5_65, 'LD V5, [I]'],
  ])('disassembles %s', (opcode, text) => {
    expect(disassemble(opcode)).toBe(text);
  });

  it.each([0x50_11, 0x80_08, 0x90_01, 0xe0_00, 0xf0_00])('shows %s as data', (opcode) => {
    expect(disassemble(opcode)).toBe(`DW 0x${opcode.toString(16).toUpperCase().padStart(4, '0')}`);
  });
});
