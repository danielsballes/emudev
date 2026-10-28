export const MEMORY_SIZE = 4096;
export const PROGRAM_START = 0x2_00;
export const FONT_START = 0x50;
export const FONT_GLYPH_SIZE = 5;
export const DISPLAY_WIDTH = 64;
export const DISPLAY_HEIGHT = 32;
export const REGISTER_COUNT = 16;
export const STACK_SIZE = 16;
export const KEY_COUNT = 16;
/**
 * Timers count down at 60 Hz.
 */
export const TIMER_HZ = 60;

/**
 * Built-in hexadecimal font: 16 glyphs (0–F) of 5 bytes, 4 pixels wide (high nibble).
 */
export const FONT = Object.freeze(
  [
    [0xf0, 0x90, 0x90, 0x90, 0xf0], // 0
    [0x20, 0x60, 0x20, 0x20, 0x70], // 1
    [0xf0, 0x10, 0xf0, 0x80, 0xf0], // 2
    [0xf0, 0x10, 0xf0, 0x10, 0xf0], // 3
    [0x90, 0x90, 0xf0, 0x10, 0x10], // 4
    [0xf0, 0x80, 0xf0, 0x10, 0xf0], // 5
    [0xf0, 0x80, 0xf0, 0x90, 0xf0], // 6
    [0xf0, 0x10, 0x20, 0x40, 0x40], // 7
    [0xf0, 0x90, 0xf0, 0x90, 0xf0], // 8
    [0xf0, 0x90, 0xf0, 0x10, 0xf0], // 9
    [0xf0, 0x90, 0xf0, 0x90, 0x90], // A
    [0xe0, 0x90, 0xe0, 0x90, 0xe0], // B
    [0xf0, 0x80, 0x80, 0x80, 0xf0], // C
    [0xe0, 0x90, 0x90, 0x90, 0xe0], // D
    [0xf0, 0x80, 0xf0, 0x80, 0xf0], // E
    [0xf0, 0x80, 0xf0, 0x80, 0x80], // F
  ].flat(),
);

/**
 * Behavior differences between CHIP-8 implementations ("quirks").
 * - `shiftUsesVy`: 8XY6/8XYE shift VY into VX (COSMAC VIP) instead of shifting VX in place.
 * - `memoryIncrementsI`: FX55/FX65 leave I incremented (COSMAC VIP).
 * - `logicResetsVf`: 8XY1/8XY2/8XY3 reset VF to 0 (COSMAC VIP).
 * - `jumpUsesVx`: BNNN jumps to XNN + VX (SCHIP) instead of NNN + V0.
 * - `clipSprites`: sprites are clipped at the screen edge instead of wrapping around.
 */
export const QUIRKS = Object.freeze({
  cosmac: Object.freeze({
    shiftUsesVy: true,
    memoryIncrementsI: true,
    logicResetsVf: true,
    jumpUsesVx: false,
    clipSprites: true,
  }),
  schip: Object.freeze({
    shiftUsesVy: false,
    memoryIncrementsI: false,
    logicResetsVf: false,
    jumpUsesVx: true,
    clipSprites: true,
  }),
});
