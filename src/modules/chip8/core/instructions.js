import {
  DISPLAY_HEIGHT,
  DISPLAY_WIDTH,
  FONT_GLYPH_SIZE,
  FONT_START,
  STACK_SIZE,
} from './constants.js';

export class Chip8Error extends Error {
  /**
   * @param {'unknown-opcode' | 'stack-overflow' | 'stack-underflow' | 'rom-too-large'} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    this.name = 'Chip8Error';
    this.code = code;
  }
}

const hex = (value) => `0x${value.toString(16).toUpperCase().padStart(4, '0')}`;

function unknown(ins) {
  throw new Chip8Error('unknown-opcode', `Unknown opcode ${hex(ins.opcode)}`);
}

function skipIf(machine, condition) {
  if (condition) {
    machine.state.pc += 2;
  }
}

// 0NNN family.
function system(machine, ins) {
  const { state } = machine;
  if (ins.opcode === 0x00_e0) {
    state.display.fill(0);
    return;
  }
  // 0NNN (call machine code routine) is ignored by modern interpreters.
  if (ins.opcode !== 0x00_ee) {
    return;
  }
  if (state.sp === 0) {
    throw new Chip8Error('stack-underflow', 'Return with an empty stack');
  }
  state.sp -= 1;
  state.pc = state.stack[state.sp];
}

function call(machine, ins) {
  const { state } = machine;
  if (state.sp === STACK_SIZE) {
    throw new Chip8Error('stack-overflow', 'Too many nested calls');
  }
  state.stack[state.sp] = state.pc;
  state.sp += 1;
  state.pc = ins.nnn;
}

const ALU = {
  0x0: (v, x, y) => {
    v[x] = v[y];
  },
  0x1: (v, x, y, quirks) => {
    v[x] |= v[y];
    if (quirks.logicResetsVf) {
      v[0xf] = 0;
    }
  },
  0x2: (v, x, y, quirks) => {
    v[x] &= v[y];
    if (quirks.logicResetsVf) {
      v[0xf] = 0;
    }
  },
  0x3: (v, x, y, quirks) => {
    v[x] ^= v[y];
    if (quirks.logicResetsVf) {
      v[0xf] = 0;
    }
  },
  0x4: (v, x, y) => {
    const sum = v[x] + v[y];
    v[x] = sum & 0xff;
    v[0xf] = sum > 0xff ? 1 : 0;
  },
  0x5: (v, x, y) => {
    const noBorrow = v[x] >= v[y] ? 1 : 0;
    v[x] = (v[x] - v[y]) & 0xff;
    v[0xf] = noBorrow;
  },
  0x6: (v, x, y, quirks) => {
    const source = v[quirks.shiftUsesVy ? y : x];
    v[x] = source >> 1;
    v[0xf] = source & 1;
  },
  0x7: (v, x, y) => {
    const noBorrow = v[y] >= v[x] ? 1 : 0;
    v[x] = (v[y] - v[x]) & 0xff;
    v[0xf] = noBorrow;
  },
  0xe: (v, x, y, quirks) => {
    const source = v[quirks.shiftUsesVy ? y : x];
    v[x] = (source << 1) & 0xff;
    v[0xf] = source >> 7;
  },
};

function arithmetic(machine, ins) {
  const operation = ALU[ins.n];
  if (!operation) {
    unknown(ins);
  }
  operation(machine.state.v, ins.x, ins.y, machine.quirks);
}

function plotRow(machine, { byte, x0, y }) {
  const { state, quirks } = machine;
  let hasCollided = false;
  for (let bit = 0; bit < 8; bit += 1) {
    const isLit = (byte & (0x80 >> bit)) !== 0;
    const column = x0 + bit;
    if (!isLit || (quirks.clipSprites && column >= DISPLAY_WIDTH)) {
      continue;
    }
    const index = y * DISPLAY_WIDTH + (column % DISPLAY_WIDTH);
    hasCollided ||= state.display[index] === 1;
    state.display[index] ^= 1;
  }
  return hasCollided;
}

// DXYN: XOR an N-byte sprite from memory[I] at (VX, VY); VF = 1 if any lit pixel was erased.
function draw(machine, ins) {
  const { state, quirks } = machine;
  const x0 = state.v[ins.x] % DISPLAY_WIDTH;
  const y0 = state.v[ins.y] % DISPLAY_HEIGHT;
  let hasCollided = false;
  for (let row = 0; row < ins.n; row += 1) {
    const y = y0 + row;
    if (quirks.clipSprites && y >= DISPLAY_HEIGHT) {
      break;
    }
    const byte = state.memory[(state.i + row) & 0xf_ff];
    hasCollided = plotRow(machine, { byte, x0, y: y % DISPLAY_HEIGHT }) || hasCollided;
  }
  state.v[0xf] = hasCollided ? 1 : 0;
  state.drawn = true;
}

function keys(machine, ins) {
  const { state } = machine;
  const isDown = state.keys[state.v[ins.x] & 0xf] === 1;
  if (ins.nn === 0x9e) {
    skipIf(machine, isDown);
  } else if (ins.nn === 0xa1) {
    skipIf(machine, !isDown);
  } else {
    unknown(ins);
  }
}

// FX0A: wait for a key by repeating the instruction until one is pressed.
function waitForKey(state, x) {
  const pressed = state.keys.indexOf(1);
  if (pressed === -1) {
    state.pc -= 2;
    return;
  }
  state.v[x] = pressed;
}

function storeBcd(state, x) {
  const value = state.v[x];
  state.memory[state.i] = Math.floor(value / 100);
  state.memory[state.i + 1] = Math.floor(value / 10) % 10;
  state.memory[state.i + 2] = value % 10;
}

function copyRegisters(machine, x, toMemory) {
  const { state, quirks } = machine;
  for (let index = 0; index <= x; index += 1) {
    if (toMemory) {
      state.memory[state.i + index] = state.v[index];
    } else {
      state.v[index] = state.memory[state.i + index];
    }
  }
  if (quirks.memoryIncrementsI) {
    state.i = (state.i + x + 1) & 0xf_ff;
  }
}

const MISC = {
  0x07: (machine, x) => {
    machine.state.v[x] = machine.state.delayTimer;
  },
  0x0a: (machine, x) => waitForKey(machine.state, x),
  0x15: (machine, x) => {
    machine.state.delayTimer = machine.state.v[x];
  },
  0x18: (machine, x) => {
    machine.state.soundTimer = machine.state.v[x];
  },
  0x1e: (machine, x) => {
    machine.state.i = (machine.state.i + machine.state.v[x]) & 0xf_ff;
  },
  0x29: (machine, x) => {
    machine.state.i = FONT_START + (machine.state.v[x] & 0xf) * FONT_GLYPH_SIZE;
  },
  0x33: (machine, x) => storeBcd(machine.state, x),
  0x55: (machine, x) => copyRegisters(machine, x, true),
  0x65: (machine, x) => copyRegisters(machine, x, false),
};

function misc(machine, ins) {
  const operation = MISC[ins.nn];
  if (!operation) {
    unknown(ins);
  }
  operation(machine, ins.x);
}

/**
 * Instruction handlers indexed by the opcode's first nibble.
 * @type {Record<number, (machine: object, ins: ReturnType<import('./decode.js').decode>) => void>}
 */
export const INSTRUCTIONS = {
  0x0: system,
  0x1: (machine, ins) => {
    machine.state.pc = ins.nnn;
  },
  0x2: call,
  0x3: (machine, ins) => skipIf(machine, machine.state.v[ins.x] === ins.nn),
  0x4: (machine, ins) => skipIf(machine, machine.state.v[ins.x] !== ins.nn),
  0x5: (machine, ins) => skipIf(machine, machine.state.v[ins.x] === machine.state.v[ins.y]),
  0x6: (machine, ins) => {
    machine.state.v[ins.x] = ins.nn;
  },
  0x7: (machine, ins) => {
    machine.state.v[ins.x] = (machine.state.v[ins.x] + ins.nn) & 0xff;
  },
  0x8: arithmetic,
  0x9: (machine, ins) => skipIf(machine, machine.state.v[ins.x] !== machine.state.v[ins.y]),
  0xa: (machine, ins) => {
    machine.state.i = ins.nnn;
  },
  0xb: (machine, ins) => {
    const offset = machine.quirks.jumpUsesVx ? machine.state.v[ins.x] : machine.state.v[0];
    machine.state.pc = (ins.nnn + offset) & 0xf_ff;
  },
  0xc: (machine, ins) => {
    machine.state.v[ins.x] = machine.random() & ins.nn;
  },
  0xd: draw,
  0xe: keys,
  0xf: misc,
};
