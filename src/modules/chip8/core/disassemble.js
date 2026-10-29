import { decode } from './decode.js';

const hex = (value, width) => `0x${value.toString(16).toUpperCase().padStart(width, '0')}`;
const register = (index) => `V${index.toString(16).toUpperCase()}`;

const ALU_NAMES = {
  0x0: 'LD',
  0x1: 'OR',
  0x2: 'AND',
  0x3: 'XOR',
  0x4: 'ADD',
  0x5: 'SUB',
  0x6: 'SHR',
  0x7: 'SUBN',
  0xe: 'SHL',
};

const MISC_FORMATS = {
  0x07: (ins) => `LD ${register(ins.x)}, DT`,
  0x0a: (ins) => `LD ${register(ins.x)}, K`,
  0x15: (ins) => `LD DT, ${register(ins.x)}`,
  0x18: (ins) => `LD ST, ${register(ins.x)}`,
  0x1e: (ins) => `ADD I, ${register(ins.x)}`,
  0x29: (ins) => `LD F, ${register(ins.x)}`,
  0x33: (ins) => `LD B, ${register(ins.x)}`,
  0x55: (ins) => `LD [I], ${register(ins.x)}`,
  0x65: (ins) => `LD ${register(ins.x)}, [I]`,
};

function formatSystem(ins) {
  const fixed = { 0x00_e0: 'CLS', 0x00_ee: 'RET' }[ins.opcode];
  return fixed ?? `SYS ${hex(ins.nnn, 3)}`;
}

function formatAlu(ins) {
  const name = ALU_NAMES[ins.n];
  return name ? `${name} ${register(ins.x)}, ${register(ins.y)}` : undefined;
}

function formatKeys(ins) {
  const name = { 0x9e: 'SKP', 0xa1: 'SKNP' }[ins.nn];
  return name ? `${name} ${register(ins.x)}` : undefined;
}

const FORMATS = {
  0x0: formatSystem,
  0x1: (ins) => `JP ${hex(ins.nnn, 3)}`,
  0x2: (ins) => `CALL ${hex(ins.nnn, 3)}`,
  0x3: (ins) => `SE ${register(ins.x)}, ${hex(ins.nn, 2)}`,
  0x4: (ins) => `SNE ${register(ins.x)}, ${hex(ins.nn, 2)}`,
  0x5: (ins) => (ins.n === 0 ? `SE ${register(ins.x)}, ${register(ins.y)}` : undefined),
  0x6: (ins) => `LD ${register(ins.x)}, ${hex(ins.nn, 2)}`,
  0x7: (ins) => `ADD ${register(ins.x)}, ${hex(ins.nn, 2)}`,
  0x8: formatAlu,
  0x9: (ins) => (ins.n === 0 ? `SNE ${register(ins.x)}, ${register(ins.y)}` : undefined),
  0xa: (ins) => `LD I, ${hex(ins.nnn, 3)}`,
  0xb: (ins) => `JP V0, ${hex(ins.nnn, 3)}`,
  0xc: (ins) => `RND ${register(ins.x)}, ${hex(ins.nn, 2)}`,
  0xd: (ins) => `DRW ${register(ins.x)}, ${register(ins.y)}, ${ins.n}`,
  0xe: formatKeys,
  0xf: (ins) => MISC_FORMATS[ins.nn]?.(ins),
};

/**
 * Turns an opcode into classic CHIP-8 assembly (e.g. `LD V1, 0x2A`). Words that are not valid
 * instructions are shown as data (`DW 0x8008`).
 * @param {number} opcode 16-bit opcode.
 * @returns {string}
 */
export function disassemble(opcode) {
  const text = FORMATS[decode(opcode).kind](decode(opcode));
  return text ?? `DW ${hex(opcode, 4)}`;
}
