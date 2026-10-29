/**
 * Splits a 16-bit opcode into the fields CHIP-8 instructions use.
 * Example: 0xD123 → { kind: 0xD, x: 1, y: 2, n: 3, nn: 0x23, nnn: 0x123 }.
 * @param {number} opcode
 */
export function decode(opcode) {
  return {
    opcode,
    kind: (opcode & 0xf0_00) >> 12,
    x: (opcode & 0x0f_00) >> 8,
    y: (opcode & 0x00_f0) >> 4,
    n: opcode & 0x00_0f,
    nn: opcode & 0x00_ff,
    nnn: opcode & 0x0f_ff,
  };
}
