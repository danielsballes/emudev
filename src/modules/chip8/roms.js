/**
 * Test ROMs shipped with the sandbox (public/roms/chip8, see LICENSES.md there). Titles come from
 * i18n, so each one is a literal key.
 */
export const ROMS = Object.freeze([
  { id: 'chip8-logo', file: '1-chip8-logo.ch8', titleKey: 'modules.chip8.sandbox.roms.chip8-logo' },
  { id: 'ibm-logo', file: '2-ibm-logo.ch8', titleKey: 'modules.chip8.sandbox.roms.ibm-logo' },
  { id: 'corax', file: '3-corax+.ch8', titleKey: 'modules.chip8.sandbox.roms.corax' },
  { id: 'flags', file: '4-flags.ch8', titleKey: 'modules.chip8.sandbox.roms.flags' },
  { id: 'quirks', file: '5-quirks.ch8', titleKey: 'modules.chip8.sandbox.roms.quirks' },
  { id: 'keypad', file: '6-keypad.ch8', titleKey: 'modules.chip8.sandbox.roms.keypad' },
]);
