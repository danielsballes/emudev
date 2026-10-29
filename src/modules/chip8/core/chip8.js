import {
  DISPLAY_HEIGHT,
  DISPLAY_WIDTH,
  FONT,
  FONT_START,
  KEY_COUNT,
  MEMORY_SIZE,
  PROGRAM_START,
  QUIRKS,
  REGISTER_COUNT,
  STACK_SIZE,
} from './constants.js';
import { decode } from './decode.js';
import { Chip8Error, INSTRUCTIONS } from './instructions.js';

function createState() {
  const memory = new Uint8Array(MEMORY_SIZE);
  memory.set(FONT, FONT_START);
  return {
    memory,
    v: new Uint8Array(REGISTER_COUNT),
    i: 0,
    pc: PROGRAM_START,
    stack: new Uint16Array(STACK_SIZE),
    sp: 0,
    delayTimer: 0,
    soundTimer: 0,
    display: new Uint8Array(DISPLAY_WIDTH * DISPLAY_HEIGHT),
    keys: new Uint8Array(KEY_COUNT),
    /**
     * Set by DXYN so a frontend knows when to redraw.
     */
    drawn: false,
  };
}

const randomByte = () => Math.floor(Math.random() * 256);

/**
 * Reference CHIP-8 interpreter: the solution students build lesson by lesson.
 * @param {{ quirks?: object, random?: () => number }} [options]
 */
export function createChip8({ quirks = QUIRKS.cosmac, random = randomByte } = {}) {
  const machine = { state: createState(), quirks, random };

  function reset() {
    machine.state = createState();
  }

  /**
   * Copies a ROM into memory at 0x200.
   * @param {Uint8Array | number[]} rom
   */
  function loadRom(rom) {
    if (rom.length > MEMORY_SIZE - PROGRAM_START) {
      throw new Chip8Error('rom-too-large', `ROM of ${rom.length} bytes does not fit in memory`);
    }
    machine.state.memory.set(rom, PROGRAM_START);
  }

  /**
   * Fetches, decodes and executes one instruction.
   */
  function step() {
    const { state } = machine;
    state.drawn = false;
    const opcode = (state.memory[state.pc] << 8) | state.memory[state.pc + 1];
    state.pc = (state.pc + 2) & 0xf_ff;
    const ins = decode(opcode);
    INSTRUCTIONS[ins.kind](machine, ins);
    return ins;
  }

  /**
   * Decrements both timers; call it 60 times per second.
   */
  function tickTimers() {
    const { state } = machine;
    state.delayTimer = Math.max(0, state.delayTimer - 1);
    state.soundTimer = Math.max(0, state.soundTimer - 1);
  }

  /**
   * @param {number} key 0x0–0xF.
   * @param {boolean} isDown
   */
  function setKey(key, isDown) {
    machine.state.keys[key & 0xf] = isDown ? 1 : 0;
  }

  return {
    get state() {
      return machine.state;
    },
    quirks,
    reset,
    loadRom,
    step,
    tickTimers,
    setKey,
  };
}
